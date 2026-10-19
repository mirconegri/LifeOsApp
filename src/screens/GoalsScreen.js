// src/screens/GoalsScreen.js
//
// M3 Expressive Goals: ScreenHeader with the add action, active/completed
// statistics, filter Chips, tonal goal cards with a static wavy linear
// progress indicator, a springy +/- stepper and a tonal complete control,
// plus a full-screen create/edit form. Every handler, state variable,
// storage field and confirmation is unchanged.
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Modal,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { M3, MODULE_TONES } from '../config/colors';
import { SHAPE, SPACING } from '../config/designSystem';
import { Pill } from '../components/Pill';
import { CustomAlert } from '../components/CustomAlert';
import { DatePicker } from '../components/DatePicker';
import { Icon } from '../components/Icon';
import { AppScrollView } from '../ui/AppScrollView';
import { ScreenHeader } from '../ui/ScreenHeader';
import { StatRow } from '../ui/StatRow';
import { Chip } from '../ui/Chip';
import { CtaButton } from '../ui/CtaButton';
import { IconButton } from '../ui/IconButton';
import { SpringPressable } from '../ui/SpringPressable';
import { EmptyState } from '../ui/EmptyState';
import { WavyProgress } from '../ui/WavyProgress';
import { TEXT } from '../ui/type';

const GOAL_CATEGORIES = ['Study', 'Sport', 'Finance', 'Health', 'Personal', 'Work'];
const PRIORITY_OPTS   = ['low', 'medium', 'high'];
const FILTERS         = ['All', 'Active', 'Completed', 'Expired'];

