import type { ComponentType } from 'react';

import CatPet from '../../assets/ShopAssets/Cat-Pet.svg';
import EggHat from '../../assets/ShopAssets/Egg-Hat.svg';
import ShadesHead from '../../assets/ShopAssets/Shades-Head.svg';

export type AccessorySlot = 'Hat' | 'Head' | 'Pet' | 'Effects' | 'Frame';

export type AccessoryItem = {
  id: string;
  name: string;
  price: number;
  slot: AccessorySlot;
  Sprite: ComponentType<{ width?: number; height?: number }>;
};

export const SLOTS: AccessorySlot[] = ['Hat', 'Head', 'Pet', 'Effects', 'Frame'];

export const ACCESSORY_ITEMS: AccessoryItem[] = [
  { id: 'egg-hat', name: 'Egg Hat', price: 50, slot: 'Hat', Sprite: EggHat },
  { id: 'shades-head', name: 'Shades', price: 100, slot: 'Head', Sprite: ShadesHead },
  { id: 'cat-pet', name: 'Cat Pet', price: 200, slot: 'Pet', Sprite: CatPet },
];

export const DEFAULT_OWNED_IDS = new Set<string>(['egg-hat']);
