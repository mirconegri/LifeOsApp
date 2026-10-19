// src/ui/Reveal.js
//
// Mount-only entrance: content rises `distance` px while fading in. Used for
// list items (staggered by `index`) and for screen fade-through.
//
// Props
//   children   content to reveal
//   index      stagger position; delay = index * 45 ms unless `delay` is set
//   distance   rise distance in px (default motionConst.revealDistance = 28)
//   delay      explicit delay in ms, overrides the index stagger
//   style      style for the Animated.View
//
// The animation runs once, on mount. Nothing here reacts to later prop
// changes, so a re-render never replays it; remount (e.g. key={screen}) when
// a replay is wanted. Items beyond motionConst.revealMaxIndex and anything
// under Reduce Motion render static.

import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { SPRING, motionConst } from '../config/designSystem';

export function Reveal({
  children,
  index = 0,
  distance = motionConst.revealDistance,
  delay,
  style,
}) {
  const reduced = useReducedMotion();
  const shouldAnimate = !reduced && index <= motionConst.revealMaxIndex;

  const opacity = useSharedValue(shouldAnimate ? 0 : 1);
  const translateY = useSharedValue(shouldAnimate ? distance : 0);
  const startDelay = delay ?? index * motionConst.revealStagger;

  useEffect(() => {
    if (!shouldAnimate) return;
    opacity.value = withDelay(startDelay, withSpring(1, SPRING.defaultEffects));
    translateY.value = withDelay(startDelay, withSpring(0, SPRING.slowSpatial));
    // Mount only: `shouldAnimate`, `startDelay` and `distance` are snapshots
    // of the first render by design (see the header comment).
  }, []);

  // A mid-flight Reduce Motion toggle lands on the final frame instead of
  // cutting the animation off halfway. This never restarts the reveal.
  useEffect(() => {
    if (!reduced) return;
    opacity.value = 1;
    translateY.value = 0;
  }, [reduced, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}
