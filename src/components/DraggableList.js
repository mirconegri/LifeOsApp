// src/components/DraggableList.js
//
// Long-press-to-reorder list, modeled on how phone home screens let you
// rearrange app icons: hold a row, feel it "pop" free (scale up + shadow),
// then drag it anywhere — the list reflows live under your finger as you
// move, and releasing drops it in place.
//
// ── Perf fix on top of the original gesture fix ──────────────────────────
// The previous version called `makeResponderFor(key)` inside the render
// loop, which created a BRAND NEW PanResponder object (with its own timer
// ref and `armed` flag) for every visible row on every single re-render of
// this component. Since this list typically lives inside a screen with
// other interactive state above it (e.g. JournalScreen toggling a
// checkbox triggers a re-render of the whole section), that meant every
// unrelated tap anywhere in the list was silently rebuilding every row's
// gesture recognizer — wasted allocation, and on a real device with many
// rows (seed data now ships dozens of tasks) this is a visible, measurable
// per-render cost, not an academic one.
//
// The fix: each row's PanResponder is created ONCE and cached by key in
// `responderCacheRef`, then reused across every render for as long as
// that key exists in the list. The risk with caching a closure long-term
// is the classic React stale-closure bug — a handler created on render #1
// would otherwise keep calling render #1's `onReorder`/`itemHeight`/
// `itemsByKey` forever, even after the parent re-renders with new props.
// `latestRef` solves that: every render updates `latestRef.current` with
// the freshest onReorder/itemHeight/itemsByKey, and the cached handlers
// read through that ref instead of closing over the values directly —
// the same pattern as `useLatestCallback`. The PanResponder object itself
// can be ancient; what it reads at call-time is always current.
import React, { useRef, useState, useEffect } from 'react';
import { View, PanResponder, Animated, StyleSheet, Vibration } from 'react-native';
import { COLORS } from '../config/colors';

const LONG_PRESS_MS = 280;
const MOVE_CANCEL_THRESHOLD = 6; // px of movement allowed before long-press fires, beyond which we assume the user is scrolling, not picking the row up

export function DraggableList({ items, keyExtractor, renderItem, onReorder, itemHeight }) {
  const [activeKey, setActiveKey] = useState(null);
  const [liveOrder, setLiveOrder] = useState(items.map(keyExtractor));

  const liveOrderRef = useRef(liveOrder);
  liveOrderRef.current = liveOrder;
  const isDraggingRef = useRef(false);

  // Keep liveOrder in sync with the parent's items whenever they change
  // from outside (add/delete/external update) and we're not mid-drag.
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLiveOrder(items.map(keyExtractor));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const dragY = useRef(new Animated.Value(0)).current;
  const draggedKeyRef = useRef(null);
  const draggedFromIndexRef = useRef(0);

  const itemsByKey = {};
  items.forEach(it => { itemsByKey[keyExtractor(it)] = it; });

  // Everything a cached PanResponder's handler needs that can legitimately
  // change between renders (onReorder identity, itemHeight, the current
  // itemsByKey lookup used at commit time) is funneled through this one
  // ref instead of being captured directly in the handler closures.
  const latestRef = useRef({ onReorder, itemHeight, itemsByKey });
  latestRef.current = { onReorder, itemHeight, itemsByKey };

  function commitDrag() {
    isDraggingRef.current = false;
    draggedKeyRef.current = null;
    setActiveKey(null);
    Animated.spring(dragY, { toValue: 0, useNativeDriver: false, speed: 20, bounciness: 4 }).start();
    const { onReorder: latestOnReorder, itemsByKey: latestItemsByKey } = latestRef.current;
    latestOnReorder(liveOrderRef.current.map(k => latestItemsByKey[k]));
  }

  function moveDraggedTo(clientDy) {
    const { itemHeight: latestItemHeight } = latestRef.current;
    if (!latestItemHeight) return;
    const key = draggedKeyRef.current;
    if (!key) return;
    const currentIndex = liveOrderRef.current.indexOf(key);
    const targetIndex = Math.max(
      0,
      Math.min(liveOrderRef.current.length - 1, draggedFromIndexRef.current + Math.round(clientDy / latestItemHeight))
    );
    if (targetIndex !== currentIndex) {
      setLiveOrder(prev => {
        const next = prev.filter(k => k !== key);
        next.splice(targetIndex, 0, key);
        return next;
      });
    }
  }

  // One PanResponder per row KEY, created lazily and cached forever (for
  // as long as that key exists in the list) instead of being rebuilt on
  // every render. Keys that disappear — item deleted — are pruned below
  // so the cache doesn't grow unbounded over a long session.
  const responderCacheRef = useRef(new Map());

  useEffect(() => {
    const liveKeys = new Set(items.map(keyExtractor));
    for (const cachedKey of responderCacheRef.current.keys()) {
      if (!liveKeys.has(cachedKey)) responderCacheRef.current.delete(cachedKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  function getResponderFor(key) {
    const cache = responderCacheRef.current;
    if (cache.has(key)) return cache.get(key);

    // Private mutable state for THIS row's gesture lifecycle. Because the
    // responder is created exactly once per key, this closure-scoped
    // state correctly persists across multiple separate press-and-drag
    // cycles on the same row, without being reset by unrelated re-renders
    // — which is exactly what a long-press timer needs.
    let longPressTimer = null;
    let armed = false;

    const responder = PanResponder.create({
      // Claim the touch immediately so we get a chance to start the
      // long-press timer — but DON'T claim it as a drag yet. Returning
      // true here just means "let me see onPanResponderGrant/Move", it
      // does not yet block the parent ScrollView; that only happens once
      // we explicitly become "armed" below.
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gesture) => {
        if (armed) return true;
        return Math.abs(gesture.dy) < MOVE_CANCEL_THRESHOLD && Math.abs(gesture.dx) < MOVE_CANCEL_THRESHOLD;
      },

      onPanResponderGrant: () => {
        clearTimeout(longPressTimer);
        longPressTimer = setTimeout(() => {
          armed = true;
          isDraggingRef.current = true;
          draggedKeyRef.current = key;
          draggedFromIndexRef.current = liveOrderRef.current.indexOf(key);
          dragY.setValue(0);
          setActiveKey(key);
          // Phone home-screen icon pickup has a haptic "pop" the instant
          // it's grabbed — Vibration.vibrate with a short duration is the
          // closest equivalent available without adding a haptics
          // dependency, and is a no-op on platforms/devices without
          // vibration hardware rather than throwing.
          Vibration.vibrate(10);
        }, LONG_PRESS_MS);
      },

      onPanResponderMove: (evt, gesture) => {
        if (!armed) return;
        dragY.setValue(gesture.dy);
        moveDraggedTo(gesture.dy);
      },

      onPanResponderRelease: () => {
        clearTimeout(longPressTimer);
        if (armed) {
          armed = false;
          commitDrag();
        }
      },
      onPanResponderTerminate: () => {
        clearTimeout(longPressTimer);
        if (armed) {
          armed = false;
          commitDrag();
        }
      },
    });

    cache.set(key, responder);
    return responder;
  }

  return (
    <View>
      {liveOrder.map((key, index) => {
        const item = itemsByKey[key];
        if (!item) return null;
        const isActive = activeKey === key;
        const responder = getResponderFor(key);

        return (
          <Animated.View
            key={key}
            style={[
              isActive && styles.activeRow,
              isActive && {
                transform: [{ translateY: dragY }, { scale: 1.04 }],
                zIndex: 10,
              },
            ]}
            {...responder.panHandlers}
          >
            {renderItem(item, index, isActive)}
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  activeRow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 14,
    backgroundColor: COLORS.bg3,
    borderRadius: 12,
  },
});
