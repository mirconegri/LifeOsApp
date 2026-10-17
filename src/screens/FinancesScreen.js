
// src/screens/FinancesScreen.js
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS } from '../config/colors';
import { TYPE, SPACING } from '../config/designSystem';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { CustomAlert } from '../components/CustomAlert';
import { DatePicker } from '../components/DatePicker';
import { Icon } from '../components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const [editingId,    setEditingId]    = useState(null);
  const [formDesc,     setFormDesc]     = useState('');
  const [formAmount,   setFormAmount]   = useState('');
  const [formType,     setFormType]     = useState('expense');
  const [formCat,      setFormCat]      = useState('other');
  const [formDate,     setFormDate]     = useState(todayStr());
  const [alertConfig,  setAlertConfig]  = useState(null);

  const showAlert = (cfg) => setAlertConfig(cfg);
  const insets = useSafeAreaInsets();
  const closeModal = () => setModalVisible(false);

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
  const openAddModal = () => {
    setEditingId(null);
    setFormDesc(''); setFormAmount('');
    setFormType('expense'); setFormCat('other');
    setFormDate(todayStr());
    setModalVisible(true);
  };

  // New: opens the same modal pre-filled for an existing transaction,
  // triggered by the pencil button next to each row — separate from the
  // "✕" delete button so editing and deleting don't compete for the same
  // tap target.
  const openEditModal = (t) => {
    setEditingId(t.id);
    setFormDesc(t.desc);
    setFormAmount(String(Math.abs(t.amount)));
    setFormType(t.type);
    setFormCat(t.category);
    setFormDate(t.date);
    setModalVisible(true);
  };

  const saveTransaction = () => {
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
    const amount = formType === 'expense' ? -Math.abs(imp) : Math.abs(imp);

    if (editingId) {
      setFinances(prev => prev.map(f => f.id === editingId
        ? { ...f, date: formDate, desc: formDesc.trim(), amount, type: formType, category: formCat }
        : f));
    } else {
      const newId = Math.max(0, ...finances.map(f => f.id)) + 1;
      setFinances(prev => [...prev, {
        id:       newId,
        date:     formDate,
        desc:     formDesc.trim(),
        amount,
        type:     formType,
        category: formCat,
      }]);
    }
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
          setModalVisible(false);
        }},
      ],
    });
  };

  const confirmClearAll = () => {
    showAlert({
      title: 'Clear All Transactions',
      message: `This will permanently delete all ${finances.length} transactions. This can't be undone.`,
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => setAlertConfig(null) },
        { text: 'Clear All', style: 'destructive', onPress: () => {
          setFinances([]);
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
        <View style={styles.sectionTitleRow}><Icon name="wallet" size={14} color={COLORS.textMuted} /><Text style={styles.sectionTitle}> Overview</Text></View>
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
        <View style={styles.sectionTitleRow}><Icon name="trending-up" size={14} color={COLORS.textMuted} /><Text style={styles.sectionTitle}> Last 6 months</Text></View>
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
          <View style={styles.sectionTitleRow}><Icon name="list" size={14} color={COLORS.textMuted} /><Text style={styles.sectionTitle}> Transactions ({recentTransactions.length})</Text></View>
          <View style={styles.listHeaderActions}>
            {finances.length > 0 && (
              <TouchableOpacity onPress={confirmClearAll} style={{ marginRight: 14 }}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={openAddModal}>
              <Text style={styles.addBtn}>+ Add</Text>
            </TouchableOpacity>
          </View>
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
              <TouchableOpacity onPress={() => openEditModal(t)} style={styles.editBtn}>
                <Text style={styles.editBtnText}>✎</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteTransaction(t.id, t.desc)} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* Add / Edit Modal */}
      {/* Edge-to-edge: without these the modal's own window stops at the
          system bars and the strip left uncovered flashes white as the
          sheet slides in. */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalRoot} keyboardVerticalOffset={0} enabled={true}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 16 }]}>
            <TouchableOpacity onPress={closeModal}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingId ? 'Edit Transaction' : 'New Transaction'}</Text>
            <View style={styles.modalHeaderRight} />
          </View>

          <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
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
          </ScrollView>

          <View style={styles.modalFooter}>
            {editingId ? (
              <TouchableOpacity onPress={() => deleteTransaction(editingId, formDesc)} style={[styles.modalFooterBtn, styles.modalFooterBtnDelete]}>
                <Text style={styles.modalFooterBtnDeleteText}>Delete</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={closeModal} style={[styles.modalFooterBtn, styles.modalFooterBtnCancel]}>
                <Text style={styles.modalFooterBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={saveTransaction} style={[styles.modalFooterBtn, styles.modalFooterBtnSave]}>
              <Text style={styles.modalFooterBtnSaveText}>{editingId ? 'Save Changes' : 'Add Transaction'}</Text>
            </TouchableOpacity>
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
  content: { padding: SPACING.md, paddingBottom: 32 },

  sectionTitle: { fontSize: TYPE.label, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 10 },
  statsRow:     { flexDirection: 'row', marginBottom: 4 },

  chartCard:  { marginBottom: 12 },
  chart:      { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 120, paddingVertical: 8 },
  barCol:     { alignItems: 'center', flex: 1 },
  bar:        { width: 24, borderRadius: 3, marginBottom: 4 },
  barVal:     { fontSize: TYPE.micro, color: COLORS.textSub, marginBottom: 2 },
  barLabel:   { fontSize: TYPE.micro, color: COLORS.textMuted },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 4 },
  listHeaderActions: { flexDirection: 'row', alignItems: 'center' },
  addBtn:     { fontSize: 13, color: COLORS.accent, fontWeight: '600' },
  clearAllText: { fontSize: 12, color: COLORS.red, fontWeight: '600' },

  txCard:  { marginBottom: 8, padding: 12 },
  txRow:   { flexDirection: 'row', alignItems: 'center' },
  txDot:   { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  txInfo:  { flex: 1, marginRight: 10 },
  txDesc:  { fontSize: TYPE.body, color: COLORS.text, fontWeight: '500' },
  txMeta:  { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  txAmount:   { fontSize: TYPE.label, fontWeight: '600', marginRight: 10 },
  editBtn:    { padding: 4, marginRight: 4 },
  editBtnText:{ fontSize: 13, color: COLORS.textMuted },
  deleteBtn:  { padding: 4 },
  deleteBtnText:{ fontSize: 14, color: COLORS.textSub },

  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, marginBottom: 10 },

  // Modal
  modalRoot: { flex: 1, backgroundColor: COLORS.bg },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalCancelText: { color: COLORS.accent, fontSize: 16 },
  modalHeaderRight: { width: 50 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  modalScrollContent: { padding: 16, paddingBottom: 32 },
  modalFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  modalFooterBtn: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10, alignItems: 'center' },
  modalFooterBtnSave: { backgroundColor: COLORS.accent, flex: 1 },
  modalFooterBtnSaveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalFooterBtnCancel: { backgroundColor: COLORS.bg4, marginRight: 10 },
  modalFooterBtnCancelText: { color: COLORS.textMuted, fontWeight: '600' },
  modalFooterBtnDelete: { backgroundColor: COLORS.redDim, borderWidth: 1, borderColor: COLORS.red, marginRight: 10 },
  modalFooterBtnDeleteText: { color: COLORS.red, fontWeight: '600' },
});
