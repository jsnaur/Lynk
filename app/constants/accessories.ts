import { ComponentType } from 'react';

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

// TODO: Create an ImageSprite component in components/sprites/
// The component should accept { source, width?, height? } props
// and render the image at the specified dimensions (default 45x45)
// Then import it here and use in ACCESSORY_ITEMS below

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
  asset?: any; // TODO: Replace with actual image source type once rendering is implemented
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
// TODO: Update Sprite components once ImageSprite component is created
// For now, using placeholder function that returns null
const PlaceholderSprite: ComponentType<any> = () => null;

export const ACCESSORY_ITEMS: AccessoryItem[] = [
  // Backgrounds
  { id: 'bg-default', name: 'Default BG', price: 0, slot: 'Background', Sprite: PlaceholderSprite, asset: Background01 },
  
  // Body (Skin Colors) - 4 Male, 4 Female
  { id: 'body-m-1', name: 'Male Tone A', price: 0, slot: 'Body', Sprite: PlaceholderSprite, asset: BaseMasc_A },
  { id: 'body-m-2', name: 'Male Tone B', price: 0, slot: 'Body', Sprite: PlaceholderSprite, asset: BaseMasc_B },
  { id: 'body-m-3', name: 'Male Tone C', price: 0, slot: 'Body', Sprite: PlaceholderSprite, asset: BaseMasc_C },
  { id: 'body-m-4', name: 'Male Tone D', price: 0, slot: 'Body', Sprite: PlaceholderSprite, asset: BaseMasc_D },
  
  { id: 'body-f-1', name: 'Female Tone A', price: 0, slot: 'Body', Sprite: PlaceholderSprite, asset: BaseFem_A },
  { id: 'body-f-2', name: 'Female Tone B', price: 0, slot: 'Body', Sprite: PlaceholderSprite, asset: BaseFem_B },
  { id: 'body-f-3', name: 'Female Tone C', price: 0, slot: 'Body', Sprite: PlaceholderSprite, asset: BaseFem_C },
  { id: 'body-f-4', name: 'Female Tone D', price: 0, slot: 'Body', Sprite: PlaceholderSprite, asset: BaseFem_D },

  // Wearables
  { id: 'top-basic', name: 'Basic Shirt', price: 50, slot: 'Top', Sprite: PlaceholderSprite, asset: M_Top01 },
  { id: 'bot-jeans', name: 'Blue Jeans', price: 50, slot: 'Bottom', Sprite: PlaceholderSprite, asset: M_Bot01 },
  { id: 'hair-base-1', name: 'Short Hair', price: 0, slot: 'HairBase', Sprite: PlaceholderSprite, asset: M_Hair_Base01 },
  { id: 'hair-fringe-1', name: 'Hair Fringe', price: 0, slot: 'HairFringe', Sprite: PlaceholderSprite, asset: M_Hair_Fringe01 },
  { id: 'eyes-normal', name: 'Normal Eyes', price: 0, slot: 'Eyes', Sprite: PlaceholderSprite, asset: Eye01 },
  { id: 'mouth-smile', name: 'Smile', price: 0, slot: 'Mouth', Sprite: PlaceholderSprite, asset: Mouth01 },
  { id: 'back-acc-1', name: 'Back Accessory', price: 50, slot: 'BackAccessory', Sprite: PlaceholderSprite, asset: BackAccessory01 },
  { id: 'headgear-1', name: 'Headgear', price: 75, slot: 'Headgear', Sprite: PlaceholderSprite, asset: Headgear01 },
  { id: 'acc-1', name: 'Accessory', price: 50, slot: 'Accessory', Sprite: PlaceholderSprite, asset: Accessory01 },
  { id: 'left-hand-1', name: 'Left Hand Item', price: 50, slot: 'LeftHand', Sprite: PlaceholderSprite, asset: LeftHand01 },
  { id: 'right-hand-1', name: 'Right Hand Item', price: 50, slot: 'RightHand', Sprite: PlaceholderSprite, asset: RightHand01 },
];

export const DEFAULT_OWNED_IDS = new Set<string>([
  'bg-default', 
  'body-m-1', 'body-m-2', 'body-m-3', 'body-m-4', 
  'body-f-1', 'body-f-2', 'body-f-3', 'body-f-4', 
  'eyes-normal', 'mouth-smile', 'hair-base-1', 'hair-fringe-1',
  'top-basic', 'bot-jeans', 'back-acc-1', 'headgear-1', 'acc-1', 'left-hand-1', 'right-hand-1'
]);