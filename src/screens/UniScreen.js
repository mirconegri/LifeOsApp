import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../config/colors';
import { Card } from '../components/Card';
import { Pill } from '../components/Pill';
import { ProgressBar } from '../components/ProgressBar';
import { StatCard } from '../components/StatCard';
import { calcMedia, prevLaurea as calcPrevLaurea } from '../data/helpers';

export default function UniScreen({ exams, setExams }) {
  const [showForm, setShowForm] = useState(false);
  const [formNome, setFormNome] = useState('');
  const [formCFU, setFormCFU] = useState('');
  const [formData, setFormData] = useState('');
  const [formVotoAtteso, setFormVotoAtteso] = useState('');
  const [formStato, setFormStato] = useState('da iniziare');

  const { media, mediaPonderata } = calcMedia(exams);
  const superati = exams.filter(e => e.votoOttenuto);
  const cfuSuperati = superati.reduce((a, e) => a + e.cfu, 0);
  const cfuTotali = exams.reduce((a, e) => a + e.cfu, 0);
  const prev = calcPrevLaurea(mediaPonderata);

  const nonSuperati = exams.filter(e => !e.votoOttenuto);
  const [simVoto, setSimVoto] = useState('');
  const [simMateria, setSimMateria] = useState(nonSuperati[0]?.id || '');

  const simObj = exams.find(e => e.id === Number(simMateria));
  const simVotoN = Number(simVoto);
  const simMediaP = simObj && simVotoN
    ? (() => {
        const esamiConSim = exams.map(e =>
          e.id === simObj.id ? { ...e, votoOttenuto: simVotoN } : e
        );
        const s = esamiConSim.filter(e => e.votoOttenuto);
        const wp = s.reduce((a, e) => a + e.votoOttenuto * e.cfu, 0);
        const wc = s.reduce((a, e) => a + e.cfu, 0);
        return wc > 0 ? wp / wc : 0;
      })()
    : mediaPonderata;

  const simPrev = calcPrevLaurea(simMediaP);

  const aggiungiEsame = () => {
    if (!formNome.trim()) { Alert.alert('Errore', 'Inserisci il nome dell\'esame'); return; }
    const cfuN = parseInt(formCFU) || 0;
    if (!formCFU || cfuN <= 0) { Alert.alert('Errore', 'Inserisci i CFU validi'); return; }
    const newId = Math.max(0, ...exams.map(e => e.id)) + 1;
    const newExam = {
      id: newId,
      name: formNome.trim(),
      cfu: cfuN,
      votoAtteso: formVotoAtteso ? Number(formVotoAtteso) : null,
      votoOttenuto: null,
      data: formData || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      stato: formStato,
    };
    setExams(prev => [...prev, newExam]);
    setFormNome(''); setFormCFU(''); setFormData(''); setFormVotoAtteso(''); setFormStato('da iniziare');
    setShowForm(false);
  };

  const pillStato = (stato) => {
    if (stato === 'superato') return <Pill color="green">{stato}</Pill>;
    if (stato === 'in preparazione') return <Pill color="accent">{stato}</Pill>;
    return <Pill color="muted">{stato}</Pill>;
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>📊 Statistiche</Text>
      <View style={styles.statsRow}>
        <StatCard label="Media" value={media ? media.toFixed(1) : '—'} sub="/30" color={COLORS.accent} />
        <StatCard label="Media Pond." value={mediaPonderata ? mediaPonderata.toFixed(1) : '—'} sub="/30" color={COLORS.amber} />
      </View>
      <View style={styles.statsRow}>
        <StatCard label="CFU" value={`${cfuSuperati}`} sub={`/ ${cfuTotali}`} color={COLORS.green} />
        <StatCard label="Prev. Laurea" value={prev || '—'} sub="/110" color={COLORS.blue} />
      </View>

      <Text style={styles.sectionTitle}>🎯 Simula Voto</Text>
      <Card style={styles.simCard}>
        <View style={styles.simRow}>
          <Text style={styles.simLabel}>Materia:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
            {nonSuperati.map(e => (
              <TouchableOpacity
                key={e.id}
                onPress={() => setSimMateria(e.id)}
                style={[styles.simChip, simMateria == e.id && styles.simChipActive]}
              >
                <Text style={[styles.simChipText, simMateria == e.id && { color: COLORS.accent }]}>{e.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Voto ipotetico (18–30)"
          placeholderTextColor={COLORS.textSub}
          keyboardType="numeric"
          value={simVoto}
          onChangeText={setSimVoto}
        />
        <View style={styles.simResult}>
          <Text style={styles.simResultLabel}>Nuova media pond.:</Text>
          <Text style={[styles.simResultVal, { color: COLORS.accent }]}>{simVotoN >= 18 && simVotoN <= 30 ? simMediaP.toFixed(2) : '—'}</Text>
        </View>
        <View style={styles.simResult}>
          <Text style={styles.simResultLabel}>Previsione laurea:</Text>
          <Text style={[styles.simResultVal, { color: COLORS.green }]}>{simVotoN >= 18 && simVotoN <= 30 ? `${simPrev}/110` : '—'}</Text>
        </View>
      </Card>

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>📋 Esami ({exams.length})</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addBtn}>{showForm ? '✕ Annulla' : '+ Aggiungi'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Nuovo Esame</Text>
          <TextInput style={styles.input} placeholder="Nome esame" placeholderTextColor={COLORS.textSub} value={formNome} onChangeText={setFormNome} />
          <TextInput style={styles.input} placeholder="CFU" placeholderTextColor={COLORS.textSub} keyboardType="numeric" value={formCFU} onChangeText={setFormCFU} />
          <TextInput style={styles.input} placeholder="Data (YYYY-MM-DD)" placeholderTextColor={COLORS.textSub} value={formData} onChangeText={setFormData} />
          <TextInput style={styles.input} placeholder="Voto atteso" placeholderTextColor={COLORS.textSub} keyboardType="numeric" value={formVotoAtteso} onChangeText={setFormVotoAtteso} />
          <View style={styles.statoRow}>
            {['da iniziare', 'in preparazione', 'superato'].map(s => (
              <TouchableOpacity key={s} onPress={() => setFormStato(s)} style={[styles.statoChip, formStato === s && styles.statoChipActive]}>
                <Text style={[styles.statoChipText, formStato === s && { color: COLORS.accent }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.submitBtn} onPress={aggiungiEsame}>
            <Text style={styles.submitBtnText}>Aggiungi</Text>
          </TouchableOpacity>
        </Card>
      )}

      {exams.map(e => (
        <Card key={e.id} style={styles.examCard}>
          <View style={styles.examTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.examName}>{e.name}</Text>
              <Text style={styles.examMeta}>{e.cfu} CFU · {e.data}</Text>
            </View>
            {pillStato(e.stato)}
          </View>
          {e.votoOttenuto && (
            <Text style={styles.voto}>Voto: {e.votoOttenuto}</Text>
          )}
          {!e.votoOttenuto && (
            <View style={{ marginTop: 8 }}>
              <ProgressBar pct={e.votoAtteso ? (e.votoAtteso / 30) * 100 : 0} color={COLORS.accent} />
              {e.votoAtteso && <Text style={styles.votoAtteso}>Target: {e.votoAtteso}/30</Text>}
            </View>
          )}
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 32 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 10 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  simCard: { marginBottom: 12 },
  simRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  simLabel: { fontSize: 12, color: COLORS.textMuted },
  simChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: COLORS.bg4, marginRight: 6 },
  simChipActive: { backgroundColor: COLORS.accentGlow },
  simChipText: { fontSize: 11, color: COLORS.textMuted },
  simResult: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  simResultLabel: { fontSize: 12, color: COLORS.textMuted },
  simResultVal: { fontSize: 14, fontWeight: 'bold' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 4 },
  addBtn: { fontSize: 13, color: COLORS.accent, fontWeight: '600' },
  formCard: { marginBottom: 12 },
  formTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 10 },
  input: { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: COLORS.text, fontSize: 13, marginBottom: 8 },
  statoRow: { flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  statoChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: COLORS.bg4 },
  statoChipActive: { backgroundColor: COLORS.accentGlow },
  statoChipText: { fontSize: 11, color: COLORS.textMuted },
  submitBtn: { backgroundColor: COLORS.accent, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  examCard: { marginBottom: 10 },
  examTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  examName: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 3 },
  examMeta: { fontSize: 11, color: COLORS.textMuted },
  voto: { fontSize: 13, color: COLORS.green, fontWeight: '600', marginTop: 6 },
  votoAtteso: { fontSize: 11, color: COLORS.textSub, marginTop: 4 },
});