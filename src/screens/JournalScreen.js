import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Card } from '../components/Card';
import { Pill } from '../components/Pill';
import { COLORS } from '../config/colors';
import { CustomAlert } from '../components/CustomAlert';
import { DatePicker } from '../components/DatePicker';
import { todayKey, diffDays } from '../data/helpers';

export default function JournalScreen({ journal, setJournal }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [formText, setFormText]         = useState('');
  const [formSubject, setFormSubject]   = useState('');
  const [formPriority, setFormPriority] = useState('medium');
  const [formDate, setFormDate]         = useState(todayKey());
  const [alertConfig, setAlertConfig]   = useState(null);

  const openModal = () => {
    setFormText(''); setFormSubject(''); setFormPriority('medium'); setFormDate(todayKey());
    setModalVisible(true);
  };

  const addEntry = () => {
    const t = formText.trim();
    if (!t) {
      setAlertConfig({ title: 'Error', message: 'Please enter a description.',
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }] });
      return;
    }

    const newId = Math.max(0, ...journal.map(x => x.id || 0)) + 1;
    setJournal(prev => [
      ...prev,
      { id: newId, text: t, subject: formSubject.trim(), priority: formPriority, date: formDate || todayKey(), done: false }
    ]);
    setModalVisible(false);
  };

  const toggleEntry = (id) => {
    setJournal(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteEntry = (id) => {
    setAlertConfig({
      title: 'Delete Entry',
      message: 'Do you want to remove this entry?',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => setAlertConfig(null) },
        { text: 'Delete', style: 'destructive', onPress: () => {
          setJournal(prev => prev.filter(t => t.id !== id));
          setAlertConfig(null);
        }},
      ],
    });
  };

  const priorityColor = (p) => p === 'high' ? 'red' : p === 'medium' ? 'amber' : 'green';

  // Group entries by date
  const groupedEntries = useMemo(() => {
    const groups = {};
    journal.forEach(t => {
      const d = t.date || todayKey();
      if (!groups[d]) groups[d] = [];
      groups[d].push(t);
    });
    // Sort dates (newest first)
    const sortedKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b));
    return sortedKeys.map(k => ({ date: k, items: groups[k] }));
  }, [journal]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>📅 Journal</Text>
        <TouchableOpacity onPress={openModal} style={styles.addFab}>
          <Text style={styles.addFabText}>+ Entry</Text>
        </TouchableOpacity>
      </View>

      {groupedEntries.length === 0 ? (
        <Card><Text style={styles.emptyText}>No entries in the journal.</Text></Card>
      ) : (
        groupedEntries.map(group => (
          <View key={group.date} style={styles.dateGroup}>
            <Text style={styles.dateTitle}>
              {group.date === todayKey() ? 'Today' : diffDays(group.date) === 1 ? 'Tomorrow' : group.date}
            </Text>
            {group.items.map(t => (
              <Card key={t.id} style={t.done ? styles.cardDone : styles.cardActive}>
                <View style={styles.taskRow}>
                  <TouchableOpacity onPress={() => toggleEntry(t.id)} style={styles.checkWrap}>
                    <View style={[styles.checkbox, t.done && styles.checkboxChecked]}>
                      {t.done && <Text style={styles.checkText}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskText, t.done && styles.taskTextStriked]}>{t.text}</Text>
                    {t.subject ? <Text style={styles.taskSubject}>{t.subject}</Text> : null}
                  </View>
                  <Pill color={priorityColor(t.priority)}>{t.priority}</Pill>
                  <TouchableOpacity onPress={() => deleteEntry(t.id)} style={styles.trashBtn}>
                    <Text style={styles.trashIcon}>✕</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        ))
      )}

      {/* Add Modal — now wrapped in KeyboardAvoidingView + a scrollable
          inner container with keyboardShouldPersistTaps="handled", and the
          date field uses the same calendar DatePicker as Exams/Finances/Goals. */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalWrapper}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>New Entry</Text>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.input}
                placeholder="What do you need to do?"
                placeholderTextColor={COLORS.textSub}
                value={formText}
                onChangeText={setFormText}
                autoFocus
              />
              <TextInput
                style={styles.input}
                placeholder="Subject or Category (optional)"
                placeholderTextColor={COLORS.textSub}
                value={formSubject}
                onChangeText={setFormSubject}
              />

              <Text style={styles.fieldLabel}>Date:</Text>
              <DatePicker
                value={formDate}
                onChange={setFormDate}
                mode="any"
                label="Select date"
              />

              <Text style={styles.fieldLabel}>Priority:</Text>
              <View style={styles.pillRow}>
                {['low', 'medium', 'high'].map((p, idx) => (
                  <TouchableOpacity key={p} onPress={() => setFormPriority(p)} style={[styles.priorityBtn, formPriority === p && styles.priorityBtnActive, idx < 2 && { marginRight: 10 }]}>
                    <Text style={[styles.priorityText, formPriority === p && {color: COLORS.accent}]}>{p.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalBtns}>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelBtn}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={addEntry}>
                  <Text style={styles.confirmBtnText}>Save</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CustomAlert config={alertConfig} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text },
  addFab: { backgroundColor: COLORS.accent, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  addFabText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  emptyText: { color: COLORS.textSub, textAlign: 'center', marginVertical: 20 },
  dateGroup: { marginBottom: 20 },
  dateTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  cardActive: { marginBottom: 8, padding: 12 },
  cardDone: { marginBottom: 8, padding: 12, opacity: 0.6 },
  taskRow: { flexDirection: 'row', alignItems: 'center' },
  checkWrap: { marginRight: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.border2, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  checkText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  taskInfo: { flex: 1 },
  taskText: { fontSize: 15, color: COLORS.text },
  taskTextStriked: { textDecorationLine: 'line-through', color: COLORS.textSub },
  taskSubject: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  trashBtn: { padding: 8, marginLeft: 8 },
  trashIcon: { color: COLORS.textSub, fontSize: 16 },

  // Modal
  modalWrapper:  { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  modal: {
    backgroundColor: COLORS.bg2,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    borderTopWidth: 1, borderColor: COLORS.border,
    maxHeight: '88%',
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.bg4, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 15, marginBottom: 12 },
  fieldLabel: { color: COLORS.textSub, fontSize: 13, marginBottom: 8 },
  pillRow: { flexDirection: 'row', marginBottom: 20 },
  priorityBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: COLORS.bg3, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  priorityBtnActive: { backgroundColor: COLORS.accentGlow, borderColor: COLORS.accent },
  priorityText: { fontSize: 12, color: COLORS.textSub, fontWeight: '600' },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cancelBtn: { color: COLORS.textSub, fontSize: 16, padding: 10 },
  confirmBtn: { backgroundColor: COLORS.accent, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
