// src/ui/DevKit.js
//
// Dev-only primitive gallery. Reachable by long-pressing the wordmark
// (Phase 1) / the search-pill brand mark (Phase 2+). Renders every
// primitive and every blob preset on one scrollable page so they can be
// eyeballed on the phone before they are applied screen by screen.
//
// Never shipped in a production UI path: App.js only mounts it in __DEV__.

import React, { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { M3, MODULE_TONES } from '../config/colors';
import { SHAPE, SPACING } from '../config/designSystem';
import { TEXT } from './type';
import { Icon } from '../components/Icon';

import { ScrollProvider } from './scrollState';
import { AppScrollView } from './AppScrollView';
import { FloatingNav } from './FloatingNav';
import { SpringPressable } from './SpringPressable';
import { Reveal } from './Reveal';
import { Blob, MorphBlob, BLOB_PRESETS } from './Blob';
import { WavyProgress } from './WavyProgress';
import { Chip } from './Chip';
import { CtaButton } from './CtaButton';
import { IconButton } from './IconButton';
import { TonalIcon } from './TonalIcon';
import { StatRow } from './StatRow';
import { EmptyState } from './EmptyState';
import { GroupItem } from './GroupItem';
import { SectionTitle } from './SectionTitle';
import { SearchPill } from './SearchPill';
import { HeroPager } from './HeroPager';
import { ScreenHeader } from './ScreenHeader';
import { Dialog } from './Dialog';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'uni', label: 'University', icon: 'graduation-cap' },
  { id: 'journal', label: 'Tasks', icon: 'check-square' },
  { id: 'finances', label: 'Finances', icon: 'wallet' },
  { id: 'stats', label: 'Stats', icon: 'bar-chart-3' },
];

const HERO_ITEMS = [
  { key: 'exam', title: 'Next exam', subtitle: 'Analysis 1 · in 12 days', icon: 'graduation-cap', tone: MODULE_TONES.uni },
  { key: 'tasks', title: 'Tasks today', subtitle: '3 of 7 done', icon: 'check-square', tone: MODULE_TONES.journal },
  { key: 'balance', title: 'Balance', subtitle: '€1,240.50', icon: 'wallet', tone: MODULE_TONES.finances },
  { key: 'study', title: 'Study days', subtitle: '18 days logged', icon: 'bar-chart-3', tone: MODULE_TONES.stats },
];

const PRESET_NAMES = Object.keys(BLOB_PRESETS);

function Section({ title, children, style }) {
  return (
    <View style={[styles.section, style]}>
      <Text style={[TEXT.titleMedium, styles.sectionTitle]}>{title}</Text>
      {children}
    </View>
  );
}

