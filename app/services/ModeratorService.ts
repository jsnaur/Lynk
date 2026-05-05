import { supabase } from '../lib/supabase';

const LOCAL_BLOCKLIST: { pattern: RegExp; category: ModerationCategory; reason: string }[] = [
  { pattern: /\b(n+i+g+(g+e+r+s?|g+a+s?|g+u+h+|let)|negroe?s?|jigaboo|coon|porch\s*monkey)\b/i, category: 'hate', reason: 'Contains racist language.' },
  { pattern: /\b(chink|chinks|gook|gooks|spic|spics|wetback|kike|kikes|towelhead|sandnigger|raghead)\b/i, category: 'hate', reason: 'Contains racist slurs.' },
  { pattern: /\b(fag|fags|faggot|faggots|f+a+g+g+o+t+|tranny|trannies|dyke|dykes|homo)\b/i, category: 'hate', reason: 'Contains homophobic or transphobic language.' },
  { pattern: /\b(retard|retards|retarded|sped|mongoloid|cripple)\b/i, category: 'hate', reason: 'Contains ableist slurs.' },
  { pattern: /\b(heil\s*hitler|sieg\s*heil|kkk|white\s*power|gas\s*the\s*jews|14\/?88)\b/i, category: 'hate', reason: 'Contains hate group references.' },
  { pattern: /\b(fuck|f+u+c+k+|fck|phuck|shit|sh1t|bitch|b1tch|asshole|cunt|c\*nt|dick|pussy|cock|whore|slut|motherfucker)\b/i, category: 'profanity', reason: 'Contains vulgar English language.' },
  { pattern: /\b(p+u+t+a+(ng)?\s*i+n+a+|tang\s*ina|tangina|tnga|pakyu|pakshet|pak\s*you|pakingshet|gago|gaga|tarantado|tanga|bobo|boba|ulol|leche|hayop\s*ka|hudas|punyeta|lintik|sira\s*ulo)\b/i, category: 'profanity', reason: 'Contains vulgar Tagalog language.' },
  { pattern: /\b(yawa|piste|pisting\s*yawa|bilat|bayot|buang|kayatun|libog|lami\s*sa|amaw|animal\s*ka|atay|peste)\b/i, category: 'profanity', reason: 'Contains vulgar Bisaya language.' },
  { pattern: /\b(kantot|kantotan|iyot|iyotan|chupa|jakol|jakulan|tite|titi|burat|puke|pekpek|pepe|tamod|kanal|kalibog|libog\s*na)\b/i, category: 'sexual', reason: 'Contains sexual content.' },
  { pattern: /\b(sex|sexy\s*time|nudes?|porn|pornhub|horny|blowjob|handjob|rimjob|jizz|orgasm|masturbat|fap|onlyfans|nsfw)\b/i, category: 'sexual', reason: 'Contains sexual content.' },
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

// Client-side pre-check uses only the local blocklist — instant, no API call.
// Nuanced moderation is handled server-side by the moderate-content edge function
// which runs after every insert and writes the final moderation_status to the DB.
export function preCheckContent(text: string): PreCheckResult {
  const trimmed = text.trim();
  if (!trimmed) return { allowed: true };
  return localPreCheck(trimmed) ?? { allowed: true };
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
