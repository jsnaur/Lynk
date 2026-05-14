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
  preview?: PreviewTransform;
  Sprite: ComponentType<{ width?: number | string; height?: number | string; style?: any }>;
};

export type PreviewTransform = {
  scale?: number;
  translateX?: number;
  translateY?: number;
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
import CLOTH_Bottom_DarkPants_Uncommon_M from '../../assets/AvatarAssets/Masculine/CLOTH_Bottom_DarkPants_Uncommon.png';
import CLOTH_Bottom_DenimPants_Rare_M from '../../assets/AvatarAssets/Masculine/CLOTH_Bottom_DenimPants_Rare.png';
import CLOTH_Bottom_WildWest_Rare_M from '../../assets/AvatarAssets/Masculine/CLOTH_Bottom_WildWest_Rare.png';

import CLOTH_Top_DarkTankTop_Uncommon_M from '../../assets/AvatarAssets/Masculine/CLOTH_Top_DarkTankTop_Uncommon.png';
import CLOTH_Top_DenimBlazer_Uncommon_M from '../../assets/AvatarAssets/Masculine/CLOTH_Top_DenimBlazer_Uncommon.png';
import CLOTH_Top_WildWest_Rare_M from '../../assets/AvatarAssets/Masculine/CLOTH_Top_WildWest_Rare.png';
import CLOTH_Top_LYNK_Rare_M from '../../assets/AvatarAssets/Masculine/CLOTH_Top_LYNK_Rare.png';
import CLOTH_Top_Pajama_Uncommon_M from '../../assets/AvatarAssets/Masculine/CLOTH_Top_Pajama_Uncommon.png';
import CLOTH_Top_Suit_Rare_M from '../../assets/AvatarAssets/Masculine/CLOTH_Top_Suit_Rare.png';
import CLOTH_Top_UniformCIT_Common_M from '../../assets/AvatarAssets/Masculine/CLOTH_Top_UniformCIT_Common.png';

// Feminine Clothing
import CLOTH_Bottom_Gala_Rare_F from '../../assets/AvatarAssets/Feminine/CLOTH_Bottom_Gala_Rare.png';
import CLOTH_Bottom_Maria_Epic_F from '../../assets/AvatarAssets/Feminine/CLOTH_Bottom_Maria_Epic.png';
import CLOTH_Bottom_Pajama_Uncommon_F from '../../assets/AvatarAssets/Feminine/CLOTH_Bottom_Pajama_Uncommon.png';
import CLOTH_Bottom_CITuniformF_Common_F from '../../assets/AvatarAssets/Feminine/CLOTH_Bottom_CITuniformF_Common.png';
import CLOTH_Bottom_Diva_Rare_F from '../../assets/AvatarAssets/Feminine/CLOTH_Bottom_Diva_Rare.png';
import CLOTH_Bottom_Nihon_Legendary_F from '../../assets/AvatarAssets/Feminine/CLOTH_Bottom_Nihon_Legendary.png';
import CLOTH_Bottom_OfficeSiren_Epic_F from '../../assets/AvatarAssets/Feminine/CLOTH_Bottom_OfficeSiren_Epic.png';

import CLOTH_Top_CITuniformF_Common_F from '../../assets/AvatarAssets/Feminine/CLOTH_Top_CITuniformF_Common.png';
import CLOTH_Top_Diva_Rare_F from '../../assets/AvatarAssets/Feminine/CLOTH_Top_Diva_Rare.png';
import CLOTH_Top_Nihon_Legendary_F from '../../assets/AvatarAssets/Feminine/CLOTH_Top_Nihon_Legendary.png';
import CLOTH_Top_OfficeSiren_Epic_F from '../../assets/AvatarAssets/Feminine/CLOTH_Top_OfficeSiren_Epic.png';
import CLOTH_Top_Gala_Rare_F from '../../assets/AvatarAssets/Feminine/CLOTH_Top_Gala_Rare.png';
import CLOTH_Top_Maria_Epic_F from '../../assets/AvatarAssets/Feminine/CLOTH_Top_Maria_Epic.png';
import CLOTH_Top_Pajama_Uncommon_F from '../../assets/AvatarAssets/Feminine/CLOTH_Top_Pajama_Uncommon.png';

// Masculine Hair
import HAIR_Base_Flat_Common_M from '../../assets/AvatarAssets/Masculine/HAIR_Base_Flat_Common.png';
import HAIR_Base_Mullet_Uncommon_M from '../../assets/AvatarAssets/Masculine/HAIR_Base_Mullet_Uncommon.png';
import HAIR_Base_Spikey_Uncommon_M from '../../assets/AvatarAssets/Masculine/HAIR_Base_Spikey_Uncommon.png';
import HAIR_Base_Parted_Uncommon_M from '../../assets/AvatarAssets/Masculine/HAIR_Base_Parted_Uncommon.png';
import HAIR_Base_Prince_Epic_M from '../../assets/AvatarAssets/Masculine/HAIR_Base_Prince_Epic.png';

import HAIR_Fringe_Marquee_Rare_M from '../../assets/AvatarAssets/Masculine/HAIR_Fringe_Marquee_Rare.png';
import HAIR_Fringe_MidBangs_Uncommon_M from '../../assets/AvatarAssets/Masculine/HAIR_Fringe_MidBangs_Uncommon.png';
import HAIR_Fringe_Chill_Common_M from '../../assets/AvatarAssets/Masculine/HAIR_Fringe_Chill_Common.png';
import HAIR_Fringe_Emo_Epic_M from '../../assets/AvatarAssets/Masculine/HAIR_Fringe_Emo_Epic.png';
import HAIR_Fringe_Mac_Uncommon_M from '../../assets/AvatarAssets/Masculine/HAIR_Fringe_Mac_Uncommon.png';

// Feminine Hair
import HAIR_Base_Calm_Uncommon_F from '../../assets/AvatarAssets/Feminine/HAIR_Base_Calm_Uncommon.png';
import HAIR_Base_Flow_Rare_F from '../../assets/AvatarAssets/Feminine/HAIR_Base_Flow_Rare.png';
import HAIR_Base_Pigtails_Uncommon_F from '../../assets/AvatarAssets/Feminine/HAIR_Base_Pigtails_Uncommon.png';
import HAIR_Base_Popstar_Rare_F from '../../assets/AvatarAssets/Feminine/HAIR_Base_Popstar_Rare.png';
import HAIR_Base_Princess_Epic_F from '../../assets/AvatarAssets/Feminine/HAIR_Base_Princess_Epic.png';

import HAIR_Fringe_Goth_Rare_F from '../../assets/AvatarAssets/Feminine/HAIR_Fringe_Goth_Rare.png';
import HAIR_Fringe_Pristine_Rare_F from '../../assets/AvatarAssets/Feminine/HAIR_Fringe_Pristine_Rare.png';
import HAIR_Fringe_MidPart_Uncommon_F from '../../assets/AvatarAssets/Feminine/HAIR_Fringe_MidPart_Uncommon.png';
import HAIR_Fringe_Natural_Rare_F from '../../assets/AvatarAssets/Feminine/HAIR_Fringe_Natural_Rare.png';
import HAIR_Fringe_Retro_Rare_F from '../../assets/AvatarAssets/Feminine/HAIR_Fringe_Retro_Rare.png';

// Shared Assets (Accessories & Face)
import ACC_Back_Moon_Uncommon from '../../assets/AvatarAssets/Shared/ACC_Back_Moon_Uncommon.png';
import ACC_Back_AngelWings_Legendary from '../../assets/AvatarAssets/Shared/ACC_Back_AngelWings_Legendary.png';
import ACC_Back_Cape_Epic from '../../assets/AvatarAssets/Shared/ACC_Back_Cape_Epic.png';
import ACC_Back_Glaze_Legendary from '../../assets/AvatarAssets/Shared/ACC_Back_Glaze_Legendary.png';
import ACC_Head_EyeMask_Rare from '../../assets/AvatarAssets/Shared/ACC_Head_EyeMask_Rare.png';
import ACC_Head_Buttercup_Rare from '../../assets/AvatarAssets/Shared/ACC_Head_Buttercup_Rare.png';
import ACC_Head_Duck_Legendary from '../../assets/AvatarAssets/Shared/ACC_Head_Duck_Legendary.png';
import ACC_Head_Kero_Epic from '../../assets/AvatarAssets/Shared/ACC_Head_Kero_Epic.png';
import ACC_Head_Nervous_Epic from '../../assets/AvatarAssets/Shared/ACC_Head_Nervous_Epic.png';
import ACC_Head_HeadphonesWhite_Rare from '../../assets/AvatarAssets/Shared/ACC_Head_HeadphonesWhite_Rare.png';
import ACC_Head_Lynk_Rare from '../../assets/AvatarAssets/Shared/ACC_Head_Lynk_Rare.png';
import ACC_Head_Upset_Epic from '../../assets/AvatarAssets/Shared/ACC_Head_Upset_Epic.png';
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
import BG_GoldFrame_Epic from '../../assets/AvatarAssets/Shared/BG_GoldFrame_Epic.png';
import BG_Stage_Legendary from '../../assets/AvatarAssets/Shared/BG_Stage_Legendary.png';
import BG_SunsetHues_Epic from '../../assets/AvatarAssets/Shared/BG_SunsetHues_Epic.png';
import BG_Sweet_Rare from '../../assets/AvatarAssets/Shared/BG_Sweet_Rare.png';

import FACE_Eyes_AllEyes_Rare from '../../assets/AvatarAssets/Shared/FACE_Eyes_AllEyes_Rare.png';
import FACE_Eyes_Boba_Rare from '../../assets/AvatarAssets/Shared/FACE_Eyes_Boba_Rare.png';
import FACE_Eyes_Closed_Common from '../../assets/AvatarAssets/Shared/FACE_Eyes_Closed_Common.png';
import FACE_Eyes_DefaultBlackWide_Common from '../../assets/AvatarAssets/Shared/FACE_Eyes_DefaultBlackWide_Common.png';
import FACE_Eyes_DefaultBlack_Common from '../../assets/AvatarAssets/Shared/FACE_Eyes_DefaultBlack_Common.png';
import FACE_Eyes_Rotund_Rare from '../../assets/AvatarAssets/Shared/FACE_Eyes_Rotund_Rare.png';
import FACE_Eyes_Stars_Rare from '../../assets/AvatarAssets/Shared/FACE_Eyes_Stars_Rare.png';
import FACE_Eyes_Wink_Uncommon from '../../assets/AvatarAssets/Shared/FACE_Eyes_Wink_Uncommon.png';

import FACE_Mouth_Car_Epic from '../../assets/AvatarAssets/Shared/FACE_Mouth_Car_Epic.png';
import FACE_Mouth_Gasp_Rare from '../../assets/AvatarAssets/Shared/FACE_Mouth_Gasp_Rare.png';
import FACE_Mouth_Open_Uncommon from '../../assets/AvatarAssets/Shared/FACE_Mouth_Open_Uncommon.png';
import FACE_Mouth_Neutral_Common from '../../assets/AvatarAssets/Shared/FACE_Mouth_Neutral_Common.png';
import FACE_Mouth_Oop_Common from '../../assets/AvatarAssets/Shared/FACE_Mouth_Oop_Common.png';
import FACE_Mouth_Smirk_Rare from '../../assets/AvatarAssets/Shared/FACE_Mouth_Smirk_Rare.png';

// Helper to wrap sources
const createSpr = (source: any) => (p: any) => React.createElement(ImageSprite, { source, ...p });

const PREVIEW_SLOT_DEFAULTS: Record<AvatarSlot, PreviewTransform> = {
  Background: { scale: 1, translateX: 0, translateY: 0 },
  BackAccessory: { scale: 1, translateX: 0, translateY: 0 },
  Body: { scale: 1, translateX: 0, translateY: 0 },
  HairBase: { scale: 1.4, translateX: 0, translateY: 4 },
  HairFringe: { scale: 1.8, translateX: 0, translateY: 8 },
  Bottom: { scale: 2, translateX: 0, translateY: -32 },
  Top: { scale: 2, translateX: 0, translateY: -18 },
  Eyes: { scale: 3, translateX: 0, translateY: -4 },
  Mouth: { scale: 3, translateX: 0, translateY: -8 },
  Headgear: { scale: 1.4, translateX: 0, translateY: 18 },
  Accessory: { scale: 1.6, translateX: 0, translateY: -4 },
  LeftHand: { scale: 1.4, translateX: -24, translateY: -8 },
  RightHand: { scale: 1.4, translateX: 24, translateY: -8 },
};

export function getAccessoryPreviewTransform(item: Pick<AccessoryItem, 'slot' | 'preview'>): PreviewTransform {
  return {
    ...PREVIEW_SLOT_DEFAULTS[item.slot],
    ...item.preview,
  };
}

export function getAccessoryPreviewStyle(
  item: Pick<AccessoryItem, 'slot' | 'preview'>,
  previewSize: number = 96,
) {
  const transform = getAccessoryPreviewTransform(item);
  const relativeOffset = previewSize / 96;
  return {
    transform: [
      transform.scale != null ? { scale: transform.scale } : undefined,
      transform.translateX != null ? { translateX: transform.translateX * relativeOffset } : undefined,
      transform.translateY != null ? { translateY: transform.translateY * relativeOffset } : undefined,
    ].filter(Boolean),
  };
}

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
  { id: 'eyes-wink', name: 'Wink', price: 1, slot: 'Eyes', gender: 'Shared', rarity: 'Uncommon', Sprite: createSpr(FACE_Eyes_Wink_Uncommon) },
  { id: 'eyes-alleyes', name: 'All Eyes', price: 2, slot: 'Eyes', gender: 'Shared', rarity: 'Rare', Sprite: createSpr(FACE_Eyes_AllEyes_Rare) },
  { id: 'eyes-boba', name: 'Boba Eyes', price: 2, slot: 'Eyes', gender: 'Shared', rarity: 'Rare', Sprite: createSpr(FACE_Eyes_Boba_Rare) },
  { id: 'eyes-rotund', name: 'Rotund Eyes', price: 2, slot: 'Eyes', gender: 'Shared', rarity: 'Rare', Sprite: createSpr(FACE_Eyes_Rotund_Rare) },
  { id: 'eyes-stars', name: 'Star Eyes', price: 2, slot: 'Eyes', gender: 'Shared', rarity: 'Rare', Sprite: createSpr(FACE_Eyes_Stars_Rare) },

  { id: 'mouth-neutral', name: 'Neutral Mouth', price: 0, slot: 'Mouth', gender: 'Shared', rarity: 'Common', isSetup: true, Sprite: createSpr(FACE_Mouth_Neutral_Common) },
  { id: 'mouth-oop', name: 'Oop Mouth', price: 0, slot: 'Mouth', gender: 'Shared', rarity: 'Common', isSetup: true, Sprite: createSpr(FACE_Mouth_Oop_Common) },
  { id: 'mouth-car', name: 'Car Mouth', price: 3, slot: 'Mouth', gender: 'Shared', rarity: 'Epic', Sprite: createSpr(FACE_Mouth_Car_Epic) },
  { id: 'mouth-gasp', name: 'Gasp Mouth', price: 2, slot: 'Mouth', gender: 'Shared', rarity: 'Rare', Sprite: createSpr(FACE_Mouth_Gasp_Rare) },
  { id: 'mouth-open', name: 'Open Mouth', price: 1, slot: 'Mouth', gender: 'Shared', rarity: 'Uncommon', Sprite: createSpr(FACE_Mouth_Open_Uncommon) },
  { id: 'mouth-smirk', name: 'Smirk Mouth', price: 2, slot: 'Mouth', gender: 'Shared', rarity: 'Rare', Sprite: createSpr(FACE_Mouth_Smirk_Rare) },

  // --- CLOTHING MASC ---
  { id: 'bot-cit-m', name: 'Uniform Pants', price: 0, slot: 'Bottom', gender: 'Masc', rarity: 'Common', isSetup: true, Sprite: createSpr(CLOTH_Bottom_UniformCIT_Common_M) },
  { id: 'bot-pjs-m', name: 'Pajama Pants', price: 0, slot: 'Bottom', gender: 'Masc', rarity: 'Uncommon', isSetup: true, Sprite: createSpr(CLOTH_Bottom_Pajama_Uncommon_M) },
  { id: 'bot-suit-m', name: 'Suit Pants', price: 2, slot: 'Bottom', gender: 'Masc', rarity: 'Rare', Sprite: createSpr(CLOTH_Bottom_Suit_Rare_M) },
  { id: 'bot-lynk-m', name: 'Lynk Bottoms', price: 2, slot: 'Bottom', gender: 'Masc', rarity: 'Rare', Sprite: createSpr(CLOTH_Bottom_Lynk_Rare_M) },
  { id: 'bot-darkpants-m', name: 'Dark Pants', price: 1, slot: 'Bottom', gender: 'Masc', rarity: 'Uncommon', Sprite: createSpr(CLOTH_Bottom_DarkPants_Uncommon_M) },
  { id: 'bot-denimpants-m', name: 'Denim Pants', price: 2, slot: 'Bottom', gender: 'Masc', rarity: 'Rare', Sprite: createSpr(CLOTH_Bottom_DenimPants_Rare_M) },
  { id: 'bot-wildwest-m', name: 'Wild West Pants', price: 2, slot: 'Bottom', gender: 'Masc', rarity: 'Rare', Sprite: createSpr(CLOTH_Bottom_WildWest_Rare_M) },

  { id: 'top-cit-m', name: 'Uniform Shirt', price: 0, slot: 'Top', gender: 'Masc', rarity: 'Common', isSetup: true, Sprite: createSpr(CLOTH_Top_UniformCIT_Common_M) },
  { id: 'top-pjs-m', name: 'Pajama Top', price: 0, slot: 'Top', gender: 'Masc', rarity: 'Uncommon', isSetup: true, Sprite: createSpr(CLOTH_Top_Pajama_Uncommon_M) },
  { id: 'top-suit-m', name: 'Suit Jacket', price: 2, slot: 'Top', gender: 'Masc', rarity: 'Rare', Sprite: createSpr(CLOTH_Top_Suit_Rare_M) },
  { id: 'top-lynk-m', name: 'Lynk Hoodie', price: 2, slot: 'Top', gender: 'Masc', rarity: 'Rare', Sprite: createSpr(CLOTH_Top_LYNK_Rare_M) },
  { id: 'top-darktanktop-m', name: 'Dark Tank Top', price: 1, slot: 'Top', gender: 'Masc', rarity: 'Uncommon', Sprite: createSpr(CLOTH_Top_DarkTankTop_Uncommon_M) },
  { id: 'top-denimblazer-m', name: 'Denim Blazer', price: 1, slot: 'Top', gender: 'Masc', rarity: 'Uncommon', Sprite: createSpr(CLOTH_Top_DenimBlazer_Uncommon_M) },
  { id: 'top-wildwest-m', name: 'Wild West Top', price: 2, slot: 'Top', gender: 'Masc', rarity: 'Rare', Sprite: createSpr(CLOTH_Top_WildWest_Rare_M) },

  // --- CLOTHING FEM ---
  { id: 'bot-pjs-f', name: 'Pajama Pants', price: 0, slot: 'Bottom', gender: 'Fem', rarity: 'Uncommon', isSetup: true, Sprite: createSpr(CLOTH_Bottom_Pajama_Uncommon_F) },
  { id: 'bot-gala-f', name: 'Gala Skirt', price: 0, slot: 'Bottom', gender: 'Fem', rarity: 'Rare', isSetup: true, Sprite: createSpr(CLOTH_Bottom_Gala_Rare_F) },
  { id: 'bot-maria-f', name: 'Maria Skirt', price: 3, slot: 'Bottom', gender: 'Fem', rarity: 'Epic', Sprite: createSpr(CLOTH_Bottom_Maria_Epic_F) },
  { id: 'bot-cituniformf-f', name: 'CIT Uniform Skirt', price: 0, slot: 'Bottom', gender: 'Fem', rarity: 'Common', Sprite: createSpr(CLOTH_Bottom_CITuniformF_Common_F) },
  { id: 'bot-diva-f', name: 'Diva Skirt', price: 2, slot: 'Bottom', gender: 'Fem', rarity: 'Rare', Sprite: createSpr(CLOTH_Bottom_Diva_Rare_F) },
  { id: 'bot-nihon-f', name: 'Nihon Skirt', price: 5, slot: 'Bottom', gender: 'Fem', rarity: 'Legendary', Sprite: createSpr(CLOTH_Bottom_Nihon_Legendary_F) },
  { id: 'bot-officesiren-f', name: 'Office Siren Skirt', price: 3, slot: 'Bottom', gender: 'Fem', rarity: 'Epic', Sprite: createSpr(CLOTH_Bottom_OfficeSiren_Epic_F) },

  { id: 'top-pjs-f', name: 'Pajama Top', price: 0, slot: 'Top', gender: 'Fem', rarity: 'Uncommon', isSetup: true, Sprite: createSpr(CLOTH_Top_Pajama_Uncommon_F) },
  { id: 'top-gala-f', name: 'Gala Top', price: 0, slot: 'Top', gender: 'Fem', rarity: 'Rare', isSetup: true, Sprite: createSpr(CLOTH_Top_Gala_Rare_F) },
  { id: 'top-maria-f', name: 'Maria Top', price: 3, slot: 'Top', gender: 'Fem', rarity: 'Epic', Sprite: createSpr(CLOTH_Top_Maria_Epic_F) },
  { id: 'top-cituniformf-f', name: 'CIT Uniform Top', price: 0, slot: 'Top', gender: 'Fem', rarity: 'Common', Sprite: createSpr(CLOTH_Top_CITuniformF_Common_F) },
  { id: 'top-diva-f', name: 'Diva Top', price: 2, slot: 'Top', gender: 'Fem', rarity: 'Rare', Sprite: createSpr(CLOTH_Top_Diva_Rare_F) },
  { id: 'top-nihon-f', name: 'Nihon Top', price: 5, slot: 'Top', gender: 'Fem', rarity: 'Legendary', Sprite: createSpr(CLOTH_Top_Nihon_Legendary_F) },
  { id: 'top-officesiren-f', name: 'Office Siren Top', price: 3, slot: 'Top', gender: 'Fem', rarity: 'Epic', Sprite: createSpr(CLOTH_Top_OfficeSiren_Epic_F) },

  // --- HAIR MASC ---
  { id: 'hairb-flat-m', name: 'Flat Base', price: 0, slot: 'HairBase', gender: 'Masc', rarity: 'Common', isSetup: true, Sprite: createSpr(HAIR_Base_Flat_Common_M) },
  { id: 'hairb-mullet-m', name: 'Mullet Base', price: 1, slot: 'HairBase', gender: 'Masc', rarity: 'Uncommon', isSetup: true, Sprite: createSpr(HAIR_Base_Mullet_Uncommon_M) },
  { id: 'hairb-spikey-m', name: 'Spikey Base', price: 1, slot: 'HairBase', gender: 'Masc', rarity: 'Uncommon', Sprite: createSpr(HAIR_Base_Spikey_Uncommon_M) },
  { id: 'hairb-parted-m', name: 'Parted Base', price: 1, slot: 'HairBase', gender: 'Masc', rarity: 'Uncommon', Sprite: createSpr(HAIR_Base_Parted_Uncommon_M) },
  { id: 'hairb-prince-m', name: 'Prince Base', price: 3, slot: 'HairBase', gender: 'Masc', rarity: 'Epic', Sprite: createSpr(HAIR_Base_Prince_Epic_M) },
  
  { id: 'hairf-chill-m', name: 'Chill Fringe', price: 0, slot: 'HairFringe', gender: 'Masc', rarity: 'Common', isSetup: true, Sprite: createSpr(HAIR_Fringe_Chill_Common_M) },
  { id: 'hairf-mac-m', name: 'Mac Fringe', price: 1, slot: 'HairFringe', gender: 'Masc', rarity: 'Uncommon', isSetup: true, Sprite: createSpr(HAIR_Fringe_Mac_Uncommon_M) },
  { id: 'hairf-emo-m', name: 'Emo Fringe', price: 3, slot: 'HairFringe', gender: 'Masc', rarity: 'Epic', Sprite: createSpr(HAIR_Fringe_Emo_Epic_M) },
  { id: 'hairf-marquee-m', name: 'Marquee Fringe', price: 2, slot: 'HairFringe', gender: 'Masc', rarity: 'Rare', Sprite: createSpr(HAIR_Fringe_Marquee_Rare_M) },
  { id: 'hairf-midbangs-m', name: 'Mid Bangs', price: 1, slot: 'HairFringe', gender: 'Masc', rarity: 'Uncommon', Sprite: createSpr(HAIR_Fringe_MidBangs_Uncommon_M) },

  // --- HAIR FEM ---
  { id: 'hairb-calm-f', name: 'Calm Base', price: 1, slot: 'HairBase', gender: 'Fem', rarity: 'Uncommon', isSetup: true, Sprite: createSpr(HAIR_Base_Calm_Uncommon_F) },
  { id: 'hairb-pigtails-f', name: 'Pigtails', price: 1, slot: 'HairBase', gender: 'Fem', rarity: 'Uncommon', isSetup: true, Sprite: createSpr(HAIR_Base_Pigtails_Uncommon_F) },
  { id: 'hairb-flow-f', name: 'Flowing Base', price: 2, slot: 'HairBase', gender: 'Fem', rarity: 'Rare', Sprite: createSpr(HAIR_Base_Flow_Rare_F), preview: { scale: 1.4, translateY: -8 } },
  { id: 'hairb-popstar-f', name: 'Popstar Base', price: 2, slot: 'HairBase', gender: 'Fem', rarity: 'Rare', Sprite: createSpr(HAIR_Base_Popstar_Rare_F) },
  { id: 'hairb-princess-f', name: 'Princess Base', price: 3, slot: 'HairBase', gender: 'Fem', rarity: 'Epic', Sprite: createSpr(HAIR_Base_Princess_Epic_F) },

  { id: 'hairf-mid-f', name: 'Mid Part', price: 1, slot: 'HairFringe', gender: 'Fem', rarity: 'Uncommon', isSetup: true, Sprite: createSpr(HAIR_Fringe_MidPart_Uncommon_F) },
  { id: 'hairf-natural-f', name: 'Natural Fringe', price: 2, slot: 'HairFringe', gender: 'Fem', rarity: 'Rare', isSetup: true, Sprite: createSpr(HAIR_Fringe_Natural_Rare_F) },
  { id: 'hairf-retro-f', name: 'Retro Fringe', price: 2, slot: 'HairFringe', gender: 'Fem', rarity: 'Rare', Sprite: createSpr(HAIR_Fringe_Retro_Rare_F) },
  { id: 'hairf-goth-f', name: 'Goth Fringe', price: 2, slot: 'HairFringe', gender: 'Fem', rarity: 'Rare', Sprite: createSpr(HAIR_Fringe_Goth_Rare_F) },
  { id: 'hairf-pristine-f', name: 'Pristine Fringe', price: 2, slot: 'HairFringe', gender: 'Fem', rarity: 'Rare', Sprite: createSpr(HAIR_Fringe_Pristine_Rare_F) },

  // --- SHARED ACCESSORIES / BGS ---
  { id: 'bg-bluegray', name: 'Blue Gray BG', price: 0, slot: 'Background', gender: 'Shared', rarity: 'Common', Sprite: createSpr(BG_BlueGray_Common) },
  { id: 'bg-goldframe', name: 'Gold Frame BG', price: 3, slot: 'Background', gender: 'Shared', rarity: 'Epic', Sprite: createSpr(BG_GoldFrame_Epic) },
  { id: 'back-moon', name: 'Moon', price: 1, slot: 'BackAccessory', gender: 'Shared', rarity: 'Uncommon', Sprite: createSpr(ACC_Back_Moon_Uncommon) },
  { id: 'back-angelwings', name: 'Angel Wings', price: 4, slot: 'BackAccessory', gender: 'Shared', rarity: 'Legendary', Sprite: createSpr(ACC_Back_AngelWings_Legendary) },
  { id: 'back-cape', name: 'Cape', price: 3, slot: 'BackAccessory', gender: 'Shared', rarity: 'Epic', Sprite: createSpr(ACC_Back_Cape_Epic) },
  { id: 'back-glaze', name: 'Glaze', price: 4, slot: 'BackAccessory', gender: 'Shared', rarity: 'Legendary', Sprite: createSpr(ACC_Back_Glaze_Legendary) },
  { id: 'bg-stage', name: 'Stage BG', price: 4, slot: 'Background', gender: 'Shared', rarity: 'Legendary', Sprite: createSpr(BG_Stage_Legendary) },
  { id: 'bg-sunsethues', name: 'Sunset Hues BG', price: 3, slot: 'Background', gender: 'Shared', rarity: 'Epic', Sprite: createSpr(BG_SunsetHues_Epic) },
  { id: 'bg-sweet', name: 'Sweet BG', price: 2, slot: 'Background', gender: 'Shared', rarity: 'Rare', Sprite: createSpr(BG_Sweet_Rare) },
  
  { id: 'head-buttercup', name: 'Buttercup', price: 2, slot: 'Headgear', gender: 'Shared', rarity: 'Rare', Sprite: createSpr(ACC_Head_Buttercup_Rare) },
  { id: 'head-duck', name: 'Duck', price: 4, slot: 'Headgear', gender: 'Shared', rarity: 'Legendary', Sprite: createSpr(ACC_Head_Duck_Legendary) },
  { id: 'head-eyemask', name: 'Eye Mask', price: 2, slot: 'Headgear', gender: 'Shared', rarity: 'Rare', Sprite: createSpr(ACC_Head_EyeMask_Rare) },
  { id: 'head-headphones', name: 'Headphones', price: 2, slot: 'Headgear', gender: 'Shared', rarity: 'Rare', Sprite: createSpr(ACC_Head_HeadphonesWhite_Rare) },
  { id: 'head-lynk', name: 'Lynk Hat', price: 2, slot: 'Headgear', gender: 'Shared', rarity: 'Rare', Sprite: createSpr(ACC_Head_Lynk_Rare) },
  { id: 'head-kero', name: 'Kero', price: 3, slot: 'Headgear', gender: 'Shared', rarity: 'Epic', Sprite: createSpr(ACC_Head_Kero_Epic) },
  { id: 'head-nervous', name: 'Nervous', price: 3, slot: 'Headgear', gender: 'Shared', rarity: 'Epic', Sprite: createSpr(ACC_Head_Nervous_Epic) },
  { id: 'head-party', name: 'Party Hat', price: 2, slot: 'Headgear', gender: 'Shared', rarity: 'Rare', Sprite: createSpr(ACC_Head_PartyHat_Rare) },
  { id: 'head-ribbon', name: 'Ribbonnita', price: 2, slot: 'Headgear', gender: 'Shared', rarity: 'Rare', Sprite: createSpr(ACC_Head_Ribbonnita_Rare) },
  { id: 'head-straw', name: 'Straw Hat', price: 3, slot: 'Headgear', gender: 'Shared', rarity: 'Epic', Sprite: createSpr(ACC_Head_StrawHat_Epic) },
  { id: 'head-upset', name: 'Upset', price: 3, slot: 'Headgear', gender: 'Shared', rarity: 'Epic', Sprite: createSpr(ACC_Head_Upset_Epic) },

  { id: 'left-books', name: 'Books', price: 2, slot: 'LeftHand', gender: 'Shared', rarity: 'Rare', Sprite: createSpr(ACC_Left_Books_Rare) },
  { id: 'left-kwek', name: 'Kwek Kwek', price: 4, slot: 'LeftHand', gender: 'Shared', rarity: 'Legendary', Sprite: createSpr(ACC_Left_KwekKwek_Legendary) },
  { id: 'left-iron', name: 'Soldering Iron', price: 1, slot: 'LeftHand', gender: 'Shared', rarity: 'Uncommon', Sprite: createSpr(ACC_Left_SolderingIron_Uncommon) },
  { id: 'left-star', name: 'Star Award', price: 2, slot: 'LeftHand', gender: 'Shared', rarity: 'Rare', Sprite: createSpr(ACC_Left_StarAward_Rare) },

  { id: 'right-bouquet', name: 'Bouquet', price: 3, slot: 'RightHand', gender: 'Shared', rarity: 'Epic', Sprite: createSpr(ACC_Right_Bouquet_Epic) },
  { id: 'right-laptop', name: 'Laptop', price: 0, slot: 'RightHand', gender: 'Shared', rarity: 'Common', Sprite: createSpr(ACC_Right_Laptop_Common) },
  { id: 'right-balloon', name: 'Red Balloon', price: 2, slot: 'RightHand', gender: 'Shared', rarity: 'Rare', Sprite: createSpr(ACC_Right_RedBalloon_Rare), preview: { scale: 1.2, translateX: 32, translateY: 12 } },
  { id: 'right-fries', name: 'Wild Fries', price: 2, slot: 'RightHand', gender: 'Shared', rarity: 'Rare', Sprite: createSpr(ACC_Right_WildFries_Rare) },

  { id: 'acc-diamond', name: 'Diamond', price: 3, slot: 'Accessory', gender: 'Shared', rarity: 'Epic', Sprite: createSpr(ACC_Other_Diamond_Epic) },
  { id: 'acc-earrings', name: 'Flower Earrings', price: 2, slot: 'Accessory', gender: 'Shared', rarity: 'Rare', Sprite: createSpr(ACC_Other_FlowerEarrings_Rare) },
  { id: 'acc-glasses', name: 'Glasses', price: 1, slot: 'Accessory', gender: 'Shared', rarity: 'Uncommon', Sprite: createSpr(ACC_Other_Glasses_Uncommon) },
  { id: 'acc-id', name: 'School ID', price: 0, slot: 'Accessory', gender: 'Shared', rarity: 'Common', Sprite: createSpr(ACC_Other_ID_Common) },
];

// Start users off with all setup items and common freebies
export const DEFAULT_OWNED_IDS = new Set<string>(
  ACCESSORY_ITEMS.filter(item => item.price === 0 || item.isSetup).map(item => item.id)
);