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

export default function StudioScreen({ tasks, setTasks }) {
  const [filter,       setFilter]       = useState('today');
  const [modalVisible, setModalVisible] = useState(false);
  const [formText,     setFormText]     = useState('');
  const [formMateria,  setFormMateria]  = useState('');
  const [formPriorita, setFormPriorita] = useState('media');
  const [formData,     setFormData]     = useState(todayKey());
  const [alertConfig,  setAlertConfig]  = useState(null);

  const today = todayKey();
  const endOfWeek = new Date();
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
  const weekKey = endOfWeek.toISOString().slice(0, 10);

  const filtered = tasks.filter(t => {
    if (filter === 'today') return t.data === today;
    if (filter === 'week')  return t.data >= today && t.data <= weekKey;
    return true;
  });

  const doneCount = filtered.filter(t => t.done).length;

  const showAlert = (cfg) => setAlertConfig(cfg);

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTask = (id, text) => {
    showAlert({
      title: 'Elimina Task',
      message: `Rimuovere "${text}"?`,
      buttons: [
        { text: 'Annulla', style: 'cancel', onPress: () => setAlertConfig(null) },
        { text: 'Elimina', style: 'destructive', onPress: () => {
          setTasks(prev => prev.filter(t => t.id !== id));
          setAlertConfig(null);
        }},
      ],
    });
  };

  const aggiungiTask = () => {
    if (!formText.trim()) {
      showAlert({
        title: 'Errore', message: 'Inserisci la descrizione',
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }],
      });
      return;
    }
    const newId = Math.max(0, ...tasks.map(t => t.id)) + 1;
    setTasks(prev => [...prev, {
      id: newId, text: formText.trim(), done: false,
      materia: formMateria.trim(), priorita: formPriorita,
      data: formData || today,
    }]);
    setFormText(''); setFormMateria('');
    setFormPriorita('media'); setFormData(today);
    setModalVisible(false);
  };

  const prioritaColor = (p) => p === 'alta' ? 'red' : p === 'media' ? 'amber' : 'muted';

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        <View style={styles.header}>
          <Text style={styles.title}>📚 Studio</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addFab}>
            <Text style={styles.addFabText}>+ Task</Text>
          </TouchableOpacity>
        </View>

        {/* ── Filtri ── */}
        <View style={styles.filters}>
          {[['today', 'Oggi'], ['week', 'Settimana'], ['all', 'Tutti']].map(([f, label]) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
            >
              <Text style={[styles.filterText, filter === f && { color: COLORS.accent }]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.counterText}>{doneCount}/{filtered.length} completati</Text>

        {/* ── Lista task ── */}
        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>Nessun task 🎉</Text>
        ) : (
          filtered.map(t => (
            <Card key={t.id} style={styles.taskCard}>
              <View style={styles.taskRow}>
                <TouchableOpacity onPress={() => toggleTask(t.id)} style={styles.checkboxWrap}>
                  <View style={[
                    styles.checkbox,
                    { borderColor: COLORS.border2, backgroundColor: t.done ? COLORS.green : 'transparent' },
                  ]}>
                    {t.done && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
                <Text style={[styles.taskText, t.done && styles.taskTextDone]}>{t.text}</Text>
                <TouchableOpacity onPress={() => deleteTask(t.id, t.text)} style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.pillsRow}>
                {t.materia ? <Pill color="muted">{t.materia}</Pill> : null}
                <Pill color={prioritaColor(t.priorita)}>{t.priorita}</Pill>
                {t.data && t.data !== today && (
                  <Pill color="muted">{t.data}</Pill>
                )}
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* ── Modal Aggiungi ── */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalWrapper}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Nuovo Task</Text>

            <TextInput
              style={styles.input}
              placeholder="Cosa devi fare?"
              placeholderTextColor={COLORS.textSub}
              value={formText}
              onChangeText={setFormText}
              autoFocus
            />
            <TextInput
              style={styles.input}
              placeholder="Materia (opzionale)"
              placeholderTextColor={COLORS.textSub}
              value={formMateria}
              onChangeText={setFormMateria}
            />
            <TextInput
              style={styles.input}
              placeholder="Data (YYYY-MM-DD)"
              placeholderTextColor={COLORS.textSub}
              value={formData}
              onChangeText={setFormData}
            />

            <Text style={styles.fieldLabel}>Priorità:</Text>
            <View style={styles.prioritaRow}>
              {['alta', 'media', 'bassa'].map(p => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setFormPriorita(p)}
                  style={[styles.prioritaChip, formPriorita === p && styles.prioritaChipActive]}
                >
                  <Text style={[styles.prioritaChipText, formPriorita === p && { color: COLORS.accent }]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtn}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={aggiungiTask}>
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
  root:   { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  content:{ padding: 16, paddingBottom: 32 },

  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title:     { fontSize: 28, fontWeight: '700', color: COLORS.text },
  addFab:    { backgroundColor: COLORS.accent, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  addFabText:{ color: '#fff', fontSize: 14, fontWeight: '700' },

  filters:     { flexDirection: 'row', gap: 8, marginBottom: 10 },
  filterPill:  { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.bg2 },
  filterPillActive: { backgroundColor: COLORS.accentGlow },
  filterText:  { fontSize: 12, color: COLORS.textMuted },
  counterText: { fontSize: 12, color: COLORS.textSub, marginBottom: 12 },
  emptyText:   { fontSize: 13, color: COLORS.textSub, textAlign: 'center', marginTop: 20 },

  taskCard:    { marginBottom: 8, padding: 12 },
  taskRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkboxWrap:{ padding: 2 },
  checkbox:    { width: 20, height: 20, borderWidth: 1.5, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  checkmark:   { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  taskText:    { flex: 1, fontSize: 13, color: COLORS.text },
  taskTextDone:{ textDecorationLine: 'line-through', color: COLORS.textSub },
  deleteBtn:   { padding: 4 },
  deleteBtnText:{ fontSize: 14, color: COLORS.textSub },
  pillsRow:    { flexDirection: 'row', gap: 6, marginTop: 6 },

  // Modal
  modalWrapper:  { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modal: {
    backgroundColor: COLORS.bg2,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    borderTopWidth: 1, borderColor: COLORS.border,
  },
  modalHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.bg4, alignSelf: 'center', marginBottom: 16 },
  modalTitle:   { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 16, textAlign: 'center' },
  input:        { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 14, marginBottom: 10 },
  fieldLabel:   { color: COLORS.textSub, fontSize: 13, marginBottom: 8 },
  prioritaRow:  { flexDirection: 'row', gap: 8, marginBottom: 16 },
  prioritaChip: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.bg4, alignItems: 'center' },
  prioritaChipActive: { backgroundColor: COLORS.accentGlow },
  prioritaChipText:   { fontSize: 12, color: COLORS.textMuted },
  modalBtns:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cancelBtn:    { color: COLORS.textSub, fontSize: 15, padding: 10 },
  confirmBtn:   { backgroundColor: COLORS.accent, paddingVertical: 12, paddingHorizontal: 22, borderRadius: 10 },
  confirmBtnText:{ color: '#fff', fontSize: 14, fontWeight: '700' },
});