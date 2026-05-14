export type BadgeCategory = 'quest' | 'reputation' | 'special';

export type BadgeDef = {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  icon: any;
  criteria: string;
};

const BADGE_SHIELD = require('../../assets/ProfileAssets/BadgeShield.png');
const BADGE_MEDAL = require('../../assets/ProfileAssets/BadgeMedal.png');
const BADGE_HAT = require('../../assets/ProfileAssets/BadgeHat.png');

export const BADGES: BadgeDef[] = [
  {
    id: 'quest_initiator',
    name: 'The Initiator',
    description: 'Awarded for posting your very first quest.',
    category: 'quest',
    icon: BADGE_SHIELD,
    criteria: 'Post 1 quest.',
  },
  {
    id: 'quest_adventurer',
    name: 'The Adventurer',
    description: 'Awarded for successfully completing your first quest.',
    category: 'quest',
    icon: BADGE_MEDAL,
    criteria: 'Complete 1 quest.',
  },
  {
    id: 'quest_prolific_patron',
    name: 'Prolific Patron',
    description: 'Awarded for posting a total of 10 quests.',
    category: 'quest',
    icon: BADGE_HAT,
    criteria: 'Post 10 quests.',
  },
];

const BADGES_BY_ID: Record<string, BadgeDef> = BADGES.reduce(
  (acc, b) => {
    acc[b.id] = b;
    return acc;
  },
  {} as Record<string, BadgeDef>,
);

export const getBadgeById = (id: string): BadgeDef | undefined => BADGES_BY_ID[id];

export const getBadgesByCategory = (category: BadgeCategory): BadgeDef[] =>
  BADGES.filter((b) => b.category === category);
