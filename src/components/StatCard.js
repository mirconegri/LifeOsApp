
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { COLORS } from '../config/colors';
import { TYPE } from '../config/designSystem';

// trend: 'up' | 'down' | 'flat' — optional micro-arrow indicator
// icon: optional small inline emoji/icon label
export function StatCard({ label, value, sub, color = COLORS.accent, trend, icon }) {
  return (
    <Card elevation="flat" style={styles.card}>
      <View style={styles.labelRow}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={styles.label}>{label}</Text>
        {trend === 'up' && <Text style={styles.trendUp}>↑</Text>}
        {trend === 'down' && <Text style={styles.trendDown}>↓</Text>}
      </View>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {sub && <Text style={styles.sub}>{sub}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  card:  { flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  icon:  { fontSize: TYPE.caption, marginRight: 4 },
  label: { fontSize: TYPE.caption, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '600' },
  value: { fontSize: TYPE.heading, fontWeight: '700' },
  sub:   { fontSize: TYPE.meta, color: COLORS.textSub, marginTop: 2 },
  trendUp:   { fontSize: TYPE.micro, color: COLORS.green, marginLeft: 4 },
  trendDown: { fontSize: TYPE.micro, color: COLORS.red, marginLeft: 4 },
  trendFlat: { fontSize: TYPE.micro, color: COLORS.textSub, marginLeft: 4 },
});
