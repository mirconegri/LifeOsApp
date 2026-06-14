import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS } from '../config/colors';
import { Card } from '../components/Card';
import { Pill } from '../components/Pill';
import { CustomAlert } from '../components/CustomAlert';

const CATEGORIE = ['supermercato', 'farmacia', 'casa', 'altro'];

export default function SpesaScreen({ spesa, setSpesa }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [formText, setFormText]         = useState('');
  const [formCat,  setFormCat]          = useState('supermercato');
  const [filter,   setFilter]           = useState('tutte');
  const [alertConfig, setAlertConfig]   = useState(null);

  const showAlert = (cfg) => setAlertConfig(cfg);

  const toggleItem = (id) => {
    setSpesa(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const deleteItem = (id, text) => {
    showAlert({
      title: 'Rimuovi',
      message: `Eliminare "${text}" dalla lista?`,
      buttons: [
        { text: 'Annulla', style: 'cancel', onPress: () => setAlertConfig(null) },
        { text: 'Elimina', style: 'destructive', onPress: () => {
          setSpesa(prev => prev.filter(item => item.id !== id));
          setAlertConfig(null);
        }},
      ],
    });
  };

  const aggiungi = () => {
    if (!formText.trim()) {
      showAlert({ title: 'Errore', message: 'Inserisci il nome del prodotto',
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }] });
      return;
    }
    const newId = Math.max(0, ...spesa.map(s => s.id)) + 1;
    setSpesa(prev => [{ id: newId, text: formText.trim(), cat: formCat, done: false }, ...prev]);
    setFormText('');
    setModalVisible(false);
  };

  const filteredSpesa = spesa.filter(item => {
    if (filter === 'da comprare') return !item.done;
    if (filter === 'completate')  return item.done;
    return true;
  });

  const daComprare  = spesa.filter(i => !i.done).length;
  const completate  = spesa.filter(i =>  i.done).length;

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>🛒 Lista Spesa</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addFab}>
            <Text style={styles.addFabText}>+ Prodotto</Text>
          </TouchableOpacity>
        </View>

        {/* Counters */}
        <View style={styles.countersRow}>
          <View style={styles.counterChip}>
            <Text style={styles.counterNum}>{daComprare}</Text>
            <Text style={styles.counterLbl}>da comprare</Text>
          </View>
          <View style={[styles.counterChip, { borderColor: COLORS.green + '44' }]}>
            <Text style={[styles.counterNum, { color: COLORS.green }]}>{completate}</Text>
            <Text style={styles.counterLbl}>completate</Text>
          </View>
        </View>

        {/* Filtri */}
        <View style={styles.filters}>
          {[['tutte', 'Tutte'], ['da comprare', 'Da Comprare'], ['completate', 'Completate']].map(([f, l]) => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}>
              <Text style={[styles.filterText, filter === f && { color: COLORS.accent }]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {filteredSpesa.length === 0 ? (
          <Text style={styles.emptyText}>Lista vuota 🎉</Text>
        ) : (
          filteredSpesa.map(item => (
            <Card key={item.id} style={styles.itemCard}>
              <View style={styles.itemRow}>
                <TouchableOpacity onPress={() => toggleItem(item.id)} style={styles.checkboxWrap}>
                  <View style={[styles.checkbox,
                    { borderColor: COLORS.border2, backgroundColor: item.done ? COLORS.green : 'transparent' }]}>
                    {item.done && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
                <Text style={[styles.itemText, item.done && styles.itemTextDone]}>{item.text}</Text>
                <Pill color="muted">{item.cat}</Pill>
                <TouchableOpacity onPress={() => deleteItem(item.id, item.text)} style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
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
            <Text style={styles.modalTitle}>Aggiungi Prodotto</Text>

            <TextInput
              style={styles.input}
              placeholder="Cosa devi comprare?"
              placeholderTextColor={COLORS.textSub}
              value={formText}
              onChangeText={setFormText}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={aggiungi}
            />

            <Text style={styles.fieldLabel}>Categoria:</Text>
            <View style={styles.catRow}>
              {CATEGORIE.map(c => (
                <TouchableOpacity key={c} onPress={() => setFormCat(c)}
                  style={[styles.catChip, formCat === c && styles.catChipActive]}>
                  <Text style={[styles.catChipText, formCat === c && { color: COLORS.accent }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtn}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={aggiungi}>
                <Text style={styles.confirmBtnText}>Aggiungi</Text>
              </TouchableOpacity>
            </View>
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
  content: { padding: 16, paddingBottom: 32 },
  header:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title:   { fontSize: 28, fontWeight: '700', color: COLORS.text },
  addFab:  { backgroundColor: COLORS.accent, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  addFabText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  countersRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  counterChip: { flex: 1, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, alignItems: 'center' },
  counterNum:  { fontSize: 22, fontWeight: '700', color: COLORS.accent },
  counterLbl:  { fontSize: 11, color: COLORS.textSub, marginTop: 2 },

  filters:         { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterPill:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.bg2 },
  filterPillActive:{ backgroundColor: COLORS.accentGlow },
  filterText:      { fontSize: 12, color: COLORS.textMuted },
  emptyText:       { fontSize: 13, color: COLORS.textSub, textAlign: 'center', marginTop: 20 },

  itemCard:    { marginBottom: 8, padding: 12 },
  itemRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkboxWrap:{ padding: 2 },
  checkbox:    { width: 20, height: 20, borderWidth: 1.5, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  checkmark:   { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  itemText:    { flex: 1, fontSize: 14, color: COLORS.text },
  itemTextDone:{ textDecorationLine: 'line-through', color: COLORS.textSub },
  deleteBtn:   { padding: 4 },
  deleteBtnText: { fontSize: 14, color: COLORS.textSub },

  // Modal
  modalWrapper:  { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modal: {
    backgroundColor: COLORS.bg2,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    borderTopWidth: 1, borderColor: COLORS.border,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.bg4, alignSelf: 'center', marginBottom: 16 },
  modalTitle:  { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 16, textAlign: 'center' },
  input:       { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 14, marginBottom: 12 },
  fieldLabel:  { color: COLORS.textSub, fontSize: 13, marginBottom: 8 },
  catRow:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 20 },
  catChip:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12, backgroundColor: COLORS.bg4 },
  catChipActive:{ backgroundColor: COLORS.accentGlow },
  catChipText: { fontSize: 13, color: COLORS.textMuted },
  modalBtns:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cancelBtn:   { color: COLORS.textSub, fontSize: 15, padding: 10 },
  confirmBtn:  { backgroundColor: COLORS.accent, paddingVertical: 12, paddingHorizontal: 22, borderRadius: 10 },
  confirmBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});