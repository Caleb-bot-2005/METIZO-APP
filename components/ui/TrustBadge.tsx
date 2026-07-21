import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface TrustBadgeProps {
  score: number;
  size?: 'sm' | 'md';
}

function scoreColor(score: number) {
  if (score >= 90) return '#22C55E';
  if (score >= 75) return '#F59E0B';
  return '#EF4444';
}

export function TrustBadge({ score, size = 'md' }: TrustBadgeProps) {
  const color = scoreColor(score);
  const dimension = size === 'sm' ? 38 : 52;
  const strokeWidth = size === 'sm' ? 3.5 : 5;
  const radius = (dimension - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(score, 100)) / 100;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={{ width: dimension, height: dimension, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={dimension} height={dimension} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={dimension / 2} cy={dimension / 2} r={radius} stroke="#E2E8F0" strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: size === 'sm' ? 10 : 12, color }}>
        {score}
      </Text>
    </View>
  );
}
