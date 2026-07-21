export const palette = {
  primary: '#0A84FF',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  gold: '#FACC15',
  white: '#FFFFFF',
  black: '#000000',
  // Distinct accent for the artisan/pro side of the app, so it reads as a
  // different mode from the customer blue rather than a re-skinned copy.
  artisan: '#7C3AED',
} as const;

export const lightColors = {
  ...palette,
  background: '#F7F8FA',
  card: '#FFFFFF',
  border: '#E7E9EC',
  text: '#0F172A',
  textSecondary: '#6B7280',
  overlay: 'rgba(15, 23, 42, 0.55)',
  glass: 'rgba(255, 255, 255, 0.65)',
} as const;

export const darkColors = {
  ...palette,
  background: '#0B1220',
  card: '#161F32',
  border: '#26314A',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  overlay: 'rgba(0, 0, 0, 0.6)',
  glass: 'rgba(22, 31, 50, 0.65)',
} as const;

export type ThemeColors = { readonly [K in keyof typeof lightColors]: string };

/**
 * Bolt-style flat blocks: start/end stops are identical so LinearGradient
 * renders as a solid color, not a blend, at every existing call site.
 */
export const gradients = {
  primary: ['#0A84FF', '#0A84FF'] as const,
  hero: ['#0A84FF', '#0A84FF'] as const,
  gold: ['#FACC15', '#FACC15'] as const,
  emergency: ['#EF4444', '#EF4444'] as const,
  success: ['#22C55E', '#22C55E'] as const,
  artisan: ['#7C3AED', '#7C3AED'] as const,
  glassLight: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.55)'] as const,
};
