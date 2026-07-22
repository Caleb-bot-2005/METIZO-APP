import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';

interface LogoProps {
  size?: number;
  color?: string;
  dotColor?: string;
}

// Precise geometry measured from the source mark (assets/images/logo-glyph.png
// is 480x408, logo-dot.png is a 96x96 circle whose bottom-left corner sits
// exactly flush against the glyph's top-right corner — see logoMetrics below).
const GLYPH_ASPECT = 480 / 408;
const DOT_TO_GLYPH_WIDTH = 96 / 480; // dot diameter as a fraction of glyph width
// Overall mark width = glyph width + dot width (dot sits past the glyph's right edge).
const GLYPH_TO_MARK_WIDTH = 1 / (1 + DOT_TO_GLYPH_WIDTH);

export function Logo({ size = 64, color = '#0A84FF', dotColor = '#FACC15' }: LogoProps) {
  const glyphWidth = size * GLYPH_TO_MARK_WIDTH;
  const glyphHeight = glyphWidth / GLYPH_ASPECT;
  const dotSize = glyphWidth * DOT_TO_GLYPH_WIDTH;

  return (
    <View style={{ width: glyphWidth + dotSize, height: glyphHeight + dotSize }}>
      <Image
        source={require('@/assets/images/logo-glyph.png')}
        tintColor={color}
        style={{ position: 'absolute', left: 0, top: dotSize, width: glyphWidth, height: glyphHeight }}
      />
      <Image
        source={require('@/assets/images/logo-dot.png')}
        tintColor={dotColor}
        style={{ position: 'absolute', left: glyphWidth, top: 0, width: dotSize, height: dotSize }}
      />
    </View>
  );
}

export const logoMetrics = {
  GLYPH_ASPECT,
  DOT_TO_GLYPH_WIDTH,
  GLYPH_TO_MARK_WIDTH,
};
