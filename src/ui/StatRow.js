// src/ui/StatRow.js
//
// A compact row of 2–3 headline statistics, separated by 1 px vertical
// dividers. Used by University (credits / average / predicted grade) and
// Finances (income / expenses).
//
// Usage:
//   <StatRow stats={[{ value: '112', label: 'Credits' }, { value: '27.5', label: 'Average' }]} />
//
// Values are passed pre-formatted (strings or numbers) — formatting stays in
// the screen.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { M3 } from '../config/colors';
import { TEXT } from './type';

export function StatRow({ stats = [], style }) {
  if (stats.length === 0) return null;

  return (
    <View style={[styles.row, style]}>
      {stats.map((stat, i) => (
        <React.Fragment key={stat.label ?? i}>
          {i > 0 ? <View style={styles.divider} /> : null}
          <View style={styles.cell}>
            <Text style={[TEXT.titleLargeEmphasized, styles.value]} numberOfLines={1}>
              {stat.value}
            </Text>
            <Text style={[TEXT.labelMedium, styles.label]} numberOfLines={1}>
              {stat.label}
            </Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: M3.onSurface,
  },
  label: {
    color: M3.onSurfaceVariant,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: M3.outlineVariant,
  },
});
