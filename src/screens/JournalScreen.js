// src/screens/JournalScreen.js
//
// This screen now serves as "Tasks" in the nav and absorbs what used to be
// the separate Habits section — a habit is just a task with
// `recurring: true` plus a `history`/`streak`, shown with a slightly
// different control (a streak flame + daily toggle) instead of a one-time
// checkbox, but living in the same list, same drag-to-reorder, same input
// bar. (Component/file name stayed as JournalScreen/journal on purpose —
// AsyncStorage already has data under the 'lifeos_journal' key.)
//
// Layout is modeled on Microsoft To Do / Google Tasks: a fixed input bar
// pinned to the bottom of the screen (not a modal you have to open) with a
// circle-checkbox-style affordance, quick-action chips for date/priority
// right under it, and the list above grouped into sections with completed
// items sunk to the bottom of their section and dimmed rather than hidden.
import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Card } from '../components/Card';
import { Pill } from '../components/Pill';
import { COLORS } from '../config/colors';
import { CustomAlert } from '../components/CustomAlert';
import { DatePicker } from '../components/DatePicker';
import { DraggableList } from '../components/DraggableList';
import { todayKey, diffDays, last7Days } from '../data/helpers';

const SECTIONS = ['Today', 'Upcoming', 'Habits', 'No Date'];

