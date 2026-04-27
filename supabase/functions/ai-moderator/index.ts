import { createClient } from "npm:@supabase/supabase-js@2";

type ModeratedTable = "comments" | "quests";

type WebhookRecord = {
  id?: string;
  user_id?: string | null;
  title?: string | null;
  description?: string | null;
  content?: string | null;
  visibility?: string | null;
};

type RequestPayload = {
  table?: string;
  type?: string;
  record?: WebhookRecord;
  old_record?: WebhookRecord;
};

type ModerationDecision = {
  flagged: boolean;
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
    confidence: Math.min(1, Math.max(0, data.confidence ?? 0)),
    reason: data.reason?.trim() || DEFAULT_RESPONSE.reason,
  };
}

function extractTarget(payload: RequestPayload) {
  const table = payload.table as ModeratedTable | undefined;
  const isSupportedTable = table === "comments" || table === "quests";

  return {
    table,
    isSupportedTable,
    recordId: payload.record?.id,
    userId: payload.record?.user_id ?? null,
    eventType: payload.type ?? "",
    visibility: payload.record?.visibility ?? null,
    oldVisibility: payload.old_record?.visibility ?? null,
    content: table === "comments"
      ? (payload.record?.content ?? "")
      : `${payload.record?.title ?? ""}\n${payload.record?.description ?? ""}`
        .trim(),
    oldContent: table === "comments"
      ? (payload.old_record?.content ?? null)
      : `${payload.old_record?.title ?? ""}\n${
        payload.old_record?.description ?? ""
      }`.trim() || null,
  };
}

async function createWarningNotification(
  admin: ReturnType<typeof createClient>,
  userId: string,
  table: ModeratedTable,
  referenceId: string,
  reason: string,
) {
  const friendlyType = table === "comments" ? "comment" : "quest";

  const { error } = await admin.from("notifications").insert({
    recipient_id: userId,
    type: "moderation_warning",
    title: `${friendlyType[0].toUpperCase()}${friendlyType.slice(1)} Hidden`,
    description: `Your ${friendlyType} was hidden by moderation. ${reason}`,
    reference_id: referenceId,
    is_read: false,
  });

  if (error) {
    console.warn(
      "Failed to insert moderation warning notification:",
      error.message,
    );
  }
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

    if (!target.isSupportedTable || !target.table) {
      return safeJsonResponse({
        skipped: true,
        reason: "Table not supported.",
      });
    }

    if (
      target.eventType && target.eventType !== "INSERT" &&
      target.eventType !== "UPDATE"
    ) {
      return safeJsonResponse({ skipped: true, reason: "Event type ignored." });
    }

    const recordId = target.recordId;
    const content = (target.content ?? "").trim();
    const userId = target.userId;

    if (!recordId) {
      return safeJsonResponse({ skipped: true, reason: "Missing record id." });
    }

    if (!content) {
      return safeJsonResponse({
        skipped: true,
        reason: "Missing content.",
      });
    }

    const visibility = (target.visibility ?? "").toLowerCase();
    const oldVisibility = (target.oldVisibility ?? "").toLowerCase();
    const contentChanged = target.oldContent !== null &&
      target.oldContent !== target.content;

    // Prevent recursive loops when our own UPDATE sets visibility to hidden.
    if (
      target.eventType === "UPDATE" && !contentChanged &&
      visibility === "hidden"
    ) {
      return safeJsonResponse({
        skipped: true,
        reason: "Already hidden by moderation.",
        recordId,
      });
    }

    if (
      target.eventType === "UPDATE" && oldVisibility === "hidden" &&
      !contentChanged
    ) {
      return safeJsonResponse({
        skipped: true,
        reason: "No new text changes to moderate.",
        recordId,
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
        recordId,
      });
    }

    if (!supabaseUrl || !serviceRoleKey) {
      console.warn("Supabase service role env vars are missing.");
      return safeJsonResponse({
        skipped: true,
        reason: "Service role missing",
        recordId,
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const prompt = `You are a university community content moderator.
Review this user-generated text under campus guidelines.
Detect hate speech, bullying/harassment, explicit sexual content, or severe profanity.
Return ONLY valid JSON (no markdown) in this exact shape:
{
  "flagged": boolean,
  "confidence": number,
  "reason": "short reason"
}

If text is unsafe, set flagged=true.
If safe, set flagged=false.

Text: "${content}"`;

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

    if (!normalized.flagged) {
      return safeJsonResponse({
        ...normalized,
        table: target.table,
        recordId,
        action: "none",
      });
    }

    const { error: hideError } = await admin
      .from(target.table)
      .update({ visibility: "hidden" })
      .eq("id", recordId);

    if (hideError) {
      console.error("Failed to hide flagged content:", hideError.message);
      return safeJsonResponse({
        error: "Failed to hide flagged content",
        table: target.table,
        recordId,
      }, 500);
    }

    if (userId) {
      await createWarningNotification(
        admin,
        userId,
        target.table,
        recordId,
        normalized.reason,
      );
    }

    return safeJsonResponse({
      ...normalized,
      table: target.table,
      recordId,
      action: "hidden",
    });
  } catch (error) {
    console.error("ai-moderator function failed:", error);
    return safeJsonResponse(DEFAULT_RESPONSE);
  }
});
