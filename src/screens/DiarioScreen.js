import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../config/colors';
import { Card } from '../components/Card';
import { todayKey } from '../data/helpers';

const MOODS = ['😁', '🙂', '😐', '😔', '😫'];

export default function DiarioScreen({ diario, setDiario }) {
  const [showForm, setShowForm] = useState(false);
  const [testo, setTesto] = useState('');
  const [mood, setMood] = useState('🙂');

  const oggi = todayKey();
  const haScrittoOggi = diario.some(d => d.data === oggi);

  const salvaEntry = () => {
    if (!testo.trim()) {
      Alert.alert('Errore', 'Scrivi qualcosa nel diario!');
      return;
    }
    const newId = Math.max(0, ...diario.map(d => d.id || 0)) + 1;
    setDiario(prev => [{
      id: newId,
      data: oggi,
      testo: testo.trim(),
      mood: mood,
    }, ...prev]);
    setTesto('');
    setMood('🙂');
    setShowForm(false);
  };

  const eliminaEntry = (id) => {
    Alert.alert('Elimina Pagina', 'Vuoi cancellare questa pagina di diario?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: () => setDiario(prev => prev.filter(d => d.id !== id)) }
    ]);
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>📖 Diario</Text>
        {!haScrittoOggi && (
          <TouchableOpacity onPress={() => setShowForm(!showForm)} style={styles.addFab}>
            <Text style={styles.addFabText}>{showForm ? '✕ Annulla' : '+ Scrivi Oggi'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {showForm && (
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Com'è andata la giornata?</Text>
          <View style={styles.moodRow}>
            {MOODS.map(m => (
              <TouchableOpacity key={m} onPress={() => setMood(m)} style={[styles.moodBtn, mood === m && styles.moodBtnActive]}>
                <Text style={styles.moodEmoji}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="Caro diario..."
            placeholderTextColor={COLORS.textSub}
            value={testo}
            onChangeText={setTesto}
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity style={styles.submitBtn} onPress={salvaEntry}>
            <Text style={styles.submitBtnText}>Salva Pagina</Text>
          </TouchableOpacity>
        </Card>
      )}

      {diario.length === 0 ? (
        <Card><Text style={styles.emptyText}>Il tuo diario è vuoto. Inizia a scrivere!</Text></Card>
      ) : (
        diario.map(entry => (
          <Card key={entry.id} style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <View style={styles.dateMoodRow}>
                <Text style={styles.entryMood}>{entry.mood}</Text>
                <Text style={styles.entryDate}>{entry.data}</Text>
              </View>
              <TouchableOpacity onPress={() => eliminaEntry(entry.id)} style={styles.trashBtn}>
                <Text style={styles.trashIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.entryText}>{entry.testo}</Text>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text },
  addFab: { backgroundColor: COLORS.accent, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  addFabText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  emptyText: { color: COLORS.textSub, textAlign: 'center', marginVertical: 20 },
  formCard: { marginBottom: 20 },
  formTitle: { fontSize: 16, color: COLORS.text, fontWeight: '600', marginBottom: 12 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  moodBtn: { padding: 8, borderRadius: 20, backgroundColor: COLORS.bg3 },
  moodBtnActive: { backgroundColor: COLORS.accentGlow, borderWidth: 1, borderColor: COLORS.accent },
  moodEmoji: { fontSize: 24 },
  textArea: { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 15, minHeight: 120, marginBottom: 16 },
  submitBtn: { backgroundColor: COLORS.accent, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  entryCard: { marginBottom: 12, padding: 16 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  dateMoodRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  entryMood: { fontSize: 20 },
  entryDate: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600' },
  trashBtn: { padding: 4 },
  trashIcon: { color: COLORS.textSub, fontSize: 12 },
  entryText: { fontSize: 15, color: COLORS.text, lineHeight: 22 },
});