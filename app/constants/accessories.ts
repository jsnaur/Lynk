import React, { ComponentType } from 'react';
import { ImageSprite } from '../components/sprites';

export type AvatarSlot = 
  | 'Background' 
  | 'BackAccessory' 
  | 'Body' 
  | 'HairBase' 
  | 'Bottom' 
  | 'Top' 
  | 'Eyes' 
  | 'Mouth' 
  | 'Headgear' 
  | 'HairFringe' 
  | 'Accessory' 
  | 'LeftHand' 
  | 'RightHand';

export type AvatarGender = 'Masc' | 'Fem' | 'Shared';
export type AvatarRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export type AccessoryItem = {
  id: string;
  name: string;
  price: number;
  slot: AvatarSlot;
  gender: AvatarGender;
  rarity: AvatarRarity;
  isSetup?: boolean; // Flags items to show in the 2-option Profile Setup Screen
  Sprite: ComponentType<{ width?: number | string; height?: number | string }>;
};

// ============================================================================
// ASSET IMPORTS
// ============================================================================

// Masculine Bodies
import BODY_Masc_A from '../../assets/AvatarAssets/Masculine/BODY_Masc_A.png';
import BODY_Masc_B from '../../assets/AvatarAssets/Masculine/BODY_Masc_B.png';
import BODY_Masc_C from '../../assets/AvatarAssets/Masculine/BODY_Masc_C.png';
import BODY_Masc_D from '../../assets/AvatarAssets/Masculine/BODY_Masc_D.png';

// Feminine Bodies
import BODY_Fem_A from '../../assets/AvatarAssets/Feminine/BODY_Fem_A.png';
import BODY_Fem_B from '../../assets/AvatarAssets/Feminine/BODY_Fem_B.png';
import BODY_Fem_C from '../../assets/AvatarAssets/Feminine/BODY_Fem_C.png';
import BODY_Fem_D from '../../assets/AvatarAssets/Feminine/BODY_Fem_D.png';

// Masculine Clothing
import CLOTH_Bottom_Lynk_Rare_M from '../../assets/AvatarAssets/Masculine/CLOTH_Bottom_Lynk_Rare.png';
import CLOTH_Bottom_Pajama_Uncommon_M from '../../assets/AvatarAssets/Masculine/CLOTH_Bottom_Pajama_Uncommon.png';
import CLOTH_Bottom_Suit_Rare_M from '../../assets/AvatarAssets/Masculine/CLOTH_Bottom_Suit_Rare.png';
import CLOTH_Bottom_UniformCIT_Common_M from '../../assets/AvatarAssets/Masculine/CLOTH_Bottom_UniformCIT_Common.png';

import CLOTH_Top_LYNK_Rare_M from '../../assets/AvatarAssets/Masculine/CLOTH_Top_LYNK_Rare.png';
import CLOTH_Top_Pajama_Uncommon_M from '../../assets/AvatarAssets/Masculine/CLOTH_Top_Pajama_Uncommon.png';
import CLOTH_Top_Suit_Rare_M from '../../assets/AvatarAssets/Masculine/CLOTH_Top_Suit_Rare.png';
import CLOTH_Top_UniformCIT_Common_M from '../../assets/AvatarAssets/Masculine/CLOTH_Top_UniformCIT_Common.png';

// Feminine Clothing
import CLOTH_Bottom_Gala_Rare_F from '../../assets/AvatarAssets/Feminine/CLOTH_Bottom_Gala_Rare.png';
import CLOTH_Bottom_Maria_Epic_F from '../../assets/AvatarAssets/Feminine/CLOTH_Bottom_Maria_Epic.png';
import CLOTH_Bottom_Pajama_Uncommon_F from '../../assets/AvatarAssets/Feminine/CLOTH_Bottom_Pajama_Uncommon.png';

import CLOTH_Top_Gala_Rare_F from '../../assets/AvatarAssets/Feminine/CLOTH_Top_Gala_Rare.png';
import CLOTH_Top_Maria_Epic_F from '../../assets/AvatarAssets/Feminine/CLOTH_Top_Maria_Epic.png';
import CLOTH_Top_Pajama_Uncommon_F from '../../assets/AvatarAssets/Feminine/CLOTH_Top_Pajama_Uncommon.png';

