import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Card } from '../components/Card';
import { Pill } from '../components/Pill';
import { COLORS } from '../config/colors';

export default function GoalsScreen({ goals, setGoals }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle]               = useState('');
  const [description, setDescription]   = useState('');
  const [targetInput, setTargetInput]   = useState('');
  const [currentProgress, setCurrentProgress] = useState('');
  const [category, setCategory]         = useState('Study');
  const [priority, setPriority]         = useState('medium');
  const [deadline, setDeadline]         = useState('');
  const [filter, setFilter]             = useState('All');

  const GOAL_CATEGORIES = ['Study', 'Sport', 'Finance', 'Health', 'Personal', 'Work'];
  const PRIORITY_OPTS   = ['low', 'medium', 'high'];
  const FILTERS         = ['All', 'Active', 'Completed', 'Expired'];

  const openModal = () => {
    setTitle(''); setDescription(''); setTargetInput('');
    setCurrentProgress('0'); setCategory('Study');
    setPriority('medium'); setDeadline('');
    setModalVisible(true);
  };

  const addGoal = () => {
    const t = title.trim();
    const target = parseFloat(targetInput.replace(',', '.')) || 0;
    if (!t) { Alert.alert('Error', 'Please enter a title'); return; }
    if (target <= 0) { Alert.alert('Error', 'Please enter a valid target'); return; }
    
    const newId = Math.max(0, ...goals.map(o => o.id || 0)) + 1;
    
    const goal = {
      id: newId,
      title: t,
      description: description.trim(),
      target,
      progress: parseFloat(currentProgress.replace(',', '.')) || 0,
      category,
      priority,
      deadline: deadline.trim(),
      completed: false,
    };
    
    setGoals(prev => [goal, ...prev]);
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
    Alert.alert('Delete Goal?', '', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        setGoals(prev => prev.filter(o => o.id !== id));
      }}
    ]);
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
        <TouchableOpacity onPress={openModal} style={styles.addFab}>
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
            <View style={styles.obHeader}>
              <View style={styles.obTitleRow}>
                <Text style={[styles.obTitle, ob.completed && styles.obDone]}>{ob.title}</Text>
                {ob.completed && <Text style={styles.checkEmoji}>✅</Text>}
                {isExpired && <Text style={styles.checkEmoji}>⚠️</Text>}
              </View>
              <TouchableOpacity onPress={() => deleteGoal(ob.id)}>
                <Text style={styles.trashBtn}>✕</Text>
              </TouchableOpacity>
            </View>

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

      {/* Create Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>🎯 New Goal</Text>

            <TextInput style={styles.input} placeholder="Goal title"
              placeholderTextColor={COLORS.textSub} value={title} onChangeText={setTitle} />
            <TextInput style={[styles.input, styles.noteInput]} placeholder="Description (opt.)"
              placeholderTextColor={COLORS.textSub} value={description}
              onChangeText={setDescription} multiline />

            <View style={styles.row2}>
              <TextInput style={[styles.input, styles.smallInput, { marginRight: 10 }]} placeholder="Numeric target"
                placeholderTextColor={COLORS.textSub} value={targetInput}
                onChangeText={setTargetInput} keyboardType="decimal-pad" />
              <TextInput style={[styles.input, styles.smallInput]} placeholder="Start (e.g. 0)"
                placeholderTextColor={COLORS.textSub} value={currentProgress}
                onChangeText={setCurrentProgress} keyboardType="decimal-pad" />
            </View>

            <Text style={styles.fieldLabel}>Category:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 10}}>
              {GOAL_CATEGORIES.map(c => (
                <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[styles.catPill, category === c && styles.catPillActive]}>
                   <Text style={[styles.catPillText, category === c && {color: COLORS.accent}]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Priority:</Text>
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

            <TextInput style={styles.input} placeholder="Deadline (e.g. 2026-12-31)"
              placeholderTextColor={COLORS.textSub} value={deadline} onChangeText={setDeadline} />

            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtn}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={addGoal}>
                <Text style={styles.confirmBtnText}>Create Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  obTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  obTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 6 },
  obDone: { textDecorationLine: 'line-through', color: COLORS.textSub },
  checkEmoji: { fontSize: 14, marginRight: 6 },
  trashBtn: { fontSize: 16, marginLeft: 8, padding: 4, color: COLORS.textMuted },
  obDesc: { fontSize: 13, color: COLORS.textMuted, marginBottom: 8, lineHeight: 18 },
  obMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' },
  deadline: { fontSize: 12, color: COLORS.textMuted },
  deadlineExpired: { color: COLORS.red, fontWeight: '600' },
  progressSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  progressBar: { flex: 1, height: 8, backgroundColor: COLORS.bg4, borderRadius: 4, overflow: 'hidden', marginRight: 10 },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 13, color: COLORS.accent, fontWeight: '700', minWidth: 36, textAlign: 'right' },
  progressNumbers: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  progressCurr: { fontSize: 14, color: COLORS.text },
  progressTarget: { fontSize: 13, color: COLORS.textSub },
  stepperRow: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.bg4, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border, marginRight: 8 },
  stepBtnText: { fontSize: 18, color: COLORS.text, fontWeight: '600' },
  stepInput: { width: 70, backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 6, color: COLORS.text, fontSize: 14, textAlign: 'center', marginRight: 8 },
  completeBtn: { backgroundColor: COLORS.accent, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  completeBtnDone: { backgroundColor: COLORS.green },
  completeBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: COLORS.bg2, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 15, marginBottom: 10 },
  row2: { flexDirection: 'row' },
  smallInput: { flex: 1 },
  noteInput: { height: 60, textAlignVertical: 'top' },
  fieldLabel: { color: COLORS.textSub, fontSize: 13, marginBottom: 8, marginTop: 4 },
  catPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: COLORS.bg4, marginRight: 8},
  catPillActive: {backgroundColor: COLORS.accentGlow},
  catPillText: {fontSize: 12, color: COLORS.textMuted},
  priorityRow: { flexDirection: 'row', marginBottom: 10 },
  priorityBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', backgroundColor: COLORS.bg3 },
  priorityText: { fontSize: 13, color: COLORS.textSub },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  cancelBtn: { color: COLORS.textSub, fontSize: 15, paddingVertical: 12, paddingHorizontal: 20 },
  confirmBtn: { backgroundColor: COLORS.accent, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});