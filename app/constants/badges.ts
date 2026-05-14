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
  {
    id: 'reputation_paragon',
    name: 'The Paragon',
    description: 'Awarded for reaching 1,000 total XP.',
    category: 'reputation',
    icon: Badge_Paragon,
    criteria: 'Reach 1,000 total XP.',
  },
  {
    id: 'reputation_veteran',
    name: 'Veteran',
    description: 'Awarded for being registered for at least 30 days.',
    category: 'reputation',
    icon: Badge_Veteran,
    criteria: 'Maintain account for 30 days or more.',
  },
  {
    id: 'reputation_master_of_disguise',
    name: 'Master of Disguise',
    description: 'Awarded for unlocking 25 unique avatar items.',
    category: 'reputation',
    icon: Badge_Disguise,
    criteria: 'Unlock 25 unique avatar items.',
  },
  {
    id: 'special_night_owl',
    name: 'The Night Owl',
    description: 'Awarded for completing a quest between midnight and 4 AM local time.',
    category: 'special',
    icon: Badge_NightOwl,
    criteria: 'Complete a quest between 00:00 and 04:00 local time.',
  },
  {
    id: 'special_hometown_hero',
    name: 'Hometown Hero',
    description: "Awarded to the user who completes someone's very first quest.",
    category: 'special',
    icon: Badge_Hero,
    criteria: 'Complete a user\'s first quest.',
  },
  {
    id: 'special_dev',
    name: 'Dev',
    description: 'Awarded to developers and authorized accounts (admins or approved email domain).',
    category: 'special',
    icon: Badge_Dev,
    criteria: 'Granted to admin accounts or approved developer emails.',
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
