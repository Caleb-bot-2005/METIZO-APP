import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface VerifiedBadgeProps {
  size?: number;
  color?: string;
}

const PETAL_COUNT = 8;
const CENTER = 12;
const MAIN_RADIUS = 7.2;
const PETAL_RADIUS = 3.6;

const petals = Array.from({ length: PETAL_COUNT }).map((_, i) => {
  const angle = ((i * 360) / PETAL_COUNT - 90) * (Math.PI / 180);
  return {
    cx: CENTER + MAIN_RADIUS * Math.cos(angle),
    cy: CENTER + MAIN_RADIUS * Math.sin(angle),
  };
});

// Instagram/Twitter-style scalloped "seal" badge: a center circle plus 8 overlapping
// petal circles around its edge, which together render as one continuous rosette outline.
export function VerifiedBadge({ size = 16, color = '#0A84FF' }: VerifiedBadgeProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={CENTER} cy={CENTER} r={MAIN_RADIUS} fill={color} />
      {petals.map((p, i) => (
        <Circle key={i} cx={p.cx} cy={p.cy} r={PETAL_RADIUS} fill={color} />
      ))}
      <Path d="M8.2 12.6 L10.8 15.2 L16 9.4" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}
