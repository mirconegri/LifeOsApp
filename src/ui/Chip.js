// src/ui/Chip.js
//
// Filter / toggle chip (40 high, full radius). With `onPress` it is a
// SpringPressable (selection tick, .94 squash); without it, a static display
// chip. No border: selection is a tonal fill swap.
//
// Usage:
//   <Chip label="All" selected onPress={...} />
//   <Chip label="Overdue" tone="tertiary" icon="alert-triangle" />
//
// `tone` is the M3 role used when selected (default 'primary'); its matching
// "on" role is derived automatically (e.g. secondaryContainer ->
// onSecondaryContainer) and falls back to onPrimary for unknown roles.
//
// Sizing/padding live in the pressable's content slot so the whole chip —
// padding included — is a touch target.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { M3 } from '../config/colors';
import { SHAPE, SPACING } from '../config/designSystem';
import { Icon } from '../components/Icon';
import { SpringPressable } from './SpringPressable';
import { TEXT } from './type';

const CHIP_HEIGHT = 40;
const ICON_SIZE = 18;

function onRoleFor(name) {
  if (typeof name !== 'string' || name.length === 0) return M3.onPrimary;
  const onName = `on${name.charAt(0).toUpperCase()}${name.slice(1)}`;
  return M3[onName] ?? M3.onPrimary;
}

export function Chip({ label, selected = false, onPress, icon, tone = 'primary', style, disabled = false, accessibilityLabel }) {
  const selectedFill = M3[tone] ?? M3.primary;
  const selectedInk = onRoleFor(tone);
  const background = selected ? selectedFill : M3.surfaceContainerHigh;
  const ink = selected ? selectedInk : M3.onSurfaceVariant;

  const content = (
    <>
      {icon ? (
        <View style={styles.icon}>
          <Icon name={icon} size={ICON_SIZE} color={ink} />
        </View>
      ) : null}
      <Text style={[TEXT.labelLarge, { color: ink }]} numberOfLines={1}>
        {label}
      </Text>
    </>
  );

  const boxStyle = [styles.box, { backgroundColor: background }, disabled && styles.disabled, style];

  if (!onPress) {
    return (
      <View style={[boxStyle, styles.content]} accessibilityLabel={accessibilityLabel ?? label}>
        {content}
      </View>
    );
  }

  return (
    <SpringPressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      haptic="selection"
      scaleTo={0.94}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected, disabled }}
      style={boxStyle}
      contentStyle={styles.content}
    >
      {content}
    </SpringPressable>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: SHAPE.full,
    overflow: 'hidden',
  },
  content: {
    height: CHIP_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  icon: {
    marginRight: 8,
  },
  disabled: {
    opacity: 0.38,
  },
});
