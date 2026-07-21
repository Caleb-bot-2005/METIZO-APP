import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { fontFamily } from '@/theme/typography';
import { lightColors as colors, ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

type Variant = 'primary' | 'outline' | 'outline-light' | 'ghost' | 'danger' | 'gold';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
}

const sizeStyles: Record<Size, ViewStyle> = {
  sm: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 },
  md: { paddingHorizontal: 20, paddingVertical: 16, borderRadius: 16 },
  lg: { paddingHorizontal: 24, paddingVertical: 20, borderRadius: 24 },
};

const textSizes: Record<Size, number> = { sm: 14, md: 16, lg: 18 };

const variantStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.primary },
  outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.primary },
  'outline-light': { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)' },
  ghost: { backgroundColor: `${colors.primary}1A` },
  danger: { backgroundColor: colors.danger },
  gold: { backgroundColor: colors.gold },
};

// Only the "gold" variant's text color actually differs between light/dark
// (colors.text) — the rest are palette accents, identical in both themes.
function getTextColors(themeColors: ThemeColors): Record<Variant, string> {
  return {
    primary: colors.white,
    outline: colors.primary,
    'outline-light': colors.white,
    ghost: colors.primary,
    danger: colors.white,
    gold: themeColors.text,
  };
}

const spinnerColor: Record<Variant, string> = {
  primary: '#FFFFFF',
  outline: '#0A84FF',
  'outline-light': '#FFFFFF',
  ghost: '#0A84FF',
  danger: '#FFFFFF',
  gold: '#0F172A',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const themeColors = useThemeColors();
  const textColors = getTextColors(themeColors);

  const content = (
    <View style={styles.content}>
      {icon && iconPosition === 'left' ? icon : null}
      {icon && iconPosition === 'right' ? <View style={{ opacity: 0 }}>{icon}</View> : null}
      {loading ? (
        <ActivityIndicator color={spinnerColor[variant]} />
      ) : (
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          style={{
            flexShrink: 1,
            fontFamily: fontFamily.semibold,
            fontSize: textSizes[size],
            color: textColors[variant],
          }}>
          {label}
        </Text>
      )}
      {icon && iconPosition === 'left' ? <View style={{ opacity: 0 }}>{icon}</View> : null}
      {icon && iconPosition === 'right' ? icon : null}
    </View>
  );

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        sizeStyles[size],
        variantStyles[variant],
        { opacity: isDisabled ? 0.5 : 1, width: fullWidth ? '100%' : undefined },
        style,
      ]}>
      {content}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
