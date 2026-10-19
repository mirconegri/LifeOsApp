// src/ui/scrollState.js
//
// UI-thread scroll signals for the floating shell.
//
// App.js wraps the app in <ScrollProvider> once (Phase 2). Every screen-level
// AppScrollView writes into the same two shared values and the single
// FloatingNav reads them. Scroll offset and nav visibility therefore never
// pass through React state, so scrolling does not re-render App.js.
//
// Public contract:
//   <ScrollProvider>{children}</ScrollProvider>
//   useScrollSignals() -> { scrollY, navHidden }   Reanimated shared values
//   useNavScrollHandler(extraOnScroll?) -> handler for Animated.ScrollView
//
// Rules: hide after 4 px of downward travel past y=80; show after 4 px of
// upward travel, or at y<=8. The spring is applied here, where navHidden is
// written, so consumers only map the value to translateY (never twice).
//
// No shared value is created at module scope: Fast Refresh and remounts stay
// clean, and the provider is the single owner.

import React, { createContext, useCallback, useContext, useMemo } from 'react';
import {
  runOnJS,
  useAnimatedScrollHandler,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { SPRING } from '../config/designSystem';

// Direction hysteresis, in logical pixels.
const HIDE_AFTER_DOWN_PX = 4;
const SHOW_AFTER_UP_PX = 4;
const HIDE_PAST_Y = 80;
const SHOW_AT_TOP_Y = 8;

const ScrollContext = createContext(null);

function useScrollContext() {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error(
      'Scroll signals are not available. Wrap the app in <ScrollProvider> from src/ui/scrollState.js before rendering AppScrollView or FloatingNav.',
    );
  }
  return context;
}

/**
 * Owns the shell's Reanimated shared values.
 * Children: the part of the tree that scrolls or shows the floating nav.
 */
export function ScrollProvider({ children }) {
  // Public signals.
  const scrollY = useSharedValue(0);
  const navHidden = useSharedValue(0);

  // Internal anchors.
  // lastY is the offset the last decision was taken from, so even a slow drag
  // accumulates to the 4 px threshold instead of comparing frame to frame.
  // navTarget avoids restarting the spring while it is already travelling to
  // the same value.
  const lastY = useSharedValue(0);
  const navTarget = useSharedValue(0);

  // Return the shell to its initial, visible state. AppScrollView calls this
  // on mount so a screen change never inherits the previous screen's hidden
  // nav (or its stale direction anchor).
  const reset = useCallback(() => {
    scrollY.value = 0;
    navHidden.value = 0;
    lastY.value = 0;
    navTarget.value = 0;
  }, [scrollY, navHidden, lastY, navTarget]);

  const value = useMemo(
    () => ({ scrollY, navHidden, lastY, navTarget, reset }),
    [scrollY, navHidden, lastY, navTarget, reset],
  );

  return <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>;
}

/**
 * The read-side API. Throws outside the provider with a clear message.
 * @returns {{ scrollY: import('react-native-reanimated').SharedValue<number>,
 *             navHidden: import('react-native-reanimated').SharedValue<number> }}
 */
export function useScrollSignals() {
  const { scrollY, navHidden } = useScrollContext();
  return { scrollY, navHidden };
}

/**
 * Stable function that puts scrollY / navHidden / the direction anchor back
 * to their initial (top, nav visible) values. Intended for a screen-level
 * AppScrollView mounting, not for scroll handlers.
 */
export function useScrollReset() {
  return useScrollContext().reset;
}

/**
 * Returns a Reanimated scroll handler for Animated.ScrollView.
 *
 * @param {(event: object) => void} [extraOnScroll] Optional caller handler.
 *   It is invoked on the JS thread through runOnJS and receives the native
 *   scroll payload (contentOffset, contentSize, layoutMeasurement, ...).
 *   Use it only for discrete work (refs, threshold flags, analytics), never
 *   to drive continuous animation — keep those on the UI thread.
 */
export function useNavScrollHandler(extraOnScroll) {
  const { scrollY, navHidden, lastY, navTarget } = useScrollContext();
  const reduceMotion = useReducedMotion();

  return useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        const y = event.contentOffset.y;
        scrollY.value = y;

        let next = navTarget.value;
        if (y <= SHOW_AT_TOP_Y) {
          // At (or above) the top the nav is always visible.
          next = 0;
          lastY.value = y;
        } else {
          const delta = y - lastY.value;
          if (delta > HIDE_AFTER_DOWN_PX && y > HIDE_PAST_Y) {
            next = 1;
            lastY.value = y;
          } else if (delta < -SHOW_AFTER_UP_PX) {
            next = 0;
            lastY.value = y;
          }
        }

        if (next !== navTarget.value) {
          navTarget.value = next;
          // The one and only hide/show spring. Under Reduce Motion the value
          // snaps and FloatingNav simply jumps.
          navHidden.value = reduceMotion
            ? next
            : withSpring(next, SPRING.defaultSpatial);
        }

        // Merged caller handler: bridged to JS for discrete work only.
        if (extraOnScroll) {
          runOnJS(extraOnScroll)(event);
        }
      },
    },
    [reduceMotion, extraOnScroll],
  );
}
