import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'lifeos_';

export async function loadJSON(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export async function saveJSON(key, value) {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn('saveJSON error:', e);
  }
}