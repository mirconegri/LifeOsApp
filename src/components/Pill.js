// src/components/Pill.js
//
// Legacy pill/chip, restyled on M3 tonal pairs.
// Public API unchanged:
// 1. static display:  <Pill color="green">Done</Pill>
// 2. filter chip:     <Pill label="Active" selected onPress={...} />
// 3. outline:         <Pill outline color="accent">Label</Pill>
// Tap feedback now goes through SpringPressable (squash + tick).
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { M3, MODULE_TONES } from '../config/colors';
import { SHAPE } from '../config/designSystem';
import { TEXT } from '../ui/type';
import { SpringPressable } from '../ui/SpringPressable';

const PILL_COLORS = {
  green:  MODULE_TONES.journal,
  amber:  MODULE_TONES.finances,
  red:    { container: M3.errorContainer, on: M3.error },
  accent: { container: M3.primaryContainer, on: M3.primary },
  muted:  { container: M3.surfaceContainerHigh, on: M3.onSurfaceVariant },
};

export function Pill({ children, color = 'muted', label, selected, onPress, outline }) {
  const tone = PILL_COLORS[color] || PILL_COLORS.muted;

  if (outline) {
    return (
      <View style={[styles.pillOutline, { borderColor: tone.on }]}>
        <Text style={[TEXT.labelMedium, { color: tone.on }]}>{label ?? children}</Text>
      </View>
    );
  }

  if (onPress) {
    return (
      <SpringPressable
        onPress={onPress}
        haptic="selection"
        accessibilityLabel={typeof (label ?? children) === 'string' ? (label ?? children) : undefined}
        style={[
          styles.pillShell,
          selected
            ? { backgroundColor: tone.on }
            : { backgroundColor: M3.surfaceContainerHigh },
        ]}
        contentStyle={styles.pillContent}
      >
        <Text style={[TEXT.labelMedium, { color: selected ? tone.container : M3.onSurfaceVariant }]}>
          {label ?? children}
        </Text>
      </SpringPressable>
    );
  }

  return (
    <View style={[styles.pill, { backgroundColor: tone.container }]}>
      <Text style={[TEXT.labelMedium, { color: tone.on }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: SHAPE.full },
  pillShell:    { borderRadius: SHAPE.full },
  pillContent:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: SHAPE.full, alignItems: 'center', justifyContent: 'center' },
  pillOutline:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: SHAPE.full, borderWidth: 1, backgroundColor: 'transparent' },
});
