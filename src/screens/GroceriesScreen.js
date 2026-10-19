// src/screens/GroceriesScreen.js
//
// M3 Expressive Groceries: ScreenHeader with the item count, remaining/done
// statistics, filter Chips, grouped tonal item rows with a springy checkbox,
// an EmptyState in the groceries tone, and a full-screen add form with filled
// fields and a CtaButton footer. Storage shape, ids, validation and the
// "Clear All" confirmation are unchanged.
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { M3, MODULE_TONES } from '../config/colors';
import { SHAPE, SPACING } from '../config/designSystem';
import { AppScrollView } from '../ui/AppScrollView';
import { ScreenHeader } from '../ui/ScreenHeader';
import { StatRow } from '../ui/StatRow';
import { Chip } from '../ui/Chip';
import { CtaButton } from '../ui/CtaButton';
import { IconButton } from '../ui/IconButton';
import { SpringPressable } from '../ui/SpringPressable';
import { EmptyState } from '../ui/EmptyState';
import { rowShape } from '../ui/GroupItem';
import { Pill } from '../components/Pill';
import { CustomAlert } from '../components/CustomAlert';
import { Icon } from '../components/Icon';
import { TEXT } from '../ui/type';

const CATEGORIES = ['supermarket', 'pharmacy', 'home', 'other'];

// Category tag colour on the tonal rows. Pill names map to tonal pairs.
const CATEGORY_PILL = {
  supermarket: 'amber',
  pharmacy: 'green',
  home: 'accent',
  other: 'accent',
};

const CHECK_HIT_SLOP = { top: 8, bottom: 8, left: 4, right: 4 };

