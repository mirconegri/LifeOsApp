// src/screens/UniScreen.js
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { COLORS } from '../config/colors';
import { Card } from '../components/Card';
import { Pill } from '../components/Pill';
import { ProgressBar } from '../components/ProgressBar';
import { StatCard } from '../components/StatCard';
import { CustomAlert } from '../components/CustomAlert';
import { DatePicker } from '../components/DatePicker';
import { GradeSelector } from '../components/GradeSelector';
import { GlassSheet } from '../components/GlassSheet';
import {
  calculateAverages, predictedDegreeGrade as calcPredictedGrade, diffDays,
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

      {/* keyboardShouldPersistTaps="always": without it, the first tap on
          anything in this scroll view (GradeSelector's dropdown rows
          included) while the keyboard is open just dismisses the
          keyboard instead of registering — every other screen's modal
          form already sets this; this top-level scroll view never had
          it. */}
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="always">

        {/* ─── Stat Grid ─── */}
        <Text style={styles.sectionTitle}>📊 Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.gridItem}>
            <StatCard label="Credits Earned" value={`${cfuAcquired}/${totalCredits}`} color={COLORS.accent} />
          </View>
          <View style={styles.gridItem}>
            <StatCard label="Passed This Year" value={passedThisYear.length} color={COLORS.green} />
          </View>
          <View style={styles.gridItem}>
            <StatCard label="Arithmetic Avg" value={average ? average.toFixed(2) : '-'} color={COLORS.text} />
          </View>
          <View style={styles.gridItem}>
            <StatCard label="Weighted Avg" value={weightedAverage ? weightedAverage.toFixed(2) : '-'} color={COLORS.amber} />
          </View>
          {hasExpected && (
            <>
              <View style={styles.gridItem}>
                <StatCard label="Arith. Avg (proj.)" value={avgWithExpected ? avgWithExpected.toFixed(2) : '-'} color={COLORS.textMuted} />
              </View>
              <View style={styles.gridItem}>
                <StatCard label="Weighted (proj.)" value={wavgWithExpected ? wavgWithExpected.toFixed(2) : '-'} color={COLORS.textMuted} />
              </View>
            </>
          )}
          <View style={[styles.gridItem, { width: '100%' }]}>
            <StatCard label="Est. Degree Grade" value={predictedGrade ? `${predictedGrade}/110` : '-'} color={COLORS.green} />
          </View>
        </View>

        {/* ─── Credits Progress ─── */}
        <View style={styles.creditBar}>
          <View style={styles.creditBarHeader}>
            <Text style={styles.creditLabel}>CREDITS PROGRESS</Text>
            <Text style={styles.creditValue}>{cfuAcquired} / {totalCredits || '?'}</Text>
          </View>
          <ProgressBar pct={cfuPct} color={COLORS.accent} />
        </View>

        {/* ─── Grade Simulator ─── */}
        <Text style={styles.sectionTitle}>🧮 Grade Simulator</Text>
        <Card style={styles.simCard}>
          <Text style={styles.simSubtitle}>How would a new grade affect your average?</Text>

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
            style={styles.input}
            placeholder={`CFU for this exam (${SIM_MIN_CREDITS}–${SIM_MAX_CREDITS})`}
            placeholderTextColor={COLORS.textSub}
            keyboardType="numeric"
            value={simCredits}
            onChangeText={v => setSimCredits(v.replace(/[^0-9]/g, ''))}
            maxLength={2}
          />

          {simReady ? (
            <View style={styles.simResults}>
              <View style={styles.simResultItem}>
                <Text style={styles.simResultLabel}>New Arithmetic</Text>
                <Text style={[styles.simResultVal, { color: projectedAvg >= average ? COLORS.green : COLORS.red }]}>
                  {projectedAvg.toFixed(2)}
                  <Text style={styles.simDelta}>
                    {' '}({projectedAvg >= average ? '+' : ''}{(projectedAvg - average).toFixed(2)})
                  </Text>
                </Text>
              </View>
              <View style={styles.simResultItem}>
                <Text style={styles.simResultLabel}>New Weighted</Text>
                <Text style={[styles.simResultVal, { color: projectedWavg >= weightedAverage ? COLORS.green : COLORS.red }]}>
                  {projectedWavg.toFixed(2)}
                  <Text style={styles.simDelta}>
                    {' '}({projectedWavg >= weightedAverage ? '+' : ''}{(projectedWavg - weightedAverage).toFixed(2)})
                  </Text>
                </Text>
              </View>
              <View style={styles.simResultItem}>
                <Text style={styles.simResultLabel}>Est. Degree</Text>
                <Text style={[styles.simResultVal, { color: COLORS.green }]}>
                  {calcPredictedGrade(projectedWavg)}/110
                </Text>
              </View>
            </View>
          ) : (
            // Explains exactly what's missing instead of staying silent —
            // this was the other source of "it doesn't work": the simulator
            // used to just render nothing with no explanation.
            <Text style={styles.simHint}>{simMissing}</Text>
          )}
        </Card>

        {/* ─── Add Exam Button ─── */}
        <TouchableOpacity onPress={openAddModal} style={styles.addFullBtn}>
          <Text style={styles.addFullBtnText}>+ Add New Exam</Text>
        </TouchableOpacity>

        {/* ─── Exams List ─── */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.sectionTitle}>📋 Exams ({exams.length})</Text>
          {exams.length > 0 && (
            <TouchableOpacity onPress={confirmClearAll}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
        {exams.length === 0 ? (
          <Card><Text style={styles.emptyText}>No exams yet. Add your first one!</Text></Card>
        ) : (
          exams
            .slice()
            .sort((a, b) => {
              const order = { preparing: 0, 'to start': 1, passed: 2 };
              return (order[a.status] ?? 3) - (order[b.status] ?? 3);
            })
            .map(exam => (
              <TouchableOpacity key={exam.id} onPress={() => openEditModal(exam)}>
                <Card style={styles.examCard}>
                  <View style={styles.examInfoRow}>
                    <View style={styles.examLeft}>
                      <Text style={styles.examName}>{exam.name}</Text>
                      <Text style={styles.examSub}>
                        {exam.credits} CFU{exam.date ? ` · ${exam.date}` : ''}
                      </Text>
                    </View>
                    <View style={styles.examRight}>
                      <Pill color={statusColor(exam.status)}>{exam.status}</Pill>
                      <Text style={styles.gradeText}>
                        {exam.achievedGrade
                          ? gradeDisplay(exam.achievedGrade)
                          : exam.expectedGrade
                            ? `(${gradeDisplay(exam.expectedGrade)})`
                            : '—'}
                      </Text>
                    </View>
                  </View>
                  {!exam.achievedGrade && exam.status === 'preparing' && exam.date && (
                    <View style={styles.prepContainer}>
                      <View style={styles.prepHeader}>
                        <Text style={styles.prepLabel}>Prep progress</Text>
                        <Text style={styles.prepDays}>{Math.max(0, diffDays(exam.date))} days left</Text>
                      </View>
                      <ProgressBar
                        pct={Math.max(0, Math.min(100, 100 - (diffDays(exam.date) / 30) * 100))}
                        color={COLORS.green}
                      />
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            ))
        )}
      </ScrollView>

      {/* ─── Add / Edit Modal ─── */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalWrapper}
        >
          <TouchableOpacity style={styles.modalBackdrop} onPress={closeModal} />
          <GlassSheet maxHeight="92%">
            <Text style={styles.modalTitle}>{editingId ? 'Edit Exam' : 'Add Exam'}</Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
            >
              {/* Name */}
              <TextInput
                placeholder="Exam name *"
                placeholderTextColor={COLORS.textSub}
                value={formName}
                onChangeText={setFormName}
                style={styles.input}
              />

              {/* Credits */}
              <TextInput
                placeholder="Credits (3–15) *"
                placeholderTextColor={COLORS.textSub}
                value={formCredits}
                onChangeText={v => setFormCredits(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                style={styles.input}
              />

              {/* Status selector */}
              <Text style={styles.fieldLabel}>Status *</Text>
              <View style={styles.statusRow}>
                {STATUSES.map(s => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => handleStatusChange(s)}
                    style={[
                      styles.statusChip,
                      formStatus === s && styles.statusChipActive,
                      { marginRight: 8, marginBottom: 8 },
                    ]}
                  >
                    <Text style={[styles.statusChipText, formStatus === s && styles.statusChipTextActive]}>
                      {s.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Date — future for upcoming, past for passed */}
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

              {/* Expected grade — only for non-passed (optional) */}
              {formStatus !== 'passed' && (
                <GradeSelector
                  value={formExpectedGrade}
                  onChange={setFormExpectedGrade}
                  placeholder="Expected grade (optional)"
                  label="Expected Grade"
                />
              )}

              {/* Action buttons */}
              <View style={styles.modalButtons}>
                {editingId ? (
                  <TouchableOpacity onPress={() => confirmDelete(editingId)} style={[styles.formBtn, styles.btnDelete]}>
                    <Text style={styles.btnDeleteText}>Delete</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={closeModal} style={[styles.formBtn, styles.btnCancel]}>
                    <Text style={styles.btnCancelText}>Cancel</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handleSave}
                  style={[styles.formBtn, styles.btnSave]}
                >
                  <Text style={styles.btnSaveText}>
                    {editingId ? 'Update Exam' : 'Add Exam'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Extra padding for keyboard */}
              <View style={{ height: 40 }} />
            </ScrollView>
          </GlassSheet>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bg },
  scrollContent:{ padding: 16, paddingBottom: 40 },

  sectionTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 10 },
  listHeaderRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clearAllText: { fontSize: 12, color: COLORS.red, fontWeight: '600' },

  statsGrid:   { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 8 },
  gridItem:    { width: '48%', marginBottom: 10 },

  creditBar:   { marginBottom: 16 },
  creditBarHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  creditLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  creditValue: { fontSize: 13, color: COLORS.accent, fontWeight: 'bold' },

  // Simulator
  simCard:     { marginBottom: 16, padding: 16, overflow: 'visible' },
  simSubtitle: { fontSize: 12, color: COLORS.textMuted, marginBottom: 12 },
  simGradeRow: { zIndex: 200, elevation: 200, marginBottom: 4 },
  simResults:  { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', marginTop: 4 },
  simResultItem:{ alignItems: 'center', flex: 1, minWidth: '30%' },
  simResultLabel:{ fontSize: 11, color: COLORS.textSub, marginBottom: 4, textAlign: 'center' },
  simResultVal: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  simDelta:    { fontSize: 11, fontWeight: '400' },
  simHint:     { fontSize: 12, color: COLORS.textSub, textAlign: 'center', paddingVertical: 8 },

  addFullBtn:  { backgroundColor: COLORS.accentGlow, borderWidth: 1, borderColor: COLORS.accent, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  addFullBtnText:{ color: COLORS.accent, fontWeight: '700', fontSize: 14 },

  emptyText:   { color: COLORS.textSub, textAlign: 'center', marginVertical: 20, fontSize: 14 },

  examCard:    { marginBottom: 10, paddingVertical: 14 },
  examInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  examLeft:    { flex: 1, marginRight: 10 },
  examName:    { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  examSub:     { fontSize: 12, color: COLORS.textMuted },
  examRight:   { alignItems: 'flex-end' },
  gradeText:   { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginTop: 6 },

  prepContainer:{ marginTop: 14 },
  prepHeader:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  prepLabel:   { fontSize: 11, color: COLORS.textSub, fontWeight: '500' },
  prepDays:    { fontSize: 11, color: COLORS.green, fontWeight: '600' },

  // Modal
  modalWrapper:  { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalTitle:  { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 20, textAlign: 'center' },
  input:       { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 14, marginBottom: 12 },
  fieldLabel:  { color: COLORS.textSub, fontSize: 13, marginBottom: 8, marginTop: 4 },
  statusRow:   { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 },
  statusChip:  { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: COLORS.bg4 },
  statusChipActive:    { backgroundColor: COLORS.accentGlow },
  statusChipText:      { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  statusChipTextActive:{ color: COLORS.accent },
  modalButtons:{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  formBtn:     { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  btnCancel:   { backgroundColor: COLORS.bg4, marginRight: 10 },
  btnCancelText:{ color: COLORS.textMuted, fontWeight: '600' },
  btnDelete:   { backgroundColor: COLORS.redDim, borderWidth: 1, borderColor: COLORS.red, marginRight: 10 },
  btnDeleteText:{ color: COLORS.red, fontWeight: '600' },
  btnSave:     { backgroundColor: COLORS.accent },
  btnSaveText: { color: '#fff', fontWeight: '700' },
});
