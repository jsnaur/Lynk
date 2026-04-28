// app/services/FeedAlgorithmService.ts
import { supabase } from "../lib/supabase";

export interface NearbyQuest {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  location?: string;
  category: string;
  token_bounty: number;
  bonus_xp: number;
  status?: string;
  poster_name: string;
  equipped_accessories: Record<string, string>; // Replaced avatar_index
  created_at: string;
  distance_km: number;
  ai_score?: number; // Added to track algorithm confidence if needed
}

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// Instant heuristic fallback: Scores quests mathematically (0ms latency)
function heuristicSort(quests: NearbyQuest[]): NearbyQuest[] {
  return [...quests].sort((a, b) => {
    // Weights: Bounty is highly valued, Distance penalizes
    const scoreA = (a.token_bounty * 10) + (a.bonus_xp * 2) - (a.distance_km * 20);
    const scoreB = (b.token_bounty * 10) + (b.bonus_xp * 2) - (b.distance_km * 20);
    return scoreB - scoreA;
  });
}

export async function getPersonalizedFeed(
  userLat: number,
  userLon: number,
  userProfileText: string = "A busy college student looking to help out locally.",
  onFastResult?: (quests: NearbyQuest[]) => void,
): Promise<NearbyQuest[]> {

  // STEP 1: Fetch AI-sorted nearby quests from the database
  // Uses the vector search RPC when available, falls back gracefully
  const { data, error } = await supabase
    .rpc("get_nearby_quests_ai", {
      user_lat: userLat,
      user_lon: userLon,
      max_results: 30,
    });

  if (error) {
    console.error("Error fetching AI nearby quests:", error);
    return [];
  }

  let nearbyQuests: NearbyQuest[] = (data as NearbyQuest[]) || [];

  // Apply heuristic sort as an instant pre-pass so the UI renders immediately
  nearbyQuests = heuristicSort(nearbyQuests);

  // Deliver the fast heuristic result to the caller right away (no waiting for AI)
  if (onFastResult) {
    onFastResult(nearbyQuests);
  }

  // ====================================================================
  // DEV OVERRIDE: AI re-ranking bypassed to save API quota and load times.
  // The DB-level vector sort already provides high-quality ordering.
  // Remove the early return below to re-enable Gemini re-ranking.
  // ====================================================================
  return nearbyQuests;

  /* --- Gemini AI Re-ranking (disabled in dev, re-enable for production) ---

  if (nearbyQuests.length <= 1 || !GEMINI_API_KEY) {
    return nearbyQuests;
  }

  // Limit AI processing to the Top 15 to cut payload size and latency
  const topQuestsForAI = nearbyQuests.slice(0, 15);
  const remainingQuests = nearbyQuests.slice(15);

  // Prepare a minified prompt (heavy descriptions excluded to save tokens)
  const minifiedQuests = topQuestsForAI.map(q => ({
    id: q.id,
    title: q.title,
    tags: q.category,
    bounty: q.token_bounty,
  }));

  const prompt = `Rank these quests based on urgency, bounty, and relevance for: ${userProfileText}. Data: ${JSON.stringify(minifiedQuests)}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
            // Forces the model to output only the sorted ID array
            responseSchema: {
              type: "ARRAY",
              items: { type: "STRING" },
            },
          },
        }),
      },
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

    const sortedIds: string[] = JSON.parse(rawText);

    // Map sorted IDs back to the original DB rows
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
    console.warn("AI re-ranking failed, falling back to heuristic sort.", err);
    return nearbyQuests;
  }

  */
}