
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../config/colors';
import { RADIUS } from '../config/designSystem';

// elevation: 'flat' | 'raised' (default) | 'prominent'
//   flat      — flush with bg, no border → for chronologically dense lists
//   raised    — standard card surface    → default
//   prominent — accent-tinted border, for hero/target content
export function Card({ children, style, borderColor, elevation = 'raised' }) {
  const base =
    elevation === 'flat'      ? styles.cardFlat :
    elevation === 'prominent' ? styles.cardProminent :
    styles.card;
  return (
    <View style={[base, borderColor && { borderColor }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    borderRadius: RADIUS.card,
    padding: 16,
  },
  cardFlat: {
    backgroundColor: COLORS.bg3,
    borderWidth: 0,
    borderRadius: 14,
    padding: 14,
  },
  cardProminent: {
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: RADIUS.card + 2,
    padding: 16,
  },
});
