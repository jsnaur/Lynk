import { supabase } from "../lib/supabase";

export type ModerationDecision = {
    flagged: boolean;
    label: "safe" | "flagged";
    confidence: number;
    reason: string;
};

const DEFAULT_DECISION: ModerationDecision = {
    flagged: false,
    label: "safe",
    confidence: 0,
    reason: "No moderation decision available.",
};

const MODERATION_FUNCTION_NAME = "ai-moderator";

export async function moderateCommentContent(
    content: string,
): Promise<ModerationDecision> {
    const trimmed = content.trim();
    if (!trimmed) return DEFAULT_DECISION;

    try {
        const { data, error } = await supabase.functions.invoke(
            MODERATION_FUNCTION_NAME,
            {
                body: { content: trimmed },
            },
        );

        if (error) {
            console.warn("Comment moderation invoke failed:", error.message);
            return DEFAULT_DECISION;
        }

        const payload = (data ?? {}) as Partial<ModerationDecision>;
        const flagged = Boolean(payload.flagged);

        return {
            flagged,
            label: flagged ? "flagged" : "safe",
            confidence: Math.min(1, Math.max(0, payload.confidence ?? 0)),
            reason: payload.reason?.trim() || DEFAULT_DECISION.reason,
        };
    } catch (err) {
        console.warn("Comment moderation failed:", err);
        return DEFAULT_DECISION;
    }
}
