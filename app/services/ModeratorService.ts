import { supabase } from '../lib/supabase';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

const LOCAL_BLOCKLIST: { pattern: RegExp; category: ModerationCategory; reason: string }[] = [
  { pattern: /\b(n+i+g+(g+e+r+s?|g+a+s?|g+u+h+|let)|negroe?s?|jigaboo|coon|porch\s*monkey)\b/i, category: 'hate', reason: 'Contains racist language.' },
  { pattern: /\b(chink|chinks|gook|gooks|spic|spics|wetback|kike|kikes|towelhead|sandnigger|raghead)\b/i, category: 'hate', reason: 'Contains racist slurs.' },
  { pattern: /\b(fag|fags|faggot|faggots|f+a+g+g+o+t+|tranny|trannies|dyke|dykes|homo|queer)\b/i, category: 'hate', reason: 'Contains homophobic or transphobic language.' },
  { pattern: /\b(retard|retards|retarded|sped|mongoloid|cripple)\b/i, category: 'hate', reason: 'Contains ableist slurs.' },
  { pattern: /\b(heil\s*hitler|sieg\s*heil|kkk|white\s*power|gas\s*the\s*jews|14\/?88)\b/i, category: 'hate', reason: 'Contains hate group references.' },
  { pattern: /\b(fuck|f+u+c+k+|fck|phuck|shit|sh1t|bitch|b1tch|asshole|cunt|c\*nt|dick|pussy|cock|whore|slut|motherfucker|mf|wtf|stfu|gtfo)\b/i, category: 'profanity', reason: 'Contains vulgar English language.' },
  { pattern: /\b(p+u+t+a+(ng)?\s*i+n+a+|tang\s*ina|tangina|tnga|pakyu|pakshet|pak\s*you|pakingshet|gago|gaga|tarantado|tanga|bobo|boba|ulol|leche|hayop\s*ka|hudas|punyeta|lintik|sira\s*ulo)\b/i, category: 'profanity', reason: 'Contains vulgar Tagalog language.' },
  { pattern: /\b(yawa|piste|pisting\s*yawa|bilat|bayot|buang|kayatun|libog|lami\s*sa|amaw|animal\s*ka|atay|peste)\b/i, category: 'profanity', reason: 'Contains vulgar Bisaya language.' },
  { pattern: /\b(kantot|kantotan|iyot|iyotan|chupa|jakol|jakulan|tite|titi|burat|puke|pekpek|pepe|tamod|kanal|kalibog|libog\s*na)\b/i, category: 'sexual', reason: 'Contains sexual content.' },
  { pattern: /\b(sex|sexy\s*time|nudes?|porn|pornhub|horny|blowjob|handjob|rimjob|cum|jizz|orgasm|masturbat|fap|onlyfans|nsfw)\b/i, category: 'sexual', reason: 'Contains sexual content.' },
  { pattern: /\b(rape|rapist|molest|pedo|pedophile|loli|cp)\b/i, category: 'sexual', reason: 'Contains prohibited sexual content.' },
  { pattern: /\b(patayin\s*kita|papatayin\s*kita|kill\s*you|i'?ll\s*kill|kill\s*yourself|kys|patyon\s*tika|patay\s*ka|bugbugin\s*kita)\b/i, category: 'harassment', reason: 'Contains threatening language.' },
  { pattern: /\b(suicide|hang\s*yourself|neck\s*yourself|drink\s*bleach|slit\s*your\s*wrists)\b/i, category: 'violence', reason: 'Contains harmful or dangerous content.' },
  { pattern: /\b(meth|cocaine|heroin|shabu|marijuana\s*for\s*sale|weed\s*for\s*sale|drugs\s*for\s*sale)\b/i, category: 'violence', reason: 'Contains references to illegal substances.' },
];

function localPreCheck(text: string): PreCheckResult | null {
  for (const entry of LOCAL_BLOCKLIST) {
    if (entry.pattern.test(text)) {
      return { allowed: false, reason: entry.reason, category: entry.category };
    }
  }
  return null;
}

export type ModerationCategory =
  | 'sexual'
  | 'profanity'
  | 'hate'
  | 'harassment'
  | 'violence'
  | 'spam'
  | 'other';

export type PreCheckResult = {
  allowed: boolean;
  reason?: string;
  category?: ModerationCategory;
  language?: string;
};

type ModerationResponse = {
  approved: boolean;
  reason: string | null;
  category: ModerationCategory | null;
  language: string | null;
};

export async function preCheckContent(text: string): Promise<PreCheckResult> {
  const trimmed = text.trim();
  if (!trimmed) return { allowed: true };

  const localHit = localPreCheck(trimmed);
  if (localHit) return localHit;

  if (!GEMINI_API_KEY) {
    if (__DEV__) {
      console.warn(
        '[ModeratorService] EXPO_PUBLIC_GEMINI_API_KEY missing — moderation disabled.',
      );
    }
    return { allowed: true };
  }

  try {
    const prompt = `You are a strict content moderator for LYNK, a social app for university students at Cebu Institute of Technology. The app's users primarily write in English, Tagalog (Filipino), and Bisaya (Cebuano), and frequently mix all three (Taglish/Bislish). You MUST recognize inappropriate content in any of these languages, including transliterations, abbreviations, and creative spellings used to evade filters (e.g., "p*ta", "putang ina", "yawa", "bilat", "lami", "kantot", "iyot", "bobo", "tanga").

Flag content that contains ANY of the following in ANY language:
- Sexual: explicit acts, genitalia slang, sexual innuendo, solicitation. Tagalog/Bisaya examples: "kantot", "iyot", "tite", "puke", "bilat", "burat", "lami sa", "chupa", "jakol".
- Profanity / vulgar insults. Tagalog/Bisaya examples: "putang ina", "tang ina", "gago", "tarantado", "ulol", "yawa", "piste", "pisting yawa", "bwisit", "leche", "pakshet", "pakyu", "tae", "hayop ka".
- Hate speech / slurs targeting race, religion, gender, sexuality, disability.
- Harassment, threats, doxxing, bullying ("patayin kita", "akoy mopatay nimo", etc.).
- Violence or dangerous behavior (drug sales, self-harm encouragement, weapons).
- Spam, scams, advertising unrelated services, or completely nonsensical / keyboard-mash content.

Be STRICT. When uncertain, FLAG it. Mild "ano ba yan" or "grabe" alone is fine — but vulgar combinations are NOT.

Text to evaluate: """${trimmed}"""

Respond ONLY with valid minified JSON matching this shape:
{"approved": boolean, "reason": "short user-friendly reason in English, or null", "category": "sexual"|"profanity"|"hate"|"harassment"|"violence"|"spam"|"other"|null, "language": "english"|"tagalog"|"bisaya"|"mixed"|"other"|null}

The "reason" must be friendly and concise (under 120 chars), e.g. "Contains vulgar language" or "Sexual content not allowed". Do NOT quote the offensive words.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0,
        },
      }),
    });

    if (!response.ok) {
      if (__DEV__) console.warn('[ModeratorService] Gemini HTTP', response.status);
      return { allowed: true };
    }

    const data = await response.json();

    if (!data?.candidates?.length) {
      return {
        allowed: false,
        reason: 'Content blocked by safety filter.',
        category: 'other',
      };
    }

    const rawText: string = data.candidates[0]?.content?.parts?.[0]?.text ?? '{}';
    const parsed = JSON.parse(rawText) as ModerationResponse;

    return {
      allowed: !!parsed.approved,
      reason: parsed.reason ?? undefined,
      category: parsed.category ?? undefined,
      language: parsed.language ?? undefined,
    };
  } catch (err) {
    if (__DEV__) console.warn('[ModeratorService] preCheck error', err);
    return { allowed: true };
  }
}

export function getModerationUI(
  status: string,
  reason?: string | null,
): { label: string; color: string; message?: string } {
  switch (status) {
    case 'pending':
      return {
        label: 'Under Review',
        color: '#F59E0B',
        message: 'Your content is being reviewed.',
      };
    case 'approved':
      return { label: '', color: '', message: undefined };
    case 'flagged':
      return {
        label: 'Flagged',
        color: '#EF4444',
        message:
          reason && !reason.startsWith('Blocked by safety filter')
            ? reason
            : 'This content violates our community guidelines.',
      };
    case 'error':
      return { label: 'Moderation Unavailable', color: '#6B7280', message: undefined };
    default:
      return { label: '', color: '', message: undefined };
  }
}

export function subscribeModerationStatus(
  table: 'quests' | 'comments' | 'profiles',
  recordId: string,
  onUpdate: (status: string, reason: string | null) => void,
): () => void {
  const channel = supabase
    .channel(`moderation_${table}_${recordId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table, filter: `id=eq.${recordId}` },
      (payload) => {
        const next = payload.new as Record<string, unknown>;
        onUpdate(
          (next.moderation_status as string) ?? '',
          (next.moderation_reason as string | null) ?? null,
        );
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
