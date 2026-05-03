import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const { type, table, record, old_record } = payload;

    // --- PREVENT INFINITE LOOP ---
    // The moderation write-back triggers another UPDATE webhook. Skip if relevant fields unchanged.
    // If old_record is missing on an UPDATE, skip entirely — safer than risking a loop.
    if (type === "UPDATE") {
      if (!old_record) {
        return new Response("UPDATE missing old_record, skipping to prevent loop", { status: 200 });
      }
      if (table === "quests") {
        const textChanged = old_record.category !== record.category ||
                            old_record.title !== record.title ||
                            old_record.description !== record.description;
        if (!textChanged) return new Response("Quest text unchanged, skipping", { status: 200 });
      } else if (table === "comments") {
        const textChanged = old_record.content !== record.content;
        if (!textChanged) return new Response("Comment text unchanged, skipping", { status: 200 });
      } else if (table === "profiles") {
        const textChanged =
          (old_record.bio !== record.bio && record.bio !== null) ||
          (old_record.display_name !== record.display_name && record.display_name !== null);
        if (!textChanged) return new Response("Profile text unchanged, skipping", { status: 200 });
      }
    }
    // ------------------------------

    // 1. Extract text to moderate based on table
    let textToModerate = "";
    if (table === "quests") {
      textToModerate = `${record.category ?? ""} ${record.title ?? ""} ${record.description ?? ""}`.trim();
    } else if (table === "comments") {
      textToModerate = (record.content ?? "").trim();
    } else if (table === "profiles") {
      const displayName = record.display_name ?? "";
      const bio = record.bio ?? "";
      if (!displayName && !bio) {
        return new Response("Profile has no text to moderate, skipping", { status: 200 });
      }
      textToModerate = `${displayName} ${bio}`.trim();
    } else {
      return new Response("Ignored table", { status: 200 });
    }

    if (!textToModerate) return new Response("Empty text, skipping", { status: 200 });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 2. Call Gemini generateContent API
    let moderationResult: { approved: boolean; reason: string | null; confidence: number };

    try {
      const prompt = `You are a content moderation system for a university social app. Evaluate the following text for community guideline violations including hate speech, harassment, explicit content, spam, and violence.

Text to evaluate:
"""
${textToModerate}
"""

Respond with a JSON object only, no markdown, no extra text:
{ "approved": boolean, "reason": string | null, "confidence": number }

Where:
- approved: true if the content is acceptable, false if it violates guidelines
- reason: a short explanation if flagged, null if approved
- confidence: a number from 0.0 to 1.0 indicating how confident you are in this decision`;

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          }),
        }
      );

      const geminiData = await geminiRes.json();

      // Gemini's own safety filter blocked the input — auto-flag it
      if (!geminiData.candidates || geminiData.candidates.length === 0) {
        moderationResult = { approved: false, reason: "This content violates our community guidelines.", confidence: 1.0 };
      } else {
        const rawText = geminiData.candidates[0]?.content?.parts?.[0]?.text;
        if (!rawText) throw new Error("Empty response from Gemini");
        moderationResult = JSON.parse(rawText);
      }
      if (typeof moderationResult.approved !== "boolean" ||
          typeof moderationResult.confidence !== "number") {
        throw new Error("Unexpected Gemini response shape");
      }
    } catch (err: unknown) {
      console.error("Gemini moderation error:", err);
      await supabase
        .from(table)
        .update({ moderation_status: "error", moderated_at: new Date().toISOString() })
        .eq("id", record.id);
      return new Response(JSON.stringify({ success: false, error: "moderation_error" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Write moderation result back to the table
    const status = moderationResult.approved ? "approved" : "flagged";
    const updatePayload: Record<string, unknown> = {
      moderation_status: status,
      moderation_reason: moderationResult.approved ? null : moderationResult.reason,
      moderation_confidence: moderationResult.confidence,
      moderated_at: new Date().toISOString(),
    };

    if (table === "profiles" && !moderationResult.approved) {
      updatePayload.bio = null;
    }

    await supabase
      .from(table)
      .update(updatePayload)
      .eq("id", record.id);

    return new Response(JSON.stringify({ success: true, status }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
});
