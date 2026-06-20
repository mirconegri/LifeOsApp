// src/components/DraggableList.js
//
// Long-press-to-reorder list. Renders `items` via `renderItem`, and lets the
// user pick up a row by holding it, then drag up/down to reorder; releasing
// commits the new order via `onReorder(newItems)`.
//
// Design notes (why PanResponder instead of a drag library):
// - No new native dependency. This project's package.json already declares
//   a couple of unused libraries (e.g. @react-navigation/*) that turned out
//   to be dead weight; adding another native module that needs linking is
//   exactly the kind of thing that broke Expo Go before. PanResponder is
//   pure JS, ships with React Native, always works in Expo Go.
// - Long-press gate (350ms) before a drag can start. Without this, any
//   vertical touch-move would be interpreted as a drag attempt and break
//   normal list scrolling — long-press is what tells the list "the user
//   means to reorder, not scroll".
// - Only one row can be "active" (lifted) at a time, tracked by index in
//   state, not by identity — this keeps the reorder math in terms of array
//   positions, which is what the parent's data array also uses.
import React, { useRef, useState } from 'react';
import { View, PanResponder, Animated, StyleSheet } from 'react-native';
import { COLORS } from '../config/colors';

const ROW_LIFT_SCALE = 1.03;
const LONG_PRESS_MS = 350;

export function DraggableList({ items, keyExtractor, renderItem, onReorder, itemHeight }) {
  // activeIndex: which row is currently picked up (or null)
  const [activeIndex, setActiveIndex] = useState(null);
  const [order, setOrder] = useState(items.map((_, i) => i)); // index permutation while dragging
  const dragY = useRef(new Animated.Value(0)).current;
  const startIndexRef = useRef(null);
  const longPressTimer = useRef(null);
  const draggingRef = useRef(false);

  // Keep `order` in sync whenever the parent's items array changes length
  // or identity (e.g. after a delete, or after the reorder is committed).
  React.useEffect(() => {
    setOrder(items.map((_, i) => i));
  }, [items.length]);

  function makeResponderFor(index) {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: () => false,

      // We gate the actual drag behind a long-press timer fired from
      // onPressIn-style handling in the row wrapper below, not here —
      // PanResponder itself only takes over once `draggingRef` is true.
      onPanResponderMove: (evt, gesture) => {
        if (!draggingRef.current || startIndexRef.current !== index) return;
        dragY.setValue(gesture.dy);

        if (itemHeight) {
          const offset = Math.round(gesture.dy / itemHeight);
          const from = startIndexRef.current;
          const to = Math.max(0, Math.min(items.length - 1, from + offset));
          if (to !== order.indexOf(from)) {
            setOrder(prev => {
              const next = prev.filter(i => i !== from);
              next.splice(to, 0, from);
              return next;
            });
          }
        }
      },
      onPanResponderRelease: () => {
        if (draggingRef.current && startIndexRef.current === index) {
          commitDrag();
        }
      },
      onPanResponderTerminate: () => {
        if (draggingRef.current && startIndexRef.current === index) {
          commitDrag();
        }
      },
    });
  }

  function commitDrag() {
    draggingRef.current = false;
    startIndexRef.current = null;
    setActiveIndex(null);
    Animated.timing(dragY, { toValue: 0, duration: 150, useNativeDriver: false }).start();
    const reordered = order.map(i => items[i]);
    onReorder(reordered);
  }

  function startLongPress(index) {
    clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      draggingRef.current = true;
      startIndexRef.current = index;
      setActiveIndex(index);
    }, LONG_PRESS_MS);
  }

  function cancelLongPress() {
    clearTimeout(longPressTimer.current);
    // If a drag never actually started, there's nothing to commit.
    if (!draggingRef.current) {
      startIndexRef.current = null;
    }
  }

  const displayOrder = activeIndex !== null ? order : items.map((_, i) => i);

  return (
    <View>
      {displayOrder.map((originalIndex) => {
        const item = items[originalIndex];
        const isActive = activeIndex === originalIndex;
        const responder = makeResponderFor(originalIndex);

        return (
          <Animated.View
            key={keyExtractor(item)}
            style={[
              isActive && styles.activeRow,
              isActive && {
                transform: [{ translateY: dragY }, { scale: ROW_LIFT_SCALE }],
                zIndex: 10,
              },
            ]}
            {...(isActive ? responder.panHandlers : {})}
            onTouchStart={() => startLongPress(originalIndex)}
            onTouchEnd={cancelLongPress}
            onTouchCancel={cancelLongPress}
          >
            {renderItem(item, originalIndex, isActive)}
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  activeRow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 12,
    backgroundColor: COLORS.bg3,
    borderRadius: 12,
  },
});
