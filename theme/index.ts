import { gradients } from './colors';
import { radius, shadow, spacing } from './spacing';
import { typography } from './typography';
import { useIsDark, useThemeColors } from '@/hooks/use-theme-colors';

export * from './colors';
export * from './spacing';
export * from './typography';

// Was hardcoded to always return light colors, so shared components using this
// (e.g. Card) never actually followed the dark mode setting. Now delegates to
// the same theme hook the rest of the app uses.
export function useTheme() {
  const colors = useThemeColors();
  const isDark = useIsDark();
  return {
    colors,
    isDark,
    spacing,
    radius,
    shadow,
    typography,
    gradients,
    glassGradient: gradients.glassLight,
  };
}
