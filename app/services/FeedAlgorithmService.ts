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
  avatar_index: number;     
  created_at: string;
  distance_km: number;
}

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

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

  const nearbyQuests: NearbyQuest[] = data || [];

  // Instantly return the raw DB results to the UI so it doesn't lag
  if (onFastResult) {
    onFastResult(nearbyQuests);
  }

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

  // STEP 3: Call Gemini API directly safely
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2, 
          }
        })
      }
    );

    const jsonResponse = await response.json();

    // Check if Gemini API returned an explicit error (e.g., quota, bad key)
    if (jsonResponse.error) {
      console.warn("Gemini API Error:", jsonResponse.error.message);
      return nearbyQuests; // Fallback
    }

    // Safely extract the text using optional chaining
    const rawText = jsonResponse.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
       console.warn("Gemini returned empty or unexpected payload.");
       return nearbyQuests; // Fallback
    }
    
    // Strip markdown code blocks just in case
    const cleanedText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    // Parse the returned IDs safely
    const sortedIds: string[] = JSON.parse(cleanedText);

    // STEP 4: Map the sorted IDs back to the original database rows
    const sortedQuests: NearbyQuest[] = [];
    sortedIds.forEach(id => {
      const match = nearbyQuests.find((q: NearbyQuest) => q.id === id);
      if (match) sortedQuests.push(match);
    });

    // Append any quests that the AI might have accidentally missed
    nearbyQuests.forEach((q: NearbyQuest) => {
      if (!sortedQuests.some(sq => sq.id === q.id)) {
        sortedQuests.push(q);
      }
    });

    return sortedQuests;

  } catch (err) {
    console.warn("AI Reranking failed, gracefully falling back to distance sort.", err);
    return nearbyQuests;
  }
}