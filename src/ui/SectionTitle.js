// src/ui/SectionTitle.js
//
// Section heading row for lists and rails.
//
// Props:
//   title        string, titleLargeEmphasized, M3.onSurface (Sentence case)
//   subtitle     optional string, bodyMedium, M3.onSurfaceVariant
//   onSeeAll     optional callback; renders the trailing arrow button when set
//   seeAllLabel  accessibility label for that button ('See all')
//   style        optional row style
//
// The trailing control is the shared 40 dp tonal IconButton. It is absolutely
// not a filled CTA: the section row stays quiet and the arrow is secondary.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { M3 } from '../config/colors';
import { IconButton } from './IconButton';
import { TEXT } from './type';

export function SectionTitle({
  title,
  subtitle,
  onSeeAll,
  seeAllLabel = 'See all',
  style,
}) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.textBlock}>
        <Text style={[TEXT.titleLargeEmphasized, styles.title]} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text style={[TEXT.bodyMedium, styles.subtitle]}>{subtitle}</Text>
        ) : null}
      </View>

      {onSeeAll ? (
        <IconButton
          icon="chevron-right"
          onPress={onSeeAll}
          size={40}
          tone="surfaceContainerHigh"
          color={M3.onSurfaceVariant}
          accessibilityLabel={seeAllLabel}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  textBlock: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    color: M3.onSurface,
  },
  subtitle: {
    color: M3.onSurfaceVariant,
    marginTop: 2,
  },
});
