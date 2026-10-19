// src/ui/CtaButton.js
//
// Primary action button: 56 high, full round, springs to a squircle radius
// (28 -> 14) plus a .97 scale while held.
//
// Usage:
//   <CtaButton label="Save" onPress={...} />
//   <CtaButton label="Delete" variant="destructive" loading={busy} />
//   <CtaButton label="Cancel" variant="text" />
//
// Variants: filled (primary), tonal (secondaryContainer), destructive
// (errorContainer), text (transparent/primary). `loading` swaps the label for
// an ActivityIndicator in the variant's foreground colour and blocks presses;
// `disabled` also dims the button. Optional leading icon (18). No border, no
// shadow.
//
// The wrapper owns the scale and the radius morph because the fill lives on
// it; SpringPressable's own squash is neutralised with scaleTo={1} so the
// button does not scale twice. Its onPressIn/onPressOut props drive the morph.

import React from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { M3 } from '../config/colors';
import { SPACING, SPRING } from '../config/designSystem';
import { Icon } from '../components/Icon';
import { SpringPressable } from './SpringPressable';
import { TEXT_EMPHASIZED } from './type';

const HEIGHT = 56;
const REST_RADIUS = HEIGHT / 2;
const PRESSED_RADIUS = 14;
const PRESS_SCALE = 0.97;
const ICON_SIZE = 18;

const VARIANTS = {
  filled: { background: M3.primary, foreground: M3.onPrimary },
  tonal: { background: M3.secondaryContainer, foreground: M3.onSecondaryContainer },
  destructive: { background: M3.errorContainer, foreground: M3.onErrorContainer },
  text: { background: 'transparent', foreground: M3.primary },
};

export function CtaButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'filled',
  icon,
  style,
  accessibilityLabel,
}) {
  const reduceMotion = useReducedMotion();
  const pressed = useSharedValue(0);
  const palette = VARIANTS[variant] ?? VARIANTS.filled;
  const blocked = disabled || loading;

  const press = (down) => {
    const target = down ? 1 : 0;
    pressed.value = reduceMotion ? target : withSpring(target, SPRING.fastSpatial);
  };

  const pressStyle = useAnimatedStyle(() => ({
    borderRadius: REST_RADIUS + (PRESSED_RADIUS - REST_RADIUS) * pressed.value,
    transform: [{ scale: 1 - (1 - PRESS_SCALE) * pressed.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.shell,
        { backgroundColor: palette.background },
        pressStyle,
        disabled && styles.disabled,
        style,
      ]}
    >
      <SpringPressable
        onPress={blocked ? undefined : onPress}
        onPressIn={blocked ? undefined : () => press(true)}
        onPressOut={() => press(false)}
        haptic="medium"
        scaleTo={1}
        disabled={blocked}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: blocked, busy: loading }}
        style={styles.target}
        contentStyle={styles.targetContent}
      >
        {loading ? (
          <ActivityIndicator color={palette.foreground} size="small" />
        ) : (
          <>
            {icon ? (
              <Icon name={icon} size={ICON_SIZE} color={palette.foreground} />
            ) : null}
            <Text
              style={[TEXT_EMPHASIZED.labelLarge, { color: palette.foreground }, icon && styles.labelWithIcon]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </>
        )}
      </SpringPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    height: HEIGHT,
    overflow: 'hidden',
  },
  // Outer slot of SpringPressable: fill the shell so the whole button is a
  // touch target.
  target: {
    flex: 1,
  },
  targetContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  labelWithIcon: {
    marginLeft: 8,
  },
  disabled: {
    opacity: 0.38,
  },
});
