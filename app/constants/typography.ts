import { TextStyle } from 'react-native';
import { FONTS } from './fonts';

// Role-based typography scale shared across Quests, Shop, and Profile screens.
// Pick the role that matches semantic intent — do not override sizes/weights ad hoc.
// Color is intentionally omitted; apply via the theme's `colors` palette at the call site.

export const TYPOGRAPHY = {
  screenTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    fontFamily: FONTS.body,
    letterSpacing: 0.2,
  } as TextStyle,

  sectionTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    fontFamily: FONTS.body,
  } as TextStyle,

  // Larger section title for list-heavy screens (e.g. Quests) where headings
  // need to stand out from many cards. Use sparingly to avoid scale dilution.
  sectionTitleLg: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    fontFamily: FONTS.body,
  } as TextStyle,

  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    fontFamily: FONTS.body,
  } as TextStyle,

  bodyStrong: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    fontFamily: FONTS.body,
  } as TextStyle,

  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    fontFamily: FONTS.body,
  } as TextStyle,

  micro: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    fontFamily: FONTS.body,
  } as TextStyle,

  // Pixel/display roles — for headers that should keep the retro aesthetic
  // (Profile block titles, leaderboard/token/quest card heads).
  pixelHeading: {
    fontSize: 12,
    fontFamily: FONTS.display,
  } as TextStyle,

  pixelLabel: {
    fontSize: 10,
    fontFamily: FONTS.display,
  } as TextStyle,
} as const;

export type TypographyRole = keyof typeof TYPOGRAPHY;