function DevKitBody({ onClose }) {
  const insets = useSafeAreaInsets();
  const [blobIndex, setBlobIndex] = useState(1);
  const [chip, setChip] = useState('all');
  const [activeNav, setActiveNav] = useState('home');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topRow}>
        <View>
          <Text style={[TEXT.headlineSmall, styles.title]}>Dev kit</Text>
          <Text style={[TEXT.bodySmall, styles.muted]}>M3 Expressive primitives</Text>
        </View>
        <IconButton icon="x" onPress={onClose} accessibilityLabel="Close dev kit" />
      </View>

      <AppScrollView contentContainerStyle={styles.content} bottomInset={false} topInset={false}>
        <Section title="Colour roles">
          <View style={styles.swatchRow}>
            {[
              ['primary', M3.primary],
              ['primaryContainer', M3.primaryContainer],
              ['secondaryContainer', M3.secondaryContainer],
              ['tertiaryContainer', M3.tertiaryContainer],
              ['surfaceContainerHigh', M3.surfaceContainerHigh],
              ['errorContainer', M3.errorContainer],
            ].map(([name, color]) => (
              <View key={name} style={styles.swatch}>
                <View style={[styles.swatchChip, { backgroundColor: color }]} />
                <Text style={[TEXT.labelSmall, styles.muted]}>{name}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Blob presets">
          <View style={styles.blobRow}>
            {PRESET_NAMES.map((name) => (
              <View key={name} style={styles.blobItem}>
                <Blob preset={name} size={64} color={MODULE_TONES.uni.on} />
                <Text style={[TEXT.labelSmall, styles.muted]}>{name}</Text>
              </View>
            ))}
          </View>
          <View style={styles.rowCenter}>
            <MorphBlob index={blobIndex} presets={PRESET_NAMES} size={120} color={MODULE_TONES.home.on} />
            <SpringPressable
              onPress={() => setBlobIndex((i) => (i + 1) % PRESET_NAMES.length)}
              style={styles.smallButton}
              contentStyle={styles.smallButtonContent}
              accessibilityLabel="Morph to next blob"
            >
              <Text style={[TEXT.labelLarge, { color: M3.onPrimary }]}>Morph</Text>
            </SpringPressable>
          </View>
        </Section>

        <Section title="Wavy progress">
          <View style={styles.rowCenter}>
            <WavyProgress variant="circular" progress={0.65} size={72} color={MODULE_TONES.stats.on} trackColor={MODULE_TONES.stats.container} />
            <WavyProgress variant="circular" progress={undefined} size={72} color={MODULE_TONES.goals.on} trackColor={MODULE_TONES.goals.container} />
          </View>
          <WavyProgress progress={0.25} style={styles.wavy} />
          <WavyProgress progress={0.55} color={MODULE_TONES.journal.on} trackColor={MODULE_TONES.journal.container} style={styles.wavy} />
          <WavyProgress progress={1} animate={false} color={MODULE_TONES.finances.on} trackColor={MODULE_TONES.finances.container} style={styles.wavy} />
          <WavyProgress progress={undefined} animate={false} color={MODULE_TONES.goals.on} trackColor={MODULE_TONES.goals.container} style={styles.wavy} />
        </Section>

        <Section title="Press, chips, buttons">
          <View style={styles.rowWrap}>
            <SpringPressable onPress={() => {}} style={styles.smallButton} contentStyle={styles.smallButtonContent}>
              <Text style={[TEXT.labelLarge, { color: M3.onPrimary }]}>Press me</Text>
            </SpringPressable>
            <Chip label="All" selected={chip === 'all'} onPress={() => setChip('all')} />
            <Chip label="Queue" selected={chip === 'queue'} onPress={() => setChip('queue')} />
            <Chip label="Installed" selected={chip === 'installed'} onPress={() => setChip('installed')} />
          </View>
          <View style={styles.rowWrap}>
            {['chevron-right', 'plus', 'download', 'settings'].map((name) => (
              <IconButton key={name} icon={name} onPress={() => {}} accessibilityLabel={name} />
            ))}
            {[MODULE_TONES.home, MODULE_TONES.journal, MODULE_TONES.finances, MODULE_TONES.stats].map((tone, i) => (
              <TonalIcon key={i} icon={['sparkles', 'check-circle', 'wallet', 'bar-chart-3'][i]} tone={tone} />
            ))}
          </View>
          <CtaButton label="Get on PC" onPress={() => {}} />
          <CtaButton label="Tonal" variant="tonal" onPress={() => {}} style={styles.mt8} />
          <CtaButton label="Destructive" variant="destructive" onPress={() => {}} style={styles.mt8} />
          <CtaButton label="Loading" loading onPress={() => {}} style={styles.mt8} />
          <CtaButton label="Text" variant="text" onPress={() => {}} style={styles.mt8} />
        </Section>

        <Section title="Reveal (stagger)">
          {[0, 1, 2, 3].map((i) => (
            <Reveal key={i} index={i}>
              <View style={styles.revealRow}>
                <Text style={[TEXT.bodyMedium, { color: M3.onSurface }]}>Item {i + 1}</Text>
              </View>
            </Reveal>
          ))}
        </Section>

        <Section title="Stat row">
          <StatRow stats={[{ value: '18', label: 'Credits' }, { value: '27.4', label: 'Average' }, { value: '104', label: 'Predicted' }]} />
        </Section>

        <Section title="Section title + rows">
          <SectionTitle title="Up next" subtitle="Your closest exams" onSeeAll={() => {}} />
          {[0, 1, 2].map((i) => (
            <GroupItem
              key={i}
              index={i}
              count={3}
              icon={['graduation-cap', 'book', 'target'][i]}
              tone={MODULE_TONES.uni}
              title={['Analysis 1', 'Physics 2', 'Statistics'][i]}
              secondary="12 credits"
              status="Preparing"
              statusIcon="clock"
              statusColor={MODULE_TONES.uni.on}
              onPress={() => {}}
            />
          ))}
        </Section>

        <Section title="Search pill">
          <SearchPill onBrandPress={() => {}} onBrandLongPress={() => {}} onAvatarPress={() => {}} avatarLabel="M" />
        </Section>

        <Section title="Hero pager">
          <HeroPager items={HERO_ITEMS} onIndexChange={setHeroIndex} />
          <Text style={[TEXT.labelSmall, styles.muted]}>index {heroIndex}</Text>
        </Section>

        <Section title="Screen header">
          <ScreenHeader title="University" subtitle="Exams, grades and degree prediction" />
        </Section>

        <Section title="Empty state">
          <EmptyState title="Nothing here" body="Add an exam to see it on the dashboard." tone={MODULE_TONES.uni} />
        </Section>

        <Section title="Dialog">
          <CtaButton label="Open dialog" variant="tonal" onPress={() => setDialogOpen(true)} />
        </Section>

        <View style={{ height: 120 + insets.bottom }} />
      </AppScrollView>

      <FloatingNav items={NAV_ITEMS} activeId={activeNav} onSelect={setActiveNav} badges={{ journal: 2 }} />

      <Dialog
        visible={dialogOpen}
        title="Delete this exam?"
        message="This cannot be undone."
        icon="trash-2"
        onRequestClose={() => setDialogOpen(false)}
        buttons={[
          { text: 'Cancel', style: 'cancel', onPress: () => setDialogOpen(false) },
          { text: 'Delete', style: 'destructive', onPress: () => setDialogOpen(false) },
        ]}
      />
    </View>
  );
}

export function DevKit({ visible, onClose }) {
  return (
    <Modal
      visible={!!visible}
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <ScrollProvider>
        <DevKitBody onClose={onClose} />
      </ScrollProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: M3.background },
  topRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  title: { color: M3.onSurface },
  muted: { color: M3.onSurfaceVariant },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  section: { paddingVertical: 12, borderBottomWidth: 0 },
  sectionTitle: { color: M3.onSurface, marginBottom: 10 },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { alignItems: 'center', width: 92 },
  swatchChip: { width: 44, height: 44, borderRadius: SHAPE.md, marginBottom: 4 },
  blobRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 12 },
  blobItem: { alignItems: 'center', width: 76 },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 20, marginVertical: 8 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 10 },
  wavy: { marginBottom: 12 },
  smallButton: {
    backgroundColor: M3.primary, borderRadius: SHAPE.full,
  },
  smallButtonContent: {
    paddingHorizontal: 16, paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center', borderRadius: SHAPE.full,
  },
  mt8: { marginTop: 8 },
  revealRow: {
    paddingHorizontal: 16, paddingVertical: 12, marginBottom: 2,
    backgroundColor: M3.surfaceContainerHigh, borderRadius: SHAPE.xs,
  },
});
