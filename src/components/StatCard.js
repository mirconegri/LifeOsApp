
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { COLORS } from '../config/colors';

export function StatCard({ label, value, sub, color = COLORS.accent }) {
  return (
    <Card style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {sub && <Text style={styles.sub}>{sub}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  card:  { flex: 1 },
  label: { fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 5, fontWeight: '600' },
  value: { fontSize: 22, fontWeight: '700' },
  sub:   { fontSize: 11, color: COLORS.textSub, marginTop: 2 },
});

