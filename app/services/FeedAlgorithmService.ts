// app/services/FeedAlgorithmService.ts
import { supabase } from '../lib/supabase';

// Standardized structure for the data we send to/receive from the DB
export interface NearbyQuest {
  id: string;
  title: string;
  description: string;
  category: string;
  token_bounty: number;
  bonus_xp: number;         
  poster_name: string;      
  equipped_accessories: Record<string, string>; // Replaced avatar_index
  created_at: string;
  distance_km: number;
}

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// Instant heuristic fallback: Scores quests mathematically (0ms latency)
function heuristicSort(quests: NearbyQuest[]): NearbyQuest[] {
  return [...quests].sort((a, b) => {
    // Arbitrary weights: Bounty is highly valued, Distance penalizes
    const scoreA = (a.token_bounty * 10) + (a.bonus_xp * 2) - (a.distance_km * 20);
    const scoreB = (b.token_bounty * 10) + (b.bonus_xp * 2) - (b.distance_km * 20);
    return scoreB - scoreA;
  });
}

export async function getPersonalizedFeed(
  userLat: number,
  userLon: number,
  userProfileText: string = "A busy college student looking to help out locally.",
  onFastResult?: (quests: NearbyQuest[]) => void
): Promise<NearbyQuest[]> {
  
  // STEP 1: Fetch nearby quests from Database
  const { data, error } = await supabase
    .rpc('get_nearby_quests', {
      user_lat: userLat,
      user_lon: userLon,
      max_results: 30
    });

  if (error) {
    console.error("Error fetching nearby quests:", error);
    if (onFastResult) onFastResult([]);
    return [];
  }

  let nearbyQuests: NearbyQuest[] = data || [];

  // Instantly sort locally to provide an immediate, high-quality UI render
  nearbyQuests = heuristicSort(nearbyQuests);

  // Instantly return the heuristic DB results to the UI so it doesn't lag
  if (onFastResult) {
    onFastResult(nearbyQuests);
  }

  // If there are 0 or 1 quests, or API Key is missing, no need to waste time/tokens
  if (nearbyQuests.length <= 1 || !GEMINI_API_KEY) {
    return nearbyQuests;
  }

  // Limit AI processing to the Top 15 to drastically cut payload size and latency
  const topQuestsForAI = nearbyQuests.slice(0, 15);
  const remainingQuests = nearbyQuests.slice(15);

  // STEP 2: Prepare a minified AI Prompt (Removed heavy descriptions)
  const minifiedQuests = topQuestsForAI.map(q => ({
    id: q.id,
    title: q.title,
    tags: q.category,
    bounty: q.token_bounty,
  }));

  const prompt = `Rank these quests based on urgency, bounty, and relevance for: ${userProfileText}. Data: ${JSON.stringify(minifiedQuests)}`;

  // STEP 3: Call Gemini API using the ultra-fast 8B model with strict JSON schema
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1, 
            responseMimeType: "application/json",
            // Forces the model to only output the array natively
            responseSchema: {
              type: "ARRAY",
              items: { type: "STRING" }
            }
          }
        })
      }
    );

    const jsonResponse = await response.json();

    if (jsonResponse.error) {
      console.warn("Gemini API Error:", jsonResponse.error.message);
      return nearbyQuests; // Fallback to heuristic
    }

    const rawText = jsonResponse.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
       console.warn("Gemini returned empty payload.");
       return nearbyQuests; 
    }
    
    // Parse the strictly formatted JSON natively
    const sortedIds: string[] = JSON.parse(rawText);

    // STEP 4: Map the sorted IDs back to the original database rows
    const aiSortedTopQuests: NearbyQuest[] = [];
    sortedIds.forEach(id => {
      const match = topQuestsForAI.find(q => q.id === id);
      if (match) aiSortedTopQuests.push(match);
    });

    // Append any top quests the AI missed + the remaining bottom 15
    topQuestsForAI.forEach(q => {
      if (!aiSortedTopQuests.some(sq => sq.id === q.id)) {
        aiSortedTopQuests.push(q);
      }
    });

    return [...aiSortedTopQuests, ...remainingQuests];

  } catch (err) {
    console.warn("AI Reranking failed, gracefully falling back to heuristic sort.", err);
    return nearbyQuests;
  }
}