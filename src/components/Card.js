// src/components/Card.js
//
// Legacy surface container, restyled on the M3 tokens.
// Depth now comes from tonal layering, not from borders or shadows; the
// public props are unchanged so unmigrated screens inherit the new look.
//
// elevation: 'flat' | 'raised' (default) | 'prominent'
//   flat      — lowest tonal layer, for dense repeated blocks
//   raised    — standard container surface (default)
//   prominent — highest tonal layer, for hero/target content
//
// `borderColor` is accepted for API compatibility and deliberately ignored:
// there are no hairline borders on cards anymore.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { M3 } from '../config/colors';
import { SHAPE } from '../config/designSystem';

export function Card({ children, style, borderColor, elevation = 'raised' }) {
  const base =
    elevation === 'flat'      ? styles.flat :
    elevation === 'prominent' ? styles.prominent :
    styles.card;
  return (
    <View style={[base, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: M3.surfaceContainer,
    borderRadius: SHAPE.xxxl,
    padding: 16,
  },
  flat: {
    backgroundColor: M3.surfaceContainerLow,
    borderRadius: SHAPE.xxl,
    padding: 14,
  },
  prominent: {
    backgroundColor: M3.surfaceContainerHigh,
    borderRadius: SHAPE.xxxl,
    padding: 16,
  },
});
