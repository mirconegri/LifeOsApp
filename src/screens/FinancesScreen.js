// src/screens/FinancesScreen.js
//
// M3 Expressive Finances: tonal balance hero, income/expense stat row,
// six-month tonal bar chart, transactions grouped by date in tonal rows,
// and a full-screen add/edit form. All storage shapes, ids and handlers are
// unchanged; the local-date fixes in todayStr()/monthKey() are preserved.
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { M3, MODULE_TONES, alpha } from '../config/colors';
import { SHAPE, SPACING } from '../config/designSystem';
import { TEXT } from '../ui/type';
import { AppScrollView } from '../ui/AppScrollView';
import { ScreenHeader } from '../ui/ScreenHeader';
import { StatRow } from '../ui/StatRow';
import { GroupItem } from '../ui/GroupItem';
import { Chip } from '../ui/Chip';
import { CtaButton } from '../ui/CtaButton';
import { IconButton } from '../ui/IconButton';
import { SpringPressable } from '../ui/SpringPressable';
import { EmptyState } from '../ui/EmptyState';
import { Blob } from '../ui/Blob';
import { BarChart } from '../components/BarChart';
import { CustomAlert } from '../components/CustomAlert';
import { DatePicker } from '../components/DatePicker';
import { Icon } from '../components/Icon';
import { localDateKey, fmt } from '../data/helpers';

// Category = tone + leading icon. No raw hex anywhere.
const CAT_META = {
  work:       { tone: MODULE_TONES.journal,   icon: 'wallet' },
  university: { tone: MODULE_TONES.uni,       icon: 'graduation-cap' },
  food:       { tone: MODULE_TONES.groceries, icon: 'shopping-cart' },
  transport:  { tone: MODULE_TONES.stats,     icon: 'globe' },
  other:      { tone: { container: M3.surfaceContainerHighest, on: M3.onSurfaceVariant }, icon: 'layers' },
};

const CATEGORIES = Object.keys(CAT_META);

// Local date key — never toISOString(): it converts to UTC first and would
// return yesterday's date between local midnight and 1–2am.
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

  const now = new Date();
  // Month keys from the local year/month directly (no UTC round-trip).
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

  const chartData = monthBars.map((value, i) => ({
    label: months[i].label,
    value: Math.abs(value),
    displayValue: `${value > 0 ? '+' : ''}${fmt(value)}`,
    color: value >= 0 ? MODULE_TONES.journal.on : M3.error,
  }));

  // ── Actions ───────────────────────────────────────────────────────────────
  const openAddModal = () => {
    setEditingId(null);
    setFormDesc(''); setFormAmount('');
    setFormType('expense'); setFormCat('other');
    setFormDate(todayStr());
    setModalVisible(true);
  };

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

  // Group the visible transactions by date, newest day first.
  const groups = [];
  for (const t of recentTransactions) {
    const last = groups[groups.length - 1];
    if (last && last.date === t.date) last.items.push(t);
    else groups.push({ date: t.date, items: [t] });
  }

  return (
    <View style={styles.root}>
      <AppScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <ScreenHeader
          title="Finances"
          subtitle={`${finances.length} transaction${finances.length === 1 ? '' : 's'}`}
          style={styles.headerFlush}
        />

        {/* Balance hero — the finances module's tonal container */}
        <View style={styles.hero}>
          <View style={styles.heroBlob} pointerEvents="none">
            <Blob preset="cookie12" size={240} color={alpha(MODULE_TONES.finances.on, 0.08)} />
          </View>
          <Text style={[TEXT.labelLarge, styles.heroLabel]}>Balance</Text>
          <Text style={[TEXT.headlineLarge, styles.heroValue]}>
            {balance >= 0 ? '+' : '−'}€{fmt(Math.abs(balance))}
          </Text>
          <Text style={[TEXT.bodySmall, styles.heroSub]}>
            {months[5].label}: {monthBars[5] >= 0 ? '+' : '−'}€{fmt(Math.abs(monthBars[5]))}
          </Text>
        </View>

        <StatRow
          stats={[
            { value: `+€${fmt(incomes)}`, label: 'Income' },
            { value: `−€${fmt(expenses)}`, label: 'Expenses' },
          ]}
        />

        <Text style={[TEXT.titleLargeEmphasized, styles.sectionTitle]}>Last 6 months</Text>
        <BarChart data={chartData} height={120} />

        <View style={styles.listHeader}>
          <Text style={[TEXT.titleLargeEmphasized, styles.sectionTitle]}>Transactions</Text>
          <View style={styles.listActions}>
            {finances.length > 0 ? (
              <SpringPressable
                onPress={confirmClearAll}
                haptic="selection"
                accessibilityLabel="Clear all transactions"
                style={styles.clearAll}
                contentStyle={styles.clearAllContent}
              >
                <Text style={[TEXT.labelLarge, styles.clearAllText]}>Clear all</Text>
              </SpringPressable>
            ) : null}
            <IconButton icon="plus" onPress={openAddModal} accessibilityLabel="Add transaction" />
          </View>
        </View>

        {groups.length === 0 ? (
          <EmptyState
            icon="wallet"
            title="No transactions yet"
            body="Add your first income or expense to see the balance and the monthly bars."
            tone={MODULE_TONES.finances}
            action={<CtaButton label="Add transaction" variant="tonal" onPress={openAddModal} />}
          />
        ) : groups.map(group => (
          <View key={group.date} style={styles.groupBlock}>
            <Text style={[TEXT.labelMedium, styles.groupDate]}>{group.date}</Text>
            <View style={styles.group}>
              {group.items.map((t, i) => {
                const meta = CAT_META[t.category] || CAT_META.other;
                const positive = t.amount >= 0;
                return (
                  <GroupItem
                    key={t.id}
                    index={i}
                    count={group.items.length}
                    icon={meta.icon}
                    tone={meta.tone}
                    title={t.desc}
                    secondary={t.category}
                    trailing={(
                      <View style={styles.txTrailing}>
                        <Text style={[TEXT.titleMedium, { color: positive ? MODULE_TONES.journal.on : M3.error }]}>
                          {positive ? '+' : '−'}€{fmt(Math.abs(t.amount))}
                        </Text>
                        <SpringPressable
                          onPress={() => deleteTransaction(t.id, t.desc)}
                          haptic="selection"
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          style={styles.txDelete}
                          contentStyle={styles.txDeleteContent}
                          accessibilityLabel={`Delete ${t.desc}`}
                        >
                          <Icon name="trash-2" size={15} color={M3.outline} />
                        </SpringPressable>
                      </View>
                    )}
                    onPress={() => openEditModal(t)}
                  />
                );
              })}
            </View>
          </View>
        ))}
      </AppScrollView>

      {/* Add / Edit modal — full screen, opaque, own insets. */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalRoot} keyboardVerticalOffset={0} enabled={true}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 12 }]}>
            <IconButton icon="x" onPress={closeModal} accessibilityLabel="Close transaction form" />
            <Text style={[TEXT.titleLargeEmphasized, styles.modalTitle]}>
              {editingId ? 'Edit transaction' : 'New transaction'}
            </Text>
            <View style={styles.modalHeaderRight} />
          </View>

          <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="always">
            <Text style={styles.fieldLabel}>Description *</Text>
            <TextInput
              style={[styles.input, TEXT.bodyLarge]}
              placeholder="e.g. Weekly groceries"
              placeholderTextColor={M3.outline}
              value={formDesc}
              onChangeText={setFormDesc}
              autoFocus
            />

            <Text style={styles.fieldLabel}>Amount (€) *</Text>
            <TextInput
              style={[styles.input, TEXT.bodyLarge]}
              placeholder="0.00"
              placeholderTextColor={M3.outline}
              keyboardType="numeric"
              value={formAmount}
              onChangeText={setFormAmount}
            />

            <Text style={styles.fieldLabel}>Date</Text>
            <DatePicker
              value={formDate}
              onChange={setFormDate}
              mode="any"
              label="Select date"
            />

            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.chipRow}>
              <Chip
                label="Income"
                icon="trending-up"
                selected={formType === 'income'}
                onPress={() => setFormType('income')}
              />
              <Chip
                label="Expense"
                icon="trending-down"
                selected={formType === 'expense'}
                onPress={() => setFormType('expense')}
              />
            </View>

            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map(c => (
                <Chip
                  key={c}
                  label={c}
                  selected={formCat === c}
                  onPress={() => setFormCat(c)}
                  accessibilityLabel={`Category ${c}`}
                />
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            {editingId ? (
              <CtaButton
                label="Delete"
                variant="destructive"
                onPress={() => deleteTransaction(editingId, formDesc)}
                style={styles.footerBtn}
              />
            ) : (
              <CtaButton
                label="Cancel"
                variant="tonal"
                onPress={closeModal}
                style={styles.footerBtn}
              />
            )}
            <CtaButton
              label={editingId ? 'Save changes' : 'Add transaction'}
              onPress={saveTransaction}
              style={[styles.footerBtn, styles.footerPrimary]}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CustomAlert config={alertConfig} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: M3.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  headerFlush: { paddingHorizontal: 0 },

  hero: {
    backgroundColor: MODULE_TONES.finances.container,
    borderRadius: SHAPE.xxxl,
    padding: 20,
    overflow: 'hidden',
    marginTop: 4,
  },
  heroBlob: {
    position: 'absolute',
    right: -60,
    bottom: -90,
  },
  heroLabel: { color: MODULE_TONES.finances.on, opacity: 0.8 },
  heroValue: { color: MODULE_TONES.finances.on, marginTop: 4 },
  heroSub: { color: MODULE_TONES.finances.on, opacity: 0.7, marginTop: 6 },

  sectionTitle: { color: M3.onSurface, marginTop: SPACING.lg, marginBottom: 8 },

  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    marginBottom: 8,
  },
  listActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clearAll: { borderRadius: SHAPE.full },
  clearAllContent: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: SHAPE.full },
  clearAllText: { color: M3.error },

  groupBlock: { marginBottom: SPACING.md },
  groupDate: { color: M3.outline, marginBottom: 6, marginLeft: 4 },
  group: { gap: 2 },
  txTrailing: { alignItems: 'flex-end', gap: 2 },
  txDelete: { borderRadius: SHAPE.full },
  txDeleteContent: { padding: 4, borderRadius: SHAPE.full },

  modalRoot: { flex: 1, backgroundColor: M3.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  modalHeaderRight: { width: 40 },
  modalTitle: { color: M3.onSurface },
  modalScrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  footerBtn: { flex: 1 },
  footerPrimary: { flex: 1.4 },
  fieldLabel: { color: M3.onSurfaceVariant, marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: M3.surfaceContainerHigh,
    borderRadius: SHAPE.lg,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: M3.onSurface,
    marginBottom: 12,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
});