export default function GroceriesScreen({ groceries, setGroceries }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [formText, setFormText]         = useState('');
  const [formCat,  setFormCat]          = useState('supermarket');
  const [filter,   setFilter]           = useState('all');
  const [alertConfig, setAlertConfig]   = useState(null);
  const insets = useSafeAreaInsets();

  const showAlert = (cfg) => setAlertConfig(cfg);
  const closeModal = () => setModalVisible(false);

  const toggleItem = (id) => {
    setGroceries(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const deleteItem = (id, text) => {
    showAlert({
      title: 'Remove',
      message: `Delete "${text}" from the list?`,
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => setAlertConfig(null) },
        { text: 'Delete', style: 'destructive', onPress: () => {
          setGroceries(prev => prev.filter(item => item.id !== id));
          setAlertConfig(null);
        }},
      ],
    });
  };

  const confirmClearAll = () => {
    showAlert({
      title: 'Clear All Items',
      message: `This will permanently delete all ${groceries.length} items from the list. This can't be undone.`,
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => setAlertConfig(null) },
        { text: 'Clear All', style: 'destructive', onPress: () => {
          setGroceries([]);
          setAlertConfig(null);
        }},
      ],
    });
  };

  const addItem = () => {
    if (!formText.trim()) {
      showAlert({ title: 'Error', message: 'Enter the product name',
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }] });
      return;
    }
    const newId = Math.max(0, ...groceries.map(s => s.id)) + 1;
    setGroceries(prev => [{ id: newId, text: formText.trim(), category: formCat, done: false }, ...prev]);
    setFormText('');
    setModalVisible(false);
  };

  const filteredGroceries = groceries.filter(item => {
    if (filter === 'to buy') return !item.done;
    if (filter === 'completed') return item.done;
    return true;
  });

  const toBuyCount    = groceries.filter(i => !i.done).length;
  const completedCount = groceries.filter(i =>  i.done).length;

  return (
    <View style={styles.root}>
      <AppScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <ScreenHeader
          title="Groceries"
          subtitle={`${groceries.length} item${groceries.length === 1 ? '' : 's'}`}
          style={styles.headerFlush}
          right={(
            <IconButton
              icon="plus"
              onPress={() => setModalVisible(true)}
              accessibilityLabel="Add product"
            />
          )}
        />

        {/* Remaining / done counters */}
        <StatRow
          stats={[
            { value: toBuyCount, label: 'Remaining' },
            { value: completedCount, label: 'Done' },
          ]}
          style={styles.statsRow}
        />

        {/* Filters + destructive clear-all */}
        <View style={styles.filtersRow}>
          <View style={styles.filters}>
            {[['all', 'All'], ['to buy', 'To Buy'], ['completed', 'Completed']].map(([f, l]) => (
              <Chip
                key={f}
                label={l}
                selected={filter === f}
                onPress={() => setFilter(f)}
                accessibilityLabel={`Filter ${l}`}
              />
            ))}
          </View>
          {groceries.length > 0 ? (
            <SpringPressable
              onPress={confirmClearAll}
              haptic="selection"
              accessibilityLabel="Clear all items"
              style={styles.clearAll}
              contentStyle={styles.clearAllContent}
            >
              <Text style={[TEXT.labelLarge, styles.clearAllText]}>Clear All</Text>
            </SpringPressable>
          ) : null}
        </View>

        {filteredGroceries.length === 0 ? (
          <EmptyState
            icon="shopping-cart"
            title="Empty list"
            body="Add a product, or switch the filter to see the rest of the list."
            tone={MODULE_TONES.groceries}
            action={(
              <CtaButton
                label="Add product"
                variant="tonal"
                onPress={() => setModalVisible(true)}
              />
            )}
          />
        ) : (
          <View style={styles.list}>
            {filteredGroceries.map((item, index) => (
              <View
                key={item.id}
                style={[styles.itemShell, rowShape(index, filteredGroceries.length)]}
              >
                <View style={styles.itemRow}>
                  <SpringPressable
                    onPress={() => toggleItem(item.id)}
                    haptic="selection"
                    hitSlop={CHECK_HIT_SLOP}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: item.done }}
                    accessibilityLabel={item.done ? `Mark ${item.text} not done` : `Mark ${item.text} done`}
                    style={[styles.checkbox, item.done && styles.checkboxChecked]}
                    contentStyle={styles.checkboxContent}
                  >
                    {item.done ? (
                      <Icon name="check" size={15} color={MODULE_TONES.groceries.container} />
                    ) : null}
                  </SpringPressable>

                  <Text
                    style={[TEXT.titleMedium, styles.itemText, item.done && styles.itemTextDone]}
                    numberOfLines={2}
                  >
                    {item.text}
                  </Text>

                  <Pill color={CATEGORY_PILL[item.category] ?? 'muted'}>{item.category}</Pill>

                  <SpringPressable
                    onPress={() => deleteItem(item.id, item.text)}
                    haptic="selection"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel={`Delete ${item.text}`}
                    style={styles.deleteBtn}
                    contentStyle={styles.deleteBtnContent}
                  >
                    <Icon name="trash-2" size={16} color={M3.outline} />
                  </SpringPressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </AppScrollView>

      {/* ── Add product modal ── */}
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
          <View style={[styles.modalHeader, { paddingTop: insets.top + 12 }]}>
            <IconButton
              icon="x"
              onPress={closeModal}
              accessibilityLabel="Close product form"
            />
            <Text style={[TEXT.titleLargeEmphasized, styles.modalTitle]}>Add Product</Text>
            <View style={styles.modalHeaderRight} />
          </View>

          <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="always">
            <Text style={[TEXT.labelLarge, styles.fieldLabel]}>Product</Text>
            <TextInput
              style={[styles.input, TEXT.bodyLarge]}
              placeholder="What do you need to buy?"
              placeholderTextColor={M3.outline}
              value={formText}
              onChangeText={setFormText}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={addItem}
            />

            <Text style={[TEXT.labelLarge, styles.fieldLabel]}>Category</Text>
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

          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 12 }]}>
            <CtaButton
              label="Cancel"
              variant="tonal"
              onPress={closeModal}
              style={styles.footerBtn}
            />
            <CtaButton
              label="Create"
              onPress={addItem}
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
  content: { paddingHorizontal: 16 },
  headerFlush: { paddingHorizontal: 0 },

  statsRow: { marginTop: 4, marginBottom: 4 },

  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  filters: { flexDirection: 'row', flexWrap: 'wrap', flex: 1, gap: 8 },
  clearAll: { borderRadius: SHAPE.full, marginLeft: 8 },
  clearAllContent: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: SHAPE.full },
  clearAllText: { color: M3.error },

  // Grouped tonal rows: 20/4 corners, 2 px gaps, no border.
  list: { gap: 2 },
  itemShell: { backgroundColor: M3.surfaceContainerHigh, overflow: 'hidden' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: M3.outline,
  },
  checkboxChecked: {
    backgroundColor: MODULE_TONES.groceries.on,
    borderColor: MODULE_TONES.groceries.on,
  },
  checkboxContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  itemText: { flex: 1, color: M3.onSurface },
  itemTextDone: { textDecorationLine: 'line-through', color: M3.outline },
  deleteBtn: { borderRadius: SHAPE.full },
  deleteBtnContent: { padding: 6, borderRadius: SHAPE.full },

  // Modal — full screen, opaque, own insets, sticky footer.
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
