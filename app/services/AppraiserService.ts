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
  difficultyBoost: number;
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

function scoreDifficultySignals(description: string, category: FeedCategory | null) {
  const text = description.toLowerCase();

  const highDifficultySignals = [
    'multi-step',
    'complex',
    'difficult',
    'advanced',
    'project',
    'research',
    'presentation',
    'exam',
    'assignment',
    'deadline',
  ];

  const mediumDifficultySignals = [
    'help',
    'assist',
    'tutor',
    'organize',
    'deliver',
    'set up',
    'assemble',
    'review',
    'prepare',
  ];

  const easyDifficultySignals = [
    'quick',
    'simple',
    'small',
    'borrow',
    'pickup',
    'pick up',
    'drop off',
    'lend',
  ];

  const categoryBase: Record<FeedCategory, number> = {
    favor: 8,
    study: 14,
    item: 10,
  };

  const highHits = highDifficultySignals.filter((signal) => text.includes(signal)).length;
  const mediumHits = mediumDifficultySignals.filter((signal) => text.includes(signal)).length;
  const easyHits = easyDifficultySignals.filter((signal) => text.includes(signal)).length;
  const structureSignals = /\b(and|then|after|before|with|plus|including|across|around)\b/i.test(description)
    ? 3
    : 0;

  const baseScore = category ? categoryBase[category] : 10;
  const weightedScore = baseScore + highHits * 7 + mediumHits * 4 + structureSignals - easyHits * 2;

  return clamp(weightedScore, 0, 34);
}

/**
 * Calls Gemini AI to analyze quest content quality, complexity, and urgency.
 * Returns AI assessment with difficulty-based scoring signals.
 */
async function callGeminiAPI(
  _title: string,
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
      difficultyBoost: 0,
    };
  }

  try {
    const prompt = `You are a quest difficulty evaluator. Analyze the actual effort, complexity, and urgency of this ${category} quest and respond ONLY with valid JSON (no markdown, no extra text).

  Do not use title wording, title length, or description length as a reward signal. Focus on the task difficulty, the number of steps involved, and how demanding the work is.

  Description: "${description}"

Evaluate and respond with ONLY this exact JSON structure:
{
  "complexity": "low|medium|high",
  "urgency": boolean,
  "quality": "poor|fair|good|excellent",
  "feedback": "One sentence improvement suggestion",
  "difficultyBoost": 0-15
}

Quality guidelines: poor=vague/incomplete, fair=basic info, good=clear/organized, excellent=detailed/compelling
Boost 0=low difficulty, 6=medium difficulty, 15=high difficulty`;

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
        difficultyBoost: 0,
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
      difficultyBoost: Math.min(15, Math.max(0, aiResponse.difficultyBoost || 0)),
    };
  } catch (error) {
    console.warn('AI appraisal failed:', error);
    return {
      complexity: 'medium',
      urgency: false,
      quality: 'fair',
      feedback: '',
      difficultyBoost: 0,
    };
  }
}

/**
 * Calculates dynamic XP and token bounty for a quest using the Guild Appraiser model.
 * Weights category, task difficulty, location specificity, and urgency signals.
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
  const locationWords = countWords(location);
  const urgentSignal = /urgent|asap|today|tonight|deadline|soon|before|by\s+\w+/i.test(description);

  const categoryWeights: Record<FeedCategory, number> = {
    favor: 16,
    study: 22,
    item: 18,
  };

  const difficultyScore = scoreDifficultySignals(description, category);
  const locationScore = clamp(locationWords >= 3 ? 12 : locationWords >= 2 ? 8 : 5, 0, 12);
  const urgencyScore = urgentSignal ? 18 : 0;
  const categoryScore = category ? categoryWeights[category as FeedCategory] : 10;

  const totalXp = clamp(
    GUILD_BASE_XP + categoryScore + difficultyScore + locationScore + urgencyScore,
    GUILD_BASE_XP,
    220,
  );

  const bonusXp = clamp(totalXp - GUILD_BASE_XP, 0, BONUS_XP_MAX);
  const tokenBounty = clamp(
    Math.round(totalXp / 16 + difficultyScore / 10 + (urgentSignal ? 3 : 0) + (category === 'item' ? 2 : 0)),
    TOKEN_MIN,
    TOKEN_MAX,
  );

  const tier = totalXp >= 170 ? 'Champion' : totalXp >= 120 ? 'Knight' : 'Scout';
  const confidence = difficultyScore >= 22 ? 'Strong' : difficultyScore >= 12 ? 'Good' : 'Light';
  const rationale =
    category === 'study'
      ? 'Study quests usually demand more effort, so the appraiser leans higher on XP.'
      : category === 'item'
        ? 'Item quests usually stay straightforward, so the appraiser balances XP with a token push.'
        : 'Favor quests are priced around effort and urgency, with a modest XP bump and token reward.';

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
 * Calls Gemini to evaluate quest difficulty and boosts rewards accordingly.
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
  const aiDifficultyBoost = aiAnalysis.complexity === 'high' ? 12 : aiAnalysis.complexity === 'medium' ? 6 : 0;
  const aiXpBoost = Math.round((Math.max(aiDifficultyBoost, aiAnalysis.difficultyBoost) * baseAppraisal.bonusXp) / 15);
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
