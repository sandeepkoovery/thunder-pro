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
     * Get the effective Gemini API Key for the logged-in user or admin.
     */
    private function getEffectiveApiKey()
    {
        $user = auth()->user();
        if ($user) {
            $prefix = ($user instanceof \App\Models\Admin) ? 'gemini_api_key_admin_' : 'gemini_api_key_user_';
            $keyName = $prefix . $user->id;

            $setting = DB::table('settings')->where('key', $keyName)->first();
            if ($setting && !empty(trim($setting->value))) {
                return trim($setting->value);
            }
        }

        return config('services.gemini.key');
    }

    /**
     * Fetch the user's stored Gemini API Key settings.
     */
    public function getKey(Request $request)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['gemini_api_key' => '', 'has_custom_key' => false]);
        }

        $prefix = ($user instanceof \App\Models\Admin) ? 'gemini_api_key_admin_' : 'gemini_api_key_user_';
        $keyName = $prefix . $user->id;
        $setting = DB::table('settings')->where('key', $keyName)->first();

        $customKey = $setting ? ($setting->value ?? '') : '';
        $globalKey = config('services.gemini.key');

        return response()->json([
            'gemini_api_key' => $customKey,
            'has_custom_key' => !empty($customKey),
            'active_key_source' => !empty($customKey) ? 'custom' : (!empty($globalKey) ? 'system' : 'none'),
        ]);
    }

    /**
     * Save the user's personal Gemini API Key.
     */
    public function saveKey(Request $request)
    {
        $request->validate([
            'gemini_api_key' => 'nullable|string',
        ]);

        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $apiKey = trim($request->input('gemini_api_key', ''));
        $prefix = ($user instanceof \App\Models\Admin) ? 'gemini_api_key_admin_' : 'gemini_api_key_user_';
        $keyName = $prefix . $user->id;

        DB::table('settings')->updateOrInsert(
            ['key' => $keyName],
            [
                'value' => $apiKey,
                'updated_at' => now(),
                'created_at' => now()
            ]
        );

        return response()->json([
            'success' => true,
            'message' => empty($apiKey) 
                ? 'Cleared personal API key. Using default system Gemini API key.' 
                : 'Personal Gemini API key saved successfully!',
            'has_custom_key' => !empty($apiKey),
        ]);
    }

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
        $lang = $request->input('language', 'en');
        $apiKey = $this->getEffectiveApiKey();

        if (!$apiKey || $apiKey === 'your_gemini_api_key_here') {
            $msg = ($lang === 'ml')
                ? "ക്ഷമിക്കണം, താങ്കളുടെ Gemini API Key ക്രമീകരിച്ചിട്ടില്ല. Header-ലെ ⚙️ Settings അമർത്തി API Key നൽകുക."
                : "Sorry, Gemini API key is not configured. Please click ⚙️ Settings in the header to set your personal API key.";
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
     * Call Gemini API with model fallback to active working models.
     */
    private function callGeminiApi($prompt, $apiKey)
    {
        $models = [
            'gemini-flash-latest',
            'gemini-3.5-flash',
            'gemini-flash-lite-latest',
            'gemini-3.1-flash-lite',
            'gemini-2.0-flash-lite',
        ];

        foreach ($models as $model) {
            try {
                $response = Http::timeout(12)->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                    'contents' => [
                        ['parts' => [['text' => $prompt]]]
                    ]
                ]);

                if ($response->successful()) {
                    $text = $response->json('candidates.0.content.parts.0.text');
                    if ($text) {
                        return trim($text);
                    }
                } else {
                    Log::warning("Gemini model {$model} HTTP {$response->status()}: " . substr($response->body(), 0, 150));
                }
            } catch (\Exception $e) {
                Log::warning("Gemini model {$model} exception: " . $e->getMessage());
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
3. Use EXACT column names from the schema context:
   - For attendances: use `punch_in`, `punch_out`, `date`, `status` (DO NOT use clock_in!).
   - For leaves: use `from_date` and `to_date` (DO NOT use start_date / end_date!).
   - For tasks: use `name` (DO NOT use title!).
4. Always join `users` table to fetch employee names (`users.name` or `CONCAT(users.first_name, ' ', users.last_name)`).
5. Understand terms in English or Malayalam:
   - 'punched in' / 'പഞ്ച് ഇൻ' / 'എത്ര പേർ' -> COUNT(*) FROM attendances WHERE date = CURDATE() AND punch_in IS NOT NULL
   - 'on leave' / 'ലീവിലുണ്ടോ' / 'അവധി' -> FROM leaves JOIN users WHERE status = 'approved' AND from_date <= CURDATE() AND to_date >= CURDATE()
   - 'late' / 'വൈകി വന്നത്' / 'ലേറ്റ് ആയത്' -> FROM attendances JOIN users WHERE date = SUBDATE(CURDATE(), 1) AND (TIME(punch_in) > '09:30:00' OR status = 'late')
   - 'last month late' / 'കഴിഞ്ഞ മാസം ലേറ്റ് ആയത്' -> SELECT users.name, COUNT(*) as late_count FROM attendances JOIN users ON attendances.user_id = users.id WHERE attendances.date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH) AND TIME(attendances.punch_in) > '09:30:00' GROUP BY users.id, users.name ORDER BY late_count DESC LIMIT 1
6. Keep queries efficient and limit to max 15 rows if returning lists.
7. If the question cannot be answered by SQL (e.g. general greeting like 'hello' or 'hi'), return string 'NO_SQL'.";

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
3. If results array is empty or count is 0, reply politely explaining that no matching records were found for this query in the database.
4. Do NOT include SQL queries, code blocks, or technical error codes in your output.
5. Make sure the text sounds natural and complete when read aloud by Text-to-Speech (TTS).
6. Keep the response complete and under 3-4 clear sentences so the entire message is spoken smoothly.";

        $response = $this->callGeminiApi($prompt, $apiKey);
        if ($response) {
            return $response;
        }

        // Direct Data Formatter Fallback if Gemini Summarizer is rate-limited or unavailable
        if (!empty($results)) {
            $count = count($results);
            if ($lang === 'ml') {
                $summary = "കണ്ടെത്തിയ വിവരങ്ങൾ ({$count} റെക്കോർഡുകൾ):\n";
                foreach (array_slice($results, 0, 5) as $row) {
                    $rowArr = (array) $row;
                    $summary .= "• " . implode(' - ', array_values($rowArr)) . "\n";
                }
                return trim($summary);
            } else {
                $summary = "Found {$count} records in database:\n";
                foreach (array_slice($results, 0, 5) as $row) {
                    $rowArr = (array) $row;
                    $summary .= "• " . implode(' - ', array_values($rowArr)) . "\n";
                }
                return trim($summary);
            }
        }

        if (empty($results)) {
            return ($lang === 'ml') 
                ? "ചോദിച്ച റെക്കോർഡുകളൊന്നും ഡാറ്റാബേസിൽ കണ്ടെത്തിയില്ല." 
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
     * Provide a comprehensive overview of the WorkNest database schema matching actual column names.
     */
    private function getSchemaContext()
    {
        $adminId = auth()->user()?->admin_id ?? auth()->id() ?? 1;

        return "
        Current Logged In Admin ID: {$adminId}

        Table Schemas (EXACT COLUMNS & ENUMS):

        1. users:
           - Columns: id, name, first_name, last_name, email, role (superadmin|admin|employee|hr|manager), designation, phone, employee_id, department_id, reporting_manager_id, joining_date, is_active, admin_id

        2. attendances:
           - Columns: id, user_id, date (YYYY-MM-DD), punch_in (DATETIME/TIMESTAMP), punch_out (DATETIME/TIMESTAMP), break_start, break_end, total_break_minutes, status (punched_in|punched_out|on_break), admin_id
           - Notes: 
             * 'punched in' / 'പഞ്ച് ഇൻ' -> punch_in IS NOT NULL and date = CURDATE()
             * 'late' / 'വൈകി വന്നത്' / 'ലേറ്റ് ആയത്' -> TIME(punch_in) > '09:30:00' OR status = 'late'
             * Column name for check in is `punch_in` (NOT clock_in!)

        3. leaves:
           - Columns: id, user_id, employee_name, leave_type (paid|sick), day_type (full|half), from_date (DATE), to_date (DATE), no_of_days, reason, status (pending|approved|rejected), admin_id
           - Notes: 
             * Columns for date range are `from_date` and `to_date` (NOT start_date / end_date!)
             * 'on leave' / 'ലീവിലുണ്ടോ' / 'അവധി' -> status = 'approved' AND from_date <= CURDATE() AND to_date >= CURDATE()

        4. tasks:
           - Columns: id, project_id, user_id, name, description, status (not started|in progress|completed|on hold), priority (low|medium|high), start_date, end_date
           - Notes: Column for task title is `name` (NOT title!)

        5. projects:
           - Columns: id, name, description, status (not started|in progress|completed|on hold), start_date, end_date, client, budget, admin_id

        6. departments:
           - Columns: id, name, admin_id

        7. daily_worksheets:
           - Columns: id, user_id, date, work_summary, admin_id
        ";
    }
}


