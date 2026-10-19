// src/ui/SpringPressable.js
//
// Touch primitive: a Pressable wrapped in an Animated.View that squashes on
// press, plus the app-wide haptic. Replaces TouchableOpacity for new code.
//
// Props
//   children, onPress, onLongPress, disabled
//   haptic         'selection' | 'light' | 'medium' | false (false = silent)
//   scaleTo        pressed scale (default motionConst.pressScale = .94)
//   style          style for the outer Animated.View (radius, overflow, layout)
//   contentStyle   style for the inner Pressable (padding, row layout)
//   ripple         Android ripple only; the caller owns the clipping radius
//   accessibilityLabel / accessibilityRole / accessibilityState / hitSlop
//   ...rest        forwarded to the inner Pressable
//
// Motion stays on the UI thread. Reduce Motion swaps between the two scales
// instantly instead of springing.

import React, { useCallback } from 'react';
import { Platform, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { M3, alpha } from '../config/colors';
import { SPRING, motionConst } from '../config/designSystem';
import { haptic as triggerHaptic } from './haptics';

// Ripple is a tint of the primary role; alpha() keeps it token-derived.
const RIPPLE_ALPHA = 0.16;

export function SpringPressable({
  children,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  disabled = false,
  haptic = 'selection',
  scaleTo = motionConst.pressScale,
  style,
  contentStyle,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityState,
  hitSlop,
  ripple = true,
  ...rest
}) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback((event) => {
    if (!disabled) {
      if (haptic !== false) triggerHaptic(haptic);
      scale.value = reduced ? scaleTo : withSpring(scaleTo, SPRING.fastSpatial);
    }
    // Callers may own an extra press animation (e.g. CtaButton's radius).
    if (typeof onPressIn === 'function') onPressIn(event);
  }, [disabled, haptic, reduced, scale, scaleTo, onPressIn]);

  const handlePressOut = useCallback((event) => {
    if (!disabled) {
      scale.value = reduced ? 1 : withSpring(1, SPRING.fastSpatial);
    }
    if (typeof onPressOut === 'function') onPressOut(event);
  }, [disabled, reduced, scale, onPressOut]);

  const androidRipple = ripple && Platform.OS === 'android'
    ? { color: alpha(M3.primary, RIPPLE_ALPHA), borderless: false }
    : undefined;

  const resolvedAccessibilityState = disabled
    ? { ...(accessibilityState || {}), disabled: true }
    : accessibilityState;

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        {...rest}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={contentStyle}
        hitSlop={hitSlop}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={resolvedAccessibilityState}
        android_ripple={androidRipple}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
