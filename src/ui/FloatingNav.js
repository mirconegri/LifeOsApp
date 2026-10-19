// src/ui/FloatingNav.js
//
// The floating Material 3 Expressive bottom navigation pill.
//
// Props:
//   items    [{ id, label, icon }] — the 5 NAV entries with bottomNav: true
//   activeId id of the current screen
//   onSelect (id) => void
//   badges   { [id]: number } — a count > 0 renders an error badge
//   style    container override; the component positions itself absolutely
//
// Layout: the component is absolutely positioned above the bottom safe-area
// inset, centred, zIndex 20. App.js only renders it; it does not wrap it.
//
// Motion: hide/show reads the shared navHidden value written by scrollState
// (the spring lives there — this file maps it to translateY only). The active
// item expands its label with a spatial spring and pops its icon from .7 to 1.
// Everything runs on the UI thread; React state never changes while scrolling.
//
// Depth: this pill owns the only shadow in the app. No borders, no blur.

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { M3 } from '../config/colors';
import { SHAPE, SPRING, motionConst } from '../config/designSystem';
import { Icon } from '../components/Icon';
import { TEXT } from './type';
import { SpringPressable } from './SpringPressable';
import { useScrollSignals } from './scrollState';

const ITEM_HEIGHT = 52;
const PILL_PADDING = 6;
const ITEM_GAP = 2;
const ICON_SIZE = 22;
// Upper bound for the label width before the hidden measure text reports.
const LABEL_ESTIMATE = 96;
const LABEL_GAP = 8;
const BADGE_SIZE = 20;
const BADGE_BORDER = 2;

function NavItem({ item, active, badge, onSelect, reduceMotion }) {
  // Measured natural label width (shared so measurement never re-renders).
  const labelWidth = useSharedValue(LABEL_ESTIMATE);
  // The visible width: 0 when inactive, measured width when active.
  const expandedWidth = useSharedValue(active ? LABEL_ESTIMATE : 0);
  const iconScale = useSharedValue(active ? motionConst.navIconPop : 1);

  useEffect(() => {
    const target = active ? labelWidth.value : 0;
    expandedWidth.value = reduceMotion
      ? target
      : withSpring(target, SPRING.defaultSpatial);
  }, [active, reduceMotion, labelWidth, expandedWidth]);

  useEffect(() => {
    if (!active || reduceMotion) {
      iconScale.value = 1;
      return;
    }
    iconScale.value = motionConst.navIconPop;
    iconScale.value = withSpring(1, SPRING.fastSpatial);
  }, [active, reduceMotion, iconScale]);

  const labelStyle = useAnimatedStyle(() => ({
    width: expandedWidth.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const measureLabel = (event) => {
    const width = Math.ceil(event.nativeEvent.layout.width);
    // Ignore empty/clipped reports and avoid restarting the spring on
    // redundant layout passes.
    if (width <= 0 || width === labelWidth.value) return;
    labelWidth.value = width;
    if (active) {
      expandedWidth.value = reduceMotion
        ? width
        : withSpring(width, SPRING.defaultSpatial);
    }
  };

  const labelColor = active ? M3.onSecondaryContainer : M3.onSurfaceVariant;
  const iconColor = active ? M3.onSecondaryContainer : M3.onSurfaceVariant;

  return (
    <SpringPressable
      onPress={() => onSelect?.(item.id)}
      haptic="selection"
      style={styles.itemPressable}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={item.label}
    >
      {/* Visual layout lives on one explicit child so it does not depend on
          SpringPressable's internal content wrapper. */}
      <View style={[styles.itemContent, active && styles.itemActive]}>
        <View style={styles.iconWrap}>
          <Animated.View style={iconStyle}>
            <Icon name={item.icon} size={ICON_SIZE} color={iconColor} />
          </Animated.View>
          {badge > 0 ? (
            <View style={styles.badge}>
              <Text style={[TEXT.labelSmall, styles.badgeText]} numberOfLines={1}>
                {badge > 99 ? '99+' : badge}
              </Text>
            </View>
          ) : null}
        </View>

        <Animated.View style={[styles.labelWrap, labelStyle]}>
          <Text
            style={[TEXT.labelLarge, styles.label, { color: labelColor }]}
            numberOfLines={1}
          >
            {item.label}
          </Text>
        </Animated.View>

        {/* Invisible, unconstrained copy used only to measure the label. */}
        <Text
          style={[TEXT.labelLarge, styles.label, styles.labelMeasure]}
          numberOfLines={1}
          onLayout={measureLabel}
          accessible={false}
          importantForAccessibility="no"
        >
          {item.label}
        </Text>
      </View>
    </SpringPressable>
  );
}

export function FloatingNav({ items, activeId, onSelect, badges = {}, style }) {
  const insets = useSafeAreaInsets();
  const { navHidden } = useScrollSignals();
  const reduceMotion = useReducedMotion();

  const hiddenStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: navHidden.value * motionConst.navHideOffset }],
  }));

  if (!items || items.length === 0) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.container,
        { bottom: insets.bottom + 12 },
        hiddenStyle,
        style,
      ]}
    >
      <View style={styles.pill}>
        {items.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            active={item.id === activeId}
            badge={badges[item.id] || 0}
            onSelect={onSelect}
            reduceMotion={reduceMotion}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ITEM_GAP,
    padding: PILL_PADDING,
    borderRadius: SHAPE.full,
    backgroundColor: M3.surfaceContainerHigh,
    // The only shadow in the app.
    elevation: 8,
    shadowColor: M3.scrim,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
  },
  itemPressable: {
    borderRadius: SHAPE.full,
    overflow: 'hidden',
  },
  itemContent: {
    height: ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: SHAPE.full,
  },
  itemActive: {
    backgroundColor: M3.secondaryContainer,
  },
  iconWrap: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrap: {
    height: 20,
    overflow: 'hidden',
  },
  label: {
    paddingLeft: LABEL_GAP,
  },
  labelMeasure: {
    position: 'absolute',
    left: 0,
    top: 0,
    opacity: 0,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: BADGE_SIZE,
    height: BADGE_SIZE,
    paddingHorizontal: 3,
    borderRadius: SHAPE.full,
    borderWidth: BADGE_BORDER,
    // The ring separates the badge from the icon below it.
    borderColor: M3.surfaceContainerHigh,
    backgroundColor: M3.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: M3.onError,
    includeFontPadding: false,
    textAlign: 'center',
  },
});
