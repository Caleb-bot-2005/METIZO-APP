import React from 'react';
import { View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

interface LogoProps {
  size?: number;
  color?: string;
  dotColor?: string;
}

// Geometry matches the generated PNG assets (scripts/asset generation) so the
// in-app mark and the app icon/splash images are the same shape.
const THICK_W = 20;
const THIN_W = 13;
const GAP_INNER = 8;
const GAP_MID = 14;
const FULL_H = 90;
const SHORT_H = 58;
const DOT_R = 8;

const LEFT_THICK_X = 0;
const LEFT_THIN_X = THICK_W + GAP_INNER;
const RIGHT_THIN_X = LEFT_THIN_X + THIN_W + GAP_MID;
const RIGHT_THICK_X = RIGHT_THIN_X + THIN_W + GAP_INNER;
const MARK_WIDTH = RIGHT_THICK_X + THICK_W;
const MARK_HEIGHT = FULL_H + DOT_R;

export function Logo({ size = 64, color = '#0A84FF', dotColor = '#FACC15' }: LogoProps) {
  const u = size / MARK_WIDTH;
  const height = MARK_HEIGHT * u;

  return (
    <View style={{ width: size, height, position: 'relative' }}>
      <View
        style={{
          position: 'absolute',
          left: LEFT_THICK_X * u,
          top: DOT_R * u,
          width: THICK_W * u,
          height: FULL_H * u,
          backgroundColor: color,
          borderTopLeftRadius: (THICK_W * u) / 2,
          borderTopRightRadius: (THICK_W * u) / 2,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: LEFT_THIN_X * u,
          top: DOT_R * u,
          width: THIN_W * u,
          height: SHORT_H * u,
          backgroundColor: color,
          borderRadius: (THIN_W * u) / 2,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: (LEFT_THIN_X + THIN_W) * u,
          top: DOT_R * u,
          width: GAP_MID * u,
          height: 50 * u,
        }}>
        <Svg width={GAP_MID * u} height={50 * u} viewBox={`0 0 ${GAP_MID} 50`}>
          <Polygon points={`0,0 ${GAP_MID},0 ${GAP_MID / 2},50`} fill={color} />
        </Svg>
      </View>
      <View
        style={{
          position: 'absolute',
          left: RIGHT_THIN_X * u,
          top: DOT_R * u,
          width: THIN_W * u,
          height: SHORT_H * u,
          backgroundColor: color,
          borderRadius: (THIN_W * u) / 2,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: RIGHT_THICK_X * u,
          top: DOT_R * u,
          width: THICK_W * u,
          height: FULL_H * u,
          backgroundColor: color,
          borderTopLeftRadius: (THICK_W * u) / 2,
          borderTopRightRadius: (THICK_W * u) / 2,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: (RIGHT_THICK_X + THICK_W - DOT_R * 0.6) * u,
          top: 0,
          width: DOT_R * 2 * u,
          height: DOT_R * 2 * u,
          borderRadius: DOT_R * u,
          backgroundColor: dotColor,
        }}
      />
    </View>
  );
}

export const logoMetrics = {
  THICK_W,
  THIN_W,
  GAP_INNER,
  GAP_MID,
  FULL_H,
  SHORT_H,
  DOT_R,
  LEFT_THICK_X,
  LEFT_THIN_X,
  RIGHT_THIN_X,
  RIGHT_THICK_X,
  MARK_WIDTH,
  MARK_HEIGHT,
};
