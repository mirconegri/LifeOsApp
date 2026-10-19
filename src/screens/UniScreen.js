// src/screens/UniScreen.js
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { M3, MODULE_TONES } from '../config/colors';
import { SHAPE, SPACING } from '../config/designSystem';
import { TEXT } from '../ui/type';
import { AppScrollView } from '../ui/AppScrollView';
import { ScreenHeader } from '../ui/ScreenHeader';
import { StatRow } from '../ui/StatRow';
import { GroupItem } from '../ui/GroupItem';
import { Chip } from '../ui/Chip';
import { CtaButton } from '../ui/CtaButton';
import { IconButton } from '../ui/IconButton';
import { SpringPressable } from '../ui/SpringPressable';
import { WavyProgress } from '../ui/WavyProgress';
import { EmptyState } from '../ui/EmptyState';
import { Card } from '../components/Card';
import { Pill } from '../components/Pill';
import { CustomAlert } from '../components/CustomAlert';
import { DatePicker } from '../components/DatePicker';
import { GradeSelector } from '../components/GradeSelector';
import {
  predictedDegreeGrade as calcPredictedGrade, diffDays,
  gradeWeight, gradeLabel,
} from '../data/helpers';

const STATUSES = ['to start', 'preparing', 'passed'];
// Same bounds the Add/Edit exam form already enforces (3–15 CFU). The
// simulator used to have no upper bound at all — only a `|| 0` floor —
// so a typo'd "150" silently produced a meaningless projected average
// instead of being rejected like a real exam with that many credits
// would be.
const SIM_MIN_CREDITS = 3;
const SIM_MAX_CREDITS = 15;

function statusColor(s) {
  if (s === 'passed')    return 'green';
  if (s === 'preparing') return 'accent';
  return 'muted';
}

// Module tone for the leading icon tile of an exam row.
function examTone(s) {
  if (s === 'passed')    return MODULE_TONES.journal;
  if (s === 'preparing') return MODULE_TONES.uni;
  return { container: M3.surfaceContainerHighest, on: M3.onSurfaceVariant };
}

function gradeDisplay(val) {
  return gradeLabel(val);
}

// gradeWeight is already NaN-proof (returns 0 for anything invalid),
// so every consumer below inherits that safety for free.
function gradeToNumber(val) {
  return gradeWeight(val);
}

// ── Averages that understand 30L → uses 30 in math (via gradeWeight) ──
// Also computes "projected" averages that fold in expectedGrade for
// exams that haven't been passed yet, so the user can see where they'd
// land if every expected grade came true.
//
// Fixed: every list is pre-filtered to drop anything that resolves to a
// 0 weight (missing/invalid grade), so a single bad record can no longer
// turn the whole average into NaN/"-".
function calcExtended(exams) {
  const passed = exams.filter(e => e.achievedGrade && gradeWeight(e.achievedGrade) > 0);
  const withExpected = exams.filter(e => !e.achievedGrade && e.expectedGrade && gradeWeight(e.expectedGrade) > 0);
  const combined = [...passed, ...withExpected.map(e => ({ ...e, achievedGrade: e.expectedGrade }))];

  function avg(list) {
    if (!list.length) return 0;
    const numList = list.map(e => gradeWeight(e.achievedGrade)).filter(n => n > 0);
    if (!numList.length) return 0;
    return numList.reduce((a, b) => a + b, 0) / numList.length;
  }
  function wavg(list) {
    if (!list.length) return 0;
    const valid = list.filter(e => gradeWeight(e.achievedGrade) > 0 && (Number(e.credits) || 0) > 0);
    if (!valid.length) return 0;
    const wp = valid.reduce((a, e) => a + gradeWeight(e.achievedGrade) * Number(e.credits), 0);
    const wc = valid.reduce((a, e) => a + Number(e.credits), 0);
    return wc ? wp / wc : 0;
  }

  return {
    average:             avg(passed),
    weightedAverage:     wavg(passed),
    avgWithExpected:     avg(combined),
    wavgWithExpected:    wavg(combined),
    hasExpected:         withExpected.length > 0,
  };
}

