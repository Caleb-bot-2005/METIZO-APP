import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { darkColors, lightColors, ThemeColors } from '@/theme/colors';

function resolveMode(mode: 'light' | 'dark' | 'system', system: 'light' | 'dark' | null | undefined) {
  return mode === 'system' ? system ?? 'light' : mode;
}

export function useThemeColors(): ThemeColors {
  const mode = useThemeStore((s) => s.mode);
  const system = useColorScheme();
  return resolveMode(mode, system) === 'dark' ? darkColors : lightColors;
}

export function useIsDark(): boolean {
  const mode = useThemeStore((s) => s.mode);
  const system = useColorScheme();
  return resolveMode(mode, system) === 'dark';
}
