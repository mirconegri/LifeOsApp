import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../config/colors';

export function Card({ children, style, borderColor }) {
  return (
    <View style={[styles.card, borderColor && { borderColor }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
  },
});
