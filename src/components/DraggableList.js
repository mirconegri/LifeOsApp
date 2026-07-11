// src/components/DraggableList.js
//
// Long-press-to-reorder list, modeled on how phone home screens let you
// rearrange app icons: hold a row, feel it "pop" free (scale up + shadow),
// then drag it anywhere — the list reflows live under your finger as you
// move, and releasing drops it in place.
//
// ── Fix: drag tracked at ~2x finger speed once it crosses a row boundary ──
// The previous version drove the Animated transform directly off the raw
// gesture delta (`dragY.setValue(gesture.dy)`), while ALSO re-sorting
// `liveOrder` (which changes the dragged row's position in the rendered
// list by ±itemHeight every time it crosses a neighbor). Both of those
// move the row visually — the transform AND the reflow — and they stack:
// once the row has crossed one neighbor, the user has moved their finger
// `itemHeight` px, the reflow has already shifted the row `itemHeight` px,
// and the transform is ALSO still applying the full `itemHeight` raw
// delta on top of that. The row ends up roughly twice as far from the
// start point as the finger is, and the effect compounds with every row
// crossed — exactly the "drag feels 2x speed, especially going up"
// symptom. The fix: every time the reflow moves the row by N slots, the
// transform is reduced by N * itemHeight, so the transform only ever
// represents the leftover delta the reflow hasn't already accounted for.
// Total visual displacement = transform + reflow = gesture.dy, always.
//
// ── Perf fix (kept from the previous pass) ────────────────────────────────
// Each row's PanResponder is created ONCE and cached by key in
// `responderCacheRef`, then reused across renders, instead of being
// rebuilt on every render (which used to happen on every unrelated state
// change anywhere in the parent screen). `latestRef` avoids the resulting
// stale-closure problem: cached handlers read the freshest
// onReorder/itemHeight/itemsByKey through this ref instead of closing
// over render-time values directly.
//
// ── Android fix: nested checkbox/buttons not registering taps reliably ───
// `onShouldBlockNativeResponder: () => false` tells Android not to let
// this PanResponder's responder grant block a nested native touchable
// (e.g. the checkbox TouchableOpacity rendered inside a row) from getting
// its own touch events. This is the documented Android-only escape hatch
// for exactly this class of bug — an ancestor PanResponder intermittently
// swallowing taps meant for a child Touchable — and costs nothing on iOS,
// where the prop is a no-op.
//
// ── Fix: row "pops" on long-press, then snaps back the instant you move ──
// Symptom: hold a row, it scales up (armed = true fired), but as soon as
// the finger moves at all, it deselects instead of dragging. Cause: this
// responder was granted at touch-down, but nothing told it to REFUSE
// giving that grant back up. A parent ScrollView watches for vertical
// movement and, the moment it sees any, asks the current responder to
// terminate so IT can take over and scroll. Without
// `onPanResponderTerminationRequest`, RN's default answer to that request
// is "yes" — which fires `onPanResponderTerminate` on this responder,
// running the exact same cleanup as a normal release. So the row was
// being "released" by the OS one frame after being armed, every time,
// regardless of how deliberate the press was. The fix returns `false`
// once `armed` is true, so the parent can't reclaim the touch mid-drag;
// before arming, it still returns `true` so an ordinary scroll gesture on
// the list is never blocked.
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

  // Computes the target slot for the dragged row given the raw finger
  // delta, reflows liveOrder if the slot changed, and sets the Animated
  // transform to ONLY the portion of clientDy not already represented by
  // that reflow (see file header for why this compensation is needed).
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
    const reflowOffset = (targetIndex - draggedFromIndexRef.current) * latestItemHeight;
    dragY.setValue(clientDy - reflowOffset);
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
      // Android-only: don't let this responder's grant block a nested
      // native touchable (checkbox, trash button, etc.) from receiving
      // its own touch. See file header for the full rationale.
      onShouldBlockNativeResponder: () => false,
      // Without this, the row pops on long-press (armed = true) but
      // reverts the instant the finger moves: a parent ScrollView asks
      // to take the responder back as soon as it sees vertical movement,
      // and by default RN grants that request, which fires
      // onPanResponderTerminate — same cleanup path as a release, so the
      // row snaps back exactly as if it had been dropped. Refusing the
      // request (but only once armed; an unarmed press still yields
      // normally so plain scrolling isn't broken) is what actually keeps
      // the drag alive once it starts.
      onPanResponderTerminationRequest: () => !armed,

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
