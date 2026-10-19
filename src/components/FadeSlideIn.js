// src/components/FadeSlideIn.js
//
// Generic "this just appeared" entrance: fades in while sliding up a few
// pixels, on the UI thread via Reanimated.
//
// Mount animation, not a continuous transition: the caller remounts when
// the effect should replay (e.g. <FadeSlideIn key={screen}>). Public API
// unchanged: children, style, duration, distance, delay.
import React from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing, useReducedMotion,
} from 'react-native-reanimated';
import { MOTION } from '../config/designSystem';

export function FadeSlideIn({
  children,
  style,
  duration = MOTION.normal,
  distance = 14,
  delay = 0,
}) {
  const reduce = useReducedMotion();
  const progress = useSharedValue(0);

  React.useEffect(() => {
    if (reduce) {
      progress.value = 1;
      return;
    }
    progress.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) }),
    );
  }, [reduce, duration, delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * distance }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}
