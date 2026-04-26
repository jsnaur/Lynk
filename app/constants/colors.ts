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

export const darkColors = {
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

export const lightColors = {
  bg: '#FFFFFF',
  textPrimary: '#1A1A1F',
  textSecondary: '#666666',
  surface: '#F5F5F7',
  surface2: '#EBEBEF',
  border: '#D1D1D6',
  favor: '#00B0B9', // Darkened slightly for better contrast on light mode
  study: '#E6155E',
  item: '#22B007',
  xp: '#9333EA',
  token: '#D4AF37',
  error: '#D10000',
  warning: '#D68A00',
  heart: '#E03E6C',
} as const;

// Fallback for files not yet using the theme context
export const COLORS = darkColors;