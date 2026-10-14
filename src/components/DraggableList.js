// src/components/DraggableList.js
//
// Long-press-to-reorder list using react-native-gesture-handler +
// react-native-reanimated. Each item has its own GestureDetector +
// useAnimatedStyle, so scroll, tap, and drag never conflict.
//
// API: items, keyExtractor, renderItem, onReorder, itemHeight
import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, Vibration } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { COLORS } from '../config/colors';
import { MOTION } from '../config/designSystem';

const LONG_PRESS_MS = 280;

function DraggableItem({ item, index, isActive, renderItem, itemKey, itemHeight, onDragStart, onDragMove, onDragEnd }) {
  const translateY = useSharedValue(0);
  const itemScale = useSharedValue(1);
  const armedRef = useRef(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: isActive ? translateY.value : 0 },
      { scale: isActive ? itemScale.value : 1 },
    ],
    zIndex: isActive ? 10 : 0,
    ...(isActive ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 14,
      elevation: 14,
    } : {}),
  }));

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(LONG_PRESS_MS)
    .onStart(() => {
      armedRef.current = true;
      translateY.value = 0;
      itemScale.value = 1.04;
      onDragStart(itemKey);
      Vibration.vibrate(10);
    })
    .onUpdate((event) => {
      if (!armedRef.current) return;
      onDragMove(itemKey, event.translationY, translateY);
    })
    .onEnd(() => {
      if (!armedRef.current) return;
      armedRef.current = false;
      itemScale.value = withSpring(1, { ...MOTION.spring, useNativeDriver: true });
      onDragEnd(itemKey, translateY);
    });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[isActive && styles.activeBg, animatedStyle]}>
        {renderItem(item, index, isActive)}
      </Animated.View>
    </GestureDetector>
  );
}

export function DraggableList({ items, keyExtractor, renderItem, onReorder, itemHeight = 60 }) {
  const [activeKey, setActiveKey] = useState(null);
  const [liveOrder, setLiveOrder] = useState(items.map(keyExtractor));
  const isDraggingRef = useRef(false);
  const draggedFromIndexRef = useRef(0);
  const liveOrderRef = useRef(liveOrder);
  liveOrderRef.current = liveOrder;

  useEffect(() => {
    if (!isDraggingRef.current) {
      setLiveOrder(items.map(keyExtractor));
    }
  }, [items, keyExtractor]);

  const itemsByKey = {};
  items.forEach(it => { itemsByKey[keyExtractor(it)] = it; });

  const latestRef = useRef({ onReorder, itemHeight, itemsByKey });
  latestRef.current = { onReorder, itemHeight, itemsByKey };

  function handleDragStart(key) {
    isDraggingRef.current = true;
    draggedFromIndexRef.current = liveOrderRef.current.indexOf(key);
    setActiveKey(key);
  }

  function handleDragMove(key, translationY, translateYShared) {
    const { itemHeight: h } = latestRef.current;
    if (!h) return;
    const fromIndex = draggedFromIndexRef.current;
    const currentIndex = liveOrderRef.current.indexOf(key);
    const targetIndex = Math.max(
      0,
      Math.min(liveOrderRef.current.length - 1, fromIndex + Math.round(translationY / h))
    );
    if (targetIndex !== currentIndex) {
      const next = liveOrderRef.current.filter(k => k !== key);
      next.splice(targetIndex, 0, key);
      setLiveOrder(next);
    }
    const reflowOffset = (targetIndex - fromIndex) * h;
    translateYShared.value = translationY - reflowOffset;
  }

  function handleDragEnd(key, translateYShared) {
    isDraggingRef.current = false;
    setActiveKey(null);
    translateYShared.value = withSpring(0, { ...MOTION.spring, useNativeDriver: true });
    const { onReorder: latestOnReorder, itemsByKey: latestItemsByKey } = latestRef.current;
    latestOnReorder(liveOrderRef.current.map(k => latestItemsByKey[k]));
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
            isActive={activeKey === key}
            renderItem={renderItem}
            itemHeight={itemHeight}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
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
});