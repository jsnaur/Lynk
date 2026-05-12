// app/services/FeedAlgorithmService.ts
import { supabase } from '../lib/supabase';

export interface NearbyQuest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  location: string | null;
  category: string;
  token_bounty: number;
  bonus_xp: number;
  status: string;
  poster_name: string;
  equipped_accessories: Record<string, string>;
  created_at: string;
  distance_km: number;
  max_participants: number;
  is_auto_accept: boolean;
  ai_score: number;
}

// REMOVED: GEMINI_API_KEY and heuristicSort (now handled instantly by DB)

function clampLatitude(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-90, Math.min(90, value));
}

function clampLongitude(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-180, Math.min(180, value));
}

function normalizeCoordinate(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  const clamped = Math.max(min, Math.min(max, value));
  // Keep at most 6 decimals to avoid DB numeric precision/range edge cases.
  return Number(clamped.toFixed(6));
}

function normalizeMaxResults(value: number): number {
  const safeValue = Number.isInteger(value) ? value : Math.floor(value);
  return Math.max(1, Math.min(100, safeValue));
}

async function fetchFallbackFeed(maxResults: number): Promise<NearbyQuest[]> {
  const { data, error } = await supabase
    .from('quests')
    .select(`
      id,
      user_id,
      title,
      description,
      location,
      category,
      token_bounty,
      bonus_xp,
      status,
      created_at,
      max_participants,
      is_auto_accept,
      profiles!quests_user_id_fkey(display_name, equipped_accessories)
    `)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(maxResults);

  if (error) {
    console.error('Fallback feed query failed:', error);
    return [];
  }

  return ((data as any[]) || []).map((q) => {
    const profile = Array.isArray(q.profiles) ? q.profiles[0] : q.profiles;
    return {
      id: q.id,
      user_id: q.user_id,
      title: q.title,
      description: q.description,
      location: q.location ?? null,
      category: q.category,
      token_bounty: q.token_bounty ?? 0,
      bonus_xp: q.bonus_xp ?? 0,
      status: q.status,
      poster_name: profile?.display_name || 'Anonymous',
      equipped_accessories: profile?.equipped_accessories || {},
      created_at: q.created_at,
      distance_km: 0,
      max_participants: q.max_participants ?? 1,
      is_auto_accept: q.is_auto_accept ?? true,
      ai_score: 0,
    } satisfies NearbyQuest;
  });
}

export async function getPersonalizedFeed(
  userLat: number,
  userLon: number
): Promise<NearbyQuest[]> {
  const safeLat = normalizeCoordinate(clampLatitude(userLat), -90, 90);
  const safeLon = normalizeCoordinate(clampLongitude(userLon), -180, 180);
  const safeMaxResults = normalizeMaxResults(30);

  if (safeLat !== userLat || safeLon !== userLon) {
    console.warn('Clamped invalid location input for AI nearby quests:', {
      originalLat: userLat,
      originalLon: userLon,
      safeLat,
      safeLon,
    });
  }

  const { data, error } = await supabase
    .rpc('get_nearby_quests_ai', {
      user_lat: safeLat,
      user_lon: safeLon,
      max_results: safeMaxResults,
    });

  if (error) {
    console.error('Error fetching AI nearby quests:', {
      error,
      user_lat: safeLat,
      user_lon: safeLon,
      max_results: safeMaxResults,
    });
    // DB function can fail with 22003 ("input is out of range") depending on internal math.
    // Fall back to a lightweight non-AI feed to keep UX stable.
    if (error.code === '22003') {
      return fetchFallbackFeed(safeMaxResults);
    }
    return [];
  }

  return (data as NearbyQuest[]) || [];
}
