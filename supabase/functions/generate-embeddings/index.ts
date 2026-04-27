import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

// Securely grab the key from Supabase Secrets
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const { table, record } = payload; 

    // 1. Determine what text to embed based on the table
    let textToEmbed = "";
    if (table === "quests") {
      textToEmbed = `Quest Category: ${record.category}. Title: ${record.title}. Description: ${record.description}.`;
    } else if (table === "profiles") {
      textToEmbed = `User Bio: ${record.bio || ''}. Major: ${record.major || ''}. Looking to help out locally.`;
    } else {
      return new Response("Ignored table", { status: 200 });
    }

    if (!textToEmbed.trim()) return new Response("Empty text", { status: 200 });

    // 2. Call Gemini Embedding API (Extremely fast and cheap)
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: { parts: [{ text: textToEmbed }] }
        }),
      }
    );

    const geminiData = await geminiRes.json();
    const embedding = geminiData.embedding?.values;

    if (!embedding) throw new Error("Failed to generate embedding");

    // 3. Save the embedding back to the database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    await supabase
      .from(table)
      .update({ embedding })
      .eq("id", record.id);

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (error: unknown) {
    console.error("Error:", error);
    // Properly extract the error message from an unknown type to satisfy the linter
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
});