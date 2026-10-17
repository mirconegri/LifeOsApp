// src/data/backup.js
//
// Export and import of everything the app stores. The file is plain JSON the
// user can read and edit; nothing leaves the device unless they share it.
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { loadJSON, saveJSON } from './storage';

const PREFIX = 'lifeos_';
export const BACKUP_SCHEMA = 1;
const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

// Written out explicitly: a key that is not on this list is never read from a
// file, so a hand-edited or hostile backup cannot reach storage.
const ALLOWED_KEYS = [
  'isFirstUse', 'userName', 'course', 'totalCredits', 'tipsShown',
  'exams', 'finances', 'groceries', 'goals', 'notes', 'links', 'journal',
  'heatmap', 'loggedSeconds', 'habitsMigrated', 'universityEnabled', 'modules',
  'home_section_order',
];
const ALLOWED = new Set(ALLOWED_KEYS);

function isPlainObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

export async function buildBackup() {
  const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
  const pairs = await AsyncStorage.multiGet(keys);
  const data = {};
  pairs.forEach(([fullKey, raw]) => {
    const key = fullKey.slice(PREFIX.length);
    if (!ALLOWED.has(key) || raw == null) return;
    try {
      data[key] = JSON.parse(raw);
    } catch {
      // Unreadable value: leave it out rather than exporting a broken file.
    }
  });
  return {
    app: 'LifeOS',
    schema: BACKUP_SCHEMA,
    exportedAt: new Date().toISOString(),
    version: Constants.expoConfig?.version ?? '0.0.0',
    data,
  };
}

// Counts for the Import preview, so the user sees what is in the file before
// it replaces anything.
export function summarize(data) {
  const count = (key) => (Array.isArray(data?.[key]) ? data[key].length : 0);
  return {
    tasks: count('journal'),
    exams: count('exams'),
    transactions: count('finances'),
    groceries: count('groceries'),
    goals: count('goals'),
    notes: count('notes'),
    links: count('links'),
  };
}

export function validateBackup(text) {
  if (typeof text !== 'string' || text.length === 0) {
    throw new Error('That file is empty.');
  }
  if (text.length > MAX_BACKUP_BYTES) {
    throw new Error('That file is larger than 5 MB. Is it really a LifeOS backup?');
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }

  if (!isPlainObject(parsed) || parsed.app !== 'LifeOS') {
    throw new Error('That file is not a LifeOS backup.');
  }
  if (!Number.isInteger(parsed.schema) || parsed.schema < 1 || parsed.schema > BACKUP_SCHEMA) {
    throw new Error('That backup comes from a newer version of the app.');
  }
  if (!isPlainObject(parsed.data)) {
    throw new Error('That backup has no data in it.');
  }

  const data = {};
  ALLOWED_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(parsed.data, key)) {
      data[key] = parsed.data[key];
    }
  });
  if (Object.keys(data).length === 0) {
    throw new Error('That backup has no data this version can import.');
  }

  return { data, schema: parsed.schema, exportedAt: parsed.exportedAt ?? null };
}

// Arrays are merged by id, objects key by key, and a scalar only fills a gap:
// importing never deletes what is already there.
function mergeValue(current, incoming) {
  if (Array.isArray(incoming)) {
    if (!Array.isArray(current)) return incoming;
    const idOf = (v) => (isPlainObject(v) && v.id !== undefined ? v.id : v);
    const seen = new Set(current.map(idOf));
    return [...current, ...incoming.filter((v) => !seen.has(idOf(v)))];
  }
  if (isPlainObject(incoming)) {
    return { ...incoming, ...(isPlainObject(current) ? current : {}) };
  }
  if (current === undefined || current === null || current === '') return incoming;
  return current;
}

export async function applyBackup(data, mode = 'replace') {
  if (mode === 'replace') {
    for (const key of ALLOWED_KEYS) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        await saveJSON(key, data[key]);
      }
    }
    return;
  }
  for (const [key, incoming] of Object.entries(data)) {
    if (!ALLOWED.has(key)) continue;
    const current = await loadJSON(key, undefined);
    await saveJSON(key, mergeValue(current, incoming));
  }
}

export async function exportToFile() {
  const backup = await buildBackup();
  const stamp = new Date().toISOString().slice(0, 10);
  const uri = `${FileSystem.cacheDirectory}lifeos-backup-${stamp}.json`;
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(backup, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/json',
      dialogTitle: 'Save your LifeOS backup',
    });
  }
  return uri;
}

export async function pickBackupFile() {
  const res = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });
  if (res.canceled) return null;
  const asset = res.assets?.[0];
  if (!asset) return null;
  if (asset.size && asset.size > MAX_BACKUP_BYTES) {
    throw new Error('That file is larger than 5 MB. Is it really a LifeOS backup?');
  }
  const text = await FileSystem.readAsStringAsync(asset.uri);
  return validateBackup(text);
}

// Only used by the explicit "delete everything" action in Settings, after two
// confirmations. Switching a module off never reaches this.
export async function clearAllData() {
  const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
  if (keys.length > 0) await AsyncStorage.multiRemove(keys);
}