// Masculine Hair
import HAIR_Base_Flat_Common_M from '../../assets/AvatarAssets/Masculine/HAIR_Base_Flat_Common.png';
import HAIR_Base_Mullet_Uncommon_M from '../../assets/AvatarAssets/Masculine/HAIR_Base_Mullet_Uncommon.png';
import HAIR_Base_Spikey_Uncommon_M from '../../assets/AvatarAssets/Masculine/HAIR_Base_Spikey_Uncommon.png';

import HAIR_Fringe_Chill_Common_M from '../../assets/AvatarAssets/Masculine/HAIR_Fringe_Chill_Common.png';
import HAIR_Fringe_Emo_Epic_M from '../../assets/AvatarAssets/Masculine/HAIR_Fringe_Emo_Epic.png';
import HAIR_Fringe_Mac_Uncommon_M from '../../assets/AvatarAssets/Masculine/HAIR_Fringe_Mac_Uncommon.png';

// Feminine Hair
import HAIR_Base_Calm_Uncommon_F from '../../assets/AvatarAssets/Feminine/HAIR_Base_Calm_Uncommon.png';
import HAIR_Base_Flow_Rare_F from '../../assets/AvatarAssets/Feminine/HAIR_Base_Flow_Rare.png';
import HAIR_Base_Pigtails_Uncommon_F from '../../assets/AvatarAssets/Feminine/HAIR_Base_Pigtails_Uncommon.png';

import HAIR_Fringe_MidPart_Uncommon_F from '../../assets/AvatarAssets/Feminine/HAIR_Fringe_MidPart_Uncommon.png';
import HAIR_Fringe_Natural_Rare_F from '../../assets/AvatarAssets/Feminine/HAIR_Fringe_Natural_Rare.png';
import HAIR_Fringe_Retro_Rare_F from '../../assets/AvatarAssets/Feminine/HAIR_Fringe_Retro_Rare.png';

// Shared Assets (Accessories & Face)
import ACC_Back_Moon_Uncommon from '../../assets/AvatarAssets/Shared/ACC_Back_Moon_Uncommon.png';
import ACC_Head_Buttercup_Rare from '../../assets/AvatarAssets/Shared/ACC_Head_Buttercup_Rare.png';
import ACC_Head_Duck_Legendary from '../../assets/AvatarAssets/Shared/ACC_Head_Duck_Legendary.png';
import ACC_Head_HeadphonesWhite_Rare from '../../assets/AvatarAssets/Shared/ACC_Head_HeadphonesWhite_Rare.png';
import ACC_Head_Lynk_Rare from '../../assets/AvatarAssets/Shared/ACC_Head_Lynk_Rare.png';
import ACC_Head_PartyHat_Rare from '../../assets/AvatarAssets/Shared/ACC_Head_PartyHat_Rare.png';
import ACC_Head_Ribbonnita_Rare from '../../assets/AvatarAssets/Shared/ACC_Head_Ribbonnita_Rare.png';
import ACC_Head_StrawHat_Epic from '../../assets/AvatarAssets/Shared/ACC_Head_StrawHat_Epic.png';

import ACC_Left_Books_Rare from '../../assets/AvatarAssets/Shared/ACC_Left_Books_Rare.png';
import ACC_Left_KwekKwek_Legendary from '../../assets/AvatarAssets/Shared/ACC_Left_KwekKwek_Legendary.png';
import ACC_Left_SolderingIron_Uncommon from '../../assets/AvatarAssets/Shared/ACC_Left_SolderingIron_Uncommon.png';
import ACC_Left_StarAward_Rare from '../../assets/AvatarAssets/Shared/ACC_Left_StarAward_Rare.png';

import ACC_Right_Bouquet_Epic from '../../assets/AvatarAssets/Shared/ACC_Right_Bouquet_Epic.png';
import ACC_Right_Laptop_Common from '../../assets/AvatarAssets/Shared/ACC_Right_Laptop_Common.png';
import ACC_Right_RedBalloon_Rare from '../../assets/AvatarAssets/Shared/ACC_Right_RedBalloon_Rare.png';
import ACC_Right_WildFries_Rare from '../../assets/AvatarAssets/Shared/ACC_Right_WildFries_Rare.png';

