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
    console.log("=== AI Assistant (OpenRouter) ===");

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
        const { prompt, products } = await req.json();
        const apiKey = Deno.env.get("OPENROUTER_API_KEY");

        if (!apiKey) {
            console.error("OPENROUTER_API_KEY non configurata!");
            return new Response(
                JSON.stringify({ error: "OPENROUTER_API_KEY non configurata" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (!prompt || typeof prompt !== "string") {
            return new Response(
                JSON.stringify({ error: "Prompt mancante" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

        console.log("Chiamata OpenRouter in corso...");

        // Chiamata a OpenRouter API
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://wishlist-xi-fawn.vercel.app",
                "X-Title": "Wishlist Assistant"
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash-001",  // Modello gratuito via OpenRouter
                messages: [
                    {
                        role: "system",
                        content: SYSTEM_PROMPT + wishlistContext
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            })
        });

        const data = await response.json();
        console.log("Risposta OpenRouter ricevuta, status:", response.status);

        if (data.error) {
            console.error("Errore OpenRouter:", data.error);
            return new Response(
                JSON.stringify({ error: data.error.message || "Errore OpenRouter" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const aiResponse = data.choices?.[0]?.message?.content || "Mi dispiace, non ho ricevuto una risposta.";
        console.log("Risposta AI OK");

        return new Response(
            JSON.stringify({ response: aiResponse }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (err) {
        const error = err as Error;
        console.error("ERRORE:", error.message);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
