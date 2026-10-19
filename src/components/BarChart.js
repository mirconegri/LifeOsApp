// src/components/BarChart.js
//
// Minimal bar chart built from Views — no chart library. Restyled for the
// M3 Expressive pass: each bar grows on a slow spring (staggered left to
// right, once on mount), the top corners are fully round, and the bars sit
// on a tonal track. Props are backward compatible (color/showValues), with
// an optional trackColor; per-datum `color` and `displayValue` still win.
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

import { M3 } from '../config/colors';
import { SPRING } from '../config/designSystem';
import { TEXT } from '../ui/type';

function Bar({ target, color, delay, reduceMotion }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = reduceMotion
      ? 1
      : withDelay(delay, withSpring(1, SPRING.slowSpatial));
  }, [delay, progress, reduceMotion]);

  const growStyle = useAnimatedStyle(() => ({
    height: Math.max(2, target * progress.value),
  }));

  return (
    <Animated.View style={[styles.bar, { backgroundColor: color }, growStyle]} />
  );
}

export function BarChart({
  data = [],
  height = 120,
  color = M3.primary,
  trackColor = M3.surfaceContainerHighest,
  showValues = true,
}) {
  const reduceMotion = useReducedMotion();
  const max = Math.max(...data.map(d => Math.abs(Number(d.value) || 0)), 1);

  return (
    <View style={styles.row}>
      {data.map((d, i) => {
        const value = Math.abs(Number(d.value) || 0);
        const target = Math.max(3, (value / max) * height);
        return (
          <View key={i} style={styles.col}>
            {showValues ? (
              <Text style={[TEXT.labelSmall, styles.value]} numberOfLines={1}>
                {value > 0 ? (d.displayValue ?? d.value) : ''}
              </Text>
            ) : null}
            <View style={[styles.track, { height, backgroundColor: trackColor }]}>
              <Bar
                target={target}
                color={d.color || color}
                delay={i * 50}
                reduceMotion={reduceMotion}
              />
            </View>
            <Text style={[TEXT.labelSmall, styles.label]} numberOfLines={1}>
              {d.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' },
  col: { alignItems: 'center', flex: 1, paddingHorizontal: 2 },
  value: { color: M3.onSurfaceVariant, marginBottom: 4, height: 16 },
  track: {
    width: 20,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: 10,
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  label: { color: M3.onSurfaceVariant, marginTop: 6 },
});
