// src/components/TipBubble.js
//
// Restyled as an inverse-surface snackbar that floats above the nav pill.
// Public props are unchanged (visible, text, onDismiss, position), so the
// screens that used the old bubble do not change.
//
// Motion is Reanimated on the UI thread: a short fade + 12 px slide. The
// snackbar unmounts when hidden (the parent owns visible), so there is no
// exit animation to coordinate.
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { M3, alpha } from '../config/colors';
import { SHAPE } from '../config/designSystem';
import { TEXT } from '../ui/type';
import { SpringPressable } from '../ui/SpringPressable';

// Floating-nav reservation: pill + gap + bottom inset + breathing room.
const NAV_LIFT = 64 + 12 + 16;

export function TipBubble({ visible, text, onDismiss, position = 'bottom' }) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = reduceMotion
      ? 1
      : withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * (position === 'bottom' ? 12 : -12) }],
  }));

  if (!visible || !text) return null;

  const offset = position === 'bottom'
    ? { bottom: insets.bottom + NAV_LIFT }
    : { top: insets.top + 12 };

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      style={[styles.host, offset, animatedStyle]}
      pointerEvents="box-none"
    >
      <View style={styles.bubble}>
        <Text style={[TEXT.bodyMedium, styles.text]}>{text}</Text>
        <SpringPressable
          onPress={onDismiss}
          haptic="selection"
          style={styles.dismiss}
          contentStyle={styles.dismissContent}
          accessibilityLabel="Dismiss tip"
        >
          <Text style={[TEXT.labelLarge, styles.dismissText]}>Got it</Text>
        </SpringPressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 30,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: M3.onSurface,
    borderRadius: SHAPE.xl,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 8,
  },
  text: {
    flex: 1,
    color: M3.surface,
    marginRight: 8,
  },
  dismiss: {
    borderRadius: SHAPE.full,
    backgroundColor: alpha(M3.surface, 0.12),
  },
  dismissContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SHAPE.full,
  },
  dismissText: {
    color: M3.surface,
  },
});
