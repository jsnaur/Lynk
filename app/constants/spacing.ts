// Shared spacing scale for screen padding, section gaps, and inline element spacing.
// Use these tokens instead of raw pixel values so Quests / Shop / Profile stay aligned.

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// Screen-level chrome shared across primary tab screens.
export const SCREEN = {
  paddingH: SPACING.xl,        // horizontal padding for the screen body
  paddingTop: SPACING.lg,      // gap below the header
  sectionGap: SPACING.xxl,     // vertical gap between major sections
  blockGap: SPACING.lg,        // gap between blocks inside a section
} as const;

export type SpacingToken = keyof typeof SPACING;
