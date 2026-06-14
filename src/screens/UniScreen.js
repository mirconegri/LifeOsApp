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
import { calcMedia, prevLaurea as calcPrevLaurea } from '../data/helpers';

const STATI = ['da iniziare', 'in preparazione', 'superato'];

function statoColor(s) {
  if (s === 'superato') return 'green';
  if (s === 'in preparazione') return 'accent';
  return 'muted';
}

export default function UniScreen({ exams, setExams }) {
  // ─── Form state (add / edit) ──────────────────────────────────────────────
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId,    setEditingId]    = useState(null); // null = new exam

  const [formNome,        setFormNome]        = useState('');
  const [formCFU,         setFormCFU]         = useState('');
  const [formData,        setFormData]        = useState('');
  const [formVotoAtteso,  setFormVotoAtteso]  = useState('');
  const [formVotoOttenuto,setFormVotoOttenuto]= useState('');
  const [formStato,       setFormStato]       = useState('da iniziare');

  // ─── Alert ───────────────────────────────────────────────────────────────
  const [alertConfig, setAlertConfig] = useState(null);
  const showAlert = (cfg) => setAlertConfig(cfg);

  // ─── Simulator ───────────────────────────────────────────────────────────
  const [simVoto,    setSimVoto]    = useState('');
  const [simMateria, setSimMateria] = useState('');

  // ─── Computed ─────────────────────────────────────────────────────────────
  const { media, mediaPonderata } = calcMedia(exams);
  const superati   = exams.filter(e => e.votoOttenuto);
  const cfuSuperati = superati.reduce((a, e) => a + e.cfu, 0);
  const cfuTotali   = exams.reduce((a, e) => a + e.cfu, 0);
  const prev        = calcPrevLaurea(mediaPonderata);

  const nonSuperati = exams.filter(e => !e.votoOttenuto);

  const simObj    = exams.find(e => e.id === Number(simMateria));
  const simVotoN  = Number(simVoto);
  const simMediaP = (simObj && simVotoN >= 18 && simVotoN <= 30)
    ? (() => {
        const tmp = exams.map(e => e.id === simObj.id ? { ...e, votoOttenuto: simVotoN } : e);
        const s   = tmp.filter(e => e.votoOttenuto);
        const wp  = s.reduce((a, e) => a + e.votoOttenuto * e.cfu, 0);
        const wc  = s.reduce((a, e) => a + e.cfu, 0);
        return wc > 0 ? wp / wc : 0;
      })()
    : mediaPonderata;
  const simPrev = calcPrevLaurea(simMediaP);

  // ─── Open modal ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingId(null);
    setFormNome(''); setFormCFU(''); setFormData('');
    setFormVotoAtteso(''); setFormVotoOttenuto('');
    setFormStato('da iniziare');
    setModalVisible(true);
  };

  const openEdit = (exam) => {
    setEditingId(exam.id);
    setFormNome(exam.name);
    setFormCFU(String(exam.cfu));
    setFormData(exam.data || '');
    setFormVotoAtteso(exam.votoAtteso ? String(exam.votoAtteso) : '');
    setFormVotoOttenuto(exam.votoOttenuto ? String(exam.votoOttenuto) : '');
    setFormStato(exam.stato || 'da iniziare');
    setModalVisible(true);
  };

  // ─── Save ─────────────────────────────────────────────────────────────────
  const salva = () => {
    if (!formNome.trim()) {
      showAlert({ title: 'Errore', message: "Inserisci il nome dell'esame",
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }] });
      return;
    }
    const cfuN = parseInt(formCFU) || 0;
    if (cfuN <= 0) {
      showAlert({ title: 'Errore', message: 'Inserisci CFU validi',
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }] });
      return;
    }
    const votoOttenutoN = formVotoOttenuto ? Number(formVotoOttenuto) : null;
    const statoCalc = votoOttenutoN ? 'superato' : formStato;

    if (editingId !== null) {
      setExams(prev => prev.map(e => e.id === editingId ? {
        ...e,
        name:          formNome.trim(),
        cfu:           cfuN,
        data:          formData || e.data,
        votoAtteso:    formVotoAtteso ? Number(formVotoAtteso) : null,
        votoOttenuto:  votoOttenutoN,
        stato:         statoCalc,
      } : e));
    } else {
      const newId = Math.max(0, ...exams.map(e => e.id)) + 1;
      setExams(prev => [...prev, {
        id:            newId,
        name:          formNome.trim(),
        cfu:           cfuN,
        votoAtteso:    formVotoAtteso ? Number(formVotoAtteso) : null,
        votoOttenuto:  votoOttenutoN,
        data:          formData || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        stato:         statoCalc,
      }]);
    }
    setModalVisible(false);
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const elimina = (id, nome) => {
    showAlert({
      title: 'Elimina Esame',
      message: `Rimuovere "${nome}"?`,
      buttons: [
        { text: 'Annulla', style: 'cancel', onPress: () => setAlertConfig(null) },
        { text: 'Elimina', style: 'destructive', onPress: () => {
          setExams(prev => prev.filter(e => e.id !== id));
          setAlertConfig(null);
        }},
      ],
    });
  };

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* ── Stats ── */}
        <Text style={styles.sectionTitle}>📊 Statistiche</Text>
        <View style={styles.statsRow}>
          <StatCard label="Media"      value={media           ? media.toFixed(1)          : '—'} sub="/30"  color={COLORS.accent} />
          <StatCard label="Media Pond." value={mediaPonderata  ? mediaPonderata.toFixed(1) : '—'} sub="/30"  color={COLORS.amber} />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="CFU"        value={`${cfuSuperati}`} sub={`/ ${cfuTotali}`}           color={COLORS.green} />
          <StatCard label="Prev. Laurea" value={prev || '—'}    sub="/110"                        color={COLORS.blue} />
        </View>

        {/* ── Simulatore ── */}
        <Text style={styles.sectionTitle}>🎯 Simula Voto</Text>
        <Card style={styles.simCard}>
          <Text style={styles.simLabel}>Materia:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            {nonSuperati.map(e => (
              <TouchableOpacity
                key={e.id}
                onPress={() => setSimMateria(e.id)}
                style={[styles.simChip, simMateria == e.id && styles.simChipActive]}
              >
                <Text style={[styles.simChipText, simMateria == e.id && { color: COLORS.accent }]}>
                  {e.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TextInput
            style={styles.input}
            placeholder="Voto ipotetico (18–30)"
            placeholderTextColor={COLORS.textSub}
            keyboardType="numeric"
            value={simVoto}
            onChangeText={setSimVoto}
          />
          <View style={styles.simResultRow}>
            <Text style={styles.simResultLabel}>Nuova media pond.:</Text>
            <Text style={[styles.simResultVal, { color: COLORS.accent }]}>
              {simVotoN >= 18 && simVotoN <= 30 ? simMediaP.toFixed(2) : '—'}
            </Text>
          </View>
          <View style={styles.simResultRow}>
            <Text style={styles.simResultLabel}>Previsione laurea:</Text>
            <Text style={[styles.simResultVal, { color: COLORS.green }]}>
              {simVotoN >= 18 && simVotoN <= 30 ? `${simPrev}/110` : '—'}
            </Text>
          </View>
        </Card>

        {/* ── Lista esami ── */}
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>📋 Esami ({exams.length})</Text>
          <TouchableOpacity onPress={openAdd}>
            <Text style={styles.addBtn}>+ Aggiungi</Text>
          </TouchableOpacity>
        </View>

        {exams.map(e => (
          <Card key={e.id} style={styles.examCard}>
            <View style={styles.examTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.examName}>{e.name}</Text>
                <Text style={styles.examMeta}>{e.cfu} CFU · {e.data}</Text>
              </View>
              <Pill color={statoColor(e.stato)}>{e.stato}</Pill>
            </View>

            {e.votoOttenuto ? (
              <Text style={styles.voto}>Voto: {e.votoOttenuto}/30</Text>
            ) : (
              <View style={{ marginTop: 8 }}>
                <ProgressBar pct={e.votoAtteso ? (e.votoAtteso / 30) * 100 : 0} color={COLORS.accent} />
                {e.votoAtteso && (
                  <Text style={styles.votoAtteso}>Target: {e.votoAtteso}/30</Text>
                )}
              </View>
            )}

            {/* Azioni */}
            <View style={styles.examActions}>
              <TouchableOpacity onPress={() => openEdit(e)} style={styles.editBtn}>
                <Text style={styles.editBtnText}>✏️ Modifica</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => elimina(e.id, e.name)} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>🗑 Elimina</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}

      </ScrollView>

      {/* ─── Modal Add/Edit ─── */}
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
            <Text style={styles.modalTitle}>
              {editingId !== null ? '✏️ Modifica Esame' : '📝 Nuovo Esame'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TextInput style={styles.input} placeholder="Nome esame"
                placeholderTextColor={COLORS.textSub} value={formNome} onChangeText={setFormNome} autoFocus />
              <TextInput style={styles.input} placeholder="CFU"
                placeholderTextColor={COLORS.textSub} keyboardType="numeric" value={formCFU} onChangeText={setFormCFU} />
              <TextInput style={styles.input} placeholder="Data (YYYY-MM-DD)"
                placeholderTextColor={COLORS.textSub} value={formData} onChangeText={setFormData} />
              <TextInput style={styles.input} placeholder="Voto atteso (opz.)"
                placeholderTextColor={COLORS.textSub} keyboardType="numeric" value={formVotoAtteso} onChangeText={setFormVotoAtteso} />
              <TextInput style={styles.input} placeholder="Voto ottenuto (se già superato)"
                placeholderTextColor={COLORS.textSub} keyboardType="numeric" value={formVotoOttenuto} onChangeText={setFormVotoOttenuto} />

              <Text style={styles.fieldLabel}>Stato:</Text>
              <View style={styles.statoRow}>
                {STATI.map(s => (
                  <TouchableOpacity key={s} onPress={() => setFormStato(s)}
                    style={[styles.statoChip, formStato === s && styles.statoChipActive]}>
                    <Text style={[styles.statoChipText, formStato === s && { color: COLORS.accent }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalBtns}>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelBtn}>Annulla</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={salva}>
                  <Text style={styles.confirmBtnText}>
                    {editingId !== null ? 'Salva modifiche' : 'Aggiungi'}
                  </Text>
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
  root:   { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  content:{ padding: 16, paddingBottom: 40 },

  sectionTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 12 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },

  simCard: { marginBottom: 12 },
  simLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 8 },
  simChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: COLORS.bg4, marginRight: 6 },
  simChipActive: { backgroundColor: COLORS.accentGlow },
  simChipText: { fontSize: 11, color: COLORS.textMuted },
  simResultRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  simResultLabel: { fontSize: 12, color: COLORS.textMuted },
  simResultVal: { fontSize: 14, fontWeight: 'bold' },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 4 },
  addBtn:     { fontSize: 13, color: COLORS.accent, fontWeight: '600' },

  examCard:    { marginBottom: 10 },
  examTop:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  examName:    { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 3 },
  examMeta:    { fontSize: 11, color: COLORS.textMuted },
  voto:        { fontSize: 13, color: COLORS.green, fontWeight: '600', marginTop: 6 },
  votoAtteso:  { fontSize: 11, color: COLORS.textSub, marginTop: 4 },

  examActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  editBtn:     { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: COLORS.accentGlow },
  editBtnText: { fontSize: 12, color: COLORS.accent, fontWeight: '600' },
  deleteBtn:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: COLORS.redDim },
  deleteBtnText:{ fontSize: 12, color: COLORS.red, fontWeight: '600' },

  // Modal
  modalWrapper:  { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modal: {
    backgroundColor: COLORS.bg2,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    borderTopWidth: 1, borderColor: COLORS.border,
    maxHeight: '90%',
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.bg4, alignSelf: 'center', marginBottom: 16 },
  modalTitle:  { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 20, textAlign: 'center' },
  input:       { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 14, marginBottom: 10 },
  fieldLabel:  { color: COLORS.textSub, fontSize: 13, marginBottom: 8, marginTop: 4 },
  statoRow:    { flexDirection: 'row', gap: 6, marginBottom: 14, flexWrap: 'wrap' },
  statoChip:   { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: COLORS.bg4 },
  statoChipActive: { backgroundColor: COLORS.accentGlow },
  statoChipText:   { fontSize: 12, color: COLORS.textMuted },
  modalBtns:   { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  cancelBtn:   { color: COLORS.textSub, fontSize: 15, paddingVertical: 12, paddingHorizontal: 16 },
  confirmBtn:  { backgroundColor: COLORS.accent, paddingVertical: 12, paddingHorizontal: 22, borderRadius: 10 },
  confirmBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});