// src/ui/AppScrollView.js
//
// The one screen-level scroll container.
//
// Props (all normal ScrollView props are forwarded too):
//   children, contentContainerStyle, style
//   onScroll                optional caller handler, bridged to JS (discrete work)
//   scrollEventThrottle     16 by default
//   topInset                true -> paddingTop = insets.top + 8
//   bottomInset             true -> paddingBottom = 64 + 12 + insets.bottom + 16
//   horizontal              false by default
//   keyboardShouldPersistTaps  'always' by default (explicit override allowed)
//   showsVerticalScrollIndicator  false by default
//
// Runs on Reanimated's Animated.ScrollView and feeds scrollState's shared
// values on the UI thread. The content container owns the safe-area padding so
// the scroll content (not the shell) is inset; the bottom reservation keeps
// every row clear of the floating nav.
//
// The caller's onScroll receives an RN-shaped event ({ nativeEvent: ... })
// because Reanimated hands worklets the native payload directly. It is meant
// for discrete work; continuous values belong in shared values.

import React, { useCallback, useLayoutEffect, useRef } from 'react';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNavScrollHandler, useScrollReset } from './scrollState';

// Floating nav reservation: pill 64 + gap 12 + system bar + breathing room.
const NAV_RESERVATION = 64;
const NAV_GAP = 12;
const SCREEN_BOTTOM_GAP = 16;
const TOP_GAP = 8;

export const AppScrollView = React.forwardRef(function AppScrollView({
  children,
  contentContainerStyle,
  style,
  onScroll,
  scrollEventThrottle = 16,
  topInset = true,
  bottomInset = true,
  horizontal = false,
  keyboardShouldPersistTaps = 'always',
  showsVerticalScrollIndicator = false,
  ...rest
}, ref) {
  const insets = useSafeAreaInsets();
  const resetScroll = useScrollReset();

  // Always forward the latest caller handler without rebuilding the worklet.
  const onScrollRef = useRef(onScroll);
  onScrollRef.current = onScroll;

  const forwardScroll = useCallback((event) => {
    onScrollRef.current?.({ nativeEvent: event });
  }, []);

  // When no caller handler exists there is no reason to cross the bridge on
  // every frame, so the merged worklet is only wired when it is needed.
  const scrollHandler = useNavScrollHandler(
    typeof onScroll === 'function' ? forwardScroll : undefined,
  );

  useLayoutEffect(() => {
    // A freshly mounted screen starts at offset 0. Clear signals left behind
    // by the previous screen so a hidden nav cannot stay off-screen until the
    // first scroll event arrives. Layout effect: no one-frame flash on back.
    resetScroll();
  }, [resetScroll]);

  const insetStyle = {
    paddingTop: topInset ? insets.top + TOP_GAP : 0,
    paddingBottom: bottomInset
      ? NAV_RESERVATION + NAV_GAP + insets.bottom + SCREEN_BOTTOM_GAP
      : 0,
  };

  return (
    <Animated.ScrollView
      ref={ref}
      style={style}
      contentContainerStyle={[insetStyle, contentContainerStyle]}
      onScroll={scrollHandler}
      scrollEventThrottle={scrollEventThrottle}
      horizontal={horizontal}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      {...rest}
    >
      {children}
    </Animated.ScrollView>
  );
});
