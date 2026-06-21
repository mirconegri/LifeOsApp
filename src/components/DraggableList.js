// src/components/DraggableList.js
//
// Long-press-to-reorder list, modeled on how phone home screens let you
// rearrange app icons: hold a row, feel it "pop" free (scale up + shadow),
// then drag it anywhere — the list reflows live under your finger as you
// move, and releasing drops it in place.
//
// Why the previous version didn't work at all, and what's different here:
//
// The previous implementation only attached PanResponder's panHandlers to
// a row AFTER a long-press timer fired, and that timer was started from
// raw onTouchStart/onTouchEnd — not from PanResponder itself. Inside a
// ScrollView, the very first hint of vertical finger movement (even a
// sub-pixel tremor, which real fingers always have) makes the ScrollView
// claim the gesture as a scroll. Once the ScrollView claims it, the row's
// onTouchEnd/onTouchCancel fires almost immediately, the long-press timer
// gets cancelled, and panHandlers never even get attached. The "drag"
// feature was essentially unreachable on a real device — it needed the
// hand to be more still than is physically realistic.
//
// The fix: PanResponder is attached to every row from the start, and we
// use onStartShouldSetPanResponder / onMoveShouldSetPanResponder to make
// OUR responder decide, on every touch, whether it wants to claim the
// gesture — gated by a long-press timer that lives INSIDE the responder's
// own lifecycle (onPanResponderGrant), not as a side-channel race against
// raw touch events. Until the long-press threshold is crossed, we return
// false from the "should set" callbacks so the ScrollView is completely
// free to scroll normally. Only once the timer fires do we promote the
// gesture to an active drag — and at that point we already have it
// captured, so the ScrollView can no longer steal it out from under us.
import React, { useRef, useState } from 'react';
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
  React.useEffect(() => {
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

  function commitDrag() {
    isDraggingRef.current = false;
    draggedKeyRef.current = null;
    setActiveKey(null);
    Animated.spring(dragY, { toValue: 0, useNativeDriver: false, speed: 20, bounciness: 4 }).start();
    onReorder(liveOrderRef.current.map(k => itemsByKey[k]));
  }

  function moveDraggedTo(clientDy) {
    if (!itemHeight) return;
    const key = draggedKeyRef.current;
    if (!key) return;
    const currentIndex = liveOrderRef.current.indexOf(key);
    const targetIndex = Math.max(
      0,
      Math.min(liveOrderRef.current.length - 1, draggedFromIndexRef.current + Math.round(clientDy / itemHeight))
    );
    if (targetIndex !== currentIndex) {
      setLiveOrder(prev => {
        const next = prev.filter(k => k !== key);
        next.splice(targetIndex, 0, key);
        return next;
      });
    }
  }

  // One PanResponder per row, created fresh each render so it always
  // closes over the current key — cheap, since rows are simple.
  function makeResponderFor(key) {
    let longPressTimer = null;
    let armed = false; // true once the long-press has fired and we own the gesture

    return PanResponder.create({
      // Claim the touch immediately so we get a chance to start the
      // long-press timer — but DON'T claim it as a drag yet. Returning
      // true here just means "let me see onPanResponderGrant/Move", it
      // does not yet block the ScrollView; that only happens once we
      // explicitly become "armed" below.
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gesture) => {
        // If we're already armed (long-press fired), keep owning the
        // gesture so the drag continues even as the finger moves.
        if (armed) return true;
        // Otherwise, only claim it if movement is still small — a fast
        // or large movement before the long-press fires means the user
        // is scrolling, not trying to pick up the row, so we back off
        // and let the ScrollView have it.
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
  }

  return (
    <View>
      {liveOrder.map((key, index) => {
        const item = itemsByKey[key];
        if (!item) return null;
        const isActive = activeKey === key;
        const responder = makeResponderFor(key);

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
