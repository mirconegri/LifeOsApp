// src/ui/HeroPager.js
//
// Horizontal "Focus" hero carousel for Home.
//
// Public API:
//   <HeroPager items onIndexChange autoAdvance style />
//     items: [{ key, title, subtitle, icon, tone: { container, on }, onPress, accessory }]
//     accessory is an optional ReactNode rendered top-right (e.g. WavyProgress).
//
//   <HeroCard item width offset />
//     Exported for previews and the dev kit. `offset` is an optional Reanimated
//     shared value in card-index units; HeroPager passes it so the decorative
//     blob drifts while paging. Omit it for a static card.
//
// Motion: everything per-frame runs on the UI thread. The only state is the
// discrete active index (it drives the dots' target width); scroll offset never
// goes through React. Reduce Motion freezes page scale, blob drift and
// auto-advance.
//
// The pager is horizontal-only on purpose: never nest a vertical scroll view
// inside it (Home owns the vertical scroll).

import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { M3, MODULE_TONES, alpha } from '../config/colors';
import { motionConst, SHAPE, SPACING, SPRING } from '../config/designSystem';
import { Icon } from '../components/Icon';
import { SpringPressable } from './SpringPressable';
import { Blob } from './Blob';
import { TEXT } from './type';

const PAGE_PADDING = 16;
const PAGE_GAP = 10;
const CARD_HEIGHT = 176;
const BLOB_SIZE = 190;
const BLOB_DRIFT = 90;
const BLOB_ROTATE = 40;
const DOT_HEIGHT = 6;
const DOT_ROW_BOTTOM = 12;
const DOT_GAP = 6;
const SCALE_LOSS = 0.07;

const DOT_ROW_HEIGHT = DOT_HEIGHT + DOT_ROW_BOTTOM * 2;

/** One page of the pager: holds the per-card scroll offset and the scale style. */
function HeroPage({ item, index, width, snap, scrollX, reduceMotion }) {
  const offset = useDerivedValue(() => scrollX.value / snap - index);

  const pageStyle = useAnimatedStyle(() => {
    if (reduceMotion) return { transform: [{ scale: 1 }] };
    const off = scrollX.value / snap - index;
    return { transform: [{ scale: 1 - Math.abs(off) * SCALE_LOSS }] };
  });

  return (
    <Animated.View style={[styles.page, { width }, pageStyle]}>
      <HeroCard item={item} width={width} offset={offset} />
    </Animated.View>
  );
}

export function HeroCard({ item, width, offset }) {
  const reduceMotion = useReducedMotion();
  const tone = item.tone ?? MODULE_TONES.home;

  // The blob wrapper drifts and slowly turns as the card leaves the centre.
  const blobStyle = useAnimatedStyle(() => {
    const raw = offset != null ? offset.value : 0;
    const v = reduceMotion ? 0 : raw;
    return {
      transform: [
        { translateX: v * BLOB_DRIFT },
        { rotate: `${v * BLOB_ROTATE}deg` },
      ],
    };
  });

  return (
    <SpringPressable
      onPress={item.onPress}
      haptic="selection"
      accessibilityRole="button"
      accessibilityLabel={
        item.subtitle ? `${item.title}. ${item.subtitle}` : item.title
      }
      style={[styles.card, { width, backgroundColor: tone.container }]}
      contentStyle={styles.cardContent}
    >
      <Animated.View style={[styles.blobWrap, blobStyle]} pointerEvents="none">
        <Blob preset="cookie12" size={BLOB_SIZE} color={alpha(tone.on, 0.08)} />
      </Animated.View>

      <View style={styles.cardTop}>
        <View style={[styles.iconTile, { backgroundColor: alpha(tone.on, 0.14) }]}>
          <Icon name={item.icon} size={28} color={tone.on} />
        </View>
        {item.accessory ? <View style={styles.accessory}>{item.accessory}</View> : null}
      </View>

      <View>
        <Text style={[TEXT.titleMedium, { color: tone.on }]} numberOfLines={1}>
          {item.title}
        </Text>
        {item.subtitle ? (
          <Text style={[TEXT.bodySmall, styles.subtitle, { color: tone.on }]} numberOfLines={1}>
            {item.subtitle}
          </Text>
        ) : null}
      </View>
    </SpringPressable>
  );
}

