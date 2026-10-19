// src/components/StatCard.js
//
// Legacy 2x2 stat tile, restyled on M3 tonal surfaces.
// Public props unchanged: label, value, sub, color, trend, icon.
//   trend: 'up' | 'down' | 'flat'
//   icon:  optional small inline node (kept as-is for compatibility)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { M3, MODULE_TONES } from '../config/colors';
import { SHAPE } from '../config/designSystem';
import { TEXT } from '../ui/type';

export function StatCard({ label, value, sub, color = M3.primary, trend, icon }) {
  return (
    <View style={styles.card}>
      <View style={styles.labelRow}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <Text style={TEXT.labelMedium} numberOfLines={1}>{label}</Text>
      </View>
      <Text style={[TEXT.headlineSmall, { color }]}>{value}</Text>
      {sub ? <Text style={[TEXT.bodySmall, styles.sub]}>{sub}</Text> : null}
      {trend === 'up' || trend === 'down' ? (
        <Text style={[TEXT.labelSmall, { color: trend === 'up' ? MODULE_TONES.journal.on : M3.error }]}>
          {trend === 'up' ? '↑' : '↓'}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: M3.surfaceContainerHigh,
    borderRadius: SHAPE.xl,
    padding: 16,
    flex: 1,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  icon: { fontSize: 12, marginRight: 4, color: M3.onSurfaceVariant },
  sub: { color: M3.outline, marginTop: 2 },
});
