import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Card } from '../components/Card';
import { Pill } from '../components/Pill';
import { COLORS } from '../config/colors';

export default function ObiettiviScreen({ obiettivi, setObiettivi }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [titolo, setTitolo] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [targetInput, setTargetInput] = useState('');
  const [progressoCorrente, setProgressoCorrente] = useState('');
  const [categoria, setCategoria] = useState('Studio');
  const [priorita, setPriorita] = useState('media');
  const [deadline, setDeadline] = useState('');
  const [filtro, setFiltro] = useState('Tutti');

  const CATEGORIE_OBIETTIVI = ['Studio', 'Sport', 'Finanza', 'Salute', 'Personale', 'Lavoro'];
  const PRIORITA_OPTS = ['bassa', 'media', 'alta'];
  const FILTRI = ['Tutti', 'Attivi', 'Completati', 'Scaduti'];

  const apriModal = () => {
    setTitolo(''); setDescrizione(''); setTargetInput('');
    setProgressoCorrente('0'); setCategoria('Studio');
    setPriorita('media'); setDeadline('');
    setModalVisible(true);
  };

  const aggiungiOb = () => {
    const t = titolo.trim();
    const target = parseFloat(targetInput.replace(',', '.')) || 0;
    if (!t) { Alert.alert('Errore', 'Inserisci un titolo'); return; }
    if (target <= 0) { Alert.alert('Errore', 'Inserisci un target valido'); return; }
    
    const newId = Math.max(0, ...obiettivi.map(o => o.id || 0)) + 1;
    
    const ob = {
      id: newId,
      titolo: t,
      descrizione: descrizione.trim(),
      target,
      progresso: parseFloat(progressoCorrente.replace(',', '.')) || 0,
      categoria,
      priorita,
      deadline: deadline.trim(),
      completato: false,
    };
    
    setObiettivi(prev => [ob, ...prev]);
    setModalVisible(false);
  };

  const aggiornaProgresso = (id, delta) => {
    setObiettivi(prev => prev.map(o => {
      if (o.id !== id) return o;
      const nuovo = Math.max(0, Math.min(o.target, o.progresso + delta));
      return { ...o, progresso: nuovo, completato: nuovo >= o.target };
    }));
  };

  const setProgressoDiretto = (id, val) => {
    setObiettivi(prev => prev.map(o => {
      if (o.id !== id) return o;
      const v = parseFloat(val.replace(',', '.')) || 0;
      return { ...o, progresso: Math.max(0, Math.min(o.target, v)), completato: v >= o.target };
    }));
  };

  const eliminaOb = (id) => {
    Alert.alert('Eliminare obiettivo?', '', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: () => {
        setObiettivi(prev => prev.filter(o => o.id !== id));
      }}
    ]);
  };

  const prioritaColor = (p) => p === 'alta' ? COLORS.red : p === 'media' ? COLORS.amber : COLORS.green;
  const prioritaLabel = (p) => p === 'alta' ? '🔴 Alta' : p === 'media' ? '🟡 Media' : '🟢 Bassa';

  const filtrati = obiettivi.filter(o => {
    if (filtro === 'Attivi') return !o.completato;
    if (filtro === 'Completati') return o.completato;
    if (filtro === 'Scaduti') return o.deadline && !o.completato && new Date(o.deadline) < new Date();
    return true;
  });

  const attivi = obiettivi.filter(o => !o.completato).length;
  const completati = obiettivi.filter(o => o.completato).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>🎯 Obiettivi</Text>
        <TouchableOpacity onPress={apriModal} style={styles.addFab}>
          <Text style={styles.addFabText}>+ Nuovo</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.statVal}>{attivi}</Text>
          <Text style={styles.statLbl}>Attivi</Text>
        </View>
        <View style={[styles.statCard, { flex: 1, marginLeft: 8 }]}>
          <Text style={[styles.statVal, { color: COLORS.green }]}>{completati}</Text>
          <Text style={styles.statLbl}>Completati</Text>
        </View>
      </View>

      {/* Filtri */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
        {FILTRI.map(f => <Pill key={f} label={f} selected={filtro === f} onPress={() => setFiltro(f)} />)}
      </ScrollView>

      {/* Lista obiettivi */}
      {filtrati.length === 0 ? (
        <Card><Text style={styles.emptyText}>Nessun obiettivo in questa categoria.</Text></Card>
      ) : filtrati.map(ob => {
        const pct = ob.target > 0 ? Math.min(100, (ob.progresso / ob.target) * 100) : 0;
        const scaduto = ob.deadline && !ob.completato && new Date(ob.deadline) < new Date();
        return (
          <Card key={ob.id} style={ob.completato ? styles.cardCompletato : scaduto ? styles.cardScaduto : null}>
            <View style={styles.obHeader}>
              <View style={styles.obTitleRow}>
                <Text style={[styles.obTitolo, ob.completato && styles.obDone]}>{ob.titolo}</Text>
                {ob.completato && <Text style={styles.checkEmoji}>✅</Text>}
                {scaduto && <Text style={styles.checkEmoji}>⚠️</Text>}
              </View>
              <TouchableOpacity onPress={() => eliminaOb(ob.id)}>
                <Text style={styles.trashBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {ob.descrizione ? <Text style={styles.obDesc}>{ob.descrizione}</Text> : null}

            <View style={styles.obMeta}>
              <Pill color="muted">{ob.categoria}</Pill>
              <Text style={{ color: prioritaColor(ob.priorita), fontSize: 12, fontWeight: '600', marginLeft: 8 }}>
                {prioritaLabel(ob.priorita)}
              </Text>
              {ob.deadline ? (
                <Text style={[styles.deadline, scaduto && styles.deadlineScaduto]}>
                  📅 {ob.deadline}
                </Text>
              ) : null}
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: ob.completato ? COLORS.green : COLORS.accent }]} />
              </View>
              <Text style={styles.progressText}>{pct.toFixed(0)}%</Text>
            </View>

            <View style={styles.progressNumbers}>
              <Text style={styles.progressCurr}>{ob.progresso}</Text>
              <Text style={styles.progressTarget}> / {ob.target}</Text>
            </View>

            <View style={styles.stepperRow}>
              <TouchableOpacity style={styles.stepBtn} onPress={() => aggiornaProgresso(ob.id, -1)}>
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.stepInput}
                value={String(ob.progresso)}
                onChangeText={v => setProgressoDiretto(ob.id, v)}
                keyboardType="decimal-pad"
                placeholderTextColor={COLORS.textSub}
              />
              <TouchableOpacity style={styles.stepBtn} onPress={() => aggiornaProgresso(ob.id, 1)}>
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                style={[styles.completeBtn, ob.completato && styles.completeBtnDone]}
                onPress={() => aggiornaProgresso(ob.id, ob.target - ob.progresso)}>
                <Text style={styles.completeBtnText}>{ob.completato ? '✓ Fatto' : '✓ Completa'}</Text>
              </TouchableOpacity>
            </View>
          </Card>
        );
      })}

      {/* Modal crea */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>🎯 Nuovo Obiettivo</Text>

            <TextInput style={styles.input} placeholder="Titolo obiettivo"
              placeholderTextColor={COLORS.textSub} value={titolo} onChangeText={setTitolo} />
            <TextInput style={[styles.input, styles.noteInput]} placeholder="Descrizione (opz.)"
              placeholderTextColor={COLORS.textSub} value={descrizione}
              onChangeText={setDescrizione} multiline />

            <View style={styles.row2}>
              <TextInput style={[styles.input, styles.smallInput]} placeholder="Target numerico"
                placeholderTextColor={COLORS.textSub} value={targetInput}
                onChangeText={setTargetInput} keyboardType="decimal-pad" />
              <TextInput style={[styles.input, styles.smallInput]} placeholder="Partenza (es. 0)"
                placeholderTextColor={COLORS.textSub} value={progressoCorrente}
                onChangeText={setProgressoCorrente} keyboardType="decimal-pad" />
            </View>

            <Text style={styles.fieldLabel}>Categoria:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 10}}>
              {CATEGORIE_OBIETTIVI.map(c => (
                <TouchableOpacity key={c} onPress={() => setCategoria(c)} style={[styles.catPill, categoria === c && styles.catPillActive]}>
                   <Text style={[styles.catPillText, categoria === c && {color: COLORS.accent}]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Priorità:</Text>
            <View style={styles.prioritaRow}>
              {PRIORITA_OPTS.map(p => (
                <TouchableOpacity key={p} onPress={() => setPriorita(p)}
                  style={[styles.prioritaBtn, priorita === p && { borderColor: prioritaColor(p), backgroundColor: prioritaColor(p) + '22' }]}>
                  <Text style={[styles.prioritaText, priorita === p && { color: prioritaColor(p) }]}>
                    {prioritaLabel(p)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput style={styles.input} placeholder="Deadline (es. 2026-12-31)"
              placeholderTextColor={COLORS.textSub} value={deadline} onChangeText={setDeadline} />

            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtn}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={aggiungiOb}>
                <Text style={styles.confirmBtnText}>Crea obiettivo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text },
  addFab: { backgroundColor: COLORS.accent, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  addFabText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  statsRow: { flexDirection: 'row', marginBottom: 16 },
  statCard: { backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 16, alignItems: 'center' },
  statVal: { fontSize: 28, fontWeight: '700', color: COLORS.accent },
  statLbl: { fontSize: 12, color: COLORS.textSub, marginTop: 4 },
  pillRow: { marginBottom: 16, flexDirection: 'row' },
  emptyText: { color: COLORS.textSub, fontSize: 14, textAlign: 'center', marginVertical: 20 },
  cardCompletato: { opacity: 0.7 },
  cardScaduto: { borderColor: COLORS.red + '44', borderWidth: 1 },
  obHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  obTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  obTitolo: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1 },
  obDone: { textDecorationLine: 'line-through', color: COLORS.textSub },
  checkEmoji: { fontSize: 14 },
  trashBtn: { fontSize: 16, marginLeft: 8, padding: 4, color: COLORS.textMuted },
  obDesc: { fontSize: 13, color: COLORS.textMuted, marginBottom: 8, lineHeight: 18 },
  obMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  deadline: { fontSize: 12, color: COLORS.textMuted, marginLeft: 8 },
  deadlineScaduto: { color: COLORS.red, fontWeight: '600' },
  progressSection: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  progressBar: { flex: 1, height: 8, backgroundColor: COLORS.bg4, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 13, color: COLORS.accent, fontWeight: '700', minWidth: 36, textAlign: 'right' },
  progressNumbers: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  progressCurr: { fontSize: 14, color: COLORS.text },
  progressTarget: { fontSize: 13, color: COLORS.textSub },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.bg4, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  stepBtnText: { fontSize: 18, color: COLORS.text, fontWeight: '600' },
  stepInput: { width: 70, backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 6, color: COLORS.text, fontSize: 14, textAlign: 'center' },
  completeBtn: { backgroundColor: COLORS.accent, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  completeBtnDone: { backgroundColor: COLORS.green },
  completeBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: COLORS.bg2, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 15, marginBottom: 10 },
  row2: { flexDirection: 'row', gap: 10 },
  smallInput: { flex: 1 },
  noteInput: { height: 60, textAlignVertical: 'top' },
  fieldLabel: { color: COLORS.textSub, fontSize: 13, marginBottom: 8, marginTop: 4 },
  catPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: COLORS.bg4, marginRight: 8},
  catPillActive: {backgroundColor: COLORS.accentGlow},
  catPillText: {fontSize: 12, color: COLORS.textMuted},
  prioritaRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  prioritaBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', backgroundColor: COLORS.bg3 },
  prioritaText: { fontSize: 13, color: COLORS.textSub },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  cancelBtn: { color: COLORS.textSub, fontSize: 15, paddingVertical: 12, paddingHorizontal: 20 },
  confirmBtn: { backgroundColor: COLORS.accent, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});