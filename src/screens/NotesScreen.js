import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../config/colors';
import { Card } from '../components/Card';
import { Pill } from '../components/Pill';
import { todayKey } from '../data/helpers';

export default function NotesScreen({ notes, setNotes }) {
  const [showForm, setShowForm] = useState(false);
  const [formTitolo, setFormTitolo] = useState('');
  const [formContenuto, setFormContenuto] = useState('');
  const [formTags, setFormTags] = useState('');

  const aggiungiNota = () => {
    if (!formTitolo.trim() && !formContenuto.trim()) {
      Alert.alert('Errore', 'Inserisci un titolo o del contenuto');
      return;
    }
    const newId = Math.max(0, ...notes.map(n => n.id || 0)) + 1;
    const tagArray = formTags.split(',').map(t => t.trim().toLowerCase()).filter(t => t);
    
    setNotes(prev => [{
      id: newId,
      titolo: formTitolo.trim(),
      contenuto: formContenuto.trim(),
      tag: tagArray,
      data: todayKey(),
    }, ...prev]);
    
    setFormTitolo(''); setFormContenuto(''); setFormTags('');
    setShowForm(false);
  };

  const eliminaNota = (id) => {
    Alert.alert('Elimina Nota', 'Sei sicuro di voler cancellare questa nota?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: () => setNotes(prev => prev.filter(n => n.id !== id)) }
    ]);
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>📝 Note</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)} style={styles.addFab}>
          <Text style={styles.addFabText}>{showForm ? '✕ Chiudi' : '+ Nuova'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <Card style={styles.formCard}>
          <TextInput
            style={[styles.input, styles.titleInput]}
            placeholder="Titolo nota..."
            placeholderTextColor={COLORS.textSub}
            value={formTitolo}
            onChangeText={setFormTitolo}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Scrivi qui i tuoi appunti..."
            placeholderTextColor={COLORS.textSub}
            value={formContenuto}
            onChangeText={setFormContenuto}
            multiline
            textAlignVertical="top"
          />
          <TextInput
            style={styles.input}
            placeholder="Tags separati da virgola (es. studio, idee)"
            placeholderTextColor={COLORS.textSub}
            value={formTags}
            onChangeText={setFormTags}
          />
          <TouchableOpacity style={styles.submitBtn} onPress={aggiungiNota}>
            <Text style={styles.submitBtnText}>Salva Nota</Text>
          </TouchableOpacity>
        </Card>
      )}

      {notes.length === 0 ? (
        <Card><Text style={styles.emptyText}>Nessuna nota salvata. Creane una!</Text></Card>
      ) : (
        notes.map(nota => (
          <Card key={nota.id} style={styles.notaCard}>
            <View style={styles.notaHeader}>
              <Text style={styles.notaTitolo}>{nota.titolo || 'Senza Titolo'}</Text>
              <TouchableOpacity onPress={() => eliminaNota(nota.id)}>
                <Text style={styles.trashBtn}>🗑️</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.notaData}>{nota.data}</Text>
            
            {nota.contenuto ? (
              <Text style={styles.notaContenuto}>{nota.contenuto}</Text>
            ) : null}

            {nota.tag && nota.tag.length > 0 ? (
              <View style={styles.tagRow}>
                {nota.tag.map((t, idx) => (
                  <Pill key={idx} color="accent">#{t}</Pill>
                ))}
              </View>
            ) : null}
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text },
  addFab: { backgroundColor: COLORS.accent, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  addFabText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  emptyText: { color: COLORS.textSub, textAlign: 'center', marginVertical: 20 },
  formCard: { marginBottom: 20 },
  input: { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 15, marginBottom: 12 },
  titleInput: { fontWeight: 'bold', fontSize: 16 },
  textArea: { minHeight: 100 },
  submitBtn: { backgroundColor: COLORS.accent, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  notaCard: { marginBottom: 12, padding: 16 },
  notaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  notaTitolo: { fontSize: 18, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 10 },
  trashBtn: { fontSize: 16, padding: 4 },
  notaData: { fontSize: 11, color: COLORS.textSub, marginTop: 4, marginBottom: 8 },
  notaContenuto: { fontSize: 14, color: COLORS.textMuted, lineHeight: 22, marginBottom: 12 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
});