import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS } from '../config/colors';
import { Card } from '../components/Card';
import { Pill } from '../components/Pill';
import { CustomAlert } from '../components/CustomAlert';
import { todayKey } from '../data/helpers';

export default function NotesScreen({ notes, setNotes }) {
  const [modalVisible,  setModalVisible]  = useState(false);
  const [formTitolo,    setFormTitolo]    = useState('');
  const [formContenuto, setFormContenuto] = useState('');
  const [formTags,      setFormTags]      = useState('');
  const [alertConfig,   setAlertConfig]   = useState(null);

  const showAlert = (cfg) => setAlertConfig(cfg);

  const aggiungiNota = () => {
    if (!formTitolo.trim() && !formContenuto.trim()) {
      showAlert({ title: 'Errore', message: 'Inserisci un titolo o del contenuto',
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }] });
      return;
    }
    const newId    = Math.max(0, ...notes.map(n => n.id || 0)) + 1;
    const tagArray = formTags.split(',').map(t => t.trim().toLowerCase()).filter(t => t);
    setNotes(prev => [{ id: newId, titolo: formTitolo.trim(), contenuto: formContenuto.trim(), tag: tagArray, data: todayKey() }, ...prev]);
    setFormTitolo(''); setFormContenuto(''); setFormTags('');
    setModalVisible(false);
  };

  const eliminaNota = (id, titolo) => {
    showAlert({
      title: 'Elimina Nota',
      message: `Eliminare "${titolo || 'questa nota'}"?`,
      buttons: [
        { text: 'Annulla', style: 'cancel', onPress: () => setAlertConfig(null) },
        { text: 'Elimina', style: 'destructive', onPress: () => {
          setNotes(prev => prev.filter(n => n.id !== id));
          setAlertConfig(null);
        }},
      ],
    });
  };

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>💡 Note</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addFab}>
            <Text style={styles.addFabText}>+ Nuova</Text>
          </TouchableOpacity>
        </View>

        {notes.length === 0 ? (
          <Card><Text style={styles.emptyText}>Nessuna nota. Creane una!</Text></Card>
        ) : (
          notes.map(nota => (
            <Card key={nota.id} style={styles.notaCard}>
              <View style={styles.notaHeader}>
                <Text style={styles.notaTitolo}>{nota.titolo || 'Senza Titolo'}</Text>
                <TouchableOpacity onPress={() => eliminaNota(nota.id, nota.titolo)}>
                  <Text style={styles.trashBtn}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.notaData}>{nota.data}</Text>
              {nota.contenuto ? <Text style={styles.notaContenuto}>{nota.contenuto}</Text> : null}
              {nota.tag && nota.tag.length > 0 ? (
                <View style={styles.tagRow}>
                  {nota.tag.map((t, idx) => <Pill key={idx} color="accent">#{t}</Pill>)}
                </View>
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>

      {/* ── Modal ── */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalWrapper}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Nuova Nota</Text>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TextInput style={[styles.input, styles.titleInput]}
                placeholder="Titolo..."
                placeholderTextColor={COLORS.textSub}
                value={formTitolo} onChangeText={setFormTitolo} autoFocus />
              <TextInput style={[styles.input, styles.textArea]}
                placeholder="Contenuto..."
                placeholderTextColor={COLORS.textSub}
                value={formContenuto} onChangeText={setFormContenuto}
                multiline textAlignVertical="top" />
              <TextInput style={styles.input}
                placeholder="Tag: studio, idee, ..."
                placeholderTextColor={COLORS.textSub}
                value={formTags} onChangeText={setFormTags} />

              <View style={styles.modalBtns}>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelBtn}>Annulla</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={aggiungiNota}>
                  <Text style={styles.confirmBtnText}>Salva</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CustomAlert config={alertConfig} />
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLORS.bg },
  scroll:  { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  header:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title:   { fontSize: 28, fontWeight: '700', color: COLORS.text },
  addFab:  { backgroundColor: COLORS.accent, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  addFabText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  emptyText:  { color: COLORS.textSub, textAlign: 'center', marginVertical: 20 },

  notaCard:    { marginBottom: 12, padding: 16 },
  notaHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  notaTitolo:  { fontSize: 17, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 10 },
  trashBtn:    { color: COLORS.textSub, fontSize: 14, padding: 4 },
  notaData:    { fontSize: 11, color: COLORS.textSub, marginTop: 4, marginBottom: 8 },
  notaContenuto:{ fontSize: 14, color: COLORS.textMuted, lineHeight: 22, marginBottom: 12 },
  tagRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  // Modal
  modalWrapper:  { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modal: {
    backgroundColor: COLORS.bg2,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    borderTopWidth: 1, borderColor: COLORS.border,
    maxHeight: '85%',
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.bg4, alignSelf: 'center', marginBottom: 16 },
  modalTitle:  { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 16, textAlign: 'center' },
  input:       { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 14, marginBottom: 10 },
  titleInput:  { fontWeight: '700', fontSize: 16 },
  textArea:    { minHeight: 100 },
  modalBtns:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  cancelBtn:   { color: COLORS.textSub, fontSize: 15, padding: 10 },
  confirmBtn:  { backgroundColor: COLORS.accent, paddingVertical: 12, paddingHorizontal: 22, borderRadius: 10 },
  confirmBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});