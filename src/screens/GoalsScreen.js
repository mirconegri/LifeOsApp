// src/screens/GoalsScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Card } from '../components/Card';
import { Pill } from '../components/Pill';
import { COLORS } from '../config/colors';
import { CustomAlert } from '../components/CustomAlert';
import { DatePicker } from '../components/DatePicker';

const GOAL_CATEGORIES = ['Study', 'Sport', 'Finance', 'Health', 'Personal', 'Work'];
const PRIORITY_OPTS   = ['low', 'medium', 'high'];
const FILTERS         = ['All', 'Active', 'Completed', 'Expired'];

export default function GoalsScreen({ goals, setGoals }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId]       = useState(null);
  const [title, setTitle]               = useState('');
  const [description, setDescription]   = useState('');
  const [targetInput, setTargetInput]   = useState('');
  const [currentProgress, setCurrentProgress] = useState('');
  const [category, setCategory]         = useState('Study');
  const [priority, setPriority]         = useState('medium');
  const [deadline, setDeadline]         = useState('');
  const [filter, setFilter]             = useState('All');
  const [alertConfig, setAlertConfig]   = useState(null);

  const resetForm = () => {
    setTitle(''); setDescription(''); setTargetInput('');
    setCurrentProgress('0'); setCategory('Study');
    setPriority('medium'); setDeadline('');
  };

  const openAddModal = () => {
    setEditingId(null);
    resetForm();
    setModalVisible(true);
  };

  // New: tapping any goal card opens it here, pre-filled, instead of only
  // ever being able to create new ones. This was the main "not editable"
  // bug — there was no openEditModal/editingId at all before.
  const openEditModal = (goal) => {
    setEditingId(goal.id);
    setTitle(goal.title);
    setDescription(goal.description || '');
    setTargetInput(String(goal.target));
    setCurrentProgress(String(goal.progress));
    setCategory(goal.category);
    setPriority(goal.priority);
    setDeadline(goal.deadline || '');
    setModalVisible(true);
  };

  const saveGoal = () => {
    const t = title.trim();
    const target = parseFloat(targetInput.replace(',', '.')) || 0;
    const progress = parseFloat(currentProgress.replace(',', '.')) || 0;

    if (!t) {
      setAlertConfig({ title: 'Error', message: 'Please enter a title.',
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }] }); return;
    }
    if (target <= 0) {
      setAlertConfig({ title: 'Error', message: 'Please enter a valid target.',
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }] }); return;
    }

    if (editingId) {
      setGoals(prev => prev.map(o => o.id === editingId ? {
        ...o,
        title: t,
        description: description.trim(),
        target,
        progress: Math.max(0, Math.min(target, progress)),
        category, priority,
        deadline: deadline.trim(),
        completed: progress >= target,
      } : o));
    } else {
      const newId = Math.max(0, ...goals.map(o => o.id || 0)) + 1;
      setGoals(prev => [{
        id: newId, title: t, description: description.trim(), target,
        progress: Math.max(0, Math.min(target, progress)),
        category, priority, deadline: deadline.trim(),
        completed: progress >= target,
      }, ...prev]);
    }
    setModalVisible(false);
  };

  const updateProgress = (id, delta) => {
    setGoals(prev => prev.map(o => {
      if (o.id !== id) return o;
      const newVal = Math.max(0, Math.min(o.target, o.progress + delta));
      return { ...o, progress: newVal, completed: newVal >= o.target };
    }));
  };

  const setDirectProgress = (id, val) => {
    setGoals(prev => prev.map(o => {
      if (o.id !== id) return o;
      const v = parseFloat(val.replace(',', '.')) || 0;
      return { ...o, progress: Math.max(0, Math.min(o.target, v)), completed: v >= o.target };
    }));
  };

  const deleteGoal = (id) => {
    setAlertConfig({
      title: 'Delete Goal?',
      message: '',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => setAlertConfig(null) },
        { text: 'Delete', style: 'destructive', onPress: () => {
          setGoals(prev => prev.filter(o => o.id !== id));
          setAlertConfig(null); setModalVisible(false);
        }},
      ],
    });
  };

  const priorityColor = (p) => p === 'high' ? COLORS.red : p === 'medium' ? COLORS.amber : COLORS.green;
  const priorityLabel = (p) => p === 'high' ? '🔴 High' : p === 'medium' ? '🟡 Medium' : '🟢 Low';

  const filteredGoals = goals.filter(o => {
    if (filter === 'Active') return !o.completed;
    if (filter === 'Completed') return o.completed;
    if (filter === 'Expired') return o.deadline && !o.completed && new Date(o.deadline) < new Date();
    return true;
  });

  const activeCount = goals.filter(o => !o.completed).length;
  const completedCount = goals.filter(o => o.completed).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>🎯 Goals</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addFab}>
          <Text style={styles.addFabText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.statVal}>{activeCount}</Text>
          <Text style={styles.statLbl}>Active</Text>
        </View>
        <View style={[styles.statCard, { flex: 1, marginLeft: 8 }]}>
          <Text style={[styles.statVal, { color: COLORS.green }]}>{completedCount}</Text>
          <Text style={styles.statLbl}>Completed</Text>
        </View>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
        {FILTERS.map(f => (
          <View key={f} style={{ marginRight: 8 }}>
            <Pill label={f} selected={filter === f} onPress={() => setFilter(f)} />
          </View>
        ))}
      </ScrollView>

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <Card><Text style={styles.emptyText}>No goals found in this category.</Text></Card>
      ) : filteredGoals.map(ob => {
        const pct = ob.target > 0 ? Math.min(100, (ob.progress / ob.target) * 100) : 0;
        const isExpired = ob.deadline && !ob.completed && new Date(ob.deadline) < new Date();
        return (
          <Card key={ob.id} style={ob.completed ? styles.cardCompleted : isExpired ? styles.cardExpired : null}>
            {/* Tapping the title row opens the edit modal — this is the new
                entry point for editing a goal that didn't exist before. */}
            <TouchableOpacity onPress={() => openEditModal(ob)} style={styles.obHeader}>
              <View style={styles.obTitleRow}>
                <Text style={[styles.obTitle, ob.completed && styles.obDone]}>{ob.title}</Text>
                {ob.completed && <Text style={styles.checkEmoji}>✅</Text>}
                {isExpired && <Text style={styles.checkEmoji}>⚠️</Text>}
                <Text style={styles.editHint}>✎</Text>
              </View>
              <TouchableOpacity onPress={() => deleteGoal(ob.id)} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                <Text style={styles.trashBtn}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>

            {ob.description ? <Text style={styles.obDesc}>{ob.description}</Text> : null}

            <View style={styles.obMeta}>
              <View style={{ marginRight: 8 }}>
                <Pill color="muted">{ob.category}</Pill>
              </View>
              <Text style={{ color: priorityColor(ob.priority), fontSize: 12, fontWeight: '600', marginRight: 8 }}>
                {priorityLabel(ob.priority)}
              </Text>
              {ob.deadline ? (
                <Text style={[styles.deadline, isExpired && styles.deadlineExpired]}>
                  📅 {ob.deadline}
                </Text>
              ) : null}
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: ob.completed ? COLORS.green : COLORS.accent }]} />
              </View>
              <Text style={styles.progressText}>{pct.toFixed(0)}%</Text>
            </View>

            <View style={styles.progressNumbers}>
              <Text style={styles.progressCurr}>{ob.progress}</Text>
              <Text style={styles.progressTarget}> / {ob.target}</Text>
            </View>

            <View style={styles.stepperRow}>
              <TouchableOpacity style={styles.stepBtn} onPress={() => updateProgress(ob.id, -1)}>
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.stepInput}
                value={String(ob.progress)}
                onChangeText={v => setDirectProgress(ob.id, v)}
                keyboardType="decimal-pad"
                placeholderTextColor={COLORS.textSub}
              />
              <TouchableOpacity style={styles.stepBtn} onPress={() => updateProgress(ob.id, 1)}>
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                style={[styles.completeBtn, ob.completed && styles.completeBtnDone]}
                onPress={() => updateProgress(ob.id, ob.target - ob.progress)}>
                <Text style={styles.completeBtnText}>{ob.completed ? '✓ Done' : '✓ Complete'}</Text>
              </TouchableOpacity>
            </View>
          </Card>
        );
      })}

      {/* Create / Edit Modal */}
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
            <Text style={styles.modalTitle}>{editingId ? '🎯 Edit Goal' : '🎯 New Goal'}</Text>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">
              <Text style={styles.fieldLabel}>Title</Text>
              <TextInput style={styles.input} placeholder="e.g. Run a half marathon"
                placeholderTextColor={COLORS.textSub} value={title} onChangeText={setTitle} />

              <Text style={styles.fieldLabel}>Description (optional)</Text>
              <TextInput style={[styles.input, styles.noteInput]} placeholder="More details about this goal..."
                placeholderTextColor={COLORS.textSub} value={description}
                onChangeText={setDescription} multiline />

              {/* These two fields used to be two unlabeled boxes side by
                  side with only placeholder text ("Numeric target" /
                  "Start (e.g. 0)") — nothing told you what they meant
                  until you tried typing in them. Each now has its own
                  full-width row with an explicit label above it, plus a
                  one-line explanation of what the number represents. */}
              <Text style={styles.fieldLabel}>Goal target — the finish line</Text>
              <Text style={styles.fieldHint}>The number that means "done". E.g. 21 for a 21km run, or 1000 for €1000 saved.</Text>
              <TextInput style={styles.input} placeholder="e.g. 21"
                placeholderTextColor={COLORS.textSub} value={targetInput}
                onChangeText={setTargetInput} keyboardType="decimal-pad" />

              <Text style={styles.fieldLabel}>Current progress — where you are now</Text>
              <Text style={styles.fieldHint}>How far along you already are, in the same unit as the target above.</Text>
              <TextInput style={styles.input} placeholder="e.g. 0"
                placeholderTextColor={COLORS.textSub} value={currentProgress}
                onChangeText={setCurrentProgress} keyboardType="decimal-pad" />

              <Text style={styles.fieldLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 10}}>
                {GOAL_CATEGORIES.map(c => (
                  <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[styles.catPill, category === c && styles.catPillActive]}>
                    <Text style={[styles.catPillText, category === c && {color: COLORS.accent}]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>Priority</Text>
              <View style={styles.priorityRow}>
                {PRIORITY_OPTS.map((p, idx) => (
                  <TouchableOpacity key={p} onPress={() => setPriority(p)}
                    style={[styles.priorityBtn, priority === p && { borderColor: priorityColor(p), backgroundColor: priorityColor(p) + '22' }, idx < 2 && { marginRight: 10 }]}>
                    <Text style={[styles.priorityText, priority === p && { color: priorityColor(p) }]}>
                      {priorityLabel(p)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Deadline (optional)</Text>
              <DatePicker
                value={deadline}
                onChange={setDeadline}
                mode="any"
                label="Select deadline"
              />

              <View style={styles.modalBtns}>
                {editingId ? (
                  <TouchableOpacity onPress={() => deleteGoal(editingId)}>
                    <Text style={styles.deleteTextBtn}>Delete</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Text style={styles.cancelBtn}>Cancel</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.confirmBtn} onPress={saveGoal}>
                  <Text style={styles.confirmBtnText}>{editingId ? 'Save Changes' : 'Create Goal'}</Text>
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
  statsRow: { flexDirection: 'row', marginBottom: 16 },
  statCard: { backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 16, alignItems: 'center' },
  statVal: { fontSize: 28, fontWeight: '700', color: COLORS.accent },
  statLbl: { fontSize: 12, color: COLORS.textSub, marginTop: 4 },
  pillRow: { marginBottom: 16, flexDirection: 'row' },
  emptyText: { color: COLORS.textSub, fontSize: 14, textAlign: 'center', marginVertical: 20 },
  cardCompleted: { opacity: 0.7 },
  cardExpired: { borderColor: COLORS.red + '44', borderWidth: 1 },
  obHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  obTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  obTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1 },
  obDone: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  checkEmoji: { fontSize: 14, marginLeft: 6 },
  editHint: { fontSize: 12, color: COLORS.textSub, marginLeft: 8 },
  trashBtn: { color: COLORS.textSub, fontSize: 14, padding: 4 },
  obDesc: { fontSize: 13, color: COLORS.textMuted, marginBottom: 8 },
  obMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 },
  deadline: { fontSize: 12, color: COLORS.textMuted },
  deadlineExpired: { color: COLORS.red, fontWeight: '600' },
  progressSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  progressBar: { flex: 1, height: 8, backgroundColor: COLORS.bg4, borderRadius: 4, marginRight: 10, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', width: 36, textAlign: 'right' },
  progressNumbers: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  progressCurr: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  progressTarget: { fontSize: 14, color: COLORS.textMuted },
  stepperRow: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.bg4, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { fontSize: 18, color: COLORS.text, fontWeight: '700' },
  stepInput: { width: 56, marginHorizontal: 8, textAlign: 'center', backgroundColor: COLORS.bg3, borderRadius: 8, paddingVertical: 6, color: COLORS.text, fontSize: 13 },
  completeBtn: { backgroundColor: COLORS.bg4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  completeBtnDone: { backgroundColor: COLORS.green + '33' },
  completeBtnText: { fontSize: 12, color: COLORS.text, fontWeight: '700' },

  // Modal
  modalWrapper:  { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modal: {
    backgroundColor: COLORS.bg2,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    borderWidth: 1, borderColor: COLORS.border, borderBottomWidth: 0,
    maxHeight: '88%',
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.bg4, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 16, textAlign: 'center' },
  input: { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 14, marginBottom: 12 },
  noteInput: { height: 70, textAlignVertical: 'top' },
  fieldLabel: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginBottom: 4, marginTop: 4 },
  fieldHint: { color: COLORS.textSub, fontSize: 11, marginBottom: 8, lineHeight: 15 },
  catPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, backgroundColor: COLORS.bg4, marginRight: 8 },
  catPillActive: { backgroundColor: COLORS.accentGlow, borderWidth: 1, borderColor: COLORS.accent },
  catPillText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  priorityRow: { flexDirection: 'row', marginBottom: 14 },
  priorityBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: COLORS.bg4, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  priorityText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  cancelBtn: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600', paddingHorizontal: 16, paddingVertical: 12 },
  deleteTextBtn: { color: COLORS.red, fontSize: 14, fontWeight: '600', paddingHorizontal: 16, paddingVertical: 12 },
  confirmBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
