import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
    console.log("=== AI Assistant Function Called ===");
    console.log("Method:", req.method);

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        console.log("CORS preflight request - returning 204");
        return new Response(null, {
            status: 204,
            headers: corsHeaders,
        });
    }

    try {
        // Only allow POST
        if (req.method !== "POST") {
            console.log("Method not allowed:", req.method);
            return new Response(
                JSON.stringify({ error: "Method not allowed" }),
                {
                    status: 405,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        // Parse request body
        const payload = await req.json();
        console.log("Richiesta ricevuta:", JSON.stringify(payload));

        // Get API key from environment
        const apiKey = Deno.env.get("GEMINI_API_KEY");
        console.log("API Key presente:", apiKey ? "Sì (lunghezza: " + apiKey.length + ")" : "NO!");

        if (!apiKey) {
            console.error("ERRORE: GEMINI_API_KEY non configurata!");
            return new Response(
                JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
                {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        const { prompt } = payload;
        if (!prompt || typeof prompt !== "string") {
            console.error("ERRORE: Prompt mancante o non valido");
            return new Response(
                JSON.stringify({ error: "Invalid request: 'prompt' is required" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        console.log("Prompt ricevuto:", prompt.substring(0, 100) + "...");
        console.log("Chiamata a Gemini in corso...");

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

        console.log("Risposta Gemini ricevuta - Status:", geminiResponse.status);

        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.text();
            console.error("ERRORE Gemini API:", errorData);
            return new Response(
                JSON.stringify({ error: "Gemini API error", details: errorData }),
                {
                    status: geminiResponse.status,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        const geminiData = await geminiResponse.json();
        console.log("Gemini data parsed successfully");

        // Extract text from Gemini response
        const responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        console.log("Risposta estratta (primi 100 char):", responseText.substring(0, 100));

        return new Response(
            JSON.stringify({ response: responseText }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (err) {
        const error = err as Error;
        console.error("=== ERRORE DETTAGLIATO ===");
        console.error("Tipo:", error.constructor?.name || "Unknown");
        console.error("Messaggio:", error.message || String(err));
        console.error("Stack:", error.stack || "No stack");

        return new Response(
            JSON.stringify({ error: "Internal server error", details: error.message || String(err) }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
