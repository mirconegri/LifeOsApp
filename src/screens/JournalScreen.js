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
//
// ── Fix: composer got covered by the keyboard ─────────────────────────────
// The composer used to be wrapped in its OWN small KeyboardAvoidingView,
// as a sibling AFTER the main ScrollView. That doesn't reliably push a
// small, content-sized view above the keyboard on Android — 'height'
// behavior resizes the view it's directly applied to, and a composer
// that's already just as tall as its content doesn't have anything to
// shrink. The whole screen (scroll list + composer) is now wrapped in a
// SINGLE KeyboardAvoidingView, so opening the keyboard shrinks the
// ScrollView's available space and the composer — its sibling lower down
// in that same flex column — gets pushed up and stays visible above the
// keyboard instead of being hidden underneath it.
//
// ── Fix: streak calculation used toISOString() instead of localDateKey ───
// toISOString() converts to UTC before slicing out the date, which in any
// timezone ahead of UTC (Italy included) can read back the WRONG calendar
// day for part of the evening/night — making a streak look broken (or
// wrongly intact) depending on when exactly the day flips over in UTC vs.
// local time. localDateKey() (already used everywhere else in this app)
// is the one already-correct way to turn a Date into a 'YYYY-MM-DD' key.
import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Modal,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { M3, MODULE_TONES } from '../config/colors';
import { SHAPE, SPACING } from '../config/designSystem';
import { TEXT } from '../ui/type';
import { AppScrollView } from '../ui/AppScrollView';
import { ScreenHeader } from '../ui/ScreenHeader';
import { Chip } from '../ui/Chip';
import { CtaButton } from '../ui/CtaButton';
import { IconButton } from '../ui/IconButton';
import { SpringPressable } from '../ui/SpringPressable';
import { EmptyState } from '../ui/EmptyState';
import { Pill } from '../components/Pill';
import { CustomAlert } from '../components/CustomAlert';
import { DatePicker } from '../components/DatePicker';
import { DraggableList } from '../components/DraggableList';
import { Icon } from '../components/Icon';
import { todayKey, localDateKey, last7Days } from '../data/helpers';

