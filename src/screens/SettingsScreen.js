// src/screens/SettingsScreen.js
//
// Full-screen modal reachable from the Home avatar and the Modules screen.
// Two things live here:
//
//   1. The module switches — each one hides its screen (and its entry in the
//      Modules grid) without touching any stored data.
//   2. Backup export/import and delete-all, plus the app version read from
//      app.config.js at runtime via expo-constants. It used to be
//      hardcoded/absent, which is what issue #1a was about: what the app
//      reports must be the version that actually shipped, not a constant
//      someone forgot to bump.
//
// Presentation follows the other M3 modals in the app: opaque root view with
// its own insets so nothing shows through during the slide-in. Depth comes
// from the grouped rows (20 outer / 4 inner corners, 2 px gaps) — no borders.
import React, { useState } from 'react';
import {
  View, Text, Switch, ScrollView, Modal, StyleSheet, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

import { M3, MODULE_TONES } from '../config/colors';
import { SPACING } from '../config/designSystem';
import { MODULES } from '../config/modules';
import { NAV } from '../config/nav';
import { TEXT } from '../ui/type';
import { rowShape } from '../ui/GroupItem';
import { IconButton } from '../ui/IconButton';
import { SpringPressable } from '../ui/SpringPressable';
import { TonalIcon } from '../ui/TonalIcon';
import { Icon } from '../components/Icon';
import { CustomAlert } from '../components/CustomAlert';
import {
  exportToFile, pickBackupFile, applyBackup, clearAllData, summarize,
} from '../data/backup';

// Never hardcode a version here again — this reads the value Expo was
// built with, so package.json and app.config.js stay the only sources.
const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

// Icons come from the same NAV table the rest of the shell uses.
const MODULE_ICONS = MODULES.reduce((acc, m) => {
  acc[m.id] = NAV.find((n) => n.id === m.id)?.icon || 'grid';
  return acc;
}, {});

const DELETE_TONE = { container: M3.errorContainer, on: M3.onErrorContainer };

// Grouped row for this screen. GroupItem's secondary is single-line, and the
// module/data descriptions here are too long for that at body width, so this
// row lets the description wrap to two lines. The group shape still comes from
// GroupItem's rowShape (20 outer / 4 inner corners) and the press from
// SpringPressable, so it behaves like every other grouped row in the app.
function SettingsRow({
  icon,
  tone,
  title,
  secondary,
  trailing,
  onPress,
  destructive = false,
  index = 0,
  count = 1,
}) {
  const shape = rowShape(index, count);

  const body = (
    <>
      <TonalIcon icon={icon} size={44} tone={tone} />
      <View style={styles.rowText}>
        <Text
          style={[TEXT.titleMedium, styles.rowTitle, destructive && styles.rowTitleDestructive]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {secondary ? (
          <Text style={[TEXT.labelMedium, styles.rowSecondary]} numberOfLines={2}>
            {secondary}
          </Text>
        ) : null}
      </View>
      {trailing ? <View style={styles.rowTrailing}>{trailing}</View> : null}
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.rowShell, shape, styles.rowContent]}>{body}</View>
    );
  }

  return (
    <SpringPressable
      onPress={onPress}
      haptic="selection"
      accessibilityLabel={title}
      style={[styles.rowShell, shape]}
      contentStyle={styles.rowContent}
    >
      {body}
    </SpringPressable>
  );
}