// Priority tag colour on the card and in the form chips. Pill names map to
// tonal pairs, so no raw green/amber/red reaches the screen.
const PRIORITY_PILL = { low: 'green', medium: 'amber', high: 'red' };

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

  const insets = useSafeAreaInsets();

  const closeModal = () => setModalVisible(false);

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

  // Tapping a goal card opens it here, pre-filled. This is the edit entry
  // point added after the original "not editable" bug.
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

  const confirmClearAll = () => {
    setAlertConfig({
      title: 'Clear All Goals',
      message: `This will permanently delete all ${goals.length} goals and their progress. This can't be undone.`,
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => setAlertConfig(null) },
        { text: 'Clear All', style: 'destructive', onPress: () => {
          setGoals([]);
          setAlertConfig(null);
        }},
      ],
    });
  };

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
    <AppScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title="Goals"
        subtitle={`${goals.length} goal${goals.length === 1 ? '' : 's'}`}
        style={styles.headerFlush}
        right={(
          <IconButton
            icon="plus"
            onPress={openAddModal}
            accessibilityLabel="Add goal"
          />
        )}
      />

      {/* Active / completed statistics */}
      <StatRow
        stats={[
          { value: activeCount, label: 'Active' },
          { value: completedCount, label: 'Completed' },
        ]}
        style={styles.statsRow}
      />

      {/* Filters + destructive clear-all */}
      <View style={styles.filterHeaderRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pillRow}
          contentContainerStyle={styles.pillRowContent}
        >
          {FILTERS.map(f => (
            <Chip
              key={f}
              label={f}
              selected={filter === f}
              onPress={() => setFilter(f)}
              accessibilityLabel={`Filter ${f}`}
            />
          ))}
        </ScrollView>

        {goals.length > 0 ? (
          <SpringPressable
            onPress={confirmClearAll}
            haptic="selection"
            accessibilityLabel="Clear all goals"
            style={styles.clearAll}
            contentStyle={styles.clearAllContent}
          >
            <Text style={[TEXT.labelLarge, styles.clearAllText]}>Clear All</Text>
          </SpringPressable>
        ) : null}
      </View>

      {/* Goal cards */}
      {filteredGoals.length === 0 ? (
        <EmptyState
          icon="target"
          title="No goals found"
          body="No goals match this filter. Create one to start tracking progress."
          tone={MODULE_TONES.goals}
          action={(
            <CtaButton
              label="New goal"
              variant="tonal"
              onPress={openAddModal}
            />
          )}
        />
      ) : filteredGoals.map(ob => {
        const pct = ob.target > 0 ? Math.min(100, (ob.progress / ob.target) * 100) : 0;
        const isExpired = ob.deadline && !ob.completed && new Date(ob.deadline) < new Date();
        const progressColor = ob.completed ? MODULE_TONES.journal.on : MODULE_TONES.goals.on;
        return (
          <View key={ob.id} style={[styles.goalCard, ob.completed && styles.cardCompleted]}>
            <View style={styles.cardHeader}>
              {/* Tapping the title block opens the edit modal. */}
              <SpringPressable
                onPress={() => openEditModal(ob)}
                haptic="selection"
                accessibilityLabel={`Edit ${ob.title}`}
                style={styles.cardTitleTap}
                contentStyle={styles.cardTitleTapContent}
              >
                <View style={styles.titleLine}>
                  <Text
                    style={[TEXT.titleMedium, styles.obTitle, ob.completed && styles.obDone]}
                    numberOfLines={2}
                  >
                    {ob.title}
                  </Text>
                  {ob.completed ? (
                    <Icon name="check-circle" size={16} color={MODULE_TONES.journal.on} />
                  ) : null}
                  {isExpired ? (
                    <Icon name="alert-triangle" size={16} color={M3.error} />
                  ) : null}
                </View>

                {ob.description ? (
                  <Text style={[TEXT.bodyMedium, styles.obDesc]} numberOfLines={2}>
                    {ob.description}
                  </Text>
                ) : null}

                <View style={styles.obMeta}>
                  <Pill color="accent">{ob.category}</Pill>
                  <Pill color={PRIORITY_PILL[ob.priority] ?? 'muted'}>
                    {priorityLabel(ob.priority)}
                  </Pill>
                  {ob.deadline ? (
                    <View style={styles.deadlineRow}>
                      <Icon
                        name="calendar"
                        size={12}
                        color={isExpired ? M3.error : M3.outline}
                      />
                      <Text
                        style={[TEXT.labelSmall, styles.deadline, isExpired && styles.deadlineExpired]}
                        numberOfLines={1}
                      >
                        {ob.deadline}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </SpringPressable>

              <SpringPressable
                onPress={() => deleteGoal(ob.id)}
                haptic="selection"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel={`Delete ${ob.title}`}
                style={styles.trashBtn}
                contentStyle={styles.trashBtnContent}
              >
                <Icon name="trash-2" size={16} color={M3.outline} />
              </SpringPressable>
            </View>

            {/* Static wavy bar: animate={false} keeps it out of the 3-wave cap. */}
            <View style={styles.progressRow}>
              <View style={styles.progressBar}>
                <WavyProgress
                  variant="linear"
                  progress={pct / 100}
                  color={progressColor}
                  trackColor={M3.surfaceContainerHighest}
                  animate={false}
                  stroke={5}
                  accessibilityLabel={`${ob.title} progress`}
                />
              </View>
              <Text style={[TEXT.labelMedium, styles.progressText]}>
                {pct.toFixed(0)}%
              </Text>
            </View>

            <View style={styles.progressNumbers}>
              <Text style={[TEXT.titleMedium, styles.progressCurr]}>{ob.progress}</Text>
              <Text style={[TEXT.labelMedium, styles.progressTarget]}> / {ob.target}</Text>
            </View>

            <View style={styles.stepperRow}>
              <SpringPressable
                onPress={() => updateProgress(ob.id, -1)}
                haptic="selection"
                accessibilityLabel={`Decrease ${ob.title} progress`}
                style={styles.stepBtn}
                contentStyle={styles.stepBtnContent}
              >
                <Text style={[TEXT.titleMedium, styles.stepBtnText]}>−</Text>
              </SpringPressable>

              <TextInput
                style={[styles.stepInput, TEXT.titleSmall]}
                value={String(ob.progress)}
                onChangeText={v => setDirectProgress(ob.id, v)}
                keyboardType="decimal-pad"
                placeholderTextColor={M3.outline}
              />

              <SpringPressable
                onPress={() => updateProgress(ob.id, 1)}
                haptic="selection"
                accessibilityLabel={`Increase ${ob.title} progress`}
                style={styles.stepBtn}
                contentStyle={styles.stepBtnContent}
              >
                <Text style={[TEXT.titleMedium, styles.stepBtnText]}>+</Text>
              </SpringPressable>

              <View style={styles.spacer} />

              <SpringPressable
                onPress={() => updateProgress(ob.id, ob.target - ob.progress)}
                haptic="selection"
                accessibilityRole="button"
                accessibilityState={{ selected: ob.completed }}
                accessibilityLabel={ob.completed ? `${ob.title} is done` : `Complete ${ob.title}`}
                style={[styles.completeBtn, ob.completed && styles.completeBtnDone]}
                contentStyle={styles.completeBtnContent}
              >
                <Icon
                  name="check"
                  size={14}
                  color={ob.completed ? MODULE_TONES.goals.container : MODULE_TONES.goals.on}
                />
                <Text
                  style={[
                    TEXT.labelMedium,
                    { color: ob.completed ? MODULE_TONES.goals.container : MODULE_TONES.goals.on },
                  ]}
                >
                  {ob.completed ? 'Done' : 'Complete'}
                </Text>
              </SpringPressable>
            </View>
          </View>
        );
      })}

      {/* Create / Edit modal — full screen, opaque, own insets, sticky footer. */}
      {/* Edge-to-edge: without these the modal's own window stops at the
          system bars and the strip left uncovered flashes white as the
          sheet slides in. */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalRoot} keyboardVerticalOffset={0} enabled={true}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 12 }]}>
            <IconButton
              icon="x"
              onPress={closeModal}
              accessibilityLabel="Close goal form"
            />
            <Text style={[TEXT.titleLargeEmphasized, styles.modalTitle]}>
              {editingId ? 'Edit Goal' : 'New Goal'}
            </Text>
            <View style={styles.modalHeaderRight} />
          </View>

          <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="always">
            <Text style={[TEXT.labelLarge, styles.fieldLabel]}>Title</Text>
            <TextInput
              style={[styles.input, TEXT.bodyLarge]}
              placeholder="e.g. Run a half marathon"
              placeholderTextColor={M3.outline}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={[TEXT.labelLarge, styles.fieldLabel]}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.noteInput, TEXT.bodyLarge]}
              placeholder="More details about this goal..."
              placeholderTextColor={M3.outline}
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <Text style={[TEXT.labelLarge, styles.fieldLabel]}>Goal target — the finish line</Text>
            <Text style={[TEXT.bodySmall, styles.fieldHint]}>
              The number that means "done". E.g. 21 for a 21km run, or 1000 for €1000 saved.
            </Text>
            <TextInput
              style={[styles.input, TEXT.bodyLarge]}
              placeholder="e.g. 21"
              placeholderTextColor={M3.outline}
              value={targetInput}
              onChangeText={setTargetInput}
              keyboardType="decimal-pad"
            />

            <Text style={[TEXT.labelLarge, styles.fieldLabel]}>Current progress — where you are now</Text>
            <Text style={[TEXT.bodySmall, styles.fieldHint]}>
              How far along you already are, in the same unit as the target above.
            </Text>
            <TextInput
              style={[styles.input, TEXT.bodyLarge]}
              placeholder="e.g. 0"
              placeholderTextColor={M3.outline}
              value={currentProgress}
              onChangeText={setCurrentProgress}
              keyboardType="decimal-pad"
            />

            <Text style={[TEXT.labelLarge, styles.fieldLabel]}>Category</Text>
            <View style={styles.chipRow}>
              {GOAL_CATEGORIES.map(c => (
                <Chip
                  key={c}
                  label={c}
                  selected={category === c}
                  onPress={() => setCategory(c)}
                  accessibilityLabel={`Category ${c}`}
                />
              ))}
            </View>

            <Text style={[TEXT.labelLarge, styles.fieldLabel]}>Priority</Text>
            <View style={styles.chipRow}>
              {PRIORITY_OPTS.map(p => (
                <Chip
                  key={p}
                  label={priorityLabel(p)}
                  selected={priority === p}
                  onPress={() => setPriority(p)}
                  accessibilityLabel={`Priority ${p}`}
                />
              ))}
            </View>

            <Text style={[TEXT.labelLarge, styles.fieldLabel]}>Deadline (optional)</Text>
            <DatePicker
              value={deadline}
              onChange={setDeadline}
              mode="any"
              label="Select deadline"
            />
          </ScrollView>

          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 12 }]}>
            {editingId ? (
              <CtaButton
                label="Delete"
                variant="destructive"
                onPress={() => deleteGoal(editingId)}
                style={styles.footerBtn}
              />
            ) : (
              <CtaButton
                label="Cancel"
                variant="tonal"
                onPress={closeModal}
                style={styles.footerBtn}
              />
            )}
            <CtaButton
              label={editingId ? 'Save Changes' : 'Create Goal'}
              onPress={saveGoal}
              style={[styles.footerBtn, styles.footerPrimary]}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CustomAlert config={alertConfig} />
    </AppScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: M3.background },
  content: { paddingHorizontal: 16 },
  headerFlush: { paddingHorizontal: 0 },

  statsRow: { marginTop: 4, marginBottom: 4 },

  filterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  pillRow: { flexGrow: 0, flexShrink: 1 },
  pillRowContent: { gap: 8, paddingRight: 4 },
  clearAll: { borderRadius: SHAPE.full, marginLeft: 8 },
  clearAllContent: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: SHAPE.full },
  clearAllText: { color: M3.error },

  // Tonal goal card: surfaceContainerHigh, 24 radius, no border.
  goalCard: {
    backgroundColor: M3.surfaceContainerHigh,
    borderRadius: SHAPE.xxl,
    padding: 16,
    marginBottom: 10,
  },
  cardCompleted: { opacity: 0.7 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  cardTitleTap: { flex: 1, borderRadius: SHAPE.md },
  cardTitleTapContent: { paddingVertical: 2, borderRadius: SHAPE.md },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  obTitle: { flex: 1, color: M3.onSurface },
  obDone: { textDecorationLine: 'line-through', color: M3.outline },
  obDesc: { color: M3.onSurfaceVariant, marginTop: 4 },
  obMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  deadlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deadline: { color: M3.outline },
  deadlineExpired: { color: M3.error },
  trashBtn: { borderRadius: SHAPE.full, marginLeft: 4 },
  trashBtnContent: { padding: 6, borderRadius: SHAPE.full },

  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  progressBar: { flex: 1, marginRight: 10, justifyContent: 'center' },
  progressText: { color: M3.onSurfaceVariant, width: 40, textAlign: 'right' },
  progressNumbers: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
  progressCurr: { color: M3.onSurface },
  progressTarget: { color: M3.onSurfaceVariant },

  stepperRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: M3.surfaceContainerHighest,
  },
  stepBtnContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  stepBtnText: { color: M3.onSurface },
  stepInput: {
    width: 56,
    marginHorizontal: 8,
    textAlign: 'center',
    backgroundColor: M3.surfaceContainerHighest,
    borderRadius: SHAPE.md,
    paddingVertical: 6,
    color: M3.onSurface,
  },
  spacer: { flex: 1 },
  completeBtn: { backgroundColor: MODULE_TONES.goals.container, borderRadius: SHAPE.full },
  completeBtnDone: { backgroundColor: MODULE_TONES.goals.on },
  completeBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: SHAPE.full,
  },

  // Modal — full screen, opaque, own insets, sticky footer.
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
  fieldLabel: { color: M3.onSurfaceVariant, marginBottom: 6, marginTop: 4 },
  fieldHint: { color: M3.outline, marginBottom: 8 },
  input: {
    backgroundColor: M3.surfaceContainerHigh,
    borderRadius: SHAPE.lg,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: M3.onSurface,
    marginBottom: 12,
  },
  noteInput: { minHeight: 96, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
});
