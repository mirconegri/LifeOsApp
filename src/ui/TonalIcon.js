// src/ui/TonalIcon.js
//
// Rounded square tonal icon tile: the module colour lives in the container,
// the glyph sits on it. No border, no shadow — depth is tonal layering.
//
// Usage:
//   <TonalIcon icon="wallet" tone={MODULE_TONES.finances} />
//   <TonalIcon icon="x" size={40} radius={14} />
//
// `tone` is a module tone object ({ container, on }); it defaults to home so
// a bare tile still renders. `color` overrides the glyph colour only.

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MODULE_TONES } from '../config/colors';
import { SHAPE } from '../config/designSystem';
import { Icon } from '../components/Icon';

const GLYPH_RATIO = 0.5;

export function TonalIcon({ icon, size = 56, tone = MODULE_TONES.home, color, radius = SHAPE.lg, style }) {
  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: tone.container,
        },
        style,
      ]}
    >
      <Icon name={icon} size={Math.round(size * GLYPH_RATIO)} color={color ?? tone.on} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
