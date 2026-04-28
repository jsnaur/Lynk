// deno-lint-ignore-file no-import-prefix
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

type QueryResult = { error: { message: string } | null };

type AdminClient = {
  from: (table: string) => {
    insert: (
      values: Record<string, unknown> | Array<Record<string, unknown>>,
    ) => Promise<QueryResult>;
    update: (
      values: Record<string, unknown>,
    ) => {
      eq: (column: string, value: string) => Promise<QueryResult>;
    };
  };
};

const PROFANITY_PATTERNS = [
  // ==========================================
  // ENGLISH - Core & Expanded
  // ==========================================
  /\bsh[i1!l][t7+]\b/i, // shit
  /\bf[uuv][ckx]+\b/i, // fuck, fuk, fux
  /\bb[i1!l][t7+]*ch\b/i, // bitch
  /\b[a@4][s5$]{2}h[o0]l[e3]\b/i, // asshole
  /\bcr[a@4]p\b/i, // crap
  /\bd[a@4]mn\b/i, // damn
  /\bb[uuv]llsh[i1!l][t7+]\b/i, // bullshit
  /\bm[o0]th[e3]rf[uuv][ckx]+[e3]r\b/i, // motherfucker
  /\bd[i1!l][ck]+\b/i, // dick
  /\bc[uuv]n[t7+]\b/i, // cunt
  /\bn[i1!l]gg[e3]r\b/i, // nigger
  /\bn[i1!l]gg[a@4]\b/i, // nigga
  /\bp[uuv][s5$]{2}y\b/i, // pussy
  /\bsl[uuv][t7+]\b/i, // slut
  /\bwh[o0]r[e3]\b/i, // whore
  /\bb[a@4]st[a@4]rd\b/i, // bastard
  /\btw[a@4][t7+]\b/i, // twat
  /\bw[a@4]nk[e3]r\b/i, // wanker
  /\bpr[i1!l]ck\b/i, // prick
  /\bd[o0][uuv]ch[e3]\b/i, // douche

  // ==========================================
  // TAGALOG - Core & Expanded
  // ==========================================
  /\b(p[uuv]t[a@4]ng?[i1!l]n[a@4]|t[a@4]ng[i1!l]n[a@4])\b/i, // putangina, tangina
  /\bg[a@4]g[o0]\b/i, // gago
  /\bp[uuv]t[a@4]\b/i, // puta
  /\b[uuv]l[o0]l\b/i, // ulol
  /\bt[a@4]r[a@4]nt[a@4]d[o0]\b/i, // tarantado
  /\bk[a@4]nt[o0][t7+]\b/i, // kantot (to fuck)
  /\bs[i1!l]r[a@4][uuv]l[o0]\b/i, // siraulo
  /\bt[i1!l]t[i1!l]\b/i, // titi (penis)
  /\bp[uuv]k[e3]\b/i, // puke (vagina)
  /\bh[i1!l]nd[o0][t7+]\b/i, // hindot (fuck/insult)
  /\bp[o0]kp[o0]k\b/i, // pokpok (whore)
  /\bk[uuv]p[a@4]l\b/i, // kupal (smegma/jerk)
  /\bb[uuv]r[a@4][t7+]\b/i, // burat (dick)
  /\bj[a@4]k[o0]l\b/i, // jakol (masturbate)
  /\bs[uuv]p[o0][t7+]\b/i, // supot (uncircumcised/insult)
  /\bp[e3]p[e3]\b/i, // pepe (vagina)
  /\bl[i1!l]nt[i1!l]k\b/i, // lintik (damn/lightning)

  // ==========================================
  // BISAYA / CEBUANO - Core & Expanded
  // ==========================================
  /\by[a@4]w[a@4]\b/i, // yawa (devil)
  /\bg[i1!l][a@4]t[a@4]y\b/i, // giatay (damn/ruined)
  /\bp[i1!l]st[e3i1!l]\b/i, // piste / pisti (pest/damn)
  /\bb[i1!l]l[a@4][t7+]\b/i, // bilat (vagina)
  /\bb[o0]t[o0]\b/i, // boto (vagina)
  /\b[o0]t[e3][nñ]\b/i, // oten (penis)
  /\bb[uuv]r[i1!l]k[a@4][t7+]\b/i, // burikat (whore)
  /\bb[uuv][a@4]ng\b/i, // buang (crazy/fool)
  /\bk[a@4]gw[a@4]ng\b/i, // kagwang (flying lemur/idiot)
  /\bl[i1!l]t[e3]ch\b/i, // litech / letse (damn)
  /\bk[a@4]y[a@4]t[a@4]?\b/i, // kayat / kayata (fuck)
  /\b[i1!l]y[o0][t7+]\b/i, // iyot (fuck)
  /\bj[e3]rj[e3]r\b/i, // jerjer (to have sex)
  /\bk[i1!l]gw[a@4]\b/i, // kigwa (parasite/restless)
  /\bp[i1!l]s[o0][t7+]\b/i, // pisot (uncircumcised/insult)
  /\bb[uuv]t[a@4]k[a@4]l\b/i, // butakal (boar/sexually aggressive)
  /\bh[a@4]ng[a@4]w\b/i, // hangaw (stupid/empty-headed)
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

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

function localFallbackModeration(content: string): ModerationDecision {
  if (!content.trim()) {
    return DEFAULT_RESPONSE;
  }

  const matchedPattern = PROFANITY_PATTERNS.find((pattern) =>
    pattern.test(content)
  );
  if (matchedPattern) {
    return {
      flagged: true,
      confidence: 0.96,
      reason: "Matched local profanity fallback.",
    };
  }

  return DEFAULT_RESPONSE;
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
  admin: AdminClient,
  userId: string,
  table: ModeratedTable,
  referenceId: string,
  reason: string,
) {
  const friendlyType = table === "comments" ? "comment" : "quest";

  const { error } = await admin.from("notifications").insert({
    recipient_id: userId,
    type: "moderator_warning",
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

async function updateCommentModeration(
  admin: AdminClient,
  commentId: string,
  status: "approved" | "flagged" | "error",
  reason: string,
  confidence: number,
) {
  const { error } = await admin
    .from("comments")
    .update({
      moderation_status: status,
      moderation_reason: reason,
      moderation_confidence: confidence,
      moderated_at: new Date().toISOString(),
    })
    .eq("id", commentId);

  if (error) {
    console.warn("Failed to update comment moderation fields:", error.message);
  }
}

async function hideAndFlagComment(
  admin: AdminClient,
  commentId: string,
  userId: string | null,
  reason: string,
  confidence: number,
) {
  const { error: hideError } = await admin
    .from("comments")
    .update({ visibility: "hidden" })
    .eq("id", commentId);

  if (hideError) {
    console.error("Failed to hide flagged comment:", hideError.message);
    await updateCommentModeration(
      admin,
      commentId,
      "error",
      "Failed to hide flagged content.",
      confidence,
    );
    return { hidden: false, hideError: hideError.message };
  }

  await updateCommentModeration(
    admin,
    commentId,
    "flagged",
    reason,
    confidence,
  );

  if (userId) {
    await createWarningNotification(
      admin,
      userId,
      "comments",
      commentId,
      reason,
    );
  }

  return { hidden: true, hideError: null };
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

    const contentChanged = target.oldContent !== null &&
      target.oldContent !== target.content;

    // Skip moderation-only UPDATEs from our own writes (status/metadata changes).
    if (target.eventType === "UPDATE" && !contentChanged) {
      return safeJsonResponse({
        skipped: true,
        reason: "Moderation-only update ignored.",
        recordId,
      });
    }

    const aiApiKey = Deno.env.get("AI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.warn("Supabase service role env vars are missing.");
      return safeJsonResponse({
        skipped: true,
        reason: "Service role missing",
        recordId,
      });
    }

    const admin = createClient(
      supabaseUrl,
      serviceRoleKey,
    ) as unknown as AdminClient;

    // Always run a strict local profanity pre-check for comments so obvious abuse
    // is blocked even when the external AI provider is rate-limited or unavailable.
    if (target.table === "comments") {
      const localPrecheck = localFallbackModeration(content);
      if (localPrecheck.flagged) {
        const precheckResult = await hideAndFlagComment(
          admin,
          recordId,
          userId,
          localPrecheck.reason,
          localPrecheck.confidence,
        );

        if (!precheckResult.hidden) {
          return safeJsonResponse({
            error: "Failed to hide flagged content",
            table: target.table,
            recordId,
          }, 500);
        }

        return safeJsonResponse({
          ...localPrecheck,
          table: target.table,
          recordId,
          action: "hidden",
          fallback: true,
          source: "local_precheck",
        });
      }
    }

    if (!aiApiKey) {
      console.warn("AI_API_KEY is not set in Supabase secrets.");
      if (target.table === "comments") {
        await updateCommentModeration(
          admin,
          recordId,
          "error",
          "AI moderation unavailable: API key missing.",
          0,
        );
      }
      return safeJsonResponse(DEFAULT_RESPONSE);
    }

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
      if (target.table === "comments") {
        const fallback = localFallbackModeration(content);
        if (fallback.flagged) {
          const fallbackResult = await hideAndFlagComment(
            admin,
            recordId,
            userId,
            fallback.reason,
            fallback.confidence,
          );

          if (!fallbackResult.hidden) {
            return safeJsonResponse({
              error: "Failed to hide flagged content",
              table: target.table,
              recordId,
            }, 500);
          }

          return safeJsonResponse({
            ...fallback,
            table: target.table,
            recordId,
            action: "hidden",
            fallback: true,
            source: "ai_failure_fallback",
          });
        }
      }

      if (target.table === "comments") {
        await updateCommentModeration(
          admin,
          recordId,
          "error",
          `AI moderation request failed with status ${aiResponse.status}.`,
          0,
        );
      }
      return safeJsonResponse(DEFAULT_RESPONSE);
    }

    const body = await aiResponse.json();
    const aiText = body?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    let parsed: Partial<ModerationDecision> = {};
    try {
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : "{}") as Partial<
        ModerationDecision
      >;
    } catch (parseError) {
      console.warn("Failed to parse Gemini response JSON:", parseError);
    }
    const normalized = normalizeModerationResponse(parsed);

    if (!normalized.flagged) {
      if (target.table === "comments") {
        await updateCommentModeration(
          admin,
          recordId,
          "approved",
          normalized.reason,
          normalized.confidence,
        );
      }

      return safeJsonResponse({
        ...normalized,
        table: target.table,
        recordId,
        action: "approved",
      });
    }

    const { error: hideError } = await admin
      .from(target.table)
      .update({ visibility: "hidden" })
      .eq("id", recordId);

    if (hideError) {
      console.error("Failed to hide flagged content:", hideError.message);
      if (target.table === "comments") {
        await updateCommentModeration(
          admin,
          recordId,
          "error",
          "Failed to hide flagged content.",
          normalized.confidence,
        );
      }
      return safeJsonResponse({
        error: "Failed to hide flagged content",
        table: target.table,
        recordId,
      }, 500);
    }

    if (target.table === "comments") {
      await updateCommentModeration(
        admin,
        recordId,
        "flagged",
        normalized.reason,
        normalized.confidence,
      );
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
