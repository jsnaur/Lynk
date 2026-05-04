import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const { type, table, record, old_record } = payload;

    // Prevent infinite loop — moderation write-back triggers another UPDATE webhook
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

    // Extract text to moderate
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

    let moderationResult: { approved: boolean; reason: string | null; confidence: number };

    try {
      const prompt = `You are a content moderator for LYNK, a social app for university students at Cebu Institute of Technology (CIT-U) in the Philippines. Users write in English, Tagalog, Bisaya (Cebuano), and mixes of all three (Taglish/Bislish).

Your job is to identify CLEAR, OBVIOUS violations only. Most content from university students is completely normal and should be APPROVED. Do NOT flag content just because it is casual, informal, slang-heavy, or uses Filipino or Bisaya words.

ONLY flag content that CLEARLY and UNAMBIGUOUSLY contains:
- Explicit sexual content: graphic descriptions of sexual acts, genitalia slang used offensively, sexual solicitation, pornography links.
- Severe profanity used as a direct personal insult (e.g. "putang ina mo", "gago ka") — casual Filipino/Bisaya expressions used as filler or exclamations (e.g. "grabe", "yawa grabe naman", "lami kaayo", "patay na ako") are NORMAL speech and must NOT be flagged.
- Explicit hate speech: slurs targeting race, religion, gender, sexuality, or disability used hatefully.
- Direct personal threats of violence (e.g. "patayin kita", "I will hurt you").
- Illegal activity: drug sales, solicitation of minors.
- Obvious spam: repetitive nonsense, ads for unrelated external services.

DO NOT flag:
- Normal university task requests (tutoring, borrowing items, food runs, study groups, errands, favors).
- Casual language, slang, hyperbole, or expressions of frustration.
- Bisaya or Tagalog vocabulary that sounds unusual in English.
- Academic Latin terms like "cum laude", "magna cum laude", "summa cum laude".
- Short or terse messages that are simply requests or questions.
- Anything that is merely informal, imperfect grammar, or low-effort content.

When in doubt, APPROVE. Only flag content you are CERTAIN violates the above rules.

Text to evaluate:
"""
${textToModerate}
"""

Respond with a JSON object only, no markdown, no extra text:
{ "approved": boolean, "reason": string | null, "confidence": number }

Where:
- approved: true if content is acceptable, false only if it clearly violates the rules above
- reason: a short user-friendly explanation if flagged (under 120 chars), null if approved
- confidence: a number from 0.0 to 1.0`;

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0,
            },
          }),
        }
      );

      // Non-2xx response (includes 429 rate limit) — approve rather than falsely flag
      if (!geminiRes.ok) {
        console.warn(`Gemini HTTP ${geminiRes.status} — approving to avoid false flag`);
        moderationResult = { approved: true, reason: null, confidence: 0.5 };
      } else {
        const geminiData = await geminiRes.json();

        // Gemini's own safety filter blocked the response — approve since the
        // client-side local blocklist already catches the worst content before submission.
        if (!geminiData.candidates || geminiData.candidates.length === 0) {
          console.warn("Gemini returned no candidates (safety block) — approving");
          moderationResult = { approved: true, reason: null, confidence: 0.5 };
        } else {
          const rawText = geminiData.candidates[0]?.content?.parts?.[0]?.text;
          if (!rawText) throw new Error("Empty response from Gemini");
          moderationResult = JSON.parse(rawText);
        }
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
