import { createClient } from "npm:@supabase/supabase-js@2";

type CommentRecord = {
  id?: string;
  content?: string | null;
  moderation_status?: string | null;
};

type RequestPayload = {
  content?: string;
  commentId?: string;
  table?: string;
  type?: string;
  record?: CommentRecord;
  old_record?: CommentRecord;
};

type ModerationDecision = {
  flagged: boolean;
  label: "safe" | "flagged";
  confidence: number;
  reason: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const DEFAULT_RESPONSE: ModerationDecision = {
  flagged: false,
  label: "safe",
  confidence: 0,
  reason: "No moderation decision available.",
};

function safeJsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: corsHeaders,
  });
}

function normalizeModerationResponse(
  data: Partial<ModerationDecision>,
): ModerationDecision {
  return {
    flagged: Boolean(data.flagged ?? DEFAULT_RESPONSE.flagged),
    label: data.flagged ? "flagged" : "safe",
    confidence: Math.min(1, Math.max(0, data.confidence ?? 0)),
    reason: data.reason?.trim() || DEFAULT_RESPONSE.reason,
  };
}

function extractTarget(payload: RequestPayload) {
  const isWebhook = payload.table === "comments" && !!payload.record;

  if (isWebhook) {
    return {
      source: "webhook" as const,
      commentId: payload.record?.id,
      content: payload.record?.content ?? "",
      status: payload.record?.moderation_status ?? null,
      oldContent: payload.old_record?.content ?? null,
      eventType: payload.type ?? "",
    };
  }

  return {
    source: "direct" as const,
    commentId: payload.commentId,
    content: payload.content ?? "",
    status: null,
    oldContent: null,
    eventType: "",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return safeJsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const payload = (await req.json()) as RequestPayload;
    const target = extractTarget(payload);

    if (
      target.source === "webhook" &&
      target.eventType &&
      target.eventType !== "INSERT" &&
      target.eventType !== "UPDATE"
    ) {
      return safeJsonResponse({ skipped: true, reason: "Event type ignored." });
    }

    const commentId = target.commentId;
    const content = (target.content ?? "").trim();

    if (!commentId) {
      return safeJsonResponse({ skipped: true, reason: "Missing comment id." });
    }

    if (!content) {
      return safeJsonResponse({
        skipped: true,
        reason: "Missing comment content.",
      });
    }

    const status = (target.status ?? "").toLowerCase();
    const contentChanged = target.oldContent !== null &&
      target.oldContent !== target.content;
    const isFinalStatus = status === "approved" || status === "flagged" ||
      status === "error";
    const isUnderReview = status === "under_review";

    // Prevent recursive UPDATE webhook loops from our own status writes.
    if (
      target.source === "webhook" && !contentChanged &&
      (isFinalStatus || isUnderReview)
    ) {
      return safeJsonResponse({
        skipped: true,
        reason: `Already moderated (${status}).`,
        commentId,
      });
    }

    const aiApiKey = Deno.env.get("AI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!aiApiKey) {
      console.warn("AI_API_KEY is not set in Supabase secrets.");
      return safeJsonResponse({
        skipped: true,
        reason: "AI_API_KEY missing",
        commentId,
      });
    }

    if (!supabaseUrl || !serviceRoleKey) {
      console.warn("Supabase service role env vars are missing.");
      return safeJsonResponse({
        skipped: true,
        reason: "Service role missing",
        commentId,
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    if (target.source === "webhook") {
      // Mark as under_review before AI call to show pending state in UI.
      await admin
        .from("comments")
        .update({ moderation_status: "under_review" })
        .eq("id", commentId)
        .in("moderation_status", [
          "pending",
          "under_review",
          "approved",
          "flagged",
          "error",
        ]);
    }

    const prompt = `You are a content moderator for a campus app.
Classify whether this message is safe or should be flagged.
Return ONLY valid JSON (no markdown) in this exact shape:
{
  "flagged": boolean,
  "confidence": number,
  "reason": "short reason"
}

Flag content that is harassment, hate, explicit sexual content, credible threats, doxxing, or severe abuse.

Message: "${content}"`;

    const aiResponse = await fetch(`${GEMINI_API_URL}?key=${aiApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!aiResponse.ok) {
      console.warn("Gemini request failed with status:", aiResponse.status);
      return safeJsonResponse(DEFAULT_RESPONSE);
    }

    const body = await aiResponse.json();
    const aiText = body?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : "{}") as Partial<
      ModerationDecision
    >;
    const normalized = normalizeModerationResponse(parsed);

    const nextStatus = normalized.flagged ? "flagged" : "approved";

    const { error: updateError } = await admin
      .from("comments")
      .update({
        moderation_status: nextStatus,
        moderation_reason: normalized.reason,
        moderation_confidence: normalized.confidence,
        moderated_at: new Date().toISOString(),
      })
      .eq("id", commentId);

    if (updateError) {
      console.error(
        "Failed to update moderation columns:",
        updateError.message,
      );
      return safeJsonResponse({
        error: "Failed to update moderation status",
        commentId,
      }, 500);
    }

    return safeJsonResponse({
      ...normalized,
      moderation_status: nextStatus,
      commentId,
    });
  } catch (error) {
    console.error("ai-moderator function failed:", error);
    return safeJsonResponse(DEFAULT_RESPONSE);
  }
});
