import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '@/theme';

interface CardProps extends ViewProps {
  elevated?: boolean;
  padded?: boolean;
  children: React.ReactNode;
}

export function Card({ elevated = true, padded = true, style, children, ...rest }: CardProps) {
  const { colors, shadow } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: 24,
          padding: padded ? 16 : 0,
        },
        elevated ? shadow.soft : null,
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}
