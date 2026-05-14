// Leaf module: lets screens invalidate each other's module-level caches
// without importing each other directly (which would create require cycles).

let questInvalidator: (() => void) | null = null;
let profileInvalidator: (() => void) | null = null;

export function registerQuestScreenCacheInvalidator(fn: () => void) {
  questInvalidator = fn;
}

export function registerProfileCacheInvalidator(fn: () => void) {
  profileInvalidator = fn;
}

export function invalidateQuestScreenCache() {
  questInvalidator?.();
}

export function invalidateProfileCache() {
  profileInvalidator?.();
}
