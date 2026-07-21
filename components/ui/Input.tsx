import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Eye, EyeOff } from 'lucide-react-native';
import { fontFamily } from '@/theme/typography';
import { ThemeColors } from '@/theme/colors';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  isPassword?: boolean;
}

export function Input({ label, error, icon, isPassword, style, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(!!isPassword);
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.field, { borderColor }]}>
        {icon}
        <TextInput
          {...rest}
          secureTextEntry={secure}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor="#94A3B8"
          style={[styles.input, style]}
        />
        {isPassword ? (
          <Pressable onPress={() => setSecure((s) => !s)} hitSlop={8}>
            {secure ? <EyeOff size={18} color="#64748B" /> : <Eye size={18} color="#64748B" />}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Animated.Text entering={FadeIn} exiting={FadeOut} style={styles.error}>
          {error}
        </Animated.Text>
      ) : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    label: { fontFamily: fontFamily.medium, fontSize: 14, color: colors.textSecondary },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderWidth: 1,
    },
    input: { flex: 1, fontFamily: fontFamily.medium, color: colors.text, fontSize: 15 },
    error: { fontFamily: fontFamily.medium, fontSize: 12, color: colors.danger },
  });
}
