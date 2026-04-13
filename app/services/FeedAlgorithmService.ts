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
  avatar_index: number;     // Added for HomeFeed Avatar mapping
  created_at: string;
  distance_km: number;
}

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

/**
 * 1. Fetches the closest 30 quests from Supabase.
 * 2. Feeds them to Gemini AI.
 * 3. Returns the quests reranked by AI based on urgency/relevance.
 */
export async function getPersonalizedFeed(
  userLat: number,
  userLon: number,
  userProfileText: string = "A busy college student looking to help out locally."
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
    return [];
  }

  const nearbyQuests: NearbyQuest[] = data || [];

  // If there are 0 or 1 quests, no need to waste AI tokens on sorting
  if (nearbyQuests.length <= 1) {
    return nearbyQuests;
  }

  // STEP 2: Prepare the AI Prompt
  const minifiedQuests = nearbyQuests.map((q: NearbyQuest) => ({
    id: q.id,
    title: q.title,
    description: q.description,
    bounty: q.token_bounty,
    distance: `${Math.round(q.distance_km * 10) / 10}km`
  }));

  const prompt = `
    You are the feed ranking algorithm for a campus quest board app.
    
    Current User Profile: ${userProfileText}
    
    Here is a JSON list of nearby quests:
    ${JSON.stringify(minifiedQuests)}
    
    Task: Rank these quests from MOST relevant/urgent to LEAST relevant/urgent.
    Prioritize emergencies, high bounties, and relevance to the user profile.
    
    Output Requirements: 
    Return ONLY a strict JSON array of the quest IDs in their new sorted order. 
    Do NOT include markdown formatting (like \`\`\`json), explanations, or any other text.
    
    Example Output:
    ["uuid-1", "uuid-2", "uuid-3"]
  `;

  // STEP 3: Call Gemini API directly
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2, // Low temperature for consistent formatting
          }
        })
      }
    );

    const jsonResponse = await response.json();
    const rawText = jsonResponse.candidates[0].content.parts[0].text.trim();
    
    // Parse the returned IDs
    const sortedIds: string[] = JSON.parse(rawText);

    // STEP 4: Map the sorted IDs back to the original database rows
    const sortedQuests: NearbyQuest[] = [];
    sortedIds.forEach(id => {
      const match = nearbyQuests.find((q: NearbyQuest) => q.id === id);
      if (match) sortedQuests.push(match);
    });

    // Append any quests that the AI might have accidentally missed to the bottom
    nearbyQuests.forEach((q: NearbyQuest) => {
      if (!sortedQuests.some(sq => sq.id === q.id)) {
        sortedQuests.push(q);
      }
    });

    return sortedQuests;

  } catch (err) {
    console.error("AI Reranking failed, falling back to distance sort:", err);
    // Fallback: If AI fails, still give the user the local quests
    return nearbyQuests;
  }
}