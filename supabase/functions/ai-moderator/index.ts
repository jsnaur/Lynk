type RequestPayload = {
  content?: string;
  commentId?: string;
};

type ModerationResponse = {
  flagged: boolean;
  label: "safe" | "flagged";
  confidence: number;
  reason: string;
  commentId?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const DEFAULT_RESPONSE: ModerationResponse = {
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
  data: Partial<ModerationResponse>,
): ModerationResponse {
  return {
    flagged: Boolean(data.flagged ?? DEFAULT_RESPONSE.flagged),
    label: data.flagged ? "flagged" : "safe",
    confidence: Math.min(1, Math.max(0, data.confidence ?? 0)),
    reason: data.reason?.trim() || DEFAULT_RESPONSE.reason,
    commentId: data.commentId,
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
    const { content = "", commentId } = (await req.json()) as RequestPayload;

    if (!content.trim()) {
      return safeJsonResponse({ error: "Missing content" }, 400);
    }

    const aiApiKey = Deno.env.get("AI_API_KEY");
    if (!aiApiKey) {
      console.warn("AI_API_KEY is not set in Supabase secrets.");
      return safeJsonResponse(DEFAULT_RESPONSE);
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
      ModerationResponse
    >;
    const normalized = normalizeModerationResponse(parsed);

    return safeJsonResponse({
      ...normalized,
      commentId,
    });
  } catch (error) {
    console.error("ai-moderator function failed:", error);
    return safeJsonResponse(DEFAULT_RESPONSE);
  }
});
