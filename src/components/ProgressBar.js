
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../config/colors';

export function ProgressBar({ pct = 0, color = COLORS.accent }) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 4, backgroundColor: COLORS.bg4, borderRadius: 2, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: 2 },
});

