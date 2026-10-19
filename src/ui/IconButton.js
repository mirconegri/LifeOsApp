// src/ui/IconButton.js
//
// Circular tonal icon button (40 default). While held, the circle morphs
// toward a squircle (radius -> pressedRadius) and scales to .94; SpringPressable
// provides the ripple, the haptic and the scale slot.
//
// Usage:
//   <IconButton icon="plus" onPress={...} accessibilityLabel="Add task" />
//   <IconButton icon="x" size={40} tone={M3.surfaceContainerHighest} />
//
// `tone` is an M3 role name (background) or a literal colour; `color`
// overrides the glyph. Hit slop pads the touch target to at least 48 dp.
//
// Press state detail: SpringPressable owns onPressIn/onPressOut internally, so
// the shape morph is driven by the touch handlers it forwards to its Pressable
// (the touch target itself). The wrapper keeps scaleTo={1} so the squash is not
// applied twice.

import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { M3 } from '../config/colors';
import { SPRING } from '../config/designSystem';
import { Icon } from '../components/Icon';
import { SpringPressable } from './SpringPressable';

const MIN_TOUCH = 48;
const PRESS_SCALE = 0.94;

export function IconButton({
  icon,
  onPress,
  size = 40,
  tone = 'surfaceContainerHigh',
  color,
  radius,
  pressedRadius = 14,
  accessibilityLabel,
  style,
  disabled,
}) {
  const reduceMotion = useReducedMotion();
  const pressed = useSharedValue(0);
  const restRadius = radius ?? size / 2;
  const background = M3[tone] ?? tone;
  const glyph = color ?? M3.onSurfaceVariant;
  const pad = Math.max(0, (MIN_TOUCH - size) / 2);

  const press = (down) => {
    const target = down ? 1 : 0;
    pressed.value = reduceMotion ? target : withSpring(target, SPRING.fastSpatial);
  };

  const pressStyle = useAnimatedStyle(() => ({
    borderRadius: restRadius + (pressedRadius - restRadius) * pressed.value,
    transform: [{ scale: 1 - (1 - PRESS_SCALE) * pressed.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.shell,
        { width: size, height: size, backgroundColor: background },
        pressStyle,
        disabled && styles.disabled,
        style,
      ]}
    >
      <SpringPressable
        onPress={disabled ? undefined : onPress}
        onPressIn={disabled ? undefined : () => press(true)}
        onPressOut={() => press(false)}
        haptic="selection"
        scaleTo={1}
        disabled={disabled}
        hitSlop={{ top: pad, bottom: pad, left: pad, right: pad }}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: Boolean(disabled) }}
        style={styles.target}
        contentStyle={styles.target}
      >
        <Icon name={icon} size={Math.round(size * 0.5)} color={glyph} />
      </SpringPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  target: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.38,
  },
});
