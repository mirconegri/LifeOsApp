// src/screens/UniScreen.js
import React, { useState, useRef } from 'react';
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
import {
  calculateAverages, predictedDegreeGrade as calcPredictedGrade, diffDays,
  gradeWeight, gradeLabel,
} from '../data/helpers';

const STATUSES = ['to start', 'preparing', 'passed'];

function statusColor(s) {
  if (s === 'passed')    return 'green';
  if (s === 'preparing') return 'accent';
  return 'muted';
}

// Thin wrapper kept local to this screen for readability
function gradeDisplay(val) {
  return gradeLabel(val);
}

function gradeToNumber(val) {
  return gradeWeight(val);
}

// ── Averages that understand 30L → uses 30 in math (via gradeWeight) ──
// Also computes "projected" averages that fold in expectedGrade for
// exams that haven't been passed yet, so the user can see where they'd
// land if every expected grade came true.
function calcExtended(exams) {
  const passed = exams.filter(e => e.achievedGrade);
  const withExpected = exams.filter(e => !e.achievedGrade && e.expectedGrade);
  const combined = [...passed, ...withExpected.map(e => ({ ...e, achievedGrade: e.expectedGrade }))];

  function avg(list) {
    if (!list.length) return 0;
    const numList = list.map(e => gradeWeight(e.achievedGrade)).filter(Boolean);
    if (!numList.length) return 0;
    return numList.reduce((a, b) => a + b, 0) / numList.length;
  }
  function wavg(list) {
    if (!list.length) return 0;
    const valid = list.filter(e => gradeWeight(e.achievedGrade));
    if (!valid.length) return 0;
    const wp = valid.reduce((a, e) => a + gradeWeight(e.achievedGrade) * e.credits, 0);
    const wc = valid.reduce((a, e) => a + e.credits, 0);
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

  // ─── Computed ─────────────────────────────────────────────────────────────
  const {
    average, weightedAverage,
    avgWithExpected, wavgWithExpected, hasExpected,
  } = calcExtended(exams);

  const predictedGrade = calcPredictedGrade(weightedAverage);

  const passedExams  = exams.filter(e => e.achievedGrade);
  const cfuAcquired  = passedExams.reduce((acc, e) => acc + e.credits, 0);
  const cfuPct       = totalCredits > 0 ? (cfuAcquired / totalCredits) * 100 : 0;

  const thisYear     = new Date().getFullYear();
  const passedThisYear = passedExams.filter(e => e.date && e.date.startsWith(String(thisYear)));

  // Simulator projection
  const simNumGrade = simGrade ? gradeToNumber(simGrade) : null;
  const simCredNum  = parseInt(simCredits) || 0;
  let projectedAvg = null, projectedWavg = null;
  if (simNumGrade && simCredNum > 0) {
    const allGrades = [...passedExams.map(e => gradeToNumber(e.achievedGrade)), simNumGrade].filter(Boolean);
    projectedAvg  = allGrades.reduce((a, b) => a + b, 0) / allGrades.length;
    const wp = passedExams.reduce((a, e) => a + gradeToNumber(e.achievedGrade) * e.credits, 0) + simNumGrade * simCredNum;
    const wc = passedExams.reduce((a, e) => a + e.credits, 0) + simCredNum;
    projectedWavg = wc ? wp / wc : 0;
  }

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
    // Convert 30 → check if it was 30L (we store 31 for 30L)
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
    const credits = parseInt(formCredits) || 0;

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
    if (formStatus === 'passed' && !formAchievedGrade) {
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

  // Date mode: both directions are capped at 5 years, exactly as requested.
  // 'future5'  → to-start/preparing exams: today through +5 years.
  // 'past5'    → passed exams: -5 years through today.
  const dateMode = formStatus === 'passed' ? 'past5' : 'future5';

  return (
    <View style={styles.container}>
      <CustomAlert config={alertConfig} />

      <ScrollView contentContainerStyle={styles.scrollContent}>

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
          <View style={styles.simRow}>
            <View style={{ flex: 1, marginRight: 10, zIndex: 200 }}>
              <GradeSelector
                value={simGrade}
                onChange={setSimGrade}
                placeholder="Grade"
              />
            </View>
            <TextInput
              style={[styles.input, { width: 80, marginBottom: 0 }]}
              placeholder="CFU"
              placeholderTextColor={COLORS.textSub}
              keyboardType="numeric"
              value={simCredits}
              onChangeText={v => setSimCredits(v.replace(/[^0-9]/g, ''))}
            />
          </View>
          {projectedAvg !== null ? (
            <View style={styles.simResults}>
              <View style={styles.simResultItem}>
                <Text style={styles.simResultLabel}>New Arithmetic</Text>
                <Text style={[styles.simResultVal, { color: projectedAvg > average ? COLORS.green : COLORS.red }]}>
                  {projectedAvg.toFixed(2)}
                  <Text style={styles.simDelta}>
                    {' '}({projectedAvg > average ? '+' : ''}{(projectedAvg - average).toFixed(2)})
                  </Text>
                </Text>
              </View>
              <View style={styles.simResultItem}>
                <Text style={styles.simResultLabel}>New Weighted</Text>
                <Text style={[styles.simResultVal, { color: projectedWavg > weightedAverage ? COLORS.green : COLORS.red }]}>
                  {projectedWavg.toFixed(2)}
                  <Text style={styles.simDelta}>
                    {' '}({projectedWavg > weightedAverage ? '+' : ''}{(projectedWavg - weightedAverage).toFixed(2)})
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
            <Text style={styles.simHint}>Enter a grade and CFU to see the projection</Text>
          )}
        </Card>

        {/* ─── Add Exam Button ─── */}
        <TouchableOpacity onPress={openAddModal} style={styles.addFullBtn}>
          <Text style={styles.addFullBtnText}>+ Add New Exam</Text>
        </TouchableOpacity>

        {/* ─── Exams List ─── */}
        <Text style={styles.sectionTitle}>📋 Exams ({exams.length})</Text>
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
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalWrapper}
        >
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setModalVisible(false)} />
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{editingId ? 'Edit Exam' : 'Add Exam'}</Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
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
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.formBtn, styles.btnCancel]}>
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
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bg },
  scrollContent:{ padding: 16, paddingBottom: 40 },

  sectionTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 10 },

  statsGrid:   { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 8 },
  gridItem:    { width: '48%', marginBottom: 10 },

  creditBar:   { marginBottom: 16 },
  creditBarHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  creditLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  creditValue: { fontSize: 13, color: COLORS.accent, fontWeight: 'bold' },

  // Simulator
  simCard:     { marginBottom: 16, padding: 16 },
  simSubtitle: { fontSize: 12, color: COLORS.textMuted, marginBottom: 12 },
  simRow:      { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  simResults:  { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
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
  modal: {
    backgroundColor: COLORS.bg2,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    borderTopWidth: 1, borderColor: COLORS.border,
    maxHeight: '92%',
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.bg4, alignSelf: 'center', marginBottom: 16 },
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
