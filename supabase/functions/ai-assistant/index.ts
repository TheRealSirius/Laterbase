import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: corsHeaders,
        });
    }

    try {
        // Only allow POST
        if (req.method !== "POST") {
            return new Response(
                JSON.stringify({ error: "Method not allowed" }),
                {
                    status: 405,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        // Get API key from environment
        const apiKey = Deno.env.get("GEMINI_API_KEY");
        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
                {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        // Parse request body
        const { prompt } = await req.json();
        if (!prompt || typeof prompt !== "string") {
            return new Response(
                JSON.stringify({ error: "Invalid request: 'prompt' is required" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        // Call Gemini API
        const geminiResponse = await fetch(
            "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=" + apiKey,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt,
                                },
                            ],
                        },
                    ],
                }),
            }
        );

        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.text();
            console.error("Gemini API error:", errorData);
            return new Response(
                JSON.stringify({ error: "Gemini API error", details: errorData }),
                {
                    status: geminiResponse.status,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        const geminiData = await geminiResponse.json();

        // Extract text from Gemini response
        const responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        return new Response(
            JSON.stringify({ response: responseText }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        console.error("Error:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error", details: String(error) }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