export default function UniScreen({ exams, setExams, totalCredits }) {
  // ─── Form state ──────────────────────────────────────────────────────────
  const [modalVisible,     setModalVisible]     = useState(false);
  const [editingId,        setEditingId]        = useState(null);
  const [formName,         setFormName]         = useState('');
  const [formCredits,      setFormCredits]      = useState('');
  const [formDate,         setFormDate]         = useState('');
  const [formExpectedGrade,setFormExpectedGrade] = useState(null);
  const [formAchievedGrade,setFormAchievedGrade] = useState(null);
  const [formStatus,       setFormStatus]       = useState('to start');
  const [alertConfig,      setAlertConfig]      = useState(null);

  // ─── Simulator state ─────────────────────────────────────────────────────
  const [simGrade,  setSimGrade]  = useState(null);
  const [simCredits,setSimCredits] = useState('6');

  const closeModal = () => setModalVisible(false);
  const insets = useSafeAreaInsets();

  // ─── Computed ─────────────────────────────────────────────────────────────
  const {
    average, weightedAverage,
    avgWithExpected, wavgWithExpected, hasExpected,
  } = calcExtended(exams);

  const predictedGrade = calcPredictedGrade(weightedAverage);

  // Only exams with a real, valid achieved grade count toward CFU/averages.
  const passedExams  = exams.filter(e => e.achievedGrade && gradeWeight(e.achievedGrade) > 0);
  const cfuAcquired  = passedExams.reduce((acc, e) => acc + (Number(e.credits) || 0), 0);
  const cfuPct       = totalCredits > 0 ? (cfuAcquired / totalCredits) * 100 : 0;

  const thisYear     = new Date().getFullYear();
  const passedThisYear = passedExams.filter(e => e.date && e.date.startsWith(String(thisYear)));

  // Preparing first, then to start, then passed. Same order as before.
  const statusOrder = { preparing: 0, 'to start': 1, passed: 2 };
  const sortedExams = [...exams].sort(
    (a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3),
  );

  // ── Simulator projection ──────────────────────────────────────────────────
  // Fixed: gradeToNumber/gradeWeight never returns NaN anymore, so a
  // malformed exam record in `exams` can no longer poison the whole
  // projection. simGrade/simCredits are validated independently so the
  // user gets a clear reason instead of the simulator silently doing
  // nothing. Credits are now also capped at SIM_MAX_CREDITS, matching the
  // Add/Edit exam form's own 3–15 validation.
  const simNumGrade = simGrade !== null ? gradeToNumber(simGrade) : 0;
  const simCredNum  = parseInt(simCredits, 10) || 0;
  const simCredInRange = simCredNum >= SIM_MIN_CREDITS && simCredNum <= SIM_MAX_CREDITS;
  const simReady     = simNumGrade > 0 && simCredInRange;

  let projectedAvg = null, projectedWavg = null;
  if (simReady) {
    const validPassedGrades = passedExams.map(e => gradeToNumber(e.achievedGrade)).filter(n => n > 0);
    const allGrades = [...validPassedGrades, simNumGrade];
    projectedAvg = allGrades.reduce((a, b) => a + b, 0) / allGrades.length;

    const wp = passedExams.reduce((a, e) => a + gradeToNumber(e.achievedGrade) * (Number(e.credits) || 0), 0)
             + simNumGrade * simCredNum;
    const wc = passedExams.reduce((a, e) => a + (Number(e.credits) || 0), 0) + simCredNum;
    projectedWavg = wc ? wp / wc : 0;
  }

  // What's missing, so the simulator can explain itself instead of staying mute
  const simMissing = !simGrade && simCredNum <= 0
    ? 'Pick a grade and enter CFU'
    : !simGrade
      ? 'Pick a grade to simulate'
      : simCredNum <= 0
        ? 'Enter the CFU for this exam'
        : !simCredInRange
          ? `CFU must be between ${SIM_MIN_CREDITS} and ${SIM_MAX_CREDITS}`
          : null;

  // ─── Modal helpers ────────────────────────────────────────────────────────
  const openAddModal = () => {
    setEditingId(null);
    setFormName(''); setFormCredits(''); setFormDate('');
    setFormExpectedGrade(null); setFormAchievedGrade(null);
    setFormStatus('to start');
    setModalVisible(true);
  };

  const openEditModal = (exam) => {
    setEditingId(exam.id);
    setFormName(exam.name);
    setFormCredits(String(exam.credits));
    setFormDate(exam.date || '');
    setFormExpectedGrade(exam.expectedGrade || null);
    setFormAchievedGrade(exam.achievedGrade || null);
    setFormStatus(exam.status || 'to start');
    setModalVisible(true);
  };

  // When status changes to 'passed', clear expectedGrade
  const handleStatusChange = (s) => {
    setFormStatus(s);
    if (s === 'passed') setFormExpectedGrade(null);
    if (s !== 'passed') setFormAchievedGrade(null);
  };

  const handleSave = () => {
    const credits = parseInt(formCredits, 10) || 0;

    // Validation
    if (!formName.trim()) {
      setAlertConfig({ title: 'Required', message: 'Enter the exam name.',
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }] }); return;
    }
    if (!formCredits || credits < 3 || credits > 15) {
      setAlertConfig({ title: 'Invalid Credits', message: 'Credits must be between 3 and 15.',
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }] }); return;
    }
    if (!formDate) {
      setAlertConfig({ title: 'Required', message: 'Select an exam date.',
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }] }); return;
    }
    if (formStatus === 'passed' && (!formAchievedGrade || gradeWeight(formAchievedGrade) <= 0)) {
      setAlertConfig({ title: 'Required', message: 'Enter the achieved grade for a passed exam.',
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }] }); return;
    }

    const parsedExam = {
      id:            editingId || Date.now(),
      name:          formName.trim(),
      credits,
      date:          formDate || null,
      expectedGrade: formStatus === 'passed' ? null : (formExpectedGrade || null),
      achievedGrade: formStatus === 'passed' ? (formAchievedGrade || null) : null,
      status:        formStatus,
    };

    if (editingId) {
      setExams(prev => prev.map(e => e.id === editingId ? parsedExam : e));
    } else {
      setExams(prev => [...prev, parsedExam]);
    }
    setModalVisible(false);
  };

  const confirmDelete = (id) => {
    setAlertConfig({
      title: 'Delete Exam',
      message: 'Are you sure you want to delete this exam?',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => setAlertConfig(null) },
        { text: 'Delete', style: 'destructive', onPress: () => {
          setExams(prev => prev.filter(e => e.id !== id));
          setAlertConfig(null); setModalVisible(false);
        }},
      ],
    });
  };

  const confirmClearAll = () => {
    setAlertConfig({
      title: 'Clear All Exams',
      message: `This will permanently delete all ${exams.length} exams. This can't be undone.`,
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => setAlertConfig(null) },
        { text: 'Clear All', style: 'destructive', onPress: () => {
          setExams([]);
          setAlertConfig(null);
        }},
      ],
    });
  };

  // Date mode: both directions are capped at 5 years, exactly as requested.
  const dateMode = formStatus === 'passed' ? 'past5' : 'future5';

  return (
    <View style={styles.container}>
      <CustomAlert config={alertConfig} />

      {/* Screen-level scroll: AppScrollView reserves the status bar and the
          floating nav, and keeps keyboardShouldPersistTaps="always" so the
          first tap on GradeSelector's dropdown registers. */}
      <AppScrollView contentContainerStyle={styles.content}>

        <ScreenHeader
          title="University"
          subtitle={`${exams.length} exam${exams.length === 1 ? '' : 's'} · ${passedExams.length} passed`}
          style={styles.headerFlush}
        />

        {/* ─── Overview: credits ring + three-column stat row ─── */}
        <View style={styles.overview}>
          <View style={styles.ringHost}>
            <WavyProgress
              variant="circular"
              progress={Math.min(1, Math.max(0, cfuPct / 100))}
              size={132}
              stroke={9}
              color={MODULE_TONES.uni.on}
              trackColor={MODULE_TONES.uni.container}
              animate={false}
              accessibilityLabel="Credits earned"
            />
            <View style={styles.ringCenter} pointerEvents="none">
              <Text style={[TEXT.headlineSmall, styles.ringValue]}>
                {Math.round(cfuPct)}%
              </Text>
              <Text style={[TEXT.labelSmall, styles.ringLabel]}>credits</Text>
            </View>
          </View>
          <View style={styles.overviewStats}>
            <StatRow
              stats={[
                { value: `${cfuAcquired}/${totalCredits}`, label: 'Credits' },
                { value: average ? average.toFixed(1) : '—', label: 'Average' },
                { value: predictedGrade ? `${predictedGrade}` : '—', label: 'Predicted' },
              ]}
            />
            <Text style={[TEXT.bodySmall, styles.overviewMeta]}>
              Passed this year {passedThisYear.length} · Weighted{' '}
              {weightedAverage ? weightedAverage.toFixed(2) : '—'}
            </Text>
            {hasExpected ? (
              <Text style={[TEXT.bodySmall, styles.overviewMeta]}>
                Projected {avgWithExpected.toFixed(2)} / {wavgWithExpected.toFixed(2)}
              </Text>
            ) : null}
          </View>
        </View>

        {/* ─── Grade Simulator ─── */}
        <Text style={[TEXT.titleLargeEmphasized, styles.blockTitle]}>Grade simulator</Text>
        <Card style={styles.simCard}>
          <Text style={[TEXT.bodyMedium, styles.simSubtitle]}>How would a new grade affect your average?</Text>

          {/* Grade picker sits ABOVE the CFU field, not beside it.
              GradeSelector's dropdown opens downward; stacking these
              vertically means the open dropdown can never land on top of
              the CFU input. `elevation` (not just zIndex — Android's
              touch dispatch for overlapping siblings needs the real
              native elevation property, zIndex alone is mostly an
              iOS/web concept) is set high here too, defensively, so this
              row's dropdown wins against whatever renders after it in
              this Card on Android. The actual reported bug (dropdown taps
              only registering via the keyboard's Enter key) was a
              different, separate issue inside GradeSelector itself — see
              GradeSelector.js for that fix. */}
          <View style={styles.simGradeRow}>
            <GradeSelector
              value={simGrade}
              onChange={setSimGrade}
              placeholder="Grade (18–30L)"
            />
          </View>
          <TextInput
            style={[styles.input, TEXT.bodyLarge]}
            placeholder={`CFU for this exam (${SIM_MIN_CREDITS}–${SIM_MAX_CREDITS})`}
            placeholderTextColor={M3.outline}
            keyboardType="numeric"
            value={simCredits}
            onChangeText={v => setSimCredits(v.replace(/[^0-9]/g, ''))}
            maxLength={2}
          />

          {simReady ? (
            <View style={styles.simResults}>
              <View style={styles.simResultItem}>
                <Text style={[TEXT.labelSmall, styles.simResultLabel]}>New arithmetic</Text>
                <Text style={[TEXT.titleMedium, styles.simResultVal, { color: projectedAvg >= average ? MODULE_TONES.journal.on : M3.error }]}>
                  {projectedAvg.toFixed(2)}
                  <Text style={[TEXT.labelSmall, styles.simDelta]}>
                    {' '}({projectedAvg >= average ? '+' : ''}{(projectedAvg - average).toFixed(2)})
                  </Text>
                </Text>
              </View>
              <View style={styles.simResultItem}>
                <Text style={[TEXT.labelSmall, styles.simResultLabel]}>New weighted</Text>
                <Text style={[TEXT.titleMedium, styles.simResultVal, { color: projectedWavg >= weightedAverage ? MODULE_TONES.journal.on : M3.error }]}>
                  {projectedWavg.toFixed(2)}
                  <Text style={[TEXT.labelSmall, styles.simDelta]}>
                    {' '}({projectedWavg >= weightedAverage ? '+' : ''}{(projectedWavg - weightedAverage).toFixed(2)})
                  </Text>
                </Text>
              </View>
              <View style={styles.simResultItem}>
                <Text style={[TEXT.labelSmall, styles.simResultLabel]}>Est. degree</Text>
                <Text style={[TEXT.titleMedium, styles.simResultVal, { color: MODULE_TONES.journal.on }]}>
                  {calcPredictedGrade(projectedWavg)}/110
                </Text>
              </View>
            </View>
          ) : (
            // Explains exactly what's missing instead of staying silent.
            <Text style={[TEXT.bodySmall, styles.simHint]}>{simMissing}</Text>
          )}
        </Card>

        {/* ─── Add Exam ─── */}
        <CtaButton
          label="Add exam"
          icon="plus"
          onPress={openAddModal}
          style={styles.addExam}
        />

        {/* ─── Exams: grouped rows with status chips + prep line ─── */}
        <View style={styles.listHeader}>
          <Text style={[TEXT.titleLargeEmphasized, styles.listTitle]}>
            Exams ({exams.length})
          </Text>
          {exams.length > 0 ? (
            <SpringPressable
              onPress={confirmClearAll}
              haptic="selection"
              accessibilityLabel="Clear all exams"
              style={styles.clearAll}
              contentStyle={styles.clearAllContent}
            >
              <Text style={[TEXT.labelLarge, styles.clearAllText]}>Clear all</Text>
            </SpringPressable>
          ) : null}
        </View>

        {sortedExams.length === 0 ? (
          <EmptyState
            icon="graduation-cap"
            title="No exams yet"
            body="Add your first exam to watch the credits ring and your average fill in."
            tone={MODULE_TONES.uni}
          />
        ) : (
          <View style={styles.group}>
            {sortedExams.map((exam, index) => {
              const days = exam.date ? Math.max(0, diffDays(exam.date)) : null;
              const prepPct = days != null
                ? Math.max(0, Math.min(100, 100 - (days / 30) * 100))
                : null;
              const gradeText = exam.achievedGrade
                ? gradeDisplay(exam.achievedGrade)
                : exam.expectedGrade
                  ? `(${gradeDisplay(exam.expectedGrade)})`
                  : '—';
              const showPrep = !exam.achievedGrade && exam.status === 'preparing' && days != null;
              return (
                <GroupItem
                  key={exam.id}
                  index={index}
                  count={sortedExams.length}
                  icon="graduation-cap"
                  tone={examTone(exam.status)}
                  title={exam.name}
                  secondary={`${exam.credits} CFU${exam.date ? ` · ${exam.date}` : ''}`}
                  status={showPrep
                    ? `${Math.round(prepPct)}% prep · ${days} day${days === 1 ? '' : 's'} left`
                    : undefined}
                  statusIcon={showPrep ? 'clock' : undefined}
                  statusColor={showPrep ? MODULE_TONES.journal.on : undefined}
                  trailing={(
                    <View style={styles.examTrailing}>
                      <Text style={[TEXT.titleMedium, {
                        color: exam.achievedGrade ? MODULE_TONES.journal.on : M3.onSurfaceVariant,
                      }]}>
                        {gradeText}
                      </Text>
                      <Pill color={statusColor(exam.status)}>{exam.status}</Pill>
                    </View>
                  )}
                  onPress={() => openEditModal(exam)}
                />
              );
            })}
          </View>
        )}
      </AppScrollView>

      {/* ─── Add / Edit Modal — full screen, opaque ───
          statusBar/navigationBarTranslucent keep the modal's own window
          under the system bars. Without them Android sizes that window
          above the navigation bar, and the strip left uncovered is what
          flashed white while the sheet slid in. */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalRoot}
          keyboardVerticalOffset={0}
          enabled={true}
        >
          {/* Header */}
          <View style={[styles.modalHeader, { paddingTop: insets.top + 12 }]}>
            <IconButton
              icon="x"
              onPress={closeModal}
              accessibilityLabel="Close exam form"
            />
            <Text style={[TEXT.titleLargeEmphasized, styles.modalTitle]}>
              {editingId ? 'Edit exam' : 'Add exam'}
            </Text>
            <View style={styles.modalHeaderRight} />
          </View>

          {/* Form */}
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
          >
            {/* Name */}
            <Text style={styles.fieldLabel}>Exam name *</Text>
            <TextInput
              placeholder="e.g. Analysis 1"
              placeholderTextColor={M3.outline}
              value={formName}
              onChangeText={setFormName}
              style={[styles.input, TEXT.bodyLarge]}
            />

            {/* Credits */}
            <Text style={styles.fieldLabel}>Credits (3–15) *</Text>
            <TextInput
              placeholder="e.g. 9"
              placeholderTextColor={M3.outline}
              value={formCredits}
              onChangeText={v => setFormCredits(v.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              style={[styles.input, TEXT.bodyLarge]}
            />

            {/* Status selector */}
            <Text style={styles.fieldLabel}>Status *</Text>
            <View style={styles.statusRow}>
              {STATUSES.map(s => (
                <Chip
                  key={s}
                  label={s}
                  selected={formStatus === s}
                  onPress={() => handleStatusChange(s)}
                  accessibilityLabel={`Status ${s}`}
                />
              ))}
            </View>

            {/* Date */}
            <Text style={styles.fieldLabel}>
              {formStatus === 'passed' ? 'Date passed *' : 'Exam date *'}
            </Text>
            <DatePicker
              value={formDate}
              onChange={setFormDate}
              mode={dateMode}
              maxYearsBack={5}
              label={formStatus === 'passed' ? 'Select date passed' : 'Select exam date'}
            />

            {/* Achieved grade — only for 'passed' */}
            {formStatus === 'passed' && (
              <GradeSelector
                value={formAchievedGrade}
                onChange={setFormAchievedGrade}
                placeholder="Achieved grade (required) *"
                label="Achieved Grade *"
              />
            )}

            {/* Expected grade — only for non-passed */}
            {formStatus !== 'passed' && (
              <GradeSelector
                value={formExpectedGrade}
                onChange={setFormExpectedGrade}
                placeholder="Expected grade (optional)"
                label="Expected Grade"
              />
            )}
          </ScrollView>

          {/* Footer — fixed action buttons */}
          <View style={styles.modalFooter}>
            {editingId ? (
              <CtaButton
                label="Delete"
                variant="destructive"
                onPress={() => confirmDelete(editingId)}
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
              label={editingId ? 'Update exam' : 'Add exam'}
              onPress={handleSave}
              style={[styles.footerBtn, styles.footerPrimary]}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: M3.background },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  headerFlush: { paddingHorizontal: 0 },

  // Overview: credits ring on the left, three-column stat row on the right.
  overview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  ringHost: { width: 132, height: 132, alignItems: 'center', justifyContent: 'center' },
  ringCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: { color: M3.onSurface },
  ringLabel: { color: M3.onSurfaceVariant, marginTop: 1 },
  overviewStats: { flex: 1 },
  overviewMeta: { color: M3.outline, marginTop: 6 },

  // Simulator
  blockTitle: { color: M3.onSurface, marginTop: SPACING.md, marginBottom: 8 },
  simCard: { marginBottom: SPACING.md },
  simSubtitle: { color: M3.onSurfaceVariant, marginBottom: 12 },
  simGradeRow: { zIndex: 200, elevation: 200, marginBottom: 4 },
  simResults: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  simResultItem: { alignItems: 'center', flex: 1, minWidth: 90 },
  simResultLabel: { color: M3.onSurfaceVariant, marginBottom: 4, textAlign: 'center' },
  simResultVal: { textAlign: 'center' },
  simDelta: { color: M3.outline, fontWeight: '400' },
  simHint: { color: M3.outline, textAlign: 'center', paddingVertical: 8 },

  // Filled form fields: surfaceContainerHigh, radius 16, no border, label above.
  input: {
    backgroundColor: M3.surfaceContainerHigh,
    borderRadius: SHAPE.lg,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: M3.onSurface,
    marginBottom: 12,
  },
  fieldLabel: { color: M3.onSurfaceVariant, marginBottom: 6, marginTop: 4 },

  addExam: { marginVertical: SPACING.md },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    marginBottom: 8,
  },
  listTitle: { color: M3.onSurface },
  clearAll: { borderRadius: SHAPE.full },
  clearAllContent: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: SHAPE.full },
  clearAllText: { color: M3.error },
  group: { gap: 2 },
  examTrailing: { alignItems: 'flex-end', gap: 4 },

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
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
});
