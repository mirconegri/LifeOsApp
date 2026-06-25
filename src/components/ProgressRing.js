
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../config/colors';

export function ProgressRing({ pct = 0, size = 64, color = COLORS.accent }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - Math.min(100, Math.max(0, pct)) / 100);
  return (
    <View style={{ transform: [{ rotate: '-90deg' }] }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={COLORS.bg4}
          strokeWidth={5}
        />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeDasharray={`${circ}`}
          strokeDashoffset={dash}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