export default function JournalScreen({ journal, setJournal }) {
  const [composerText, setComposerText] = useState('');
  const [composerDate, setComposerDate] = useState(todayKey());
  const [composerPriority, setComposerPriority] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);

  const [editingId, setEditingId]       = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [formText, setFormText]         = useState('');
  const [formSubject, setFormSubject]   = useState('');
  const [formPriority, setFormPriority] = useState('medium');
  const [formDate, setFormDate]         = useState(todayKey());
  const [formRecurring, setFormRecurring] = useState(false);
  const [formIcon, setFormIcon]         = useState('🌟');
  const [alertConfig, setAlertConfig]   = useState(null);

  const composerInputRef = useRef(null);
  const today = todayKey();
  const pastWeek = last7Days();

  // ── Composer (the always-visible bottom bar, Microsoft To Do style) ──────
  const submitComposer = () => {
    const t = composerText.trim();
    if (!t) return;
    const newId = Math.max(0, ...journal.map(x => x.id || 0)) + 1;
    setJournal(prev => [
      ...prev,
      {
        id: newId, text: t, subject: '', priority: composerPriority || 'medium',
        date: composerDate || today, done: false, recurring: false,
      }
    ]);
    setComposerText('');
    setComposerDate(today);
    setComposerPriority(null);
    composerInputRef.current?.focus();
  };

  // ── Full edit modal (for details a one-line composer can't capture) ─────
  const openEditModal = (entry) => {
    setEditingId(entry.id);
    setFormText(entry.text);
    setFormSubject(entry.subject || '');
    setFormPriority(entry.priority || 'medium');
    setFormDate(entry.date || today);
    setFormRecurring(!!entry.recurring);
    setFormIcon(entry.icon || '🌟');
    setEditModalVisible(true);
  };

  const openAddHabitModal = () => {
    setEditingId(null);
    setFormText(''); setFormSubject(''); setFormPriority('medium');
    setFormDate(today); setFormRecurring(true); setFormIcon('🌟');
    setEditModalVisible(true);
  };

  const saveEdit = () => {
    const t = formText.trim();
    if (!t) {
      setAlertConfig({ title: 'Error', message: 'Please enter a description.',
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }] });
      return;
    }

    if (editingId) {
      setJournal(prev => prev.map(x => x.id === editingId ? {
        ...x, text: t, subject: formSubject.trim(), priority: formPriority,
        date: formRecurring ? null : (formDate || today),
        recurring: formRecurring,
        icon: formRecurring ? (formIcon.trim() || '🌟') : undefined,
        history: formRecurring ? (x.history || {}) : undefined,
        streak: formRecurring ? (x.streak || 0) : undefined,
      } : x));
    } else {
      const newId = Math.max(0, ...journal.map(x => x.id || 0)) + 1;
      setJournal(prev => [
        ...prev,
        {
          id: newId, text: t, subject: formSubject.trim(), priority: formPriority,
          date: formRecurring ? null : (formDate || today),
          done: false, recurring: formRecurring,
          icon: formRecurring ? (formIcon.trim() || '🌟') : undefined,
          history: formRecurring ? {} : undefined,
          streak: formRecurring ? 0 : undefined,
        }
      ]);
    }
    setEditModalVisible(false);
  };

  // One-time task: flips `done`. Recurring habit: toggles today in
  // `history` and recomputes the streak — same gesture (tap the
  // check/circle), different meaning depending on the item type.
  const toggleEntry = (id) => {
    setJournal(prev => prev.map(t => {
      if (t.id !== id) return t;
      if (!t.recurring) return { ...t, done: !t.done };

      const history = { ...(t.history || {}) };
      if (history[today]) delete history[today];
      else history[today] = 1;

      let streak = 0;
      const d = new Date();
      while (true) {
        const dateStr = d.toISOString().slice(0, 10);
        if (history[dateStr]) { streak++; d.setDate(d.getDate() - 1); }
        else if (dateStr === today) { d.setDate(d.getDate() - 1); }
        else break;
      }
      return { ...t, history, streak };
    }));
  };

  const deleteEntry = (id) => {
    setAlertConfig({
      title: 'Delete',
      message: 'Are you sure you want to delete this?',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => setAlertConfig(null) },
        { text: 'Delete', style: 'destructive', onPress: () => {
          setJournal(prev => prev.filter(t => t.id !== id));
          setAlertConfig(null); setEditModalVisible(false);
        }},
      ],
    });
  };

  const priorityColor = (p) => p === 'high' ? 'red' : p === 'medium' ? 'amber' : 'green';

  // ── Grouping: Microsoft To Do-style sections instead of one flat list ───
  const grouped = useMemo(() => {
    const habits = journal.filter(t => t.recurring);
    const oneTime = journal.filter(t => !t.recurring);

    const todayItems    = oneTime.filter(t => t.date === today);
    const upcomingItems = oneTime.filter(t => t.date && t.date > today);
    const noDateItems   = oneTime.filter(t => !t.date);

    // Within each section: not-done first, done items sink to the bottom
    // and stay visible but dimmed — this mirrors Microsoft To Do, where
    // completing something doesn't make it vanish, it just moves down and
    // fades, so you can still see what you got done today.
    const sortDone = (list) => [...list].sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0));

    return {
      Today: sortDone(todayItems),
      Upcoming: upcomingItems.sort((a, b) => a.date.localeCompare(b.date)),
      Habits: habits,
      'No Date': sortDone(noDateItems),
    };
  }, [journal, today]);

  const handleReorderSection = (sectionItems, reordered) => {
    setJournal(prev => {
      const reorderedIds = new Set(reordered.map(r => r.id));
      const others = prev.filter(t => !reorderedIds.has(t.id));
      return [...others, ...reordered];
    });
  };

  const totalToday = grouped.Today.length;
  const doneToday = grouped.Today.filter(t => t.done).length;

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="always">
        <View style={styles.header}>
          <Text style={styles.title}>✅ Tasks</Text>
          {totalToday > 0 && (
            <Text style={styles.progressText}>{doneToday}/{totalToday} today</Text>
          )}
        </View>

        {SECTIONS.map(section => {
          const items = grouped[section];
          if (!items || items.length === 0) return null;
          const isHabitSection = section === 'Habits';

          return (
            <View key={section} style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>{section}</Text>
                {isHabitSection && (
                  <TouchableOpacity onPress={openAddHabitModal}>
                    <Text style={styles.addHabitLink}>+ Add habit</Text>
                  </TouchableOpacity>
                )}
              </View>
              {items.length > 1 && (
                <Text style={styles.reorderHint}>Hold and drag to reorder</Text>
              )}

              <DraggableList
                items={items}
                keyExtractor={(t) => String(t.id)}
                onReorder={(reordered) => handleReorderSection(items, reordered)}
                itemHeight={isHabitSection ? 96 : 60}
                renderItem={(t) => {
                  if (t.recurring) {
                    const doneTodayFlag = !!(t.history && t.history[today]);
                    return (
                      <Card style={styles.habitCard}>
                        <TouchableOpacity onPress={() => openEditModal(t)} style={styles.habitTopRow}>
                          <Text style={styles.habitIcon}>{t.icon || '🌟'}</Text>
                          <Text style={styles.habitName}>{t.text}</Text>
                          <View style={styles.streakBadge}>
                            <Text style={styles.streakText}>🔥 {t.streak || 0}</Text>
                          </View>
                        </TouchableOpacity>
                        <View style={styles.daysRow}>
                          {pastWeek.map(day => {
                            const done = !!(t.history && t.history[day]);
                            const isToday = day === today;
                            return (
                              <TouchableOpacity
                                key={day}
                                disabled={!isToday}
                                onPress={() => toggleEntry(t.id)}
                                style={styles.dayCol}
                              >
                                <View style={[styles.dayCircle, done && styles.dayCircleDone, isToday && styles.dayCircleToday]} />
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </Card>
                    );
                  }

                  return (
                    <Card style={t.done ? styles.cardDone : styles.cardActive}>
                      <View style={styles.taskRow}>
                        <TouchableOpacity onPress={() => toggleEntry(t.id)} style={styles.checkWrap}>
                          <View style={[styles.checkbox, t.done && styles.checkboxChecked]}>
                            {t.done && <Text style={styles.checkText}>✓</Text>}
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => openEditModal(t)} style={styles.taskInfo}>
                          <Text style={[styles.taskText, t.done && styles.taskTextStriked]}>{t.text}</Text>
                          {t.subject ? <Text style={styles.taskSubject}>{t.subject}</Text> : null}
                        </TouchableOpacity>
                        <Pill color={priorityColor(t.priority)}>{t.priority}</Pill>
                        <TouchableOpacity onPress={() => deleteEntry(t.id)} style={styles.trashBtn}>
                          <Text style={styles.trashIcon}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    </Card>
                  );
                }}
              />
            </View>
          );
        })}

        {journal.length === 0 && (
          <Card><Text style={styles.emptyText}>No tasks yet. Add one below.</Text></Card>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── Fixed bottom composer — Microsoft To Do / Google Tasks style.
          Always visible, not a modal you open: type and hit the arrow (or
          Enter) to add a one-off task right where you are, with quick chips
          for date and priority right underneath instead of a full form. ── */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.composer}>
          <View style={styles.composerInputRow}>
            <View style={styles.composerCircle} />
            <TextInput
              ref={composerInputRef}
              style={styles.composerInput}
              placeholder="Add a task..."
              placeholderTextColor={COLORS.textSub}
              value={composerText}
              onChangeText={setComposerText}
              onSubmitEditing={submitComposer}
              returnKeyType="done"
            />
            <TouchableOpacity onPress={submitComposer} style={styles.composerSendBtn}>
              <Text style={styles.composerSendIcon}>↑</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.composerQuickRow}>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.composerChip}>
              <Text style={styles.composerChipText}>
                📅 {composerDate === today ? 'Today' : composerDate}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPriorityPicker(v => !v)} style={styles.composerChip}>
              <Text style={styles.composerChipText}>
                {composerPriority ? `${composerPriority === 'high' ? '🔴' : composerPriority === 'medium' ? '🟡' : '🟢'} ${composerPriority}` : '⚪ Priority'}
              </Text>
            </TouchableOpacity>
          </View>
          {showPriorityPicker && (
            <View style={styles.priorityPopRow}>
              {['low', 'medium', 'high'].map(p => (
                <TouchableOpacity key={p} onPress={() => { setComposerPriority(p); setShowPriorityPicker(false); }} style={styles.priorityPopChip}>
                  <Text style={styles.priorityPopText}>{p === 'high' ? '🔴' : p === 'medium' ? '🟡' : '🟢'} {p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {showDatePicker && (
            <View style={{ marginTop: 8 }}>
              <DatePicker
                value={composerDate}
                onChange={(d) => { setComposerDate(d); setShowDatePicker(false); }}
                mode="any"
                label="Select date"
              />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* ── Full edit modal — used for habits (icon, recurring) and for
          editing details of an existing task that the composer doesn't
          cover. ── */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalWrapper}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setEditModalVisible(false)} />
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {editingId ? (formRecurring ? 'Edit Habit' : 'Edit Task') : 'New Habit'}
            </Text>

            <ScrollView keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
              {formRecurring && (
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
                    placeholder="Habit name..."
                    placeholderTextColor={COLORS.textSub}
                    value={formText}
                    onChangeText={setFormText}
                    autoFocus
                  />
                </View>
              )}
              {!formRecurring && (
                <>
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
                  <DatePicker value={formDate} onChange={setFormDate} mode="any" label="Select date" />

                  <Text style={styles.fieldLabel}>Priority:</Text>
                  <View style={styles.pillRow}>
                    {['low', 'medium', 'high'].map((p, idx) => (
                      <TouchableOpacity key={p} onPress={() => setFormPriority(p)} style={[styles.priorityBtn, formPriority === p && styles.priorityBtnActive, idx < 2 && { marginRight: 10 }]}>
                        <Text style={[styles.priorityText, formPriority === p && {color: COLORS.accent}]}>{p.toUpperCase()}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <View style={styles.modalBtns}>
                {editingId ? (
                  <TouchableOpacity onPress={() => deleteEntry(editingId)}>
                    <Text style={styles.deleteTextBtn}>Delete</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                    <Text style={styles.cancelBtn}>Cancel</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.confirmBtn} onPress={saveEdit}>
                  <Text style={styles.confirmBtnText}>{editingId ? 'Save Changes' : 'Create'}</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CustomAlert config={alertConfig} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text },
  progressText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },

  sectionBlock: { marginBottom: 18 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  addHabitLink: { fontSize: 12, color: COLORS.accent, fontWeight: '600' },
  reorderHint: { fontSize: 11, color: COLORS.textSub, marginBottom: 6 },
  emptyText: { color: COLORS.textSub, textAlign: 'center', marginVertical: 20 },

  cardActive: { marginBottom: 8, padding: 12 },
  cardDone: { marginBottom: 8, padding: 12, opacity: 0.45 },
  taskRow: { flexDirection: 'row', alignItems: 'center' },
  checkWrap: { marginRight: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.border2, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  checkText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  taskInfo: { flex: 1 },
  taskText: { fontSize: 15, color: COLORS.text },
  taskTextStriked: { textDecorationLine: 'line-through', color: COLORS.textSub },
  taskSubject: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  trashBtn: { padding: 8, marginLeft: 8 },
  trashIcon: { color: COLORS.textSub, fontSize: 16 },

  // Habit card (absorbed from the old HabitsScreen)
  habitCard: { marginBottom: 10, padding: 14 },
  habitTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  habitIcon: { fontSize: 20, marginRight: 10 },
  habitName: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1 },
  streakBadge: { backgroundColor: COLORS.amberDim, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  streakText: { color: COLORS.amber, fontWeight: 'bold', fontSize: 11 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', flex: 1 },
  dayCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.bg4 },
  dayCircleDone: { backgroundColor: COLORS.green },
  dayCircleToday: { borderWidth: 2, borderColor: COLORS.text },

  // Fixed bottom composer
  composer: {
    backgroundColor: COLORS.bg2, borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 24 : 14,
  },
  composerInputRow: { flexDirection: 'row', alignItems: 'center' },
  composerCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.border2, marginRight: 10 },
  composerInput: { flex: 1, color: COLORS.text, fontSize: 15, paddingVertical: 6 },
  composerSendBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  composerSendIcon: { color: '#fff', fontSize: 16, fontWeight: '700' },
  composerQuickRow: { flexDirection: 'row', marginTop: 8 },
  composerChip: { backgroundColor: COLORS.bg3, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  composerChipText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  priorityPopRow: { flexDirection: 'row', marginTop: 8 },
  priorityPopChip: { backgroundColor: COLORS.bg3, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  priorityPopText: { color: COLORS.text, fontSize: 12, fontWeight: '600' },

  // Edit modal
  modalWrapper: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  modal: {
    backgroundColor: COLORS.bg2, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: COLORS.border, maxHeight: '88%',
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.bg4, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 15, marginBottom: 12 },
  formRow: { flexDirection: 'row', marginBottom: 4 },
  iconInput: { width: 60, marginRight: 10, textAlign: 'center' },
  fieldLabel: { color: COLORS.textSub, fontSize: 13, marginBottom: 8 },
  pillRow: { flexDirection: 'row', marginBottom: 20 },
  priorityBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: COLORS.bg3, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  priorityBtnActive: { backgroundColor: COLORS.accentGlow, borderColor: COLORS.accent },
  priorityText: { fontSize: 12, color: COLORS.textSub, fontWeight: '600' },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  cancelBtn: { color: COLORS.textSub, fontSize: 16, padding: 10 },
  deleteTextBtn: { color: COLORS.red, fontSize: 16, padding: 10, fontWeight: '600' },
  confirmBtn: { backgroundColor: COLORS.accent, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
