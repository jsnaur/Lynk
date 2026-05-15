// Leaf module: lets screens invalidate each other's module-level caches
// without importing each other directly (which would create require cycles).

type ProfileCacheSnapshot = {
  profile: any;
  totalXP: number;
  activeQuestCount: number;
  completedQuestCount: number;
};

type ShopCacheSnapshot = {
  appliedAccessories: Record<string, string>;
  ownedItemIds: string[];
};

let questInvalidator: (() => void) | null = null;
let profileInvalidator: (() => void) | null = null;
let shopInvalidator: (() => void) | null = null;
let profileCache: ProfileCacheSnapshot | null = null;
let shopCache: ShopCacheSnapshot = {
  appliedAccessories: {},
  ownedItemIds: [],
};

export function registerQuestScreenCacheInvalidator(fn: () => void) {
  questInvalidator = fn;
}

export function registerProfileCacheInvalidator(fn: () => void) {
  profileInvalidator = fn;
}

export function registerShopCacheInvalidator(fn: () => void) {
  shopInvalidator = fn;
}

export function invalidateQuestScreenCache() {
  questInvalidator?.();
}

export function invalidateProfileCache() {
  profileInvalidator?.();
}

export function invalidateShopCache() {
  shopInvalidator?.();
}

export function getProfileCacheSnapshot() {
  return profileCache;
}

export function setProfileCacheSnapshot(next: Partial<ProfileCacheSnapshot>) {
  profileCache = {
    profile: next.profile ?? profileCache?.profile ?? null,
    totalXP: next.totalXP ?? profileCache?.totalXP ?? 0,
    activeQuestCount: next.activeQuestCount ?? profileCache?.activeQuestCount ?? 0,
    completedQuestCount: next.completedQuestCount ?? profileCache?.completedQuestCount ?? 0,
  };
}

export function clearProfileCacheSnapshot() {
  profileCache = null;
}

export function getShopCacheSnapshot() {
  return shopCache;
}

export function setShopCacheSnapshot(next: Partial<ShopCacheSnapshot>) {
  shopCache = {
    appliedAccessories: next.appliedAccessories ?? shopCache.appliedAccessories,
    ownedItemIds: next.ownedItemIds ?? shopCache.ownedItemIds,
  };
}

export function clearShopCacheSnapshot() {
  shopCache = {
    appliedAccessories: {},
    ownedItemIds: [],
  };
}
