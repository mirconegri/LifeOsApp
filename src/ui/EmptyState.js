// src/ui/EmptyState.js
//
// Centred empty state: a soft blob, a glyph, a title, optional body copy and
// an optional action node (a Chip or CtaButton).
//
// Usage:
//   <EmptyState title="No exams yet" body="Add your first exam to see it here." action={<CtaButton label="Add exam" onPress={...} />} />
//
// `tone` is a module tone object ({ container, on }) and defaults to home, so
// an empty state always carries a hue without the caller passing one.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { M3, MODULE_TONES } from '../config/colors';
import { SPACING } from '../config/designSystem';
import { Icon } from '../components/Icon';
import { Blob } from './Blob';
import { TEXT } from './type';

const BLOB_SIZE = 96;
const GLYPH_SIZE = 36;

export function EmptyState({ icon = 'sparkles', title, body, tone, action, style }) {
  const blobColor = tone?.container ?? MODULE_TONES.home.container;
  const glyphColor = tone?.on ?? MODULE_TONES.home.on;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.artwork}>
        <Blob preset="cookie9" size={BLOB_SIZE} color={blobColor} />
        <View style={styles.glyph} pointerEvents="none">
          <Icon name={icon} size={GLYPH_SIZE} color={glyphColor} />
        </View>
      </View>

      {title ? (
        <Text style={[TEXT.titleMedium, styles.title]} numberOfLines={2}>
          {title}
        </Text>
      ) : null}

      {body ? (
        <Text style={[TEXT.bodyMedium, styles.body]}>{body}</Text>
      ) : null}

      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  artwork: {
    width: BLOB_SIZE,
    height: BLOB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: M3.onSurface,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  body: {
    color: M3.onSurfaceVariant,
    marginTop: 4,
    textAlign: 'center',
  },
  action: {
    marginTop: SPACING.md,
  },
});
