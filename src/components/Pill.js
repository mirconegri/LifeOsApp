import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../config/colors';

const PILL_COLORS = {
  green:  { bg: COLORS.greenDim,   fg: COLORS.green  },
  amber:  { bg: COLORS.amberDim,   fg: COLORS.amber  },
  red:    { bg: COLORS.redDim,     fg: COLORS.red    },
  accent: { bg: COLORS.accentGlow, fg: COLORS.accent },
  muted:  { bg: COLORS.bg4,        fg: COLORS.textMuted },
};

export function Pill({ children, color = 'muted' }) {
  const { bg, fg } = PILL_COLORS[color] || PILL_COLORS.muted;
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  text: { fontSize: 11, fontWeight: '500' },
});
