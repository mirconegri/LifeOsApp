// src/screens/SettingsScreen.js
//
// Full-screen modal reachable from the drawer. Two things live here:
//
//   1. The module switches — each one hides its tab (and drawer entry)
//      without touching any stored data.
//   2. The app version, read from app.config.js at runtime via
//      expo-constants. It used to be hardcoded/absent, which is what
//      issue #1a was about: what the app reports must be the version that
//      actually shipped, not a constant someone forgot to bump.
//
// Presentation follows the other modals in the app: opaque root view so
// nothing shows through during the slide-in.
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Switch, ScrollView,
  Modal, StyleSheet, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Icon } from '../components/Icon';
import { CustomAlert } from '../components/CustomAlert';
import { COLORS } from '../config/colors';
import { TYPE } from '../config/designSystem';
import { MODULES } from '../config/modules';
import {
  exportToFile, pickBackupFile, applyBackup, clearAllData, summarize,
} from '../data/backup';

// Never hardcode a version here again — this reads the value Expo was
// built with, so package.json and app.config.js stay the only sources.
const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

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
      message: 'Every task, exam, note and transaction on this device will be erased. This cannot be undone.',
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
                    if (onDataChanged) await onDataChanged();
                    notify('Deleted', 'Everything has been removed from this device.');
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
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg2} />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close settings">
            <Icon name="x" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionLabel}>Modules</Text>

          <View style={styles.moduleList}>
            {MODULES.map((m, i) => {
              const on = modules[m.id] !== false;
              return (
                <View key={m.id} style={[styles.moduleRow, i < MODULES.length - 1 && styles.moduleRowDivider]}>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{m.label}</Text>
                    <Text style={styles.rowDesc}>{m.desc}</Text>
                  </View>
                  <Switch
                    value={on}
                    onValueChange={(v) => requestToggle(m.id, v)}
                    trackColor={{ false: COLORS.bg4, true: COLORS.accentDim }}
                    thumbColor={on ? COLORS.accent : COLORS.textSub}
                  />
                </View>
              );
            })}
          </View>

          {/* Data is never deleted when a module is switched off — it stays
              in AsyncStorage and comes back with the tab. */}
          <Text style={styles.hint}>
            Switching a section off only hides it. Nothing is deleted — switch it
            back on and everything is exactly where you left it.
          </Text>

          <Text style={styles.sectionLabel}>Data</Text>

          <View style={styles.dataList}>
            <TouchableOpacity
              style={[styles.dataRow, styles.dataRowDivider]}
              onPress={handleExport}
              disabled={busy}
              accessibilityLabel="Export data to a file"
            >
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Export data</Text>
                <Text style={styles.rowDesc}>Save everything as a readable JSON file</Text>
              </View>
              <Icon name="download" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dataRow, styles.dataRowDivider]}
              onPress={handleImport}
              disabled={busy}
              accessibilityLabel="Import data from a file"
            >
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Import data</Text>
                <Text style={styles.rowDesc}>Restore from a backup, merging or replacing</Text>
              </View>
              <Icon name="upload" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dataRow}
              onPress={handleDeleteAll}
              disabled={busy}
              accessibilityLabel="Delete all data on this device"
            >
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: COLORS.red }]}>Delete all data</Text>
                <Text style={styles.rowDesc}>Erase everything stored on this device</Text>
              </View>
              <Icon name="trash-2" size={18} color={COLORS.red} />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>About</Text>

          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Version</Text>
              <Text style={styles.rowDesc}>Read from the app configuration</Text>
            </View>
            <Text style={styles.versionValue}>{APP_VERSION}</Text>
          </View>
        </ScrollView>

        <CustomAlert config={alert} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, height: 52,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg2,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  closeBtn: { padding: 8 },

  content: { padding: 16, paddingBottom: 40 },

  sectionLabel: {
    fontSize: TYPE.meta, color: COLORS.textSub,
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginTop: 18, marginBottom: 10,
  },

  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.bg2,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },

  // Same card treatment as the module list: one block, hairline dividers.
  dataList: {
    backgroundColor: COLORS.bg2,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 14,
    paddingHorizontal: 16,
  },
  dataRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14,
  },
  dataRowDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.hairline },

  // One card holding every switch, so the list reads as a single control.
  moduleList: {
    backgroundColor: COLORS.bg2,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 14,
    paddingHorizontal: 16,
  },
  moduleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12,
  },
  moduleRowDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.hairline },
  rowText: { flex: 1, paddingRight: 12 },
  rowTitle: { fontSize: 15, color: COLORS.text, fontWeight: '600' },
  rowDesc: { fontSize: TYPE.meta, color: COLORS.textMuted, marginTop: 3 },
  versionValue: { fontSize: 15, color: COLORS.textMuted, fontWeight: '600' },

  hint: {
    fontSize: TYPE.meta, color: COLORS.textSub,
    lineHeight: 18, marginTop: 10, paddingHorizontal: 4,
  },
});
