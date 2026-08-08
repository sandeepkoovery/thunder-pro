<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class AiAssistantController extends Controller
{
    /**
     * Handle the AI chat request.
     */
    public function chat(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'language' => 'nullable|string|in:en,ml',
        ]);

        $userMessage = trim($request->input('message'));
        $lang = $request->input('language', 'en'); // Default to English
        $apiKey = config('services.gemini.key');

        if (!$apiKey || $apiKey === 'your_gemini_api_key_here') {
            $msg = ($lang === 'ml')
                ? "ക്ഷമിക്കണം, Gemini API കീ കോൺഫിഗർ ചെയ്തിട്ടില്ല. .env ഫയലിൽ GEMINI_API_KEY ചേർക്കുക."
                : "Sorry, Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file.";
            return response()->json(['response' => $msg]);
        }

        try {
            // 1. Generate SQL from natural language
            $sql = $this->generateSql($userMessage, $apiKey);

            $results = [];
            if ($sql) {
                // 2. Validate and Execute SQL
                $results = $this->executeSecurely($sql);
            }

            // 3. Summarize results into natural language (English or Malayalam)
            $finalResponse = $this->summarizeResults($userMessage, $results, $sql, $lang, $apiKey);

            return response()->json([
                'response' => $finalResponse,
                'debug_sql' => config('app.debug') ? $sql : null,
            ]);

        } catch (\Exception $e) {
            Log::error('AI Assistant Error: ' . $e->getMessage());
            
            try {
                $directResponse = $this->generateDirectResponse($userMessage, $lang, $apiKey);
                if ($directResponse) {
                    return response()->json([
                        'response' => $directResponse,
                    ]);
                }
            } catch (\Exception $fallbackErr) {
                Log::error('AI Assistant Direct Fallback Error: ' . $fallbackErr->getMessage());
            }

            $errMsg = ($lang === 'ml')
                ? "ക്ഷമിക്കണം, താങ്കളുടെ ചോദ്യം പ്രോസസ്സ് ചെയ്യുന്നതിൽ ഒരു തടസ്സം നേരിട്ടു. ദയവായി വീണ്ടും ശ്രമിക്കൂ."
                : "Sorry, there was an issue processing your request. Please try again.";

            return response()->json([
                'response' => $errMsg,
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 200);
        }
    }

    /**
     * Stream full Malayalam / English Text-to-Speech MP3 audio without sentence truncation.
     */
    public function tts(Request $request)
    {
        $text = trim($request->input('text', ''));
        $lang = $request->input('lang', 'ml');

        if (empty($text)) {
            return response('', 400);
        }

        // Strip markdown formatting
        $cleanText = preg_replace('/[\*\_`#\[\]]/u', '', $text);
        
        // Split text into full sentences or chunks <= 160 characters
        $chunks = [];
        if (mb_strlen($cleanText) <= 160) {
            $chunks[] = $cleanText;
        } else {
            $sentences = preg_split('/(?<=[.?!।\n])+/u', $cleanText);
            $currentChunk = '';

            foreach ($sentences as $sentence) {
                if (mb_strlen($currentChunk . ' ' . $sentence) > 160) {
                    if (!empty(trim($currentChunk))) {
                        $chunks[] = trim($currentChunk);
                    }
                    $currentChunk = $sentence;
                } else {
                    $currentChunk .= ' ' . $sentence;
                }
            }
            if (!empty(trim($currentChunk))) {
                $chunks[] = trim($currentChunk);
            }
        }

        $combinedAudio = '';

        foreach ($chunks as $chunk) {
            $chunkText = trim($chunk);
            if (empty($chunkText)) continue;

            $url = "https://translate.google.com/translate_tts?ie=UTF-8&q=" . urlencode($chunkText) . "&tl=" . $lang . "&client=tw-ob";
            try {
                $response = Http::withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                ])->get($url);

                if ($response->successful()) {
                    $combinedAudio .= $response->body();
                }
            } catch (\Exception $e) {
                Log::error("TTS chunk fetch error: " . $e->getMessage());
            }
        }

        if (!empty($combinedAudio)) {
            return response($combinedAudio, 200)
                ->header('Content-Type', 'audio/mpeg')
                ->header('Cache-Control', 'public, max-age=86400');
        }

        return response('', 500);
    }

    /**
     * Call Gemini API with model fallback
     */
    private function callGeminiApi($prompt, $apiKey)
    {
        $models = [
            'gemini-1.5-flash',
            'gemini-2.0-flash',
            'gemini-1.5-pro'
        ];

        foreach ($models as $model) {
            try {
                $response = Http::timeout(15)->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                    'contents' => [
                        ['parts' => [['text' => $prompt]]]
                    ]
                ]);

                if ($response->successful()) {
                    $text = $response->json('candidates.0.content.parts.0.text');
                    if ($text) {
                        return trim($text);
                    }
                }
            } catch (\Exception $e) {
                Log::warning("Gemini model {$model} failed: " . $e->getMessage());
            }
        }

        return null;
    }

    /**
     * Use Gemini to generate a SQL query based on the user's message.
     */
    private function generateSql($message, $apiKey)
    {
        $schemaContext = $this->getSchemaContext();
        $currentTime = now()->toDateTimeString();
        $currentUserId = auth()->id() ?? 1;

        $prompt = "You are a database SQL generator expert for a Laravel ERP application (WorkNest).
Current Date & Time: {$currentTime}
Current User ID: {$currentUserId}

Database Schema Context:
{$schemaContext}

User Question: \"{$message}\"

Rules:
1. Return ONLY the raw SQL query. Do not wrap in markdown (no ```sql or triple backticks), no explanations.
2. Only generate read-only SELECT queries. DO NOT generate DELETE, DROP, UPDATE, INSERT, ALTER or TRUNCATE.
3. Understand terms in English or Malayalam:
   - 'employees' / 'users' / 'staff' / 'ജീവനക്കാർ' / 'ആളുകൾ' -> users table
   - 'attendance' / 'present' / 'absent' / 'ഹാജർ' -> attendances table
   - 'leaves' / 'leave' / 'അവധി' -> leaves table
   - 'tasks' / 'task' / 'ജോലികൾ' -> tasks table
   - 'projects' / 'project' / 'പ്രോജക്റ്റുകൾ' -> projects table
   - 'departments' / 'department' / 'ഡിപ്പാർട്ട്മെന്റ്' -> departments table
   - 'today' / 'ഇന്ന്' -> CURDATE() or DATE(created_at) = CURDATE()
   - 'pending' / 'unfinished' / 'പെൻഡിംഗ്' -> status = 'pending'
   - 'count' / 'total' / 'how many' / 'എത്ര' -> COUNT(*) or aggregate SELECT
4. For user relative references ('my tasks', 'assigned to me'): use user_id = {$currentUserId} or check task_user join table.
5. Keep queries efficient and limit to max 15 rows if returning lists.
6. If the question cannot be answered by SQL (e.g. general greeting like 'hello' or 'hi'), return string 'NO_SQL'.";

        $result = $this->callGeminiApi($prompt, $apiKey);
        if (!$result || str_contains($result, 'NO_SQL')) {
            return null;
        }

        $sql = trim(str_replace(['```sql', '```'], '', $result));
        return $sql;
    }

    /**
     * Execute the generated SQL securely.
     */
    private function executeSecurely($sql)
    {
        $forbidden = ['drop', 'delete', 'truncate', 'update', 'insert', 'alter', 'create', 'grant', 'revoke'];
        $lowerSql = strtolower($sql);

        foreach ($forbidden as $word) {
            if (preg_match('/\b' . $word . '\b/', $lowerSql)) {
                throw new \Exception("Security Violation: Forbidden keyword '{$word}' found in generated SQL.");
            }
        }

        if (!str_starts_with($lowerSql, 'select')) {
            throw new \Exception("Security Violation: Only SELECT queries are allowed.");
        }

        return DB::select($sql);
    }

    /**
     * Use Gemini to summarize database results in the requested target language (en or ml).
     */
    private function summarizeResults($question, $results, $sql, $lang, $apiKey)
    {
        $resultsJson = json_encode($results, JSON_UNESCAPED_UNICODE);

        if ($lang === 'ml') {
            $langInstruction = "You MUST respond STRICTLY in clear, natural, friendly MALAYALAM (മലയാളം script only).";
        } else {
            $langInstruction = "You MUST respond STRICTLY in clear, natural, friendly ENGLISH.";
        }

        $prompt = "You are WorkNest AI Voice Assistant.
{$langInstruction}

Admin/User asked: \"{$question}\"
Executed SQL: \"{$sql}\"
Database Query Results (JSON): {$resultsJson}

Instructions:
1. Provide a concise, clear, complete, and direct answer.
2. Format numbers, names, and key counts clearly.
3. If results array is empty or count is 0, reply politely explaining that no matching records were found.
4. Do NOT include SQL queries, code blocks, or technical error codes in your output.
5. Make sure the text sounds natural and complete when read aloud by Text-to-Speech (TTS).
6. Keep the response complete and under 3-4 clear sentences so the entire message is spoken smoothly.";

        $response = $this->callGeminiApi($prompt, $apiKey);
        if ($response) {
            return $response;
        }

        if (empty($results)) {
            return ($lang === 'ml') 
                ? "ചോദിച്ച വിവരങ്ങളുമായി ബന്ധപ്പെട്ട റെക്കോർഡുകളൊന്നും ഡാറ്റാബേസിൽ കണ്ടെത്തിയില്ല." 
                : "No matching records were found in the database.";
        }
        
        return ($lang === 'ml')
            ? "കണ്ടെത്തിയ വിവരങ്ങൾ: " . count($results) . " റെക്കോർഡുകൾ ലഭ്യമാണ്."
            : "Found " . count($results) . " records in the system.";
    }

    /**
     * Direct fallback response for general greetings or non-DB questions.
     */
    private function generateDirectResponse($question, $lang, $apiKey)
    {
        $langInstruction = ($lang === 'ml')
            ? "Respond STRICTLY in natural, friendly MALAYALAM (മലയാളം script only)."
            : "Respond STRICTLY in natural, friendly ENGLISH.";

        $prompt = "You are WorkNest AI Voice Assistant for an ERP system.
User asked: \"{$question}\"

Instructions:
1. {$langInstruction}
2. Keep the answer helpful, brief, and clear.
3. Do not show code or technical error terms.";

        return $this->callGeminiApi($prompt, $apiKey);
    }

    /**
     * Provide a comprehensive overview of the WorkNest database schema.
     */
    private function getSchemaContext()
    {
        return "
        - users (id, name, email, role, phone, designation, status, created_at)
        - projects (id, name, description, status, budget, start_date, end_date, created_at)
        - tasks (id, title, description, status, priority, project_id, due_date, created_at)
        - task_user (task_id, user_id)
        - attendances (id, user_id, date, clock_in, clock_out, status, created_at)
        - leaves (id, user_id, leave_type, start_date, end_date, reason, status, created_at)
        - departments (id, name, status, created_at)
        - daily_worksheets (id, user_id, date, work_summary, created_at)
        - domains (id, domain_name, expiration_date, status, created_at)
        - hostings (id, domain_id, provider, expiration_date, status, created_at)
        ";
    }
}


