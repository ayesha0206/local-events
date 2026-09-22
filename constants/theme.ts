/**
 * Visual tokens for Local Events — typography color hierarchy.
 *
 * Brand (fixed hex):
 * - Ultramarine #1805DB — screen headings, major titles, buttons, active tabs, links
 * - Purple #9B96FD — surface fills (pills/chips); darkened purple text for subheads
 * - Yellow (light) — accent FILLS only (Free badges, selected filters, callouts)
 *
 * Hierarchy:
 * 1) Headings / major titles → primary (#1805DB), Times New Roman. Never ink.
 * 2) Subheadings / taglines / section labels → subheader (darkened purple ~4.5:1+
 *    on lilac canvas). Raw #9B96FD fails as text; use it as a FILL, not body color.
 * 3) Body / emails / times / long descriptions → ink on white cards. Never yellow text.
 * 4) Yellow = fill only + dark or ultramarine text on top. Never full-screen yellow.
 * Destructive stays red.
 */

import { Platform } from 'react-native';

/** Display / heading face — Times New Roman with tight tracking (no TNR Compressed on iOS). */
const headingFontFamily = Platform.select({
  ios: 'Times New Roman',
  android: 'serif',
  default: 'Times New Roman',
  web: "'Times New Roman', Times, serif",
});

export const Palette = {
  /** Ultramarine — headings, CTAs, tabs, links. White text on it ~10:1. */
  primary: '#1805DB',
  /** Purple surface FILL — chips/pills/selections. Dark ink on it only; never white text. */
  surface: '#9B96FD',
  /**
   * Subheading / tagline / section-label TEXT.
   * Darkened from brand purple for ~4.5:1+ on lilac canvas #B2AFDA
   * (#9B96FD / prior #5C54D4 fail as text on this darker lilac).
   */
  subheader: '#3C36A0',
  /** Light yellow accent FILL — Free badges, selected filters, small callouts. */
  highlight: '#FFF9B0',
  /** Lilac app canvas — cards stay white for body readability. */
  background: '#B2AFDA',
  card: '#FFFFFF',
  /** Near-black — body copy, emails, times, descriptions. */
  ink: '#12121A',
  /** Same as primary — screen titles and card titles. */
  title: '#1805DB',
  /** Tertiary chrome (permission lines, soft separators). Prefer subheader for brand voice. */
  meta: '#5C5878',
  muted: '#5E5A78',
  /** Prefer ink for long descriptions; kept for legacy soft body if needed. */
  description: '#6B6788',
  metaDot: '#8A86B8',
  destructive: '#C62828',
  onPrimary: '#FFFFFF',
  onSurface: '#12121A',
  /** Text on yellow fills — ink or use primary for stronger brand. */
  onHighlight: '#12121A',
  shadow: '#12121A',
  tabInactive: '#5E5A78',
  statusDraft: '#E8E6F8',
  statusPublished: '#D4D1FC',
  statusCancelled: '#F5D6D6',
  /** App canvas — same as background (legacy name). */
  cream: '#B2AFDA',
  /** Primary actions — same as primary (legacy name). */
  accent: '#1805DB',
  onAccent: '#FFFFFF',
  /** Free-badge fill — same as highlight; pair with onHighlight / primary text. */
  free: '#FFF9B0',
} as const;

/**
 * Hand-assigned category pill fills derived from the violet surface family.
 * All pair with Palette.onSurface / ink (never white text).
 */
export const PillColors = [
  '#9B96FD',
  '#B0ACFE',
  '#C8C5FF',
  '#A39EFF',
  '#8680F5',
  '#D4D1FC',
  '#7E78F0',
  '#B8B4FE',
  '#E0DEFF',
] as const;

/** Fixed category set (Phase 5.3). */
const CategoryPillColors: Record<string, (typeof PillColors)[number]> = {
  Fashion: '#9B96FD',
  Crafts: '#B0ACFE',
  Music: '#C8C5FF',
  Wellness: '#A39EFF',
  Outdoors: '#8680F5',
  Games: '#D4D1FC',
  Food: '#7E78F0',
  History: '#B8B4FE',
  Other: '#E0DEFF',
};

export const Spacing = {
  screenX: 20,
  screenTopIos: 12,
  screenTopAndroid: 40,
  headerGap: 6,
  sectionBottom: 24,
  cardBody: 20,
  listBottom: 32,
  cardGap: 18,
  metaGap: 8,
  pillX: 12,
  pillY: 6,
} as const;

export const Radii = {
  card: 24,
  pill: 999,
  metaDot: 2,
} as const;

export const Typography = {
  header: {
    fontFamily: headingFontFamily,
    fontSize: 34,
    fontWeight: '700' as const,
    letterSpacing: -1.2,
  },
  subheader: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  cardTitle: {
    fontFamily: headingFontFamily,
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
    letterSpacing: -0.8,
  },
  meta: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  pill: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400' as const,
  },
} as const;

export const Shadows = {
  card: Platform.select({
    ios: {
      shadowColor: Palette.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
    },
    android: {
      elevation: 6,
    },
    default: {
      shadowColor: Palette.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
    },
  }),
} as const;

/** Navigation / scheme colors built from the palette (app is light-first). */
export const Colors = {
  light: {
    text: Palette.ink,
    background: Palette.background,
    tint: Palette.primary,
    icon: Palette.tabInactive,
    tabIconDefault: Palette.tabInactive,
    tabIconSelected: Palette.primary,
    card: Palette.card,
    muted: Palette.muted,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: Palette.primary,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: Palette.primary,
    card: '#1C1C1E',
    muted: '#9BA1A6',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'Times New Roman',
    heading: 'Times New Roman',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    heading: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "'Times New Roman', Times, serif",
    heading: "'Times New Roman', Times, serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export function getPillColor(category: string): string {
  const key = category.trim();
  return CategoryPillColors[key] ?? CategoryPillColors.Other;
}
