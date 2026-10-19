// src/ui/ScreenHeader.js
//
// Scrolling screen header for the flat shell.
//
// Props:
//   title       string, titleLargeEmphasized (22/28), M3.onSurface
//   subtitle    optional string, bodyMedium, M3.onSurfaceVariant
//   right       optional node, aligned right in the same row
//   style       optional container style
//   titleStyle  optional override for the title text
//
// No back button and no uppercase: the shell is flat and every screen is a
// root destination. The header scrolls with the content, so it is placed
// inside AppScrollView (not above it).

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { M3 } from '../config/colors';
import { TEXT } from './type';

export function ScreenHeader({ title, subtitle, right, style, titleStyle }) {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.textBlock}>
        <Text
          style={[TEXT.titleLargeEmphasized, styles.title, titleStyle]}
          numberOfLines={1}
          accessibilityRole="header"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[TEXT.bodyMedium, styles.subtitle]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right != null && right !== false ? (
        <View style={styles.right}>{right}</View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  textBlock: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: M3.onSurface,
  },
  subtitle: {
    color: M3.onSurfaceVariant,
    marginTop: 2,
  },
  right: {
    marginLeft: 8,
  },
});
