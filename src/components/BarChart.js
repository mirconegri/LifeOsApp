// src/components/BarChart.js
//
// Minimal bar chart built from plain Views — no chart library dependency.
// Each bar's height is proportional to its value against the dataset max,
// with an optional label under each bar and an optional value label above.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../config/colors';

export function BarChart({ data, height = 120, color = COLORS.accent, showValues = true }) {
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <View style={[styles.row, { height: height + 36 }]}>
      {data.map((d, i) => {
        const barHeight = Math.max(3, (d.value / max) * height);
        return (
          <View key={i} style={styles.col}>
            {showValues && (
              <Text style={styles.value} numberOfLines={1}>
                {d.value > 0 ? d.displayValue ?? d.value : ''}
              </Text>
            )}
            <View style={[styles.track, { height }]}>
              <View style={[
                styles.bar,
                { height: barHeight, backgroundColor: d.color || color },
              ]} />
            </View>
            <Text style={styles.label}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' },
  col: { alignItems: 'center', flex: 1 },
  value: { fontSize: 10, color: COLORS.textSub, marginBottom: 4, height: 14 },
  track: { width: 18, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 5 },
  label: { fontSize: 10, color: COLORS.textMuted, marginTop: 6 },
});
