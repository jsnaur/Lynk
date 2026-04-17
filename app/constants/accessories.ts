import React, { ComponentType } from 'react';
import { ImageSprite } from '../components/sprites';

// ============================================================================
// ASSET IMPORTS - 8 Body Types (4 Masculine + 4 Feminine)
// ============================================================================

// Masculine Body Types (Skin Tones A-D)
import BaseMasc_A from '../../assets/AvatarAssets/Masculine/BaseMasc_A.png';
import BaseMasc_B from '../../assets/AvatarAssets/Masculine/BaseMasc_B.png';
import BaseMasc_C from '../../assets/AvatarAssets/Masculine/BaseMasc_C.png';
import BaseMasc_D from '../../assets/AvatarAssets/Masculine/BaseMasc_D.png';

// Feminine Body Types (Skin Tones A-D)
import BaseFem_A from '../../assets/AvatarAssets/Feminine/BaseFem_A.png';
import BaseFem_B from '../../assets/AvatarAssets/Feminine/BaseFem_B.png';
import BaseFem_C from '../../assets/AvatarAssets/Feminine/BaseFem_C.png';
import BaseFem_D from '../../assets/AvatarAssets/Feminine/BaseFem_D.png';

// Shared Assets
import Background01 from '../../assets/AvatarAssets/Masculine/Background01.png';
import Eye01 from '../../assets/AvatarAssets/Masculine/Eye01.png';
import Mouth01 from '../../assets/AvatarAssets/Masculine/Mouth01.png';
import M_Hair_Base01 from '../../assets/AvatarAssets/Masculine/M_Hair_Base01.png';
import M_Hair_Fringe01 from '../../assets/AvatarAssets/Masculine/M_Hair_Fringe01.png';
import M_Top01 from '../../assets/AvatarAssets/Masculine/M_Top01.png';
import M_Bot01 from '../../assets/AvatarAssets/Masculine/M_Bot01.png';
import BackAccessory01 from '../../assets/AvatarAssets/Masculine/BackAccessory01.png';
import Headgear01 from '../../assets/AvatarAssets/Masculine/Headgear01.png';
import Accessory01 from '../../assets/AvatarAssets/Masculine/Accessory01.png';
import LeftHand01 from '../../assets/AvatarAssets/Masculine/LeftHand01.png';
import RightHand01 from '../../assets/AvatarAssets/Masculine/RightHand01.png';

export type AvatarSlot = 
  | 'Background' 
  | 'BackAccessory' 
  | 'Body' 
  | 'Bottom' 
  | 'Top' 
  | 'Eyes' 
  | 'Mouth' 
  | 'HairBase' 
  | 'Headgear' 
  | 'HairFringe' 
  | 'Accessory' 
  | 'LeftHand' 
  | 'RightHand';

export type AccessoryItem = {
  id: string;
  name: string;
  price: number;
  slot: AvatarSlot;
  Sprite: ComponentType<{ width?: number | string; height?: number | string }>;
};

// Precise Z-Order defined by your rules (back to front)
export const ALL_SLOTS_Z_ORDER: AvatarSlot[] = [
  'Background',
  'BackAccessory',
  'Body',
  'Bottom',
  'Top',
  'Eyes',
  'Mouth',
  'HairBase',
  'Headgear',
  'HairFringe',
  'Accessory',
  'LeftHand',
  'RightHand'
];

// UI Groupings for mental space / progressive reveal
export const BASE_TRAIT_SLOTS: AvatarSlot[] = [
  'Background', 'Body', 'Eyes', 'Mouth', 'HairBase', 'HairFringe'
];

export const WEARABLE_SLOTS: AvatarSlot[] = [
  'BackAccessory', 'Bottom', 'Top', 'Headgear', 'Accessory', 'LeftHand', 'RightHand'
];