const SECTIONS = ['Today', 'Upcoming', 'Habits', 'No Date'];
const CHECK_HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };
const DAY_HIT_SLOP   = { top: 8, bottom: 8, left: 4, right: 4 };

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
  const insets = useSafeAreaInsets();

  const composerInputRef = useRef(null);
  // Auto-scroll while dragging: DraggableList scrolls this ScrollView, so
  // it needs the ref plus the offset the ScrollView last reported.
  const scrollRef = useRef(null);
  const scrollYRef = useRef(0);
  const today = todayKey();
  const pastWeek = last7Days();

  const closeEditModal = () => setEditModalVisible(false);

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
        const dateStr = localDateKey(d);
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

  const confirmClearAll = () => {
    const hasHabits = journal.some(t => t.recurring);
    setAlertConfig({
      title: 'Clear All',
      message: hasHabits
        ? `This will permanently delete all ${journal.length} items, including your habits and their streaks. This can't be undone.`
        : `This will permanently delete all ${journal.length} tasks. This can't be undone.`,
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => setAlertConfig(null) },
        { text: 'Clear All', style: 'destructive', onPress: () => {
          setJournal([]);
          setAlertConfig(null);
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
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AppScrollView
        ref={scrollRef}
        onScroll={(e) => { scrollYRef.current = e.nativeEvent.contentOffset.y; }}
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >
        <ScreenHeader
          title="Tasks"
          subtitle={totalToday > 0 ? `${doneToday}/${totalToday} done today` : 'Nothing scheduled today'}
          style={styles.headerFlush}
          right={journal.length > 0 ? (
            <SpringPressable
              onPress={confirmClearAll}
              haptic="selection"
              accessibilityLabel="Clear all tasks"
              style={styles.clearAll}
              contentStyle={styles.clearAllContent}
            >
              <Text style={[TEXT.labelLarge, styles.clearAllText]}>Clear all</Text>
            </SpringPressable>
          ) : null}
        />

        {SECTIONS.map(section => {
          const items = grouped[section];
          if (!items || items.length === 0) return null;
          const isHabitSection = section === 'Habits';

          return (
            <View key={section} style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[TEXT.titleLargeEmphasized, styles.sectionTitle]}>{section}</Text>
                {isHabitSection ? (
                  <SpringPressable
                    onPress={openAddHabitModal}
                    haptic="selection"
                    accessibilityLabel="Add habit"
                    style={styles.addHabit}
                    contentStyle={styles.addHabitContent}
                  >
                    <Text style={[TEXT.labelLarge, styles.addHabitLink]}>+ Add habit</Text>
                  </SpringPressable>
                ) : null}
              </View>
              {items.length > 1 ? (
                <Text style={[TEXT.labelSmall, styles.reorderHint]}>Hold and drag to reorder</Text>
              ) : null}

              <DraggableList
                items={items}
                keyExtractor={(t) => String(t.id)}
                onReorder={(reordered) => handleReorderSection(items, reordered)}
                itemHeight={isHabitSection ? 108 : 64}
                scrollRef={scrollRef}
                scrollYRef={scrollYRef}
                renderItem={(t) => {
                  if (t.recurring) {
                    return (
                      <View style={styles.habitCard}>
                        <SpringPressable
                          onPress={() => openEditModal(t)}
                          haptic="selection"
                          accessibilityLabel={`Edit habit ${t.text}`}
                          style={styles.habitTopRow}
                          contentStyle={styles.habitTopContent}
                        >
                          <View style={styles.habitIconTile}>
                            <Text style={styles.habitIcon}>{t.icon || '🌟'}</Text>
                          </View>
                          <Text style={[TEXT.titleMedium, styles.habitName]} numberOfLines={1}>{t.text}</Text>
                          <View style={styles.streakBadge}>
                            <Icon name="flame" size={12} color={MODULE_TONES.finances.on} />
                            <Text style={[TEXT.labelSmall, styles.streakText]}>{t.streak || 0}</Text>
                          </View>
                        </SpringPressable>
                        <View style={styles.daysRow}>
                          {pastWeek.map(day => {
                            const done = !!(t.history && t.history[day]);
                            const isToday = day === today;
                            return (
                              <SpringPressable
                                key={day}
                                disabled={!isToday}
                                onPress={() => toggleEntry(t.id)}
                                haptic="selection"
                                style={styles.dayCol}
                                contentStyle={styles.dayColContent}
                                hitSlop={DAY_HIT_SLOP}
                                accessibilityRole="button"
                                accessibilityState={{ selected: done }}
                                accessibilityLabel={`Toggle habit for ${day}`}
                              >
                                <View style={[styles.dayCircle, done && styles.dayCircleDone, isToday && styles.dayCircleToday]} />
                              </SpringPressable>
                            );
                          })}
                        </View>
                      </View>
                    );
                  }

                  return (
                    <View style={[styles.taskCard, t.done && styles.taskCardDone]}>
                      <View style={styles.taskRow}>
                        <SpringPressable
                          onPress={() => toggleEntry(t.id)}
                          haptic="selection"
                          hitSlop={CHECK_HIT_SLOP}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: t.done }}
                          accessibilityLabel={t.done ? `Mark ${t.text} not done` : `Mark ${t.text} done`}
                          style={[styles.checkbox, t.done && styles.checkboxChecked]}
                          contentStyle={styles.checkboxContent}
                        >
                          {t.done ? (
                            <Icon name="check" size={15} color={MODULE_TONES.journal.container} />
                          ) : null}
                        </SpringPressable>
                        <SpringPressable
                          onPress={() => openEditModal(t)}
                          haptic="selection"
                          style={styles.taskInfo}
                          contentStyle={styles.taskInfoContent}
                          accessibilityLabel={`Edit ${t.text}`}
                        >
                          <Text style={[TEXT.titleMedium, t.done && styles.taskTextStriked]} numberOfLines={1}>
                            {t.text}
                          </Text>
                          {t.subject ? (
                            <Text style={[TEXT.labelMedium, styles.taskSubject]} numberOfLines={1}>
                              {t.subject}
                            </Text>
                          ) : null}
                        </SpringPressable>
                        <Pill color={priorityColor(t.priority)}>{t.priority}</Pill>
                        <SpringPressable
                          onPress={() => deleteEntry(t.id)}
                          haptic="selection"
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          style={styles.trashBtn}
                          contentStyle={styles.trashBtnContent}
                          accessibilityLabel={`Delete ${t.text}`}
                        >
                          <Icon name="trash-2" size={16} color={M3.outline} />
                        </SpringPressable>
                      </View>
                    </View>
                  );
                }}
              />
            </View>
          );
        })}

        {journal.length === 0 ? (
          <EmptyState
            icon="check-square"
            title="No tasks yet"
            body="Type below to add your first task. Habits live here too."
            tone={MODULE_TONES.journal}
          />
        ) : null}

        </AppScrollView>

      {/* ── Fixed bottom composer — Microsoft To Do / Google Tasks style.
          Always visible, not a modal you open: type and hit the arrow (or
          Enter) to add a one-off task right where you are, with quick chips
          for date and priority right underneath instead of a full form.
          Now a direct sibling of the ScrollView inside the SAME
          KeyboardAvoidingView (see file header), so it gets pushed up
          above the keyboard instead of staying pinned underneath it. ── */}
      <View style={[styles.composer, { paddingBottom: insets.bottom + 14 + 64 + 12 + 8 }]}>
        <View style={styles.composerInputRow}>
          <View style={styles.composerCircle} />
          <TextInput
            ref={composerInputRef}
            style={[styles.composerInput, TEXT.bodyLarge]}
            placeholder="Add a task..."
            placeholderTextColor={M3.outline}
            value={composerText}
            onChangeText={setComposerText}
            onSubmitEditing={submitComposer}
            returnKeyType="done"
          />
          <SpringPressable
            onPress={submitComposer}
            haptic="medium"
            accessibilityLabel="Add task"
            style={styles.composerSendBtn}
            contentStyle={styles.composerSendContent}
          >
            <Icon name="arrow-up" size={18} color={MODULE_TONES.journal.container} />
          </SpringPressable>
        </View>
        <View style={styles.composerQuickRow}>
          <SpringPressable
            onPress={() => setShowDatePicker(true)}
            haptic="selection"
            accessibilityLabel="Choose date"
            style={styles.composerChip}
            contentStyle={styles.composerChipContent}
          >
            <Icon name="calendar" size={13} color={M3.onSurfaceVariant} />
            <Text style={[TEXT.labelMedium, styles.composerChipText]}>
              {composerDate === today ? 'Today' : composerDate}
            </Text>
          </SpringPressable>
          <SpringPressable
            onPress={() => setShowPriorityPicker(v => !v)}
            haptic="selection"
            accessibilityLabel="Choose priority"
            style={styles.composerChip}
            contentStyle={styles.composerChipContent}
          >
            <Text style={[TEXT.labelMedium, styles.composerChipText]}>
              {composerPriority
                ? `${composerPriority === 'high' ? '🔴' : composerPriority === 'medium' ? '🟡' : '🟢'} ${composerPriority}`
                : 'Priority'}
            </Text>
          </SpringPressable>
        </View>
        {showPriorityPicker && (
          <View style={styles.priorityPopRow}>
            {['low', 'medium', 'high'].map(p => (
              <SpringPressable
                key={p}
                onPress={() => { setComposerPriority(p); setShowPriorityPicker(false); }}
                haptic="selection"
                style={styles.priorityPopChip}
                contentStyle={styles.priorityPopChipContent}
                accessibilityLabel={`Set priority ${p}`}
              >
                <Text style={[TEXT.labelMedium, styles.priorityPopText]}>
                  {p === 'high' ? '🔴' : p === 'medium' ? '🟡' : '🟢'} {p}
                </Text>
              </SpringPressable>
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

      {/* ── Full edit modal — used for habits (icon, recurring) and for
          editing details of an existing task that the composer doesn't
          cover. ── */}
      {/* Edge-to-edge: without these the modal's own window stops at the
          system bars and the strip left uncovered flashes white as the
          sheet slides in. */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={false}
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={closeEditModal}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalRoot} keyboardVerticalOffset={0} enabled={true}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 12 }]}>
            <IconButton
              icon="x"
              onPress={closeEditModal}
              accessibilityLabel="Close task form"
            />
            <Text style={[TEXT.titleLargeEmphasized, styles.modalTitle]}>
              {editingId ? (formRecurring ? 'Edit habit' : 'Edit task') : 'New habit'}
            </Text>
            <View style={styles.modalHeaderRight} />
          </View>

          <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="always">
            {formRecurring ? (
              <>
                <Text style={styles.fieldLabel}>Habit icon</Text>
                <TextInput
                  style={[styles.input, styles.iconInput, TEXT.bodyLarge]}
                  value={formIcon}
                  onChangeText={setFormIcon}
                  maxLength={2}
                  placeholder="🌟"
                  placeholderTextColor={M3.outline}
                  textAlign="center"
                />
                <Text style={styles.fieldLabel}>Habit name *</Text>
                <TextInput
                  style={[styles.input, TEXT.bodyLarge]}
                  placeholder="e.g. Read 20 pages"
                  placeholderTextColor={M3.outline}
                  value={formText}
                  onChangeText={setFormText}
                  autoFocus
                />
              </>
            ) : (
              <>
                <Text style={styles.fieldLabel}>Task *</Text>
                <TextInput
                  style={[styles.input, TEXT.bodyLarge]}
                  placeholder="What do you need to do?"
                  placeholderTextColor={M3.outline}
                  value={formText}
                  onChangeText={setFormText}
                  autoFocus
                />
                <Text style={styles.fieldLabel}>Subject or category</Text>
                <TextInput
                  style={[styles.input, TEXT.bodyLarge]}
                  placeholder="Optional"
                  placeholderTextColor={M3.outline}
                  value={formSubject}
                  onChangeText={setFormSubject}
                />

                <Text style={styles.fieldLabel}>Date</Text>
                <DatePicker value={formDate} onChange={setFormDate} mode="any" label="Select date" />

                <Text style={styles.fieldLabel}>Priority</Text>
                <View style={styles.pillRow}>
                  {['low', 'medium', 'high'].map(p => (
                    <Chip
                      key={p}
                      label={p}
                      selected={formPriority === p}
                      onPress={() => setFormPriority(p)}
                      accessibilityLabel={`Priority ${p}`}
                    />
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            {editingId ? (
              <CtaButton
                label="Delete"
                variant="destructive"
                onPress={() => deleteEntry(editingId)}
                style={styles.footerBtn}
              />
            ) : (
              <CtaButton
                label="Cancel"
                variant="tonal"
                onPress={closeEditModal}
                style={styles.footerBtn}
              />
            )}
            <CtaButton
              label={editingId ? 'Save changes' : 'Create'}
              onPress={saveEdit}
              style={[styles.footerBtn, styles.footerPrimary]}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CustomAlert config={alertConfig} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: M3.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 4 },
  headerFlush: { paddingHorizontal: 0 },

  clearAll: { borderRadius: SHAPE.full },
  clearAllContent: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: SHAPE.full },
  clearAllText: { color: M3.error },

  sectionBlock: { marginBottom: SPACING.lg },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: { color: M3.onSurface },
  addHabit: { borderRadius: SHAPE.full },
  addHabitContent: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: SHAPE.full },
  addHabitLink: { color: M3.primary },
  reorderHint: { color: M3.outline, marginBottom: 6 },

  // Grouped task rows: tonal surface, 20 radius, 2 px gap between rows.
  taskCard: {
    backgroundColor: M3.surfaceContainerHigh,
    borderRadius: SHAPE.xl,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 2,
  },
  taskCardDone: { opacity: 0.55 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: M3.outline,
  },
  checkboxChecked: {
    backgroundColor: MODULE_TONES.journal.on,
    borderColor: MODULE_TONES.journal.on,
  },
  checkboxContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  taskInfo: { flex: 1 },
  taskInfoContent: { paddingVertical: 2 },
  taskTextStriked: { textDecorationLine: 'line-through', color: M3.outline },
  taskSubject: { color: M3.onSurfaceVariant, marginTop: 1 },
  trashBtn: { borderRadius: SHAPE.full },
  trashBtnContent: { padding: 6, borderRadius: SHAPE.full },

  // Habit card: icon tile + streak chip + week of day circles.
  habitCard: {
    backgroundColor: M3.surfaceContainerHigh,
    borderRadius: SHAPE.xxl,
    padding: 12,
    marginBottom: 2,
  },
  habitTopRow: { borderRadius: SHAPE.lg },
  habitTopContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: SHAPE.lg,
  },
  habitIconTile: {
    width: 40,
    height: 40,
    borderRadius: SHAPE.md,
    backgroundColor: MODULE_TONES.finances.container,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitIcon: { fontSize: 20 },
  habitName: { flex: 1, color: M3.onSurface },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: MODULE_TONES.finances.container,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: SHAPE.full,
  },
  streakText: { color: MODULE_TONES.finances.on },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  dayCol: { flex: 1, alignItems: 'center', borderRadius: SHAPE.full },
  dayColContent: { alignItems: 'center', paddingVertical: 4, borderRadius: SHAPE.full },
  dayCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: M3.surfaceContainerHighest },
  dayCircleDone: { backgroundColor: MODULE_TONES.journal.on },
  dayCircleToday: { borderWidth: 2, borderColor: M3.onSurface },

  // Fixed bottom composer — lifted above the floating nav, no border.
  composer: {
    backgroundColor: M3.surfaceContainerLow,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  composerInputRow: { flexDirection: 'row', alignItems: 'center' },
  composerCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: M3.outline,
    marginRight: 10,
  },
  composerInput: { flex: 1, color: M3.onSurface, paddingVertical: 6 },
  composerSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: MODULE_TONES.journal.on,
    marginLeft: 8,
  },
  composerSendContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  composerQuickRow: { flexDirection: 'row', marginTop: 8 },
  composerChip: {
    backgroundColor: M3.surfaceContainerHigh,
    borderRadius: SHAPE.full,
    marginRight: 8,
  },
  composerChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SHAPE.full,
  },
  composerChipText: { color: M3.onSurfaceVariant },
  priorityPopRow: { flexDirection: 'row', marginTop: 8 },
  priorityPopChip: {
    backgroundColor: M3.surfaceContainerHigh,
    borderRadius: SHAPE.full,
    marginRight: 8,
  },
  priorityPopChipContent: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: SHAPE.full },
  priorityPopText: { color: M3.onSurface },

  // Modal — full screen, opaque, own insets.
  modalRoot: { flex: 1, backgroundColor: M3.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  modalHeaderRight: { width: 40 },
  modalTitle: { color: M3.onSurface },
  modalScrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  footerBtn: { flex: 1 },
  footerPrimary: { flex: 1.4 },
  input: {
    backgroundColor: M3.surfaceContainerHigh,
    borderRadius: SHAPE.lg,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: M3.onSurface,
    marginBottom: 12,
  },
  iconInput: { width: 72, textAlign: 'center' },
  fieldLabel: { color: M3.onSurfaceVariant, marginBottom: 6, marginTop: 4 },
  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
});
