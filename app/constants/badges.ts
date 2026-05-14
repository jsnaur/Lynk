export type BadgeCategory = 'quest' | 'reputation' | 'special';

export type BadgeDef = {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  icon: any;
  criteria: string;
};

const Badge_Initiatior = require('../../assets/BadgeAssets/Badge_Initiatior.png');
const Badge_Adventurer = require('../../assets/BadgeAssets/Badge_Adventurer.png');
const Badge_Patron = require('../../assets/BadgeAssets/Badge_Patron.png');
const Badge_Disguise = require('../../assets/BadgeAssets/Badge_Disguise.png');
const Badge_Paragon = require('../../assets/BadgeAssets/Badge_Paragon.png');
const Badge_Veteran = require('../../assets/BadgeAssets/Badge_Veteran.png');
const Badge_NightOwl = require('../../assets/BadgeAssets/Badge_NightOwl.png');
const Badge_Hero = require('../../assets/BadgeAssets/Badge_Hero.png');
const Badge_Dev = require('../../assets/BadgeAssets/Badge_Dev.png');

export const BADGES: BadgeDef[] = [
  {
    id: 'quest_initiator',
    name: 'The Initiator',
    description: 'Awarded for posting your very first quest.',
    category: 'quest',
    icon: Badge_Initiatior,
    criteria: 'Post 1 quest.',
  },
  {
    id: 'quest_adventurer',
    name: 'The Adventurer',
    description: 'Awarded for successfully completing your first quest.',
    category: 'quest',
    icon: Badge_Adventurer,
    criteria: 'Complete 1 quest.',
  },
  {
    id: 'quest_prolific_patron',
    name: 'Prolific Patron',
    description: 'Awarded for posting a total of 10 quests.',
    category: 'quest',
    icon: Badge_Patron,
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