// Initial mock data with 8 body types (4 Male, 4 Female) and shared assets
export const ACCESSORY_ITEMS: AccessoryItem[] = [
  // Backgrounds
  { id: 'bg-default', name: 'Default BG', price: 0, slot: 'Background', Sprite: (p: any) => React.createElement(ImageSprite, { source: Background01, ...p }) },
  
  // Body (Skin Colors) - 4 Male, 4 Female
  { id: 'body-m-1', name: 'Male Tone A', price: 0, slot: 'Body', Sprite: (p: any) => React.createElement(ImageSprite, { source: BaseMasc_A, ...p }) },
  { id: 'body-m-2', name: 'Male Tone B', price: 0, slot: 'Body', Sprite: (p: any) => React.createElement(ImageSprite, { source: BaseMasc_B, ...p }) },
  { id: 'body-m-3', name: 'Male Tone C', price: 0, slot: 'Body', Sprite: (p: any) => React.createElement(ImageSprite, { source: BaseMasc_C, ...p }) },
  { id: 'body-m-4', name: 'Male Tone D', price: 0, slot: 'Body', Sprite: (p: any) => React.createElement(ImageSprite, { source: BaseMasc_D, ...p }) },
  
  { id: 'body-f-1', name: 'Female Tone A', price: 0, slot: 'Body', Sprite: (p: any) => React.createElement(ImageSprite, { source: BaseFem_A, ...p }) },
  { id: 'body-f-2', name: 'Female Tone B', price: 0, slot: 'Body', Sprite: (p: any) => React.createElement(ImageSprite, { source: BaseFem_B, ...p }) },
  { id: 'body-f-3', name: 'Female Tone C', price: 0, slot: 'Body', Sprite: (p: any) => React.createElement(ImageSprite, { source: BaseFem_C, ...p }) },
  { id: 'body-f-4', name: 'Female Tone D', price: 0, slot: 'Body', Sprite: (p: any) => React.createElement(ImageSprite, { source: BaseFem_D, ...p }) },

  // Wearables
  { id: 'top-basic', name: 'Basic Shirt', price: 50, slot: 'Top', Sprite: (p: any) => React.createElement(ImageSprite, { source: M_Top01, ...p }) },
  { id: 'bot-jeans', name: 'Blue Jeans', price: 50, slot: 'Bottom', Sprite: (p: any) => React.createElement(ImageSprite, { source: M_Bot01, ...p }) },
  { id: 'hair-base-1', name: 'Short Hair', price: 0, slot: 'HairBase', Sprite: (p: any) => React.createElement(ImageSprite, { source: M_Hair_Base01, ...p }) },
  { id: 'hair-fringe-1', name: 'Hair Fringe', price: 0, slot: 'HairFringe', Sprite: (p: any) => React.createElement(ImageSprite, { source: M_Hair_Fringe01, ...p }) },
  { id: 'eyes-normal', name: 'Normal Eyes', price: 0, slot: 'Eyes', Sprite: (p: any) => React.createElement(ImageSprite, { source: Eye01, ...p }) },
  { id: 'mouth-smile', name: 'Smile', price: 0, slot: 'Mouth', Sprite: (p: any) => React.createElement(ImageSprite, { source: Mouth01, ...p }) },
  { id: 'back-acc-1', name: 'Back Accessory', price: 50, slot: 'BackAccessory', Sprite: (p: any) => React.createElement(ImageSprite, { source: BackAccessory01, ...p }) },
  { id: 'headgear-1', name: 'Headgear', price: 75, slot: 'Headgear', Sprite: (p: any) => React.createElement(ImageSprite, { source: Headgear01, ...p }) },
  { id: 'acc-1', name: 'Accessory', price: 50, slot: 'Accessory', Sprite: (p: any) => React.createElement(ImageSprite, { source: Accessory01, ...p }) },
  { id: 'left-hand-1', name: 'Left Hand Item', price: 50, slot: 'LeftHand', Sprite: (p: any) => React.createElement(ImageSprite, { source: LeftHand01, ...p }) },
  { id: 'right-hand-1', name: 'Right Hand Item', price: 50, slot: 'RightHand', Sprite: (p: any) => React.createElement(ImageSprite, { source: RightHand01, ...p }) },
];

export const DEFAULT_OWNED_IDS = new Set<string>([
  'bg-default', 
  'body-m-1', 'body-m-2', 'body-m-3', 'body-m-4', 
  'body-f-1', 'body-f-2', 'body-f-3', 'body-f-4', 
  'eyes-normal', 'mouth-smile', 'hair-base-1', 'hair-fringe-1',
  'top-basic', 'bot-jeans', 'back-acc-1', 'headgear-1', 'acc-1', 'left-hand-1', 'right-hand-1'
]);