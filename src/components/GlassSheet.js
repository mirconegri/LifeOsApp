// src/components/GlassSheet.js
//
// Bottom-sheet container shared by every screen's add/edit modal. This is
// the one genuine "Liquid Glass" surface that makes sense given the rest
// of the app's flat, non-overlapping layout: a Modal always renders in
// its own native layer ABOVE the current screen, so a BlurView here
// actually has real content underneath it to blur (the screen + the
// darkened backdrop), unlike e.g. a Card sitting in normal scroll flow
// next to other Cards, where there's nothing positioned "behind" it for
// a blur to show through.
//
// Drop-in replacement for the old pattern repeated in every screen:
//   <View style={styles.modal}>
//     <View style={styles.modalHandle} />
//     {children}
//   </View>
// Same rounded-top corners, same handle, same border — just a real blur
// instead of a flat COLORS.bg2 fill. `maxHeight` defaults to '88%' (what
// most screens used); pass the screen's original value to preserve exact
// prior behavior where it differed (UniScreen used '92%').
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../config/colors';

export function GlassSheet({ children, style, maxHeight = '88%' }) {
  return (
    <View style={[styles.wrapper, { maxHeight }, style]}>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.handle} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    // Clips the BlurView (and its absoluteFill rectangle) to the rounded
    // corners — without this the blur renders as a square behind the
    // rounded sheet, visible peeking out at the top two corners.
    overflow: 'hidden',
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.bg4,
    alignSelf: 'center', marginBottom: 16,
  },
});
