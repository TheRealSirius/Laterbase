import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// System prompt per istruire l'AI sul suo ruolo
const SYSTEM_PROMPT = `Sei l'assistente AI di una app Wishlist. Il tuo nome è "Assistente Wishlist".

Il tuo ruolo è aiutare l'utente a gestire la sua lista dei desideri. Puoi:
- Rispondere a domande sui prodotti nella wishlist (prezzi, categorie, priorità)
- Dare consigli su cosa comprare prima in base al budget
- Calcolare statistiche (totale, media prezzi, prodotto più/meno costoso)
- Suggerire quando è un buon momento per acquistare (se il prezzo è vicino al target)
- Dare consigli generali sugli acquisti

Rispondi sempre in italiano, in modo amichevole e conciso.
Se l'utente chiede qualcosa che non riguarda la wishlist, puoi comunque aiutarlo ma ricordagli gentilmente che sei specializzato nella gestione della wishlist.

I dati della wishlist dell'utente ti verranno forniti in formato JSON.`;

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
        console.log("Richiesta ricevuta");

        // Get API key from environment
        const apiKey = Deno.env.get("GEMINI_API_KEY");
        console.log("API Key presente:", apiKey ? "Sì" : "NO!");

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

        const { prompt, products } = payload;
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

        // Costruisci il contesto con i dati della wishlist
        let wishlistContext = "";
        if (products && Array.isArray(products) && products.length > 0) {
            const activeProducts = products.filter((p: any) => !p.isPurchased && !p.isArchived);
            const purchasedProducts = products.filter((p: any) => p.isPurchased);

            wishlistContext = `

DATI WISHLIST DELL'UTENTE:
- Prodotti attivi: ${activeProducts.length}
- Prodotti acquistati: ${purchasedProducts.length}
- Totale wishlist attiva: €${activeProducts.reduce((sum: number, p: any) => sum + Number(p.price), 0).toFixed(2)}

LISTA PRODOTTI ATTIVI:
${activeProducts.map((p: any) => `- ${p.name}: €${p.price} (categoria: ${p.category || 'N/A'}, priorità: ${p.priority || 'normale'}${p.targetPrice ? ', target: €' + p.targetPrice : ''})`).join('\n')}
`;
        } else {
            wishlistContext = "\n\nL'utente non ha ancora prodotti nella wishlist.";
        }

        const fullPrompt = SYSTEM_PROMPT + wishlistContext + "\n\nDOMANDA DELL'UTENTE: " + prompt;

        console.log("Prompt completo costruito, chiamata a Gemini...");

        // Call Gemini API (Gemini 3 Flash - free tier)
        const geminiResponse = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey,
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
                                    text: fullPrompt,
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
