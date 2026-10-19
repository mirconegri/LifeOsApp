// src/ui/GroupItem.js
//
// One row of a grouped list. Rows are flat on the background (no card, no
// border, no shadow): the group reads from its corner radii, with 2 px gaps
// between rows. See rowShape(index, count).
//
// Public API:
//   rowShape(index, count) -> { borderTopLeftRadius, ... }
//   <GroupItem
//     icon title secondary status statusIcon statusColor
//     trailing leading onPress onLongPress selected index count style tone />
//
// `tone` is additive to the §4 contract: it tints the leading TonalIcon so a
// module's rows keep their hue. Omit it for the home tone.
// `trailing` replaces the default chevron; a custom node may be any ReactNode.

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { M3 } from '../config/colors';
import { SHAPE, SPACING, SPRING } from '../config/designSystem';
import { Icon } from '../components/Icon';
import { SpringPressable } from './SpringPressable';
import { TonalIcon } from './TonalIcon';
import { TEXT } from './type';

const OUTER_RADIUS = SHAPE.xl;
const INNER_RADIUS = SHAPE.xs;
const ICON_SIZE = 56;

/** Corner radii for a row that sits at `index` in a group of `count`. */
export function rowShape(index, count) {
  if (count <= 1) {
    return {
      borderTopLeftRadius: OUTER_RADIUS,
      borderTopRightRadius: OUTER_RADIUS,
      borderBottomLeftRadius: OUTER_RADIUS,
      borderBottomRightRadius: OUTER_RADIUS,
    };
  }
  const first = index <= 0;
  const last = index >= count - 1;
  if (first) {
    return {
      borderTopLeftRadius: OUTER_RADIUS,
      borderTopRightRadius: OUTER_RADIUS,
      borderBottomLeftRadius: INNER_RADIUS,
      borderBottomRightRadius: INNER_RADIUS,
    };
  }
  if (last) {
    return {
      borderTopLeftRadius: INNER_RADIUS,
      borderTopRightRadius: INNER_RADIUS,
      borderBottomLeftRadius: OUTER_RADIUS,
      borderBottomRightRadius: OUTER_RADIUS,
    };
  }
  return {
    borderTopLeftRadius: INNER_RADIUS,
    borderTopRightRadius: INNER_RADIUS,
    borderBottomLeftRadius: INNER_RADIUS,
    borderBottomRightRadius: INNER_RADIUS,
  };
}

export function GroupItem({
  icon,
  title,
  secondary,
  status,
  statusIcon,
  statusColor,
  trailing,
  leading,
  onPress,
  onLongPress,
  selected = false,
  index = 0,
  count = 1,
  style,
  tone,
}) {
  const reduceMotion = useReducedMotion();
  const base = rowShape(index, count);
  const pressed = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    pressed.value = reduceMotion
      ? (selected ? 1 : 0)
      : withSpring(selected ? 1 : 0, SPRING.fastSpatial);
  }, [pressed, selected, reduceMotion]);

  // Corners morph from the group shape to a fully round selected row.
  const shapeStyle = useAnimatedStyle(() => {
    const t = pressed.value;
    return {
      borderTopLeftRadius: base.borderTopLeftRadius + (SHAPE.full - base.borderTopLeftRadius) * t,
      borderTopRightRadius: base.borderTopRightRadius + (SHAPE.full - base.borderTopRightRadius) * t,
      borderBottomLeftRadius: base.borderBottomLeftRadius + (SHAPE.full - base.borderBottomLeftRadius) * t,
      borderBottomRightRadius: base.borderBottomRightRadius + (SHAPE.full - base.borderBottomRightRadius) * t,
    };
  });

  const statusTint = statusColor ?? M3.onSurfaceVariant;
  const interactive = Boolean(onPress || onLongPress);
  const leadingNode = leading ?? (icon ? <TonalIcon icon={icon} size={ICON_SIZE} tone={tone} /> : null);
  const trailingNode = trailing !== undefined
    ? trailing
    : (onPress ? <Icon name="chevron-right" size={20} color={M3.onSurfaceVariant} /> : null);

  const body = (
    <>
      {leadingNode ? <View style={styles.leading}>{leadingNode}</View> : null}

      <View style={styles.textColumn}>
        <Text style={[TEXT.titleMedium, styles.title]} numberOfLines={1}>
          {title}
        </Text>
        {secondary ? (
          <Text style={[TEXT.labelMedium, styles.secondary]} numberOfLines={1}>
            {secondary}
          </Text>
        ) : null}
        {status ? (
          <View style={styles.statusRow}>
            {statusIcon ? (
              <View style={styles.statusIcon}>
                <Icon name={statusIcon} size={12} color={statusTint} />
              </View>
            ) : null}
            <Text style={[TEXT.labelSmall, { color: statusTint }]} numberOfLines={1}>
              {status}
            </Text>
          </View>
        ) : null}
      </View>

      {trailingNode ? <View style={styles.trailing}>{trailingNode}</View> : null}
    </>
  );

  return (
    <Animated.View style={[styles.shell, shapeStyle, style]}>
      {interactive ? (
        <SpringPressable
          onPress={onPress}
          onLongPress={onLongPress}
          haptic="selection"
          accessibilityRole="button"
          accessibilityLabel={title}
          accessibilityState={{ selected }}
          style={styles.row}
          contentStyle={styles.rowContent}
        >
          {body}
        </SpringPressable>
      ) : (
        <View style={[styles.row, styles.rowContent]} accessibilityLabel={title}>
          {body}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    // The radius lives here so it can animate; clipping gives the row shape.
    overflow: 'hidden',
  },
  // Outer slot of SpringPressable: the tonal fill that squashes on press.
  row: {
    backgroundColor: M3.surfaceContainerHigh,
  },
  // Inner slot: padding and row layout, so the whole row is a touch target.
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  leading: {
    marginRight: SPACING.md,
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: M3.onSurface,
  },
  secondary: {
    color: M3.onSurfaceVariant,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusIcon: {
    marginRight: 4,
  },
  trailing: {
    marginLeft: SPACING.sm,
  },
});