import ACC_Other_Diamond_Epic from '../../assets/AvatarAssets/Shared/ACC_Other_Diamond_Epic.png';
import ACC_Other_FlowerEarrings_Rare from '../../assets/AvatarAssets/Shared/ACC_Other_FlowerEarrings_Rare.png';
import ACC_Other_Glasses_Uncommon from '../../assets/AvatarAssets/Shared/ACC_Other_Glasses_Uncommon.png';
import ACC_Other_ID_Common from '../../assets/AvatarAssets/Shared/ACC_Other_ID_Common.png';

import BG_BlueGray_Common from '../../assets/AvatarAssets/Shared/BG_BlueGray_Common.png';

import FACE_Eyes_Closed_Common from '../../assets/AvatarAssets/Shared/FACE_Eyes_Closed_Common.png';
import FACE_Eyes_DefaultBlackWide_Common from '../../assets/AvatarAssets/Shared/FACE_Eyes_DefaultBlackWide_Common.png';
import FACE_Eyes_DefaultBlack_Common from '../../assets/AvatarAssets/Shared/FACE_Eyes_DefaultBlack_Common.png';
import FACE_Eyes_Wink_Uncommon from '../../assets/AvatarAssets/Shared/FACE_Eyes_Wink_Uncommon.png';

import FACE_Mouth_Neutral_Common from '../../assets/AvatarAssets/Shared/FACE_Mouth_Neutral_Common.png';
import FACE_Mouth_Oop_Common from '../../assets/AvatarAssets/Shared/FACE_Mouth_Oop_Common.png';

// Helper to wrap sources
const createSpr = (source: any) => (p: any) => React.createElement(ImageSprite, { source, ...p });

// Precise Z-Order defined by rules (back to front)
export const ALL_SLOTS_Z_ORDER: AvatarSlot[] = [
  'Background',
  'BackAccessory',
  'Body',
  'HairBase',
  'Bottom',
  'Top',
  'Eyes',
  'Mouth',
  'Headgear',
  'HairFringe',
  'Accessory',
  'LeftHand',
  'RightHand'
];

export const BASE_TRAIT_SLOTS: AvatarSlot[] = [
  'Body',
  'Eyes',
  'Mouth',
  'HairBase',
  'HairFringe'
];

export const WEARABLE_SLOTS: AvatarSlot[] = [
  'Background',
  'BackAccessory',
  'Top',
  'Bottom',
  'Headgear',
  'Accessory',
  'LeftHand',
  'RightHand'
];

