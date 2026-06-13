import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../config/colors';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';

const CAT_COLORS = {
  lavoro: COLORS.green,
  università: COLORS.accent,
  cibo: COLORS.amber,
  trasporti: COLORS.blue,
  altro: COLORS.textMuted,
};

export default function FinanzeScreen({ finanze, setFinanze }) {
  const [showForm, setShowForm] = useState(false);
  const [formDesc, setFormDesc] = useState('');
  const [formImporto, setFormImporto] = useState('');
  const [formTipo, setFormTipo] = useState('uscita');
  const [formCat, setFormCat] = useState('altro');
  const [formData, setFormData] = useState('');

  const saldo = finanze.reduce((a, t) => a + t.importo, 0);
  const entrate = finanze.filter(t => t.tipo === 'entrata').reduce((a, t) => a + t.importo, 0);
  const uscite = Math.abs(finanze.filter(t => t.tipo === 'uscita').reduce((a, t) => a + t.importo, 0));

  // Ultimi 6 mesi per grafico a barre
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return {
      label: d.toLocaleDateString('it-IT', { month: 'short' }),
      key: d.toISOString().slice(0, 7),
    };
  });

  const monthBars = months.map(m => {
    const entries = finanze.filter(t => t.data && t.data.startsWith(m.key));
    const tot = entries.reduce((a, t) => a + t.importo, 0);
    return tot;
  });
  const maxAbs = Math.max(...monthBars.map(Math.abs), 1);

  const aggiungi = () => {
    if (!formDesc.trim()) { Alert.alert('Errore', 'Inserisci la descrizione'); return; }
    const imp = parseFloat(formImporto) || 0;
    if (imp === 0) { Alert.alert('Errore', 'Inserisci un importo valido'); return; }
    const newId = Math.max(0, ...finanze.map(f => f.id)) + 1;
    setFinanze(prev => [...prev, {
      id: newId,
      data: formData || new Date().toISOString().slice(0, 10),
      desc: formDesc.trim(),
      importo: formTipo === 'uscita' ? -Math.abs(imp) : Math.abs(imp),
      tipo: formTipo,
      cat: formCat,
    }]);
    setFormDesc(''); setFormImporto(''); setFormTipo('uscita'); setFormCat('altro'); setFormData('');
    setShowForm(false);
  };

  const elimina = (id) => {
    Alert.alert('Elimina', 'Rimuovere questa transazione?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: () => setFinanze(prev => prev.filter(f => f.id !== id)) },
    ]);
  };

  const recenti = [...finanze].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 15);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>💶 Panoramica</Text>
      <View style={styles.statsRow}>
        <StatCard label="Saldo" value={saldo >= 0 ? `+${saldo}` : `${saldo}`} sub="€" color={saldo >= 0 ? COLORS.green : COLORS.red} />
        <StatCard label="Entrate" value={`+${entrate}`} sub="€" color={COLORS.green} />
        <StatCard label="Uscite" value={`-${uscite}`} sub="€" color={COLORS.red} />
      </View>

      <Text style={styles.sectionTitle}>📈 Ultimi 6 mesi</Text>
      <Card style={styles.chartCard}>
        <View style={styles.chart}>
          {monthBars.map((val, i) => {
            const h = Math.abs(val) / maxAbs * 80;
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

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>📋 Transazioni ({recenti.length})</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addBtn}>{showForm ? '✕ Annulla' : '+ Aggiungi'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Nuova Transazione</Text>
          <TextInput style={styles.input} placeholder="Descrizione" placeholderTextColor={COLORS.textSub} value={formDesc} onChangeText={setFormDesc} />
          <TextInput style={styles.input} placeholder="Importo (€)" placeholderTextColor={COLORS.textSub} keyboardType="numeric" value={formImporto} onChangeText={setFormImporto} />
          <TextInput style={styles.input} placeholder="Data (YYYY-MM-DD)" placeholderTextColor={COLORS.textSub} value={formData} onChangeText={setFormData} />
          <View style={styles.tipoRow}>
            {[['entrata', 'Entrata'], ['uscita', 'Uscita']].map(([v, l]) => (
              <TouchableOpacity key={v} onPress={() => setFormTipo(v)} style={[styles.tipoChip, formTipo === v && styles.tipoChipActive]}>
                <Text style={[styles.tipoChipText, formTipo === v && { color: formTipo === 'entrata' ? COLORS.green : COLORS.red }]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.catRow}>
            {Object.keys(CAT_COLORS).map(c => (
              <TouchableOpacity key={c} onPress={() => setFormCat(c)} style={[styles.catChip, formCat === c && styles.catChipActive]}>
                <Text style={[styles.catChipText, formCat === c && { color: CAT_COLORS[c] }]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.submitBtn} onPress={aggiungi}>
            <Text style={styles.submitBtnText}>Aggiungi</Text>
          </TouchableOpacity>
        </Card>
      )}

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
            <TouchableOpacity onPress={() => elimina(t.id)} style={styles.deleteBtn}>
              <Text style={styles.deleteBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
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
  chartCard: { marginBottom: 12 },
  chart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 120, paddingVertical: 8 },
  barCol: { alignItems: 'center', flex: 1 },
  bar: { width: 24, borderRadius: 3, marginBottom: 4 },
  barVal: { fontSize: 9, color: COLORS.textSub, marginBottom: 2 },
  barLabel: { fontSize: 9, color: COLORS.textMuted },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 4 },
  addBtn: { fontSize: 13, color: COLORS.accent, fontWeight: '600' },
  formCard: { marginBottom: 12 },
  formTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 10 },
  input: { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: COLORS.text, fontSize: 13, marginBottom: 8 },
  tipoRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tipoChip: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.bg4, alignItems: 'center' },
  tipoChipActive: { backgroundColor: COLORS.accentGlow },
  tipoChipText: { fontSize: 12, color: COLORS.textMuted },
  catRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 10 },
  catChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: COLORS.bg4 },
  catChipActive: { backgroundColor: COLORS.accentGlow },
  catChipText: { fontSize: 11, color: COLORS.textMuted },
  submitBtn: { backgroundColor: COLORS.accent, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  txCard: { marginBottom: 8, padding: 12 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  txDot: { width: 8, height: 8, borderRadius: 4 },
  txDesc: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  txMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  txImporto: { fontSize: 13, fontWeight: '600' },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 14, color: COLORS.textSub },
});