// app/services/FeedAlgorithmService.ts
import { supabase } from '../lib/supabase';

export interface NearbyQuest {
  id: string;
  title: string;
  description: string;
  category: string;
  token_bounty: number;
  bonus_xp: number;         
  poster_name: string;      
  equipped_accessories: Record<string, string>;
  created_at: string;
  distance_km: number;
  ai_score?: number; // Added to track algorithm confidence if needed
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