// src/components/DraggableList.js
//
// Long-press-to-reorder list using react-native-gesture-handler +
// react-native-reanimated. Each item owns its own GestureDetector and
// animated style, so scroll, tap, and drag never conflict.
//
// API: items, keyExtractor, renderItem, onReorder, itemHeight
//
// ── Every drag frame used to round-trip through the JS thread ──────────
// onUpdate called runOnJS(onDragMove) on EVERY pointer move, and that JS
// handler then wrote the offset back into a shared value. Each frame paid
// a UI→JS→UI hop, which is what made the row feel laggy and detached from
// the finger. The index math now runs entirely on the UI thread; JS is
// only notified when the target slot actually changes.
//
// ── The spring config was being silently discarded ─────────────────────
// The drop passed `{ ...MOTION.spring, useNativeDriver: true }`. That is
// the React Native `Animated` spring shape ({ speed, bounciness }) — NOT
// reanimated's. `withSpring` takes { damping, stiffness, mass } and drops
// unknown keys without complaining, so every drop ran on reanimated's
// defaults. SPRING below is the real thing.
//
// ── The row never actually snapped on drop ─────────────────────────────
// translateY was only applied while `isActive` was true, and the end
// handler cleared the active key immediately — so the spring back to 0 was
// computed but never rendered; the row just jumped to place. The style now
// keeps applying translateY while the value is non-zero, so the spring is
// visible until it settles.
//
// ── Haptics ────────────────────────────────────────────────────────────
// expo-haptics is a NATIVE module: on a dev client built before it was
// added, requiring it throws. It is therefore resolved lazily inside
// try/catch, falling back to React Native's Vibration. Dragging works
// either way; the finer feedback appears after the next native rebuild.
import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, Vibration } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing, runOnJS,
} from 'react-native-reanimated';
import { COLORS } from '../config/colors';

// How long the finger must rest before the row arms. 200ms is the native
// long-press feel; 280ms read as "nothing happened, I let go".
const LONG_PRESS_MS = 200;

const DRAG_SCALE   = 1.03;
const DRAG_OPACITY = 0.95;
const IDLE_SCALE   = 0.98;  // rows that are NOT being dragged, while a drag runs
const IDLE_MS      = 120;   // how quickly idle rows shrink/restore
const SHIFT_MS     = 150;   // reorder slide
const SPRING       = { damping: 20, stiffness: 300, mass: 0.8 };

let _haptics;
let _hapticsTried = false;
function loadHaptics() {
  if (_hapticsTried) return _haptics;
  _hapticsTried = true;
  try {
    _haptics = require('expo-haptics');
  } catch {
    _haptics = null;
  }
  return _haptics;
}

function hapticPickup() {
  const H = loadHaptics();
  if (H?.impactAsync) H.impactAsync(H.ImpactFeedbackStyle.Medium).catch(() => {});
  else Vibration.vibrate(12);
}

function hapticDrop() {
  const H = loadHaptics();
  if (H?.impactAsync) H.impactAsync(H.ImpactFeedbackStyle.Light).catch(() => {});
  else Vibration.vibrate(8);
}

function DraggableItem({
  item, index, isActive, renderItem, itemKey,
  itemHeight, count, dragActive,
  onDragStart, onMoveToIndex, onDragEnd,
}) {
  const translateY  = useSharedValue(0); // drag offset, owned by the UI thread
  const shiftY      = useSharedValue(0); // slide-in offset after a reorder
  const itemScale   = useSharedValue(1);
  const armed       = useSharedValue(false);
  const startIndex  = useSharedValue(0); // index the row was picked up from
  const targetIndex = useSharedValue(0); // slot the row is currently over

  // Animate the row from where it was to where it now is. The layout has
  // already moved it by (index - prev) * itemHeight, so feeding it the
  // opposite offset and decaying that to 0 produces the slide. Skipped for
  // the row under the finger: its position is driven by translateY instead,
  // and shifting it too would double-compensate.
  const prevIndexRef = useRef(index);
  useEffect(() => {
    const prev = prevIndexRef.current;
    prevIndexRef.current = index;
    if (prev === index || isActive) return;
    shiftY.value = (prev - index) * itemHeight;
    shiftY.value = withTiming(0, { duration: SHIFT_MS, easing: Easing.out(Easing.cubic) });
  }, [index, isActive, itemHeight, shiftY]);

  const animatedStyle = useAnimatedStyle(() => {
    // Also true while the drop spring is still running, so the row keeps
    // rendering its motion instead of snapping to the final slot.
    const dragging = isActive || translateY.value !== 0;
    return {
      transform: [
        { translateY: dragging ? translateY.value : shiftY.value },
        { scale: dragging ? itemScale.value : 1 - (1 - IDLE_SCALE) * dragActive.value },
      ],
      opacity: dragging ? DRAG_OPACITY : 1,
      zIndex: dragging ? 10 : 0,
    };
  });

  const panGesture = Gesture.Pan()
    // The gesture only arms if the press survives LONG_PRESS_MS without the
    // finger travelling past the pan's own activation distance — so a
    // vertical flick scrolls the list instead of picking the row up.
    .activateAfterLongPress(LONG_PRESS_MS)
    .onStart(() => {
      armed.value = true;
      startIndex.value = index;
      targetIndex.value = index;
      translateY.value = 0;
      shiftY.value = 0;
      itemScale.value = DRAG_SCALE;
      dragActive.value = withTiming(1, { duration: IDLE_MS });
      runOnJS(onDragStart)(itemKey);
      runOnJS(hapticPickup)();
    })
    .onUpdate((event) => {
      if (!armed.value) return;
      const h = itemHeight > 0 ? itemHeight : 1;
      const last = count - 1;
      let slot = startIndex.value + Math.round(event.translationY / h);
      if (slot < 0) slot = 0;
      else if (slot > last) slot = last;

      // Only cross the bridge when the slot actually changes — this is the
      // fix for the per-frame UI→JS→UI round trip.
      if (slot !== targetIndex.value) {
        targetIndex.value = slot;
        runOnJS(onMoveToIndex)(itemKey, slot);
      }
      // Slide compensation: as the list reflows under the finger, subtract
      // the distance it already moved so the row stays under the touch.
      translateY.value = event.translationY - (targetIndex.value - startIndex.value) * h;
    })
    .onEnd(() => {
      if (!armed.value) return;
      armed.value = false;
      itemScale.value = withSpring(1, SPRING);
      translateY.value = withSpring(0, SPRING);
      dragActive.value = withTiming(0, { duration: IDLE_MS });
      runOnJS(hapticDrop)();
      runOnJS(onDragEnd)(itemKey);
    });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[isActive && styles.activeBg, isActive && styles.activeShadow, animatedStyle]}>
        {renderItem(item, index, isActive)}
      </Animated.View>
    </GestureDetector>
  );
}

export function DraggableList({ items, keyExtractor, renderItem, onReorder, itemHeight = 60 }) {
  const [activeKey, setActiveKey] = useState(null);
  const [liveOrder, setLiveOrder] = useState(() => items.map(keyExtractor));
  const isDraggingRef = useRef(false);
  const liveOrderRef = useRef(liveOrder);
  liveOrderRef.current = liveOrder;

  // Shared, not state: every row reads it from the UI thread to shrink
  // itself while a sibling is lifted. Driving that from React state would
  // re-render the whole list on pickup and drop.
  const dragActive = useSharedValue(0);

  useEffect(() => {
    if (!isDraggingRef.current) {
      setLiveOrder(items.map(keyExtractor));
    }
  }, [items, keyExtractor]);

  const itemsByKey = {};
  items.forEach(it => { itemsByKey[keyExtractor(it)] = it; });

  const latestRef = useRef({ onReorder, itemsByKey });
  latestRef.current = { onReorder, itemsByKey };

  function handleDragStart(key) {
    isDraggingRef.current = true;
    setActiveKey(key);
  }

  // Called from the UI thread only when the slot under the finger changes,
  // not on every move.
  function handleMoveToIndex(key, slot) {
    const current = liveOrderRef.current;
    const from = current.indexOf(key);
    if (from === -1 || from === slot) return;
    const next = current.filter(k => k !== key);
    next.splice(slot, 0, key);
    liveOrderRef.current = next;
    setLiveOrder(next);
  }

  function handleDragEnd(key) {
    isDraggingRef.current = false;
    setActiveKey(null);
    // The spring back to 0 is already running on the UI thread; this only
    // has to hand the settled order to the caller.
    const { onReorder: settle, itemsByKey: map } = latestRef.current;
    settle(liveOrderRef.current.map(k => map[k]));
  }

  return (
    <Animated.View>
      {liveOrder.map((key) => {
        const item = itemsByKey[key];
        if (!item) return null;
        return (
          <DraggableItem
            key={key}
            itemKey={key}
            item={item}
            index={liveOrder.indexOf(key)}
            count={liveOrder.length}
            isActive={activeKey === key}
            renderItem={renderItem}
            itemHeight={itemHeight}
            dragActive={dragActive}
            onDragStart={handleDragStart}
            onMoveToIndex={handleMoveToIndex}
            onDragEnd={handleDragEnd}
          />
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  activeBg: {
    backgroundColor: COLORS.bg3,
    borderRadius: 12,
  },
  activeShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 14,
  },
});
