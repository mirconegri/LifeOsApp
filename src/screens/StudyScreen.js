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
  const [formSubject,  setFormSubject]  = useState('');
  const [formPriority, setFormPriority] = useState('medium');
  const [formDate,     setFormDate]     = useState(todayKey());
  const [alertConfig,  setAlertConfig]  = useState(null);

  const today = todayKey();
  const endOfWeek = new Date();
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
  const weekKey = endOfWeek.toISOString().slice(0, 10);

  // Filter Tasks based on tab selection
  const filtered = tasks.filter(t => {
    if (filter === 'today') return t.date === today;
    if (filter === 'week')  return t.date >= today && t.date <= weekKey;
    return true;
  });

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleAddTask = () => {
    if (!formText.trim()) return;
    const newTask = {
      id: Date.now(),
      text: formText.trim(),
      subject: formSubject.trim() || null,
      priority: formPriority,
      date: formDate,
      done: false
    };
    setTasks(prev => [newTask, ...prev]);
    
    // Reset fields
    setFormText('');
    setFormSubject('');
    setFormPriority('medium');
    setFormDate(todayKey());
    setModalVisible(false);
  };

  const confirmDelete = (id) => {
    setAlertConfig({
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task?',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => setAlertConfig(null) },
        { text: 'Delete', style: 'destructive', onPress: () => {
            setTasks(prev => prev.filter(t => t.id !== id));
            setAlertConfig(null);
          }
        }
      ]
    });
  };

  const getPriorityColor = (p) => {
    if (p === 'high') return 'red';
    if (p === 'medium') return 'amber';
    return 'muted';
  };

  return (
    <View style={styles.container}>
      <CustomAlert config={alertConfig} />

      {/* ─── Tabs Bar ─── */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
          {['today', 'week', 'all'].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setFilter(tab)}
              style={[styles.tab, filter === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, filter === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add Task</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Task List ─── */}
      <ScrollView contentContainerStyle={styles.list}>
        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>No tasks found.</Text>
        ) : (
          filtered.map((t) => (
            <Card key={t.id} style={[styles.taskCard, t.done && styles.taskCardDone]}>
              <TouchableOpacity onPress={() => toggleTask(t.id)} style={styles.checkArea}>
                <View style={[styles.checkbox, t.done && styles.checkboxChecked]}>
                  {t.done && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <View style={styles.taskMeta}>
                  <Text style={[styles.taskText, t.done && styles.taskTextDone]}>
                    {t.text}
                  </Text>
                  {t.subject && <Text style={styles.taskSubject}>📚 {t.subject}</Text>}
                </View>
              </TouchableOpacity>

              <View style={styles.rightAction}>
                <Pill color={getPriorityColor(t.priority)}>{t.priority}</Pill>
                <TouchableOpacity onPress={() => confirmDelete(t.id)} style={styles.deleteBtn}>
                  <Text style={styles.deleteIcon}>✕</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* ─── Add Task Bottom Sheet Modal ─── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalWrapper}
        >
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setModalVisible(false)} />
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>New Task</Text>

            <TextInput
              placeholder="Task description..."
              placeholderTextColor={COLORS.textSub}
              value={formText}
              onChangeText={setFormText}
              style={styles.input}
            />

            <TextInput
              placeholder="Subject name (optional)..."
              placeholderTextColor={COLORS.textSub}
              value={formSubject}
              onChangeText={setFormSubject}
              style={styles.input}
            />

            <TextInput
              placeholder="Date (YYYY-MM-DD)..."
              placeholderTextColor={COLORS.textSub}
              value={formDate}
              onChangeText={setFormDate}
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {['low', 'medium', 'high'].map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setFormPriority(p)}
                  style={[styles.priorityChip, formPriority === p && styles.priorityChipActive, { marginRight: 8 }]}
                >
                  <Text style={[styles.priorityChipText, formPriority === p && styles.priorityChipTextActive]}>
                    {p.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.formBtn, styles.btnCancel]}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddTask} style={[styles.formBtn, styles.btnSave]}>
                <Text style={styles.btnSaveText}>Save</Text>
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  tabsContainer: { flexDirection: 'row', padding: 16, alignItems: 'center', justifyContent: 'space-between' },
  tabs: { flexDirection: 'row', backgroundColor: COLORS.bg2, borderRadius: 10, padding: 4, flex: 1, marginRight: 12 },
  tab: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: COLORS.bg4 },
  tabText: { fontSize: 13, color: COLORS.textMuted },
  tabTextActive: { color: COLORS.text, fontWeight: '600' },
  addBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  list: { padding: 16, paddingTop: 0 },
  emptyText: { color: COLORS.textMuted, textAlign: 'center', marginTop: 40, fontSize: 14 },
  
  taskCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingVertical: 12 },
  taskCardDone: { opacity: 0.5 },
  checkArea: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkboxChecked: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  checkMark: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  taskMeta: { flex: 1 },
  taskText: { color: COLORS.text, fontSize: 14, fontWeight: '500' },
  taskTextDone: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  taskSubject: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 },
  rightAction: { flexDirection: 'row', alignItems: 'center' },
  deleteBtn: { padding: 8, marginLeft: 8 },
  deleteIcon: { color: COLORS.textSub, fontSize: 14 },

  modalWrapper: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modal: { backgroundColor: COLORS.bg2, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: COLORS.border },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.bg4, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 16, textAlign: 'center' },
  input: { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 14, marginBottom: 10 },
  fieldLabel: { color: COLORS.textSub, fontSize: 13, marginBottom: 8 },
  priorityRow: { flexDirection: 'row', marginBottom: 16 },
  priorityChip: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.bg4, alignItems: 'center' },
  priorityChipActive: { backgroundColor: COLORS.accentGlow },
  priorityChipText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  priorityChipTextActive: { color: COLORS.accent },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  formBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnCancel: { backgroundColor: COLORS.bg4, marginRight: 10 },
  btnCancelText: { color: COLORS.textMuted, fontWeight: '600' },
  btnSave: { backgroundColor: COLORS.accent },
  btnSaveText: { color: '#fff', fontWeight: '700' }
});