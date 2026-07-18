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
        ]);

        $userMessage = $request->input('message');
        $apiKey = config('services.gemini.key');

        if (!$apiKey || $apiKey === 'your_gemini_api_key_here') {
            return response()->json([
                'response' => "I'm sorry, but the Gemini API key is not configured. Please add `GEMINI_API_KEY` to your `.env` file.",
            ]);
        }

        try {
            // 1. Generate SQL from natural language
            $sql = $this->generateSql($userMessage, $apiKey);

            if (!$sql) {
                return response()->json([
                    'response' => "I couldn't understand how to query that. Could you please rephrase your question?",
                ]);
            }

            // 2. Validate and Execute SQL
            $results = $this->executeSecurely($sql);

            // 3. Summarize results into natural language
            $finalResponse = $this->summarizeResults($userMessage, $results, $apiKey);

            return response()->json([
                'response' => $finalResponse,
                'debug_sql' => config('app.debug') ? $sql : null,
            ]);

        } catch (\Exception $e) {
            Log::error('AI Assistant Error: ' . $e->getMessage());
            return response()->json([
                'response' => "Something went wrong while processing your request. Please try again later.",
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Use Gemini to generate a SQL query based on the user's message.
     */
    private function generateSql($message, $apiKey)
    {
        $schemaContext = $this->getSchemaContext();
        $currentTime = now()->toDateTimeString();
        $currentUserId = auth()->id();

        $prompt = "You are a SQL expert for a Laravel CRM application. 
        Current Time: {$currentTime}
        Current User ID: {$currentUserId}
        
        Database Schema:
        {$schemaContext}
        
        User Question: \"{$message}\"
        
        Rules:
        1. Return ONLY the SQL query. No markdown, no triple backticks, no explanations.
        2. Always use table names as defined.
        3. If the user refers to 'me', 'my tasks', or 'for me', use user_id = {$currentUserId}.
        4. Tasks are in 'tasks' table. Many-to-many relation with users in 'task_user' table.
        5. Attendance is in 'attendances' table.
        6. Leaves are in 'leaves' table.
        7. Projects are in 'projects' table.
        8. For 'absent today', check users who do NOT have an entry in 'attendances' for today (date = CURRENT_DATE).
        9. For 'pending tasks', status is usually 'pending'.
        10. Only generate SELECT queries. DO NOT generate DELETE, DROP, UPDATE, or INSERT.
        11. Be concise and accurate.";

        $response = Http::post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={$apiKey}", [
            'contents' => [
                ['parts' => [['text' => $prompt]]]
            ]
        ]);

        if ($response->successful()) {
            $text = $response->json('candidates.0.content.parts.0.text');
            return trim(str_replace(['```sql', '```'], '', $text));
        }

        throw new \Exception('Gemini API request failed: ' . $response->body());
    }

    /**
     * Execute the generated SQL securely.
     */
    private function executeSecurely($sql)
    {
        // Simple regex check for dangerous keywords
        $forbidden = ['drop', 'delete', 'truncate', 'update', 'insert', 'alter', 'create', 'grant', 'revoke'];
        $lowerSql = strtolower($sql);

        foreach ($forbidden as $word) {
            if (str_contains($lowerSql, $word)) {
                throw new \Exception("Security Violation: Forbidden keyword '{$word}' found in generated SQL.");
            }
        }

        if (!str_starts_with($lowerSql, 'select')) {
            throw new \Exception("Security Violation: Only SELECT queries are allowed.");
        }

        return DB::select($sql);
    }

    /**
     * Use Gemini to summarize the database results into a human-friendly response.
     */
    private function summarizeResults($question, $results, $apiKey)
    {
        $resultsJson = json_encode($results);

        $prompt = "User asked: \"{$question}\"
        Database Results (JSON): {$resultsJson}
        
        Please provide a concise, friendly, and helpful summary of these results to the user. 
        If no results were found, say something appropriate.
        Do not mention SQL or technical details unless asked.";

        $response = Http::post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={$apiKey}", [
            'contents' => [
                ['parts' => [['text' => $prompt]]]
            ]
        ]);

        if ($response->successful()) {
            return $response->json('candidates.0.content.parts.0.text');
        }

        return "I found some results but couldn't summarize them properly. Here they are: " . $resultsJson;
    }

    /**
     * Provide a brief overview of the relevant database schema.
     */
    private function getSchemaContext()
    {
        return "
        - users (id, name, email, role)
        - projects (id, name, description, status, start_date, end_date)
        - tasks (id, name, description, status, priority, project_id, start_date, end_date)
        - task_user (task_id, user_id) - join table for task assignees
        - attendances (id, user_id, date, punch_in, punch_out, status)
        - leaves (id, user_id, leave_type, from_date, to_date, status)
        ";
    }
}
