
// src/screens/FinancesScreen.js
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS } from '../config/colors';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { CustomAlert } from '../components/CustomAlert';
import { DatePicker } from '../components/DatePicker';

import { localDateKey } from '../data/helpers';

const CAT_COLORS = {
  work:       COLORS.green,
  university: COLORS.accent,
  food:       COLORS.amber,
  transport:  COLORS.blue,
  other:      COLORS.textMuted,
};

const CATEGORIES = Object.keys(CAT_COLORS);

// Fixed: this used to be `new Date().toISOString().slice(0,10)`, which
// converts to UTC first. Between midnight and 1-2am local time in any
// timezone ahead of UTC (Italy included), that returned YESTERDAY's date
// as "today" for a brand new transaction.
function todayStr() {
  return localDateKey(new Date());
}

export default function FinancesScreen({ finances, setFinances }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [formDesc,     setFormDesc]     = useState('');
  const [formAmount,   setFormAmount]   = useState('');
  const [formType,     setFormType]     = useState('expense');
  const [formCat,      setFormCat]      = useState('other');
  const [formDate,     setFormDate]     = useState(todayStr());
  const [alertConfig,  setAlertConfig]  = useState(null);

  const showAlert = (cfg) => setAlertConfig(cfg);

  // ── Computed ──────────────────────────────────────────────────────────────
  const balance  = finances.reduce((a, t) => a + t.amount, 0);
  const incomes  = finances.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const expenses = Math.abs(finances.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0));

  const now    = new Date();
  // Fixed: month keys used to come from `d.toISOString().slice(0,7)`.
  // toISOString() always converts to UTC first — for any timezone ahead of
  // UTC (like Italy, UTC+1/+2), local midnight on the 1st of the month
  // becomes 22:00 or 23:00 on the LAST DAY of the PREVIOUS month in UTC.
  // So the "June" bucket was actually keyed as "2026-05", and every
  // transaction landed one month off from what the chart label showed.
  // Building the key from the local year/month directly avoids the UTC
  // round-trip entirely.
  function monthKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return {
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      key:   monthKey(d),
    };
  });
  const monthBars = months.map(m => {
    const entries = finances.filter(t => t.date && t.date.startsWith(m.key));
    return entries.reduce((a, t) => a + t.amount, 0);
  });
  const maxAbs = Math.max(...monthBars.map(Math.abs), 1);

  // ── Actions ───────────────────────────────────────────────────────────────
  const openModal = () => {
    setFormDesc(''); setFormAmount('');
    setFormType('expense'); setFormCat('other');
    setFormDate(todayStr());
    setModalVisible(true);
  };

  const addTransaction = () => {
    if (!formDesc.trim()) {
      showAlert({ title: 'Error', message: 'Enter a description.',
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }] }); return;
    }
    const imp = parseFloat(formAmount) || 0;
    if (imp === 0) {
      showAlert({ title: 'Error', message: 'Enter a valid amount.',
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }] }); return;
    }
    if (!formDate) {
      showAlert({ title: 'Error', message: 'Select a date.',
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }] }); return;
    }
    const newId = Math.max(0, ...finances.map(f => f.id)) + 1;
    setFinances(prev => [...prev, {
      id:       newId,
      date:     formDate,
      desc:     formDesc.trim(),
      amount:   formType === 'expense' ? -Math.abs(imp) : Math.abs(imp),
      type:     formType,
      category: formCat,
    }]);
    setModalVisible(false);
  };

  const deleteTransaction = (id, desc) => {
    showAlert({
      title: 'Delete',
      message: `Remove "${desc}"?`,
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => setAlertConfig(null) },
        { text: 'Delete', style: 'destructive', onPress: () => {
          setFinances(prev => prev.filter(f => f.id !== id));
          setAlertConfig(null);
        }},
      ],
    });
  };

  const recentTransactions = [...finances]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 15);

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Stats */}
        <Text style={styles.sectionTitle}>💶 Overview</Text>
        <View style={styles.statsRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <StatCard label="Balance"  value={balance >= 0 ? `+${balance}` : `${balance}`} sub="€" color={balance >= 0 ? COLORS.green : COLORS.red} />
          </View>
          <View style={{ flex: 1, marginRight: 8 }}>
            <StatCard label="Income"   value={`+${incomes}`} sub="€" color={COLORS.green} />
          </View>
          <View style={{ flex: 1 }}>
            <StatCard label="Expenses" value={`-${expenses}`}  sub="€" color={COLORS.red} />
          </View>
        </View>

        {/* Chart */}
        <Text style={styles.sectionTitle}>📈 Last 6 months</Text>
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

        {/* Transactions */}
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>📋 Transactions ({recentTransactions.length})</Text>
          <TouchableOpacity onPress={openModal}>
            <Text style={styles.addBtn}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {recentTransactions.map(t => (
          <Card key={t.id} style={styles.txCard}>
            <View style={styles.txRow}>
              <View style={[styles.txDot, { backgroundColor: CAT_COLORS[t.category] || COLORS.textMuted }]} />
              <View style={styles.txInfo}>
                <Text style={styles.txDesc}>{t.desc}</Text>
                <Text style={styles.txMeta}>{t.date} · {t.category}</Text>
              </View>
              <Text style={[styles.txAmount, { color: t.amount >= 0 ? COLORS.green : COLORS.red }]}>
                {t.amount >= 0 ? '+' : ''}{t.amount} €
              </Text>
              <TouchableOpacity onPress={() => deleteTransaction(t.id, t.desc)} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* Add Modal */}
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
            <Text style={styles.modalTitle}>New Transaction</Text>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">
              <TextInput
                style={styles.input}
                placeholder="Description *"
                placeholderTextColor={COLORS.textSub}
                value={formDesc}
                onChangeText={setFormDesc}
                autoFocus
              />
              <TextInput
                style={styles.input}
                placeholder="Amount (€) *"
                placeholderTextColor={COLORS.textSub}
                keyboardType="numeric"
                value={formAmount}
                onChangeText={setFormAmount}
              />

              {/* Date with Today shortcut */}
              <Text style={styles.fieldLabel}>Date</Text>
              <DatePicker
                value={formDate}
                onChange={setFormDate}
                mode="any"
                label="Select date"
              />

              <Text style={styles.fieldLabel}>Type:</Text>
              <View style={styles.typeRow}>
                {[['income', '↑ Income'], ['expense', '↓ Expense']].map(([v, l]) => (
                  <TouchableOpacity
                    key={v}
                    onPress={() => setFormType(v)}
                    style={[styles.typeChip, formType === v && styles.typeChipActive, { marginRight: v === 'income' ? 8 : 0 }]}
                  >
                    <Text style={[styles.typeChipText, formType === v && { color: v === 'income' ? COLORS.green : COLORS.red }]}>
                      {l}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Category:</Text>
              <View style={styles.catRow}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setFormCat(c)}
                    style={[styles.catChip, formCat === c && styles.catChipActive, { marginRight: 6, marginBottom: 6 }]}
                  >
                    <Text style={[styles.catChipText, formCat === c && { color: CAT_COLORS[c] }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={addTransaction}>
                <Text style={styles.submitBtnText}>Add Transaction</Text>
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CustomAlert config={alertConfig} />
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLORS.bg },
  scroll:  { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },

  sectionTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 10 },
  statsRow:     { flexDirection: 'row', marginBottom: 4 },

  chartCard:  { marginBottom: 12 },
  chart:      { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 120, paddingVertical: 8 },
  barCol:     { alignItems: 'center', flex: 1 },
  bar:        { width: 24, borderRadius: 3, marginBottom: 4 },
  barVal:     { fontSize: 9, color: COLORS.textSub, marginBottom: 2 },
  barLabel:   { fontSize: 9, color: COLORS.textMuted },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 4 },
  addBtn:     { fontSize: 13, color: COLORS.accent, fontWeight: '600' },

  txCard:  { marginBottom: 8, padding: 12 },
  txRow:   { flexDirection: 'row', alignItems: 'center' },
  txDot:   { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  txInfo:  { flex: 1, marginRight: 10 },
  txDesc:  { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  txMeta:  { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  txAmount:   { fontSize: 13, fontWeight: '600', marginRight: 10 },
  deleteBtn:  { padding: 4 },
  deleteBtnText:{ fontSize: 14, color: COLORS.textSub },

  // Modal
  modalWrapper:  { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modal: {
    backgroundColor: COLORS.bg2,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    borderTopWidth: 1, borderColor: COLORS.border,
    maxHeight: '88%',
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.bg4, alignSelf: 'center', marginBottom: 16 },
  modalTitle:  { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 16, textAlign: 'center' },
  input:       { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: COLORS.text, fontSize: 14, marginBottom: 10 },
  fieldLabel:  { color: COLORS.textSub, fontSize: 13, marginBottom: 8, marginTop: 4 },
  typeRow:     { flexDirection: 'row', marginBottom: 12 },
  typeChip:    { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: COLORS.bg4, alignItems: 'center' },
  typeChipActive: { backgroundColor: COLORS.accentGlow },
  typeChipText:   { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  catRow:      { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 },
  catChip:     { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, backgroundColor: COLORS.bg4 },
  catChipActive:{ backgroundColor: COLORS.accentGlow },
  catChipText: { fontSize: 12, color: COLORS.textMuted },
  submitBtn:   { backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  submitBtnText:{ color: '#fff', fontSize: 14, fontWeight: '700' },
});

