import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

// Securely grab the key from Supabase Secrets
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const { type, table, record, old_record } = payload; 

    // --- CRITICAL ADDITION: PREVENT INFINITE LOOP ---
    // Only generate a new embedding if the relevant text fields actually changed.
    if (type === "UPDATE" && old_record) {
      if (table === "quests") {
        const textChanged = old_record.category !== record.category || 
                            old_record.title !== record.title || 
                            old_record.description !== record.description;
        if (!textChanged) return new Response("Quest text unchanged, skipping", { status: 200 });
      } else if (table === "profiles") {
        const textChanged = old_record.bio !== record.bio || 
                            old_record.major !== record.major;
        if (!textChanged) return new Response("Profile text unchanged, skipping", { status: 200 });
      }
    }
    // ------------------------------------------------

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

    // 2. Call Gemini Embedding API
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
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
});