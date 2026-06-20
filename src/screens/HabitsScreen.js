import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Card } from '../components/Card';
import { COLORS } from '../config/colors';
import { CustomAlert } from '../components/CustomAlert';
import { DraggableList } from '../components/DraggableList';
import { todayKey, last7Days, localDateKey } from '../data/helpers';

export default function HabitsScreen({ habits, setHabits }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId]       = useState(null);
  const [formName, setFormName]         = useState('');
  const [formIcon, setFormIcon]         = useState('🌟');
  const [alertConfig, setAlertConfig]   = useState(null);

  const today    = todayKey();
  const pastWeek = last7Days();

  const showAlert = (config) => setAlertConfig(config);

  const toggleHabit = (id) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      const history = { ...(h.history || {}) };
      if (history[today]) {
        delete history[today];
      } else {
        history[today] = 1;
      }

      let streak = 0;
      const d = new Date();
      while (true) {
        const dateStr = localDateKey(d);
        if (history[dateStr]) {
          streak++;
          d.setDate(d.getDate() - 1);
        } else {
          if (dateStr === today) {
             d.setDate(d.getDate() - 1);
          } else {
             break;
          }
        }
      }

      return { ...h, history, streak };
    }));
  };

  const deleteHabit = (id, name) => {
    showAlert({
      title: 'Delete Habit',
      message: `Are you sure you want to delete "${name}"?`,
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => setAlertConfig(null) },
        { text: 'Delete', style: 'destructive', onPress: () => {
          setHabits(prev => prev.filter(h => h.id !== id));
          setAlertConfig(null); setModalVisible(false);
        }},
      ],
    });
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormName(''); setFormIcon('🌟');
    setModalVisible(true);
  };

  // New: tapping a habit's name/icon area opens it for editing instead of
  // only ever being able to add new ones.
  const openEditModal = (habit) => {
    setEditingId(habit.id);
    setFormName(habit.name);
    setFormIcon(habit.icon);
    setModalVisible(true);
  };

  const saveHabit = () => {
    if (!formName.trim()) {
      showAlert({
        title: 'Error', message: 'Please enter a name for the habit.',
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }]
      });
      return;
    }

    if (editingId) {
      setHabits(prev => prev.map(h => h.id === editingId
        ? { ...h, name: formName.trim(), icon: formIcon.trim() || '🌟' }
        : h
      ));
    } else {
      const newId = Math.max(0, ...habits.map(h => h.id || 0)) + 1;
      setHabits(prev => [...prev, {
        id: newId, name: formName.trim(), icon: formIcon.trim() || '🌟',
        streak: 0, history: {},
      }]);
    }
    setModalVisible(false);
    setFormName(''); setFormIcon('🌟'); setEditingId(null);
  };

  const handleReorder = (reordered) => setHabits(reordered);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.header}>
          <Text style={styles.title}>🔥 Habits</Text>
          <TouchableOpacity onPress={openAddModal} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptySub}>Start building your routine!</Text>
          </View>
        ) : (
          <>
            <Text style={styles.reorderHint}>Hold and drag a habit to reorder</Text>
            <DraggableList
              items={habits}
              keyExtractor={(h) => String(h.id)}
              onReorder={handleReorder}
              itemHeight={180}
              renderItem={(h) => {
                const isDoneToday = !!(h.history && h.history[today]);
                return (
                  <Card style={styles.habitCard}>
                    <TouchableOpacity onPress={() => openEditModal(h)} style={styles.habitHeader}>
                      <View style={styles.habitInfo}>
                        <Text style={styles.habitIcon}>{h.icon}</Text>
                        <Text style={styles.habitName}>{h.name}</Text>
                        <Text style={styles.editHint}>✎</Text>
                      </View>
                      <View style={styles.streakBadge}>
                        <Text style={styles.streakText}>🔥 {h.streak}</Text>
                      </View>
                    </TouchableOpacity>

                    <View style={styles.daysRow}>
                      {pastWeek.map(day => {
                        const done = !!(h.history && h.history[day]);
                        const isToday = day === today;
                        return (
                          <View key={day} style={styles.dayCol}>
                            <View style={[
                              styles.dayCircle,
                              done && styles.dayCircleDone,
                              isToday && styles.dayCircleToday
                            ]} />
                            <Text style={styles.dayLabel}>
                              {new Date(day).toLocaleDateString('en-US', { weekday: 'narrow' })}
                            </Text>
                          </View>
                        );
                      })}
                    </View>

                    <View style={styles.actionsRow}>
                       <TouchableOpacity onPress={() => toggleHabit(h.id)} style={[styles.mainBtn, isDoneToday && styles.mainBtnDone]}>
                          <Text style={styles.mainBtnText}>{isDoneToday ? 'Completed ✓' : 'Mark as Done'}</Text>
                       </TouchableOpacity>
                       <TouchableOpacity onPress={() => deleteHabit(h.id, h.name)} style={styles.deleteBtn}>
                          <Text style={styles.deleteText}>Delete</Text>
                       </TouchableOpacity>
                    </View>
                  </Card>
                );
              }}
            />
          </>
        )}
      </ScrollView>

      {/* Add / Edit Habit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalWrapper}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{editingId ? 'Edit Habit' : 'New Habit'}</Text>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.formRow}>
                <TextInput
                  style={[styles.input, styles.iconInput]}
                  value={formIcon}
                  onChangeText={setFormIcon}
                  maxLength={2}
                  placeholder="Icon"
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Name (e.g. Reading, Running)..."
                  placeholderTextColor={COLORS.textSub}
                  value={formName}
                  onChangeText={setFormName}
                  autoFocus
                />
              </View>

              <View style={styles.modalBtns}>
                {editingId ? (
                  <TouchableOpacity style={[styles.btn, styles.btnDelete]} onPress={() => deleteHabit(editingId, formName)}>
                    <Text style={styles.btnDeleteText}>Delete</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setModalVisible(false)}>
                    <Text style={styles.btnCancelText}>Cancel</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={saveHabit}>
                  <Text style={styles.btnSaveText}>{editingId ? 'Save' : 'Create'}</Text>
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
  content: { padding: 16, paddingBottom: 40 },
  header:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:   { fontSize: 28, fontWeight: '700', color: COLORS.text },
  addBtn:  { backgroundColor: COLORS.accent, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  addBtnText:{ color: '#fff', fontSize: 14, fontWeight: '700' },

  reorderHint: { fontSize: 11, color: COLORS.textSub, marginBottom: 10, textAlign: 'center' },

  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, color: COLORS.text, fontWeight: '700', marginBottom: 4 },
  emptySub:   { fontSize: 14, color: COLORS.textMuted },

  habitCard:  { marginBottom: 16, padding: 16 },
  habitHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  habitInfo:  { flexDirection: 'row', alignItems: 'center', flex: 1 },
  habitIcon:  { fontSize: 24, marginRight: 12 },
  habitName:  { fontSize: 18, fontWeight: '700', color: COLORS.text },
  editHint:   { fontSize: 12, color: COLORS.textSub, marginLeft: 8 },
  streakBadge:{ backgroundColor: COLORS.amberDim, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  streakText: { color: COLORS.amber, fontWeight: 'bold', fontSize: 12 },

  daysRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  dayCol:    { alignItems: 'center' },
  dayCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.bg4, marginBottom: 8 },
  dayCircleDone:  { backgroundColor: COLORS.green },
  dayCircleToday: { borderWidth: 2, borderColor: COLORS.text },
  dayLabel:  { fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase' },

  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mainBtn:    { flex: 1, backgroundColor: COLORS.accent, paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginRight: 12 },
  mainBtnDone:{ backgroundColor: COLORS.green },
  mainBtnText:{ color: '#fff', fontWeight: '700', fontSize: 13 },
  deleteBtn:  { paddingHorizontal: 8 },
  deleteText: { color: COLORS.red, fontSize: 12, fontWeight: '600' },

  modalWrapper: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modal: {
    backgroundColor: COLORS.bg2, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: COLORS.border, maxHeight: '88%',
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.bg4, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 20, textAlign: 'center' },
  formRow:    { flexDirection: 'row', marginBottom: 20 },
  input:      { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 15 },
  iconInput:  { width: 60, marginRight: 10, textAlign: 'center' },

  modalBtns:    { flexDirection: 'row', justifyContent: 'space-between' },
  btn:          { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  btnCancel:    { backgroundColor: COLORS.bg4, marginRight: 10 },
  btnCancelText:{ color: COLORS.textMuted, fontWeight: '600' },
  btnDelete:    { backgroundColor: COLORS.redDim, borderWidth: 1, borderColor: COLORS.red, marginRight: 10 },
  btnDeleteText:{ color: COLORS.red, fontWeight: '600' },
  btnSave:      { backgroundColor: COLORS.accent },
  btnSaveText:  { color: '#fff', fontWeight: '700' },
});
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Card } from '../components/Card';
import { COLORS } from '../config/colors';
import { CustomAlert } from '../components/CustomAlert';
import { todayKey, last7Days } from '../data/helpers';

export default function HabitsScreen({ habits, setHabits }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [formName, setFormName]         = useState('');
  const [formIcon, setFormIcon]         = useState('🌟');
  const [alertConfig, setAlertConfig]   = useState(null);

  const today    = todayKey();
  const pastWeek = last7Days();

  const showAlert = (config) => setAlertConfig(config);

  const toggleHabit = (id) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      const history = { ...(h.history || {}) };
      if (history[today]) {
        delete history[today];
      } else {
        history[today] = 1;
      }

      let streak = 0;
      const d = new Date();
      while (true) {
        const dateStr = d.toISOString().slice(0, 10);
        if (history[dateStr]) {
          streak++;
          d.setDate(d.getDate() - 1);
        } else {
          // Allow the current day to be missed without breaking streak calculation
          if (dateStr === today) {
             d.setDate(d.getDate() - 1);
          } else {
             break;
          }
        }
      }

      return { ...h, history, streak };
    }));
  };

  const deleteHabit = (id, name) => {
    showAlert({
      title: 'Delete Habit',
      message: `Are you sure you want to delete "${name}"?`,
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => setAlertConfig(null) },
        { text: 'Delete', style: 'destructive', onPress: () => {
          setHabits(prev => prev.filter(h => h.id !== id));
          setAlertConfig(null);
        }},
      ],
    });
  };

  const addHabit = () => {
    if (!formName.trim()) {
      showAlert({
        title: 'Error', message: 'Please enter a name for the habit.',
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }]
      });
      return;
    }
    const newId = Math.max(0, ...habits.map(h => h.id || 0)) + 1;
    const newHabit = {
      id: newId,
      name: formName.trim(),
      icon: formIcon.trim() || '🌟',
      streak: 0,
      history: {}
    };
    setHabits(prev => [...prev, newHabit]);
    setModalVisible(false);
    setFormName('');
    setFormIcon('🌟');
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.header}>
          <Text style={styles.title}>🔥 Habits</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptySub}>Start building your routine!</Text>
          </View>
        ) : (
          habits.map(h => {
            const isDoneToday = !!(h.history && h.history[today]);
            return (
              <Card key={h.id} style={styles.habitCard}>
                <View style={styles.habitHeader}>
                  <View style={styles.habitInfo}>
                    <Text style={styles.habitIcon}>{h.icon}</Text>
                    <Text style={styles.habitName}>{h.name}</Text>
                  </View>
                  <View style={styles.streakBadge}>
                    <Text style={styles.streakText}>🔥 {h.streak}</Text>
                  </View>
                </View>

                {/* Last 7 days tracking */}
                <View style={styles.daysRow}>
                  {pastWeek.map(day => {
                    const done = !!(h.history && h.history[day]);
                    const isToday = day === today;
                    return (
                      <View key={day} style={styles.dayCol}>
                        <View style={[
                          styles.dayCircle,
                          done && styles.dayCircleDone,
                          isToday && styles.dayCircleToday
                        ]} />
                        <Text style={styles.dayLabel}>
                          {new Date(day).toLocaleDateString('en-US', { weekday: 'narrow' })}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.actionsRow}>
                   <TouchableOpacity onPress={() => toggleHabit(h.id)} style={[styles.mainBtn, isDoneToday && styles.mainBtnDone]}>
                      <Text style={styles.mainBtnText}>{isDoneToday ? 'Completed ✓' : 'Mark as Done'}</Text>
                   </TouchableOpacity>
                   <TouchableOpacity onPress={() => deleteHabit(h.id, h.name)} style={styles.deleteBtn}>
                      <Text style={styles.deleteText}>Delete</Text>
                   </TouchableOpacity>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Add Habit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalWrapper}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>New Habit</Text>

            {/* keyboardShouldPersistTaps="handled" fixes the bug where the
                first tap on Create just dismisses the keyboard instead of
                firing onPress, forcing a second tap. */}
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.formRow}>
                <TextInput
                  style={[styles.input, styles.iconInput]}
                  value={formIcon}
                  onChangeText={setFormIcon}
                  maxLength={2}
                  placeholder="Icon"
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Name (e.g. Reading, Running)..."
                  placeholderTextColor={COLORS.textSub}
                  value={formName}
                  onChangeText={setFormName}
                  autoFocus
                />
              </View>

              <View style={styles.modalBtns}>
                <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setModalVisible(false)}>
                  <Text style={styles.btnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={addHabit}>
                  <Text style={styles.btnSaveText}>Create</Text>
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
  content: { padding: 16, paddingBottom: 40 },
  header:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:   { fontSize: 28, fontWeight: '700', color: COLORS.text },
  addBtn:  { backgroundColor: COLORS.accent, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  addBtnText:{ color: '#fff', fontSize: 14, fontWeight: '700' },

  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, color: COLORS.text, fontWeight: '700', marginBottom: 4 },
  emptySub:   { fontSize: 14, color: COLORS.textMuted },

  habitCard:  { marginBottom: 16, padding: 16 },
  habitHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  habitInfo:  { flexDirection: 'row', alignItems: 'center' },
  habitIcon:  { fontSize: 24, marginRight: 12 },
  habitName:  { fontSize: 18, fontWeight: '700', color: COLORS.text },
  streakBadge:{ backgroundColor: COLORS.amberDim, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  streakText: { color: COLORS.amber, fontWeight: 'bold', fontSize: 12 },

  daysRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  dayCol:    { alignItems: 'center' },
  dayCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.bg4, marginBottom: 8 },
  dayCircleDone:  { backgroundColor: COLORS.green },
  dayCircleToday: { borderWidth: 2, borderColor: COLORS.text },
  dayLabel:  { fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase' },

  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mainBtn:    { flex: 1, backgroundColor: COLORS.accent, paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginRight: 12 },
  mainBtnDone:{ backgroundColor: COLORS.green },
  mainBtnText:{ color: '#fff', fontWeight: '700', fontSize: 13 },
  deleteBtn:  { paddingHorizontal: 8 },
  deleteText: { color: COLORS.red, fontSize: 12, fontWeight: '600' },

  // Modal
  modalWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modal: {
    backgroundColor: COLORS.bg2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    maxHeight: '88%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.bg4,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 20, textAlign: 'center' },
  formRow:    { flexDirection: 'row', marginBottom: 20 },
  input:      { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 15 },
  iconInput:  { width: 60, marginRight: 10, textAlign: 'center' },
  
  modalBtns:    { flexDirection: 'row', justifyContent: 'space-between' },
  btn:          { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  btnCancel:    { backgroundColor: COLORS.bg4, marginRight: 10 },
  btnCancelText:{ color: COLORS.textMuted, fontWeight: '600' },
  btnSave:      { backgroundColor: COLORS.accent },
  btnSaveText:  { color: '#fff', fontWeight: '700' },
});
