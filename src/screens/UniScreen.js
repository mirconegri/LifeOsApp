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
import { calculateAverages, predictedDegreeGrade as calcPredictedGrade, diffDays } from '../data/helpers';

const STATUSES = ['to start', 'preparing', 'passed'];

function statusColor(s) {
  if (s === 'passed') return 'green';
  if (s === 'preparing') return 'accent';
  return 'muted';
}

export default function UniScreen({ exams, setExams, totalCredits }) {
  // ─── Form state (add / edit) ──────────────────────────────────────────────
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId,    setEditingId]    = useState(null); // null = new exam

  const [formName,          setFormName]          = useState('');
  const [formCredits,       setFormCredits]       = useState('');
  const [formDate,          setFormDate]          = useState('');
  const [formExpectedGrade, setFormExpectedGrade] = useState('');
  const [formAchievedGrade, setFormAchievedGrade] = useState('');
  const [formStatus,        setFormStatus]        = useState('to start');
  const [alertConfig,       setAlertConfig]       = useState(null);

  // ─── Global calculations ──────────────────────────────────────────────────
  const { average, weightedAverage } = calculateAverages(exams);
  const predictedGrade = calcPredictedGrade(weightedAverage);

  const passedExams = exams.filter(e => e.achievedGrade);             
  const cfuAcquired = passedExams.reduce((acc, e) => acc + e.credits, 0); 
  const cfuPct = totalCredits > 0 ? (cfuAcquired / totalCredits) * 100 : 0;

  const openAddModal = () => {
    setEditingId(null);
    setFormName('');
    setFormCredits('');
    setFormDate('');
    setFormExpectedGrade('');
    setFormAchievedGrade('');
    setFormStatus('to start');
    setModalVisible(true);
  };

  const openEditModal = (exam) => {
    setEditingId(exam.id);
    setFormName(exam.name);
    setFormCredits(String(exam.credits));
    setFormDate(exam.date || '');
    setFormExpectedGrade(exam.expectedGrade ? String(exam.expectedGrade) : '');
    setFormAchievedGrade(exam.achievedGrade ? String(exam.achievedGrade) : '');
    setFormStatus(exam.status || 'to start');
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formCredits) return;

    const parsedExam = {
      id: editingId || Date.now(),
      name: formName.trim(),
      credits: parseInt(formCredits) || 0,
      date: formDate.trim() || null,
      expectedGrade: parseInt(formExpectedGrade) || null,
      achievedGrade: parseInt(formAchievedGrade) || null,
      status: formStatus
    };

    // Forces passed status if a grade is inputted
    if (parsedExam.achievedGrade) {
      parsedExam.status = 'passed';
    }

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
            setAlertConfig(null);
            setModalVisible(false);
          }
        }
      ]
    });
  };

  return (
    <View style={styles.container}>
      <CustomAlert config={alertConfig} />

      {/* ─── Top Stats row ─── */}
      <View style={styles.statsRow}>
        <View style={styles.statCol}>
          <StatCard label="Average" value={average ? average.toFixed(1) : '-'} color={COLORS.text} />
        </View>
        <View style={styles.statCol}>
          <StatCard label="Weighted Avg" value={weightedAverage ? weightedAverage.toFixed(2) : '-'} color={COLORS.amber} />
        </View>
        <View style={styles.statCol}>
          <StatCard label="Est. Degree" value={predictedGrade || '-'} color={COLORS.green} />
        </View>
      </View>

      {/* ─── Credits Progress ─── */}
      <View style={styles.creditsContainer}>
        <View style={styles.creditsHeader}>
          <Text style={styles.creditsLabel}>CREDITS PROGRESS</Text>
          <Text style={styles.creditsValue}>{cfuAcquired} / {totalCredits}</Text>
        </View>
        <ProgressBar pct={cfuPct} color={COLORS.accent} />
      </View>

      <TouchableOpacity onPress={openAddModal} style={styles.addFullBtn}>
        <Text style={styles.addFullBtnText}>+ Add New Exam</Text>
      </TouchableOpacity>

      {/* ─── Exams List ─── */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {exams.map((exam) => (
          <TouchableOpacity key={exam.id} onPress={() => openEditModal(exam)}>
            <Card style={styles.examCard}>
              
              {/* Exam Info Row */}
              <View style={styles.examInfoRow}>
                <View style={styles.examLeft}>
                  <Text style={styles.examName}>{exam.name}</Text>
                  <Text style={styles.examSub}>
                    {exam.credits} Credits {exam.date ? `• ${exam.date}` : ''}
                  </Text>
                </View>

                <View style={styles.examRight}>
                  <Pill color={statusColor(exam.status)}>{exam.status}</Pill>
                  <Text style={styles.gradeText}>
                    {exam.achievedGrade ? exam.achievedGrade : (exam.expectedGrade ? `(${exam.expectedGrade})` : '-')}
                  </Text>
                </View>
              </View>

              {/* Status Progress Bar (Only visible if preparing and not yet passed) */}
              {!exam.achievedGrade && exam.status === 'preparing' && exam.date && (
                <View style={styles.prepContainer}>
                  <View style={styles.prepHeader}>
                    <Text style={styles.prepLabel}>Prep progress</Text>
                    <Text style={styles.prepDays}>{Math.max(0, diffDays(exam.date))} days left</Text>
                  </View>
                  {/* Calculates progress assuming a standard 30-day prep period */}
                  <ProgressBar 
                    pct={Math.max(0, Math.min(100, 100 - (diffDays(exam.date) / 30) * 100))} 
                    color={COLORS.green} 
                  />
                </View>
              )}

            </Card>
          </TouchableOpacity>
        ))}
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

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                placeholder="Exam Name..."
                placeholderTextColor={COLORS.textSub}
                value={formName}
                onChangeText={setFormName}
                style={styles.input}
              />

              <TextInput
                placeholder="Credits (e.g. 9)..."
                placeholderTextColor={COLORS.textSub}
                value={formCredits}
                onChangeText={formCredits => setFormCredits(formCredits.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                style={styles.input}
              />

              <TextInput
                placeholder="Exam Date (YYYY-MM-DD)..."
                placeholderTextColor={COLORS.textSub}
                value={formDate}
                onChangeText={setFormDate}
                style={styles.input}
              />

              <TextInput
                placeholder="Expected Grade..."
                placeholderTextColor={COLORS.textSub}
                value={formExpectedGrade}
                onChangeText={val => setFormExpectedGrade(val.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                style={styles.input}
              />

              <TextInput
                placeholder="Achieved Grade (leave blank if not passed)..."
                placeholderTextColor={COLORS.textSub}
                value={formAchievedGrade}
                onChangeText={val => setFormAchievedGrade(val.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                style={styles.input}
              />

              <Text style={styles.fieldLabel}>Status</Text>
              <View style={styles.statusRow}>
                {STATUSES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setFormStatus(s)}
                    style={[styles.statusChip, formStatus === s && styles.statusChipActive, { marginRight: 8, marginBottom: 8 }]}
                  >
                    <Text style={[styles.statusChipText, formStatus === s && styles.statusChipTextActive]}>
                      {s.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

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

                <TouchableOpacity onPress={handleSave} style={[styles.formBtn, styles.btnSave]}>
                  <Text style={styles.btnSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  statsRow: { flexDirection: 'row', padding: 16, paddingBottom: 8 },
  statCol: { flex: 1, marginHorizontal: 4 },
  
  creditsContainer: { paddingHorizontal: 16, marginBottom: 16 },
  creditsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  creditsLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  creditsValue: { fontSize: 13, color: COLORS.accent, fontWeight: 'bold' },

  addFullBtn: { backgroundColor: COLORS.accentGlow, borderWidth: 1, borderColor: COLORS.accent, marginHorizontal: 16, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  addFullBtnText: { color: COLORS.accent, fontWeight: '700', fontSize: 14 },
  
  scrollContent: { padding: 16, paddingTop: 0, paddingBottom: 32 },
  
  examCard: { marginBottom: 10, paddingVertical: 14 },
  examInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  examLeft: { flex: 1, marginRight: 10 },
  examName: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  examSub: { fontSize: 12, color: COLORS.textMuted },
  examRight: { alignItems: 'flex-end' },
  gradeText: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginTop: 6 },

  prepContainer: { marginTop: 14 },
  prepHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  prepLabel: { fontSize: 11, color: COLORS.textSub, fontWeight: '500' },
  prepDays: { fontSize: 11, color: COLORS.green, fontWeight: '600' },

  modalWrapper: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modal: { backgroundColor: COLORS.bg2, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: COLORS.border, maxHeight: '90%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.bg4, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 14, marginBottom: 12 },
  fieldLabel: { color: COLORS.textSub, fontSize: 13, marginBottom: 8, marginTop: 4 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 },
  statusChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: COLORS.bg4 },
  statusChipActive: { backgroundColor: COLORS.accentGlow },
  statusChipText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  statusChipTextActive: { color: COLORS.accent },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  formBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  btnCancel: { backgroundColor: COLORS.bg4, marginRight: 10 },
  btnCancelText: { color: COLORS.textMuted, fontWeight: '600' },
  btnDelete: { backgroundColor: COLORS.redDim, borderWidth: 1, borderColor: COLORS.red, marginRight: 10 },
  btnDeleteText: { color: COLORS.red, fontWeight: '600' },
  btnSave: { backgroundColor: COLORS.accent },
  btnSaveText: { color: '#fff', fontWeight: '700' }
});