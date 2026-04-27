import { supabase } from "../lib/supabase";

export type ModerationDecision = {
    flagged: boolean;
    label: "safe" | "flagged";
    confidence: number;
    reason: string;
};

export type ReportContentType = "comment" | "quest";

const DEFAULT_DECISION: ModerationDecision = {
    flagged: false,
    label: "safe",
    confidence: 0,
    reason: "No moderation decision available.",
};

const PROFANITY_PATTERNS = [
    // ==========================================
    // ENGLISH
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
    /\bp[uuv][s5$]{2}y\b/i, // pussy
    /\bsl[uuv][t7+]\b/i, // slut
    /\bwh[o0]r[e3]\b/i, // whore

    // ==========================================
    // TAGALOG
    // ==========================================
    /\b(p[uuv]t[a@4]ng?[i1!l]n[a@4]|t[a@4]ng[i1!l]n[a@4])\b/i, // putangina, tangina
    /\bg[a@4]g[o0]\b/i, // gago
    /\b[bv][o0u][bv][o0u]\b/i, // bobo
    /\bp[uuv]t[a@4]\b/i, // puta
    /\b[uuv]l[o0]l\b/i, // ulol
    /\bt[a@4]r[a@4]nt[a@4]d[o0]\b/i, // tarantado
    /\bk[a@4]nt[o0][t7+]\b/i, // kantot
    /\bs[i1!l]r[a@4][uuv]l[o0]\b/i, // siraulo
    /\bt[i1!l]t[i1!l]\b/i, // titi
    /\bp[uuv]k[e3]\b/i, // puke

    // ==========================================
    // BISAYA / CEBUANO
    // ==========================================
    /\by[a@4]w[a@4]\b/i, // yawa
    /\bg[i1!l][a@4]t[a@4]y\b/i, // giatay
    /\bp[i1!l]st[e3i1!l]\b/i, // piste / pisti
    /\bb[i1!l]l[a@4][t7+]\b/i, // bilat
    /\bb[o0]t[o0]\b/i, // boto
    /\b[o0]t[e3][nñ]\b/i, // oten
    /\bb[uuv]r[i1!l]k[a@4][t7+]\b/i, // burikat
    /\bb[uuv][a@4]ng\b/i, // buang
    /\bk[a@4]gw[a@4]ng\b/i, // kagwang
    /\bl[i1!l]t[e3]ch\b/i, // litech / letse (also used in Tagalog)
];

function normalizeForCheck(value: string): string {
    return value
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^a-z0-9\s@!$+]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export async function moderateCommentContent(
    content: string,
): Promise<ModerationDecision> {
    const trimmed = content.trim();
    if (!trimmed) return DEFAULT_DECISION;
    const normalized = normalizeForCheck(trimmed);
    const matchedPattern = PROFANITY_PATTERNS.find((pattern) =>
        pattern.test(normalized)
    );

    if (!matchedPattern) {
        return DEFAULT_DECISION;
    }

    return {
        flagged: true,
        label: "flagged",
        confidence: 0.96,
        reason: "Blocked by local profanity safety net.",
    };
}

export async function reportContent(
    contentId: string,
    contentType: ReportContentType,
    reason: string,
): Promise<{ success: boolean; error?: string }> {
    const trimmedId = contentId.trim();
    const trimmedReason = reason.trim();

    if (!trimmedId || !trimmedReason) {
        return {
            success: false,
            error: "Missing report details.",
        };
    }

    const { error } = await supabase.from("reports").insert({
        content_id: trimmedId,
        content_type: contentType,
        reason: trimmedReason,
    });

    if (error) {
        console.warn("Failed to submit content report:", error.message);
        return {
            success: false,
            error: error.message,
        };
    }

    return { success: true };
}
