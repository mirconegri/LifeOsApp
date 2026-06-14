import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS } from '../config/colors';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { CustomAlert } from '../components/CustomAlert';

const CAT_COLORS = {
  lavoro:      COLORS.green,
  università:  COLORS.accent,
  cibo:        COLORS.amber,
  trasporti:   COLORS.blue,
  altro:       COLORS.textMuted,
};

const CATEGORIE = Object.keys(CAT_COLORS);

export default function FinanzeScreen({ finanze, setFinanze }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [formDesc,    setFormDesc]    = useState('');
  const [formImporto, setFormImporto] = useState('');
  const [formTipo,    setFormTipo]    = useState('uscita');
  const [formCat,     setFormCat]     = useState('altro');
  const [formData,    setFormData]    = useState('');
  const [alertConfig, setAlertConfig] = useState(null);

  const showAlert = (cfg) => setAlertConfig(cfg);

  // ── Computed ─────────────────────────────────────────────────────────────
  const saldo   = finanze.reduce((a, t) => a + t.importo, 0);
  const entrate = finanze.filter(t => t.tipo === 'entrata').reduce((a, t) => a + t.importo, 0);
  const uscite  = Math.abs(finanze.filter(t => t.tipo === 'uscita').reduce((a, t) => a + t.importo, 0));

  const now    = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return {
      label: d.toLocaleDateString('it-IT', { month: 'short' }),
      key:   d.toISOString().slice(0, 7),
    };
  });

  const monthBars = months.map(m => {
    const entries = finanze.filter(t => t.data && t.data.startsWith(m.key));
    return entries.reduce((a, t) => a + t.importo, 0);
  });
  const maxAbs = Math.max(...monthBars.map(Math.abs), 1);

  // ── Actions ───────────────────────────────────────────────────────────────
  const aggiungi = () => {
    if (!formDesc.trim()) {
      showAlert({ title: 'Errore', message: 'Inserisci la descrizione',
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }] });
      return;
    }
    const imp = parseFloat(formImporto) || 0;
    if (imp === 0) {
      showAlert({ title: 'Errore', message: 'Inserisci un importo valido',
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }] });
      return;
    }
    const newId = Math.max(0, ...finanze.map(f => f.id)) + 1;
    setFinanze(prev => [...prev, {
      id:      newId,
      data:    formData || new Date().toISOString().slice(0, 10),
      desc:    formDesc.trim(),
      importo: formTipo === 'uscita' ? -Math.abs(imp) : Math.abs(imp),
      tipo:    formTipo,
      cat:     formCat,
    }]);
    setFormDesc(''); setFormImporto(''); setFormTipo('uscita');
    setFormCat('altro'); setFormData('');
    setModalVisible(false);
  };

  const elimina = (id, desc) => {
    showAlert({
      title: 'Elimina',
      message: `Rimuovere "${desc}"?`,
      buttons: [
        { text: 'Annulla', style: 'cancel', onPress: () => setAlertConfig(null) },
        { text: 'Elimina', style: 'destructive', onPress: () => {
          setFinanze(prev => prev.filter(f => f.id !== id));
          setAlertConfig(null);
        }},
      ],
    });
  };

  const recenti = [...finanze].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 15);

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* ── Stats ── */}
        <Text style={styles.sectionTitle}>💶 Panoramica</Text>
        <View style={styles.statsRow}>
          <StatCard label="Saldo"   value={saldo >= 0 ? `+${saldo}` : `${saldo}`} sub="€" color={saldo >= 0 ? COLORS.green : COLORS.red} />
          <StatCard label="Entrate" value={`+${entrate}`} sub="€" color={COLORS.green} />
          <StatCard label="Uscite"  value={`-${uscite}`}  sub="€" color={COLORS.red}   />
        </View>

        {/* ── Grafico ── */}
        <Text style={styles.sectionTitle}>📈 Ultimi 6 mesi</Text>
        <Card style={styles.chartCard}>
          <View style={styles.chart}>
            {monthBars.map((val, i) => {
              const h     = Math.abs(val) / maxAbs * 80;
              const isPos = val >= 0;
              return (
                <View key={i} style={styles.barCol}>
                  <View style={[styles.bar, { height: h || 2, backgroundColor: isPos ? COLORS.green : COLORS.red }]} />
                  <Text style={styles.barVal}>{val > 0 ? '+' : ''}{val}</Text>
                  <Text style={styles.barLabel}>{months[i].label}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* ── Transazioni ── */}
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>📋 Transazioni ({recenti.length})</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={styles.addBtn}>+ Aggiungi</Text>
          </TouchableOpacity>
        </View>

        {recenti.map(t => (
          <Card key={t.id} style={styles.txCard}>
            <View style={styles.txRow}>
              <View style={[styles.txDot, { backgroundColor: CAT_COLORS[t.cat] || COLORS.textMuted }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.txDesc}>{t.desc}</Text>
                <Text style={styles.txMeta}>{t.data} · {t.cat}</Text>
              </View>
              <Text style={[styles.txImporto, { color: t.importo >= 0 ? COLORS.green : COLORS.red }]}>
                {t.importo >= 0 ? '+' : ''}{t.importo} €
              </Text>
              <TouchableOpacity onPress={() => elimina(t.id, t.desc)} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* ── Modal Aggiungi ── */}
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
            <Text style={styles.modalTitle}>Nuova Transazione</Text>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TextInput style={styles.input} placeholder="Descrizione"
                placeholderTextColor={COLORS.textSub} value={formDesc} onChangeText={setFormDesc} autoFocus />
              <TextInput style={styles.input} placeholder="Importo (€)"
                placeholderTextColor={COLORS.textSub} keyboardType="numeric" value={formImporto} onChangeText={setFormImporto} />
              <TextInput style={styles.input} placeholder="Data (YYYY-MM-DD)"
                placeholderTextColor={COLORS.textSub} value={formData} onChangeText={setFormData} />

              <Text style={styles.fieldLabel}>Tipo:</Text>
              <View style={styles.tipoRow}>
                {[['entrata', '↑ Entrata'], ['uscita', '↓ Uscita']].map(([v, l]) => (
                  <TouchableOpacity key={v} onPress={() => setFormTipo(v)}
                    style={[styles.tipoChip, formTipo === v && styles.tipoChipActive]}>
                    <Text style={[styles.tipoChipText,
                      formTipo === v && { color: v === 'entrata' ? COLORS.green : COLORS.red }
                    ]}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Categoria:</Text>
              <View style={styles.catRow}>
                {CATEGORIE.map(c => (
                  <TouchableOpacity key={c} onPress={() => setFormCat(c)}
                    style={[styles.catChip, formCat === c && styles.catChipActive]}>
                    <Text style={[styles.catChipText, formCat === c && { color: CAT_COLORS[c] }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={aggiungi}>
                <Text style={styles.submitBtnText}>Aggiungi</Text>
              </TouchableOpacity>
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
  content:{ padding: 16, paddingBottom: 32 },

  sectionTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 10 },
  statsRow:     { flexDirection: 'row', gap: 10, marginBottom: 4 },

  chartCard: { marginBottom: 12 },
  chart:     { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 120, paddingVertical: 8 },
  barCol:    { alignItems: 'center', flex: 1 },
  bar:       { width: 24, borderRadius: 3, marginBottom: 4 },
  barVal:    { fontSize: 9, color: COLORS.textSub, marginBottom: 2 },
  barLabel:  { fontSize: 9, color: COLORS.textMuted },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 4 },
  addBtn:     { fontSize: 13, color: COLORS.accent, fontWeight: '600' },

  txCard: { marginBottom: 8, padding: 12 },
  txRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  txDot:  { width: 8, height: 8, borderRadius: 4 },
  txDesc: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  txMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  txImporto:  { fontSize: 13, fontWeight: '600' },
  deleteBtn:  { padding: 4 },
  deleteBtnText: { fontSize: 14, color: COLORS.textSub },

  // Modal
  modalWrapper:  { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modal: {
    backgroundColor: COLORS.bg2,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    borderTopWidth: 1, borderColor: COLORS.border,
    maxHeight: '85%',
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.bg4, alignSelf: 'center', marginBottom: 16 },
  modalTitle:  { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 16, textAlign: 'center' },
  input:       { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: COLORS.text, fontSize: 14, marginBottom: 10 },
  fieldLabel:  { color: COLORS.textSub, fontSize: 13, marginBottom: 8, marginTop: 4 },
  tipoRow:     { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tipoChip:    { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: COLORS.bg4, alignItems: 'center' },
  tipoChipActive: { backgroundColor: COLORS.accentGlow },
  tipoChipText:   { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  catRow:      { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 14 },
  catChip:     { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, backgroundColor: COLORS.bg4 },
  catChipActive:{ backgroundColor: COLORS.accentGlow },
  catChipText: { fontSize: 12, color: COLORS.textMuted },
  submitBtn:   { backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  submitBtnText:{ color: '#fff', fontSize: 14, fontWeight: '700' },
});