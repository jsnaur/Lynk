import type { FeedCategory } from '../constants/categories';
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export type GuildAppraisal = {
  bonusXp: number;
  tokenBounty: number;
  totalXp: number;
  tier: 'Scout' | 'Knight' | 'Champion';
  confidence: string;
  rationale: string;
  aiEnhanced?: boolean;
  aiQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  aiFeedback?: string;
};

type AiAppraisalResponse = {
  complexity: 'low' | 'medium' | 'high';
  urgency: boolean;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  feedback: string;
  qualityBoost: number;
};

const GUILD_BASE_XP = 50;
const BONUS_XP_MAX = 200;
const TOKEN_MIN = 0;
const TOKEN_MAX = 50;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function countWords(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Calls Gemini AI to analyze quest content quality, complexity, and urgency.
 * Returns AI assessment with quality boost multiplier for scoring.
 */
async function callGeminiAPI(
  title: string,
  description: string,
  category: FeedCategory | null,
): Promise<AiAppraisalResponse> {
  if (!GEMINI_API_KEY) {
    // Fallback to default if no API key
    return {
      complexity: 'medium',
      urgency: false,
      quality: 'fair',
      feedback: '',
      qualityBoost: 0,
    };
  }

  try {
    const prompt = `You are a quest quality evaluator. Analyze this ${category} quest and respond ONLY with valid JSON (no markdown, no extra text).

Title: "${title}"
Description: "${description}"

Evaluate and respond with ONLY this exact JSON structure:
{
  "complexity": "low|medium|high",
  "urgency": boolean,
  "quality": "poor|fair|good|excellent",
  "feedback": "One sentence improvement suggestion",
  "qualityBoost": 0-15
}

Quality guidelines: poor=vague/incomplete, fair=basic info, good=clear/organized, excellent=detailed/compelling
Boost 0=poor, 3=fair, 8=good, 15=excellent`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      console.warn('Gemini API error:', response.statusText);
      return {
        complexity: 'medium',
        urgency: false,
        quality: 'fair',
        feedback: '',
        qualityBoost: 0,
      };
    }

    const data = await response.json();
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    const aiResponse = JSON.parse(jsonMatch ? jsonMatch[0] : '{}') as AiAppraisalResponse;

    return {
      complexity: aiResponse.complexity || 'medium',
      urgency: aiResponse.urgency ?? false,
      quality: aiResponse.quality || 'fair',
      feedback: aiResponse.feedback || '',
      qualityBoost: Math.min(15, Math.max(0, aiResponse.qualityBoost || 0)),
    };
  } catch (error) {
    console.warn('AI appraisal failed:', error);
    return {
      complexity: 'medium',
      urgency: false,
      quality: 'fair',
      feedback: '',
      qualityBoost: 0,
    };
  }
}

/**
 * Calculates dynamic XP and token bounty for a quest using the Guild Appraiser model.
 * Weights category, title length, detail depth, location specificity, and urgency signals.
 */
export function appraiseQuest({
  category,
  title,
  description,
  location,
}: {
  category: FeedCategory | null;
  title: string;
  description: string;
  location: string;
}): GuildAppraisal {
  const titleWords = countWords(title);
  const descWords = countWords(description);
  const locationWords = countWords(location);
  const urgentSignal = /urgent|asap|today|tonight|deadline|soon|before|by\s+\w+/i.test(
    `${title} ${description}`,
  );

  const categoryWeights: Record<FeedCategory, number> = {
    favor: 16,
    study: 22,
    item: 18,
  };

  const titleScore = clamp(Math.round(titleWords * 3 + title.length / 4), 0, 18);
  const detailScore = clamp(Math.round(descWords * 1.5 + description.length / 30), 0, 34);
  const locationScore = clamp(locationWords >= 3 ? 12 : locationWords >= 2 ? 8 : 5, 0, 12);
  const urgencyScore = urgentSignal ? 18 : 0;
  const categoryScore = category ? categoryWeights[category as FeedCategory] : 10;

  const totalXp = clamp(
    GUILD_BASE_XP + categoryScore + titleScore + detailScore + locationScore + urgencyScore,
    GUILD_BASE_XP,
    220,
  );

  const bonusXp = clamp(totalXp - GUILD_BASE_XP, 0, BONUS_XP_MAX);
  const tokenBounty = clamp(
    Math.round(totalXp / 16 + detailScore / 10 + (urgentSignal ? 3 : 0) + (category === 'item' ? 2 : 0)),
    TOKEN_MIN,
    TOKEN_MAX,
  );

  const tier = totalXp >= 170 ? 'Champion' : totalXp >= 120 ? 'Knight' : 'Scout';
  const confidence = descWords >= 24 ? 'Strong' : descWords >= 12 ? 'Good' : 'Light';
  const rationale =
    category === 'study'
      ? 'Study quests usually need more context, so the appraiser leans higher on XP.'
      : category === 'item'
        ? 'Item quests favor fast pickup, so the appraiser balances XP with a token push.'
        : 'Favor quests stay competitive with a modest XP bump and token reward.';

  return {
    bonusXp,
    tokenBounty,
    totalXp,
    tier,
    confidence,
    rationale,
  };
}

export const DEFAULT_APPRAISAL = appraiseQuest({
  category: null,
  title: '',
  description: '',
  location: '',
});

/**
 * Async function that enhances the base appraisal with AI analysis.
 * Calls Gemini to evaluate quest quality and boosts rewards accordingly.
 */
export async function getAIEnhancedAppraisal({
  category,
  title,
  description,
  location,
}: {
  category: FeedCategory | null;
  title: string;
  description: string;
  location: string;
}): Promise<GuildAppraisal> {
  // Get base appraisal from rule-based system
  const baseAppraisal = appraiseQuest({
    category,
    title,
    description,
    location,
  });

  // Skip AI if insufficient content
  if (!title.trim() || !description.trim()) {
    return baseAppraisal;
  }

  // Get AI analysis
  const aiAnalysis = await callGeminiAPI(title, description, category);

  // Calculate AI-enhanced rewards
  const aiXpBoost = Math.round((aiAnalysis.qualityBoost * baseAppraisal.bonusXp) / 15);
  const enhancedBonusXp = clamp(baseAppraisal.bonusXp + aiXpBoost, 0, BONUS_XP_MAX);
  const enhancedTokenBounty = clamp(
    baseAppraisal.tokenBounty + (aiAnalysis.quality === 'excellent' ? 2 : aiAnalysis.quality === 'good' ? 1 : 0),
    TOKEN_MIN,
    TOKEN_MAX,
  );

  const enhancedTotalXp = GUILD_BASE_XP + enhancedBonusXp;
  const enhancedTier =
    enhancedTotalXp >= 170 ? 'Champion' : enhancedTotalXp >= 120 ? 'Knight' : 'Scout';

  return {
    bonusXp: enhancedBonusXp,
    tokenBounty: enhancedTokenBounty,
    totalXp: enhancedTotalXp,
    tier: enhancedTier,
    confidence: 'AI-Verified',
    rationale: aiAnalysis.feedback || baseAppraisal.rationale,
    aiEnhanced: true,
    aiQuality: aiAnalysis.quality,
    aiFeedback: aiAnalysis.feedback,
  };
}

export const APPRAISER_CONSTANTS = {
  GUILD_BASE_XP,
  BONUS_XP_MAX,
  TOKEN_MIN,
  TOKEN_MAX,
};