export const ACCESSORY_ITEMS: AccessoryItem[] = [
  // --- BODIES ---
  { id: 'body-masc-a', name: 'Masc Tone A', price: 0, slot: 'Body', gender: 'Masc', rarity: 'Common', Sprite: createSpr(BODY_Masc_A) },
  { id: 'body-masc-b', name: 'Masc Tone B', price: 0, slot: 'Body', gender: 'Masc', rarity: 'Common', Sprite: createSpr(BODY_Masc_B) },
  { id: 'body-masc-c', name: 'Masc Tone C', price: 0, slot: 'Body', gender: 'Masc', rarity: 'Common', Sprite: createSpr(BODY_Masc_C) },
  { id: 'body-masc-d', name: 'Masc Tone D', price: 0, slot: 'Body', gender: 'Masc', rarity: 'Common', Sprite: createSpr(BODY_Masc_D) },
  { id: 'body-fem-a', name: 'Fem Tone A', price: 0, slot: 'Body', gender: 'Fem', rarity: 'Common', Sprite: createSpr(BODY_Fem_A) },
  { id: 'body-fem-b', name: 'Fem Tone B', price: 0, slot: 'Body', gender: 'Fem', rarity: 'Common', Sprite: createSpr(BODY_Fem_B) },
  { id: 'body-fem-c', name: 'Fem Tone C', price: 0, slot: 'Body', gender: 'Fem', rarity: 'Common', Sprite: createSpr(BODY_Fem_C) },
  { id: 'body-fem-d', name: 'Fem Tone D', price: 0, slot: 'Body', gender: 'Fem', rarity: 'Common', Sprite: createSpr(BODY_Fem_D) },

  // --- SHARED FACES (EYES & MOUTH) ---
  { id: 'eyes-default', name: 'Default Eyes', price: 0, slot: 'Eyes', gender: 'Shared', rarity: 'Common', isSetup: true, Sprite: createSpr(FACE_Eyes_DefaultBlack_Common) },
  { id: 'eyes-wide', name: 'Wide Eyes', price: 0, slot: 'Eyes', gender: 'Shared', rarity: 'Common', isSetup: true, Sprite: createSpr(FACE_Eyes_DefaultBlackWide_Common) },
  { id: 'eyes-closed', name: 'Closed Eyes', price: 0, slot: 'Eyes', gender: 'Shared', rarity: 'Common', Sprite: createSpr(FACE_Eyes_Closed_Common) },
  { id: 'eyes-wink', name: 'Wink', price: 50, slot: 'Eyes', gender: 'Shared', rarity: 'Uncommon', Sprite: createSpr(FACE_Eyes_Wink_Uncommon) },

  { id: 'mouth-neutral', name: 'Neutral Mouth', price: 0, slot: 'Mouth', gender: 'Shared', rarity: 'Common', isSetup: true, Sprite: createSpr(FACE_Mouth_Neutral_Common) },
  { id: 'mouth-oop', name: 'Oop Mouth', price: 0, slot: 'Mouth', gender: 'Shared', rarity: 'Common', isSetup: true, Sprite: createSpr(FACE_Mouth_Oop_Common) },

  // --- CLOTHING MASC ---
  { id: 'bot-cit-m', name: 'Uniform Pants', price: 0, slot: 'Bottom', gender: 'Masc', rarity: 'Common', isSetup: true, Sprite: createSpr(CLOTH_Bottom_UniformCIT_Common_M) },
  { id: 'bot-pjs-m', name: 'Pajama Pants', price: 0, slot: 'Bottom', gender: 'Masc', rarity: 'Uncommon', isSetup: true, Sprite: createSpr(CLOTH_Bottom_Pajama_Uncommon_M) },
  { id: 'bot-suit-m', name: 'Suit Pants', price: 150, slot: 'Bottom', gender: 'Masc', rarity: 'Rare', Sprite: createSpr(CLOTH_Bottom_Suit_Rare_M) },
  { id: 'bot-lynk-m', name: 'Lynk Bottoms', price: 150, slot: 'Bottom', gender: 'Masc', rarity: 'Rare', Sprite: createSpr(CLOTH_Bottom_Lynk_Rare_M) },

  { id: 'top-cit-m', name: 'Uniform Shirt', price: 0, slot: 'Top', gender: 'Masc', rarity: 'Common', isSetup: true, Sprite: createSpr(CLOTH_Top_UniformCIT_Common_M) },
  { id: 'top-pjs-m', name: 'Pajama Top', price: 0, slot: 'Top', gender: 'Masc', rarity: 'Uncommon', isSetup: true, Sprite: createSpr(CLOTH_Top_Pajama_Uncommon_M) },
  { id: 'top-suit-m', name: 'Suit Jacket', price: 150, slot: 'Top', gender: 'Masc', rarity: 'Rare', Sprite: createSpr(CLOTH_Top_Suit_Rare_M) },
  { id: 'top-lynk-m', name: 'Lynk Hoodie', price: 150, slot: 'Top', gender: 'Masc', rarity: 'Rare', Sprite: createSpr(CLOTH_Top_LYNK_Rare_M) },

  // --- CLOTHING FEM ---
  { id: 'bot-pjs-f', name: 'Pajama Pants', price: 0, slot: 'Bottom', gender: 'Fem', rarity: 'Uncommon', isSetup: true, Sprite: createSpr(CLOTH_Bottom_Pajama_Uncommon_F) },
  { id: 'bot-gala-f', name: 'Gala Skirt', price: 0, slot: 'Bottom', gender: 'Fem', rarity: 'Rare', isSetup: true, Sprite: createSpr(CLOTH_Bottom_Gala_Rare_F) },
  { id: 'bot-maria-f', name: 'Maria Skirt', price: 200, slot: 'Bottom', gender: 'Fem', rarity: 'Epic', Sprite: createSpr(CLOTH_Bottom_Maria_Epic_F) },

  { id: 'top-pjs-f', name: 'Pajama Top', price: 0, slot: 'Top', gender: 'Fem', rarity: 'Uncommon', isSetup: true, Sprite: createSpr(CLOTH_Top_Pajama_Uncommon_F) },
  { id: 'top-gala-f', name: 'Gala Top', price: 0, slot: 'Top', gender: 'Fem', rarity: 'Rare', isSetup: true, Sprite: createSpr(CLOTH_Top_Gala_Rare_F) },
  { id: 'top-maria-f', name: 'Maria Top', price: 200, slot: 'Top', gender: 'Fem', rarity: 'Epic', Sprite: createSpr(CLOTH_Top_Maria_Epic_F) },

  // --- HAIR MASC ---
  { id: 'hairb-flat-m', name: 'Flat Base', price: 0, slot: 'HairBase', gender: 'Masc', rarity: 'Common', Sprite: createSpr(HAIR_Base_Flat_Common_M) },
  { id: 'hairb-mullet-m', name: 'Mullet Base', price: 50, slot: 'HairBase', gender: 'Masc', rarity: 'Uncommon', Sprite: createSpr(HAIR_Base_Mullet_Uncommon_M) },
  { id: 'hairb-spikey-m', name: 'Spikey Base', price: 50, slot: 'HairBase', gender: 'Masc', rarity: 'Uncommon', Sprite: createSpr(HAIR_Base_Spikey_Uncommon_M) },
  
  { id: 'hairf-chill-m', name: 'Chill Fringe', price: 0, slot: 'HairFringe', gender: 'Masc', rarity: 'Common', Sprite: createSpr(HAIR_Fringe_Chill_Common_M) },
  { id: 'hairf-mac-m', name: 'Mac Fringe', price: 50, slot: 'HairFringe', gender: 'Masc', rarity: 'Uncommon', Sprite: createSpr(HAIR_Fringe_Mac_Uncommon_M) },
  { id: 'hairf-emo-m', name: 'Emo Fringe', price: 200, slot: 'HairFringe', gender: 'Masc', rarity: 'Epic', Sprite: createSpr(HAIR_Fringe_Emo_Epic_M) },

  // --- HAIR FEM ---
  { id: 'hairb-calm-f', name: 'Calm Base', price: 50, slot: 'HairBase', gender: 'Fem', rarity: 'Uncommon', Sprite: createSpr(HAIR_Base_Calm_Uncommon_F) },
  { id: 'hairb-pigtails-f', name: 'Pigtails', price: 50, slot: 'HairBase', gender: 'Fem', rarity: 'Uncommon', Sprite: createSpr(HAIR_Base_Pigtails_Uncommon_F) },
  { id: 'hairb-flow-f', name: 'Flowing Base', price: 150, slot: 'HairBase', gender: 'Fem', rarity: 'Rare', Sprite: createSpr(HAIR_Base_Flow_Rare_F) },

  { id: 'hairf-mid-f', name: 'Mid Part', price: 50, slot: 'HairFringe', gender: 'Fem', rarity: 'Uncommon', Sprite: createSpr(HAIR_Fringe_MidPart_Uncommon_F) },
  { id: 'hairf-natural-f', name: 'Natural Fringe', price: 150, slot: 'HairFringe', gender: 'Fem', rarity: 'Rare', Sprite: createSpr(HAIR_Fringe_Natural_Rare_F) },
  { id: 'hairf-retro-f', name: 'Retro Fringe', price: 150, slot: 'HairFringe', gender: 'Fem', rarity: 'Rare', Sprite: createSpr(HAIR_Fringe_Retro_Rare_F) },

  // --- SHARED ACCESSORIES / BGS ---
  { id: 'bg-bluegray', name: 'Blue Gray BG', price: 0, slot: 'Background', gender: 'Shared', rarity: 'Common', Sprite: createSpr(BG_BlueGray_Common) },
  { id: 'back-moon', name: 'Moon', price: 50, slot: 'BackAccessory', gender: 'Shared', rarity: 'Uncommon', Sprite: createSpr(ACC_Back_Moon_Uncommon) },
  
  { id: 'head-buttercup', name: 'Buttercup', price: 150, slot: 'Headgear', gender: 'Shared', rarity: 'Rare', Sprite: createSpr(ACC_Head_Buttercup_Rare) },
  { id: 'head-duck', name: 'Duck', price: 500, slot: 'Headgear', gender: 'Shared', rarity: 'Legendary', Sprite: createSpr(ACC_Head_Duck_Legendary) },
  { id: 'head-headphones', name: 'Headphones', price: 150, slot: 'Headgear', gender: 'Shared', rarity: 'Rare', Sprite: createSpr(ACC_Head_HeadphonesWhite_Rare) },
  { id: 'head-lynk', name: 'Lynk Hat', price: 150, slot: 'Headgear', gender: 'Shared', rarity: 'Rare', Sprite: createSpr(ACC_Head_Lynk_Rare) },
  { id: 'head-party', name: 'Party Hat', price: 150, slot: 'Headgear', gender: 'Shared', rarity: 'Rare', Sprite: createSpr(ACC_Head_PartyHat_Rare) },
  { id: 'head-ribbon', name: 'Ribbonnita', price: 150, slot: 'Headgear', gender: 'Shared', rarity: 'Rare', Sprite: createSpr(ACC_Head_Ribbonnita_Rare) },
  { id: 'head-straw', name: 'Straw Hat', price: 200, slot: 'Headgear', gender: 'Shared', rarity: 'Epic', Sprite: createSpr(ACC_Head_StrawHat_Epic) },

  { id: 'left-books', name: 'Books', price: 150, slot: 'LeftHand', gender: 'Shared', rarity: 'Rare', Sprite: createSpr(ACC_Left_Books_Rare) },
  { id: 'left-kwek', name: 'Kwek Kwek', price: 500, slot: 'LeftHand', gender: 'Shared', rarity: 'Legendary', Sprite: createSpr(ACC_Left_KwekKwek_Legendary) },
  { id: 'left-iron', name: 'Soldering Iron', price: 50, slot: 'LeftHand', gender: 'Shared', rarity: 'Uncommon', Sprite: createSpr(ACC_Left_SolderingIron_Uncommon) },
  { id: 'left-star', name: 'Star Award', price: 150, slot: 'LeftHand', gender: 'Shared', rarity: 'Rare', Sprite: createSpr(ACC_Left_StarAward_Rare) },

  { id: 'right-bouquet', name: 'Bouquet', price: 200, slot: 'RightHand', gender: 'Shared', rarity: 'Epic', Sprite: createSpr(ACC_Right_Bouquet_Epic) },
  { id: 'right-laptop', name: 'Laptop', price: 0, slot: 'RightHand', gender: 'Shared', rarity: 'Common', Sprite: createSpr(ACC_Right_Laptop_Common) },
  { id: 'right-balloon', name: 'Red Balloon', price: 150, slot: 'RightHand', gender: 'Shared', rarity: 'Rare', Sprite: createSpr(ACC_Right_RedBalloon_Rare) },
  { id: 'right-fries', name: 'Wild Fries', price: 150, slot: 'RightHand', gender: 'Shared', rarity: 'Rare', Sprite: createSpr(ACC_Right_WildFries_Rare) },

  { id: 'acc-diamond', name: 'Diamond', price: 200, slot: 'Accessory', gender: 'Shared', rarity: 'Epic', Sprite: createSpr(ACC_Other_Diamond_Epic) },
  { id: 'acc-earrings', name: 'Flower Earrings', price: 150, slot: 'Accessory', gender: 'Shared', rarity: 'Rare', Sprite: createSpr(ACC_Other_FlowerEarrings_Rare) },
  { id: 'acc-glasses', name: 'Glasses', price: 50, slot: 'Accessory', gender: 'Shared', rarity: 'Uncommon', Sprite: createSpr(ACC_Other_Glasses_Uncommon) },
  { id: 'acc-id', name: 'School ID', price: 0, slot: 'Accessory', gender: 'Shared', rarity: 'Common', Sprite: createSpr(ACC_Other_ID_Common) },
];

// Start users off with all setup items and common freebies
export const DEFAULT_OWNED_IDS = new Set<string>(
  ACCESSORY_ITEMS.filter(item => item.price === 0 || item.isSetup).map(item => item.id)
);