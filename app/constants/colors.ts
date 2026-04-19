/**
 * Utility to dynamically add opacity to a hex color token.
 * Example: withOpacity(COLORS.favor, 0.15)
 */
export const withOpacity = (hex: string, opacity: number): string => {
  // Remove the hash if present
  hex = hex.replace(/^#/, '');

  // Parse r, g, b values
  let r, g, b;
  if (hex.length === 3) {
    r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
    g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
    b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else {
    throw new Error('Invalid hex color format');
  }

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const COLORS = {
  bg: '#1A1A1F',
  textPrimary: '#F0F0F5',
  textSecondary: '#8A8A9A',
  surface: '#26262E',
  surface2: '#31313C',
  border: '#3A3A48',
  favor: '#00F5FF',
  study: '#FF2D78',
  item: '#39FF14',
  xp: '#C084FC',
  token: '#FFD700',
  error: '#FF4d4d',
  warning: '#FFA500',
  heart: '#FF5B8A',
} as const;