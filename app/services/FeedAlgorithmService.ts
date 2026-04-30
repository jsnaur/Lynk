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

export async function getPersonalizedFeed(
  userLat: number,
  userLon: number
): Promise<NearbyQuest[]> {
  
  // STEP 1: Fetch AI-Sorted nearby quests instantly from Database
  const { data, error } = await supabase
    .rpc('get_nearby_quests_ai', {
      user_lat: userLat,
      user_lon: userLon,
      max_results: 30
    });

  if (error) {
    console.error("Error fetching AI nearby quests:", error);
    return [];
  }

  // Quests arrive already sorted perfectly by your custom AI Vector logic
  return data as NearbyQuest[];
}