// src/ui/SearchPill.js
//
// Home's search row: brand mark + inert search pill + avatar.
//
// Props:
//   placeholder        text shown in the pill ('Search LifeOS')
//   avatarLabel        source for the avatar initial ('L')
//   onBrandPress       tap on the cookie brand mark -> open modules
//   onBrandLongPress   long-press on the brand mark -> dev kit (caller decides)
//   onAvatarPress      tap on the avatar -> open Settings
//   style              optional row style
//
// The pill itself is deliberately NOT pressable: search is inert until Phase 6,
// so it has no fake press feedback. Only the brand mark and the avatar respond.
//
// Layout: 64-high row, 52-high fully-round pill, 40 cookie brand mark, 34
// avatar. The two targets get hitSlop to reach the 48 dp minimum.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { M3 } from '../config/colors';
import { SHAPE } from '../config/designSystem';
import { Icon } from '../components/Icon';
import { Blob } from './Blob';
import { SpringPressable } from './SpringPressable';
import { TEXT } from './type';

const ROW_HEIGHT = 64;
const PILL_HEIGHT = 52;
const BRAND_SIZE = 40;
const AVATAR_SIZE = 34;

export function SearchPill({
  placeholder = 'Search LifeOS',
  avatarLabel = 'L',
  onBrandPress,
  onBrandLongPress,
  onAvatarPress,
  style,
}) {
  const initial =
    (avatarLabel || 'L').trim().charAt(0).toUpperCase() || 'L';

  return (
    <View style={[styles.row, style]}>
      <View style={styles.pill}>
        <SpringPressable
          onPress={onBrandPress}
          onLongPress={onBrandLongPress}
          haptic="selection"
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel="Open modules"
          style={styles.brandPressable}
        >
          <View style={styles.brandContent}>
            <Blob preset="cookie9" size={BRAND_SIZE} color={M3.primary} />
            <View style={styles.brandGlyph} pointerEvents="none">
              <Icon name="sparkles" size={18} color={M3.onPrimary} />
            </View>
          </View>
        </SpringPressable>

        <Text style={[TEXT.bodyLarge, styles.placeholder]} numberOfLines={1}>
          {placeholder}
        </Text>
      </View>

      <SpringPressable
        onPress={onAvatarPress}
        haptic="selection"
        hitSlop={7}
        accessibilityRole="button"
        accessibilityLabel="Open settings"
        style={styles.avatarPressable}
      >
        <View style={styles.avatarContent}>
          <Text style={[TEXT.labelLarge, styles.avatarText]}>{initial}</Text>
        </View>
      </SpringPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  pill: {
    flex: 1,
    height: PILL_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderRadius: SHAPE.full,
    backgroundColor: M3.surfaceContainerHigh,
  },
  brandPressable: {
    borderRadius: SHAPE.full,
  },
  brandContent: {
    width: BRAND_SIZE,
    height: BRAND_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandGlyph: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    flex: 1,
    paddingLeft: 12,
    color: M3.onSurfaceVariant,
  },
  avatarPressable: {
    borderRadius: SHAPE.full,
    overflow: 'hidden',
  },
  avatarContent: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: SHAPE.full,
    backgroundColor: M3.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: M3.onSecondaryContainer,
  },
});
