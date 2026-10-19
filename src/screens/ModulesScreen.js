// src/screens/ModulesScreen.js
//
// The secondary modules are no longer drawer entries. They live here: a
// presentational 3-column blob grid opened from the SearchPill brand mark
// (and from Home's "Browse modules" rail). It is not a NAV id and has no
// tab of its own; BackHandler pops it like any other screen.
//
// Counts come from App.js (the same objects Settings uses), so this screen
// never touches data. Settings and the dev kit are reachable from here even
// when the Home header has scrolled away.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { M3, MODULE_TONES } from '../config/colors';
import { SHAPE, SPACING } from '../config/designSystem';
import { MODULES } from '../config/modules';
import { NAV } from '../config/nav';
import { TEXT } from '../ui/type';
import { Icon } from '../components/Icon';
import { Blob } from '../ui/Blob';
import { SpringPressable } from '../ui/SpringPressable';
import { AppScrollView } from '../ui/AppScrollView';
import { ScreenHeader } from '../ui/ScreenHeader';
import { GroupItem } from '../ui/GroupItem';

// A different blob family per module, so the grid reads as a set of shapes.
const TILE_BLOBS = [
  'cookie9', 'sunny', 'clover4', 'cookie6', 'flower', 'cookie12', 'circle',
];

export default function ModulesScreen({
  modules = {},
  moduleCounts = {},
  onNavigate,
  onOpenSettings,
  onOpenDevKit,
}) {
  const enabled = MODULES.filter((m) => modules[m.id] !== false);
  const hiddenCount = MODULES.length - enabled.length;

  return (
    <View style={styles.root}>
      <AppScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          title="Modules"
          subtitle="Everything outside the main tabs"
        />

        <View style={styles.grid}>
          {enabled.map((mod, i) => {
            const tone = MODULE_TONES[mod.id] || MODULE_TONES.home;
            const nav = NAV.find((n) => n.id === mod.id);
            const count = moduleCounts[mod.id] || 0;
            const countLabel = `${count} ${count === 1 ? 'item' : 'items'}`;
            return (
              <SpringPressable
                key={mod.id}
                onPress={() => onNavigate?.(mod.id)}
                haptic="selection"
                style={styles.tile}
                contentStyle={styles.tileContent}
                accessibilityLabel={`${mod.label}, ${countLabel}`}
              >
                <View style={styles.art}>
                  <Blob
                    preset={TILE_BLOBS[i % TILE_BLOBS.length]}
                    size={64}
                    color={tone.container}
                  />
                  <View style={styles.artGlyph} pointerEvents="none">
                    <Icon name={nav?.icon || 'grid'} size={26} color={tone.on} />
                  </View>
                </View>
                <Text style={[TEXT.labelLarge, styles.label]} numberOfLines={1}>
                  {mod.label}
                </Text>
                <Text style={[TEXT.labelSmall, styles.count]} numberOfLines={1}>
                  {countLabel}
                </Text>
              </SpringPressable>
            );
          })}
        </View>

        {hiddenCount > 0 ? (
          <Text style={[TEXT.bodySmall, styles.hint]}>
            {hiddenCount} hidden module{hiddenCount === 1 ? '' : 's'} can be
            turned back on in Settings.
          </Text>
        ) : null}

        <Text style={[TEXT.titleMedium, styles.sectionTitle]}>App</Text>
        <View style={styles.group}>
          <GroupItem
            icon="settings"
            title="Settings"
            secondary="Modules, backup and version"
            tone={MODULE_TONES.home}
            onPress={onOpenSettings}
            index={0}
            count={1}
          />
          {__DEV__ && onOpenDevKit ? (
            <GroupItem
              icon="sparkles"
              title="Dev kit"
              secondary="Primitive and blob gallery"
              tone={MODULE_TONES.stats}
              onPress={onOpenDevKit}
              index={0}
              count={1}
            />
          ) : null}
        </View>
      </AppScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: M3.background },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
    rowGap: 20,
  },
  tile: {
    width: '30%',
    alignItems: 'center',
  },
  tileContent: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  art: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artGlyph: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: M3.onSurface,
    marginTop: 8,
    textAlign: 'center',
  },
  count: {
    color: M3.onSurfaceVariant,
    marginTop: 1,
    textAlign: 'center',
  },
  hint: {
    color: M3.outline,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    color: M3.onSurface,
    marginTop: SPACING.lg,
    marginBottom: 8,
  },
  group: {
    gap: 2,
  },
});
