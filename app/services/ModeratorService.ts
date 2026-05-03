import { supabase } from '../lib/supabase';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

type ModerationResponse = {
  approved: boolean;
  reason: string | null;
};

export async function preCheckContent(
  text: string,
): Promise<{ allowed: boolean; reason?: string }> {
  if (!GEMINI_API_KEY) {
    return { allowed: true };
  }

  try {
    const prompt = `You are a strict content moderator for a university social app. Flag any content that is inappropriate for a campus environment.

Flag content that contains ANY of the following:
- Sexual language, innuendo, or explicit content (including slang for genitals, sex acts, or body parts used vulgarly)
- Profanity or offensive language
- Hate speech or discrimination based on race, gender, religion, or other identity
- Harassment, threats, or bullying
- Spam or completely nonsensical content
- Violence or dangerous content

Be strict. When in doubt, flag it. Context does not excuse inappropriate language.

Text to evaluate: "${text}"

Respond ONLY with valid JSON:
{
  "approved": boolean,
  "reason": "brief user-friendly explanation if flagged, or null if approved"
}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      return { allowed: true };
    }

    const data = await response.json();

    if (!data?.candidates?.length) {
      return { allowed: false, reason: 'Content blocked by safety filter' };
    }

    const rawText = data.candidates[0]?.content?.parts?.[0]?.text ?? '{}';
    const parsed = JSON.parse(rawText) as ModerationResponse;

    return {
      allowed: parsed.approved,
      reason: parsed.reason ?? undefined,
    };
  } catch {
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