export default function SettingsScreen({
  visible,
  onClose,
  modules,
  moduleCounts,
  onToggleModule,
  onDataChanged,
}) {
  const insets = useSafeAreaInsets();
  const [alert, setAlert] = useState(null);
  // One flag, one spinner-free guard: the buttons are cheap, double taps are not.
  const [busy, setBusy] = useState(false);

  const notify = (title, message) =>
    setAlert({ title, message, buttons: [{ text: 'OK', onPress: () => setAlert(null) }] });

  // Turning a module off only hides it. Ask first when there is something to
  // hide, so the count is never a surprise; an empty module just switches.
  const requestToggle = (id, enabled) => {
    if (enabled) {
      onToggleModule(id, true);
      return;
    }
    const count = moduleCounts?.[id] ?? 0;
    if (count === 0) {
      onToggleModule(id, false);
      return;
    }
    setAlert({
      title: 'Hide this section?',
      message: `Its ${count} item${count === 1 ? '' : 's'} stay on this device and come back if you switch it on again.`,
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => setAlert(null) },
        {
          text: 'Hide',
          style: 'destructive',
          onPress: () => { onToggleModule(id, false); setAlert(null); },
        },
      ],
    });
  };

  const runImport = async (data, mode) => {
    setAlert(null);
    setBusy(true);
    try {
      await applyBackup(data, mode);
      if (onDataChanged) await onDataChanged();
      notify('Import complete', 'Your data is on screen now.');
    } catch (e) {
      notify('Import failed', e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async () => {
    setBusy(true);
    try {
      await exportToFile();
    } catch (e) {
      notify('Export failed', e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    setBusy(true);
    try {
      const picked = await pickBackupFile();
      if (!picked) return; // file picker dismissed
      const counts = summarize(picked.data);
      const parts = [
        [counts.tasks, 'task'], [counts.exams, 'exam'], [counts.transactions, 'transaction'],
        [counts.groceries, 'grocery item'], [counts.goals, 'goal'],
        [counts.notes, 'note'], [counts.links, 'link'],
      ].filter(([n]) => n > 0).map(([n, word]) => `${n} ${word}${n === 1 ? '' : 's'}`);

      setAlert({
        title: 'Import this backup?',
        message: parts.length ? `It contains ${parts.join(', ')}.` : 'It contains no items.',
        buttons: [
          { text: 'Cancel', style: 'cancel', onPress: () => setAlert(null) },
          { text: 'Merge', onPress: () => runImport(picked.data, 'merge') },
          { text: 'Replace', style: 'destructive', onPress: () => runImport(picked.data, 'replace') },
        ],
      });
    } catch (e) {
      notify('Import failed', e.message);
    } finally {
      setBusy(false);
    }
  };

  // Two steps on purpose: the first tells you what is about to go, the second
  // gives you a chance to export first.
  const handleDeleteAll = () => {
    setAlert({
      title: 'Delete everything?',
      message: 'Every task, exam, note and transaction on this device will be erased and the app goes back to its first-launch state. This cannot be undone.',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => setAlert(null) },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => setAlert({
            title: 'Last chance',
            message: 'Export a backup first if you might want this data again.',
            buttons: [
              { text: 'Cancel', style: 'cancel', onPress: () => setAlert(null) },
              {
                text: 'Delete all',
                style: 'destructive',
                onPress: async () => {
                  setAlert(null);
                  setBusy(true);
                  try {
                    await clearAllData();
                    // The reload sends the app back to onboarding, so this
                    // screen is gone before any confirmation could be read.
                    if (onDataChanged) await onDataChanged();
                  } catch (e) {
                    notify('Delete failed', e.message);
                  } finally {
                    setBusy(false);
                  }
                },
              },
            ],
          }),
        },
      ],
    });
  };

  const chevron = <Icon name="chevron-right" size={20} color={M3.onSurfaceVariant} />;
  const destructiveChevron = <Icon name="chevron-right" size={20} color={M3.error} />;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={M3.background} />

        <View style={styles.header}>
          <IconButton
            icon="x"
            onPress={onClose}
            accessibilityLabel="Close settings"
          />
          <Text style={[TEXT.titleLargeEmphasized, styles.headerTitle]}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACING.xl }]}
        >
          <Text style={[TEXT.titleMedium, styles.sectionLabel]}>Modules</Text>

          <View style={styles.group}>
            {MODULES.map((m, i) => {
              const on = modules[m.id] !== false;
              return (
                <SettingsRow
                  key={m.id}
                  index={i}
                  count={MODULES.length}
                  icon={MODULE_ICONS[m.id]}
                  tone={MODULE_TONES[m.id] || MODULE_TONES.home}
                  title={m.label}
                  secondary={m.desc}
                  trailing={(
                    <Switch
                      value={on}
                      onValueChange={(v) => requestToggle(m.id, v)}
                      trackColor={{ false: M3.surfaceContainerHighest, true: M3.primary }}
                      thumbColor={on ? M3.onPrimary : M3.outline}
                      ios_backgroundColor={M3.surfaceContainerHighest}
                      accessibilityLabel={`${m.label} visible`}
                    />
                  )}
                />
              );
            })}
          </View>

          {/* Data is never deleted when a module is switched off — it stays
              in AsyncStorage and comes back with the screen. */}
          <Text style={[TEXT.bodySmall, styles.hint]}>
            Switching a section off only hides it. Nothing is deleted — switch it
            back on and everything is exactly where you left it.
          </Text>

          <Text style={[TEXT.titleMedium, styles.sectionLabel]}>Data</Text>

          <View style={styles.group}>
            <SettingsRow
              index={0}
              count={3}
              icon="download"
              tone={MODULE_TONES.home}
              title="Export data"
              secondary="Save everything as a readable JSON file"
              onPress={busy ? undefined : handleExport}
              trailing={chevron}
            />

            <SettingsRow
              index={1}
              count={3}
              icon="upload"
              tone={MODULE_TONES.stats}
              title="Import data"
              secondary="Restore from a backup, merging or replacing"
              onPress={busy ? undefined : handleImport}
              trailing={chevron}
            />

            <SettingsRow
              index={2}
              count={3}
              icon="trash-2"
              tone={DELETE_TONE}
              destructive
              title="Delete all data"
              secondary="Erase everything stored on this device"
              onPress={busy ? undefined : handleDeleteAll}
              trailing={destructiveChevron}
            />
          </View>

          <Text style={[TEXT.bodySmall, styles.hint, styles.aboutHint]}>
            No account, no server. Every task, exam and note lives in this phone's
            storage, and nothing is sent anywhere unless you share a backup yourself.
          </Text>

          <Text style={[TEXT.bodySmall, styles.version]}>
            Version {APP_VERSION} · read from the app configuration
          </Text>
        </ScrollView>

        <CustomAlert config={alert} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: M3.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    color: M3.onSurface,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: SPACING.xs,
  },
  sectionLabel: {
    color: M3.onSurface,
    marginTop: SPACING.lg,
    marginBottom: 8,
  },
  group: {
    gap: 2,
  },
  // Grouped row internals (shape comes from rowShape at render time).
  rowShell: {
    backgroundColor: M3.surfaceContainerHigh,
    overflow: 'hidden',
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  rowText: {
    flex: 1,
    marginLeft: 12,
  },
  rowTitle: {
    color: M3.onSurface,
  },
  rowTitleDestructive: {
    color: M3.error,
  },
  rowSecondary: {
    color: M3.onSurfaceVariant,
    marginTop: 2,
  },
  rowTrailing: {
    marginLeft: 10,
    alignItems: 'flex-end',
  },
  hint: {
    color: M3.outline,
    marginTop: SPACING.sm,
    paddingHorizontal: 4,
  },
  aboutHint: {
    marginTop: SPACING.lg,
  },
  version: {
    color: M3.outline,
    textAlign: 'center',
    marginTop: SPACING.xl,
    paddingHorizontal: 4,
  },
});