/** Pager dot: the active width springs open, the rest stay short. */
function Dot({ active, reduceMotion }) {
  const target = active ? motionConst.dotActive : motionConst.dotInactive;
  const width = useSharedValue(target);

  useEffect(() => {
    width.value = reduceMotion ? target : withSpring(target, SPRING.fastSpatial);
  }, [width, target, reduceMotion]);

  const dotStyle = useAnimatedStyle(() => ({ width: width.value }));

  return (
    <Animated.View
      style={[
        styles.dot,
        dotStyle,
        { backgroundColor: active ? M3.primary : M3.outlineVariant },
      ]}
    />
  );
}

export function HeroPager({ items = [], onIndexChange, autoAdvance = true, style }) {
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.max(0, windowWidth - PAGE_PADDING * 2);
  const snap = width + PAGE_GAP;

  const reduceMotion = useReducedMotion();
  const scrollRef = useRef(null);
  const scrollX = useSharedValue(0);
  const draggingRef = useRef(false);
  const indexRef = useRef(0);
  const onIndexChangeRef = useRef(onIndexChange);
  onIndexChangeRef.current = onIndexChange;
  const [index, setIndex] = useState(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const commitIndex = (next) => {
    if (items.length === 0) return;
    const clamped = Math.max(0, Math.min(items.length - 1, next));
    if (clamped === indexRef.current) return;
    indexRef.current = clamped;
    setIndex(clamped);
    if (onIndexChangeRef.current) onIndexChangeRef.current(clamped);
  };

  // Auto-advance is a plain JS interval: it only fires every 5.5 s and calls
  // the native scrollTo, so no per-frame work and no worklet timer. The index is
  // committed optimistically because a programmatic animated scroll does not
  // always emit momentum events on Android; the dots must follow the glide.
  useEffect(() => {
    if (!autoAdvance || reduceMotion || items.length < 2) return undefined;
    const id = setInterval(() => {
      if (draggingRef.current) return;
      const next = (indexRef.current + 1) % items.length;
      const node = scrollRef.current;
      if (node && typeof node.scrollTo === 'function') {
        node.scrollTo({ x: next * snap, animated: true });
        commitIndex(next);
      }
    }, motionConst.heroIntervalMs);
    return () => clearInterval(id);
  }, [autoAdvance, reduceMotion, items.length, snap, index]);

  // A shrinking list must not leave the index past the end. `commitIndex`
  // deliberately stays out of the deps: it only reads refs and state.
  useEffect(() => {
    if (indexRef.current > items.length - 1) {
      commitIndex(Math.max(0, items.length - 1));
    }
  }, [items.length]);

  if (items.length === 0) return null;

  const handleDragBegin = () => {
    draggingRef.current = true;
  };

  const handleScrollSettled = (event) => {
    draggingRef.current = false;
    commitIndex(Math.round(event.nativeEvent.contentOffset.x / snap));
  };

  return (
    <View style={[styles.container, style]}>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        snapToInterval={snap}
        decelerationRate="fast"
        disableIntervalMomentum
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={handleDragBegin}
        onScrollEndDrag={handleScrollSettled}
        onMomentumScrollEnd={handleScrollSettled}
        contentContainerStyle={styles.track}
      >
        {items.map((item, i) => (
          <HeroPage
            key={item.key ?? i}
            item={item}
            index={i}
            width={width}
            snap={snap}
            scrollX={scrollX}
            reduceMotion={reduceMotion}
          />
        ))}
      </Animated.ScrollView>

      <View style={styles.dots} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {items.map((item, i) => (
          <Dot key={item.key ?? i} active={i === index} reduceMotion={reduceMotion} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Room for the centred dot row underneath the cards.
    paddingBottom: DOT_ROW_HEIGHT,
  },
  track: {
    paddingHorizontal: PAGE_PADDING,
    gap: PAGE_GAP,
  },
  page: {
    // The card fills the page and is scaled from its centre.
    alignItems: 'stretch',
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: SHAPE.xxxl,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  blobWrap: {
    position: 'absolute',
    right: -26,
    bottom: -34,
    width: BLOB_SIZE,
    height: BLOB_SIZE,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  iconTile: {
    width: 56,
    height: 56,
    borderRadius: SHAPE.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessory: {
    marginLeft: SPACING.sm,
  },
  subtitle: {
    marginTop: 2,
    opacity: 0.85,
  },
  dots: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: DOT_ROW_BOTTOM,
    height: DOT_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DOT_GAP,
  },
  dot: {
    height: DOT_HEIGHT,
    borderRadius: SHAPE.full,
  },
});
