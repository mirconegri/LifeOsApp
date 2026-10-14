
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS } from '../config/colors';
import { Card } from '../components/Card';
import { Pill } from '../components/Pill';
import { CustomAlert } from '../components/CustomAlert';
import { Icon } from '../components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CATEGORIES = ['supermarket', 'pharmacy', 'home', 'other'];

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
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}><Icon name="shopping-cart" size={24} color={COLORS.text} /><Text style={styles.title}> Groceries</Text></View>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addFab}>
            <Text style={styles.addFabText}>+ Product</Text>
          </TouchableOpacity>
        </View>

        {/* Counters */}
        <View style={styles.countersRow}>
          <View style={[styles.counterChip, { marginRight: 10 }]}>
            <Text style={styles.counterNum}>{toBuyCount}</Text>
            <Text style={styles.counterLbl}>to buy</Text>
          </View>
          <View style={[styles.counterChip, { borderColor: COLORS.green + '44' }]}>
            <Text style={[styles.counterNum, { color: COLORS.green }]}>{completedCount}</Text>
            <Text style={styles.counterLbl}>completed</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersRow}>
          <View style={styles.filters}>
            {[['all', 'All'], ['to buy', 'To Buy'], ['completed', 'Completed']].map(([f, l]) => (
              <TouchableOpacity key={f} onPress={() => setFilter(f)}
                style={[styles.filterPill, filter === f && styles.filterPillActive, { marginRight: 8 }]}>
                <Text style={[styles.filterText, filter === f && { color: COLORS.accent }]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {groceries.length > 0 && (
            <TouchableOpacity onPress={confirmClearAll}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {filteredGroceries.length === 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}><Text style={styles.emptyText}>Empty list</Text><Icon name="sparkles" size={14} color={COLORS.textSub} /></View>
        ) : (
          filteredGroceries.map(item => (
            <Card key={item.id} style={styles.itemCard}>
              <View style={styles.itemRow}>
                <TouchableOpacity onPress={() => toggleItem(item.id)} style={styles.checkboxWrap}>
                  <View style={[styles.checkbox,
                    { borderColor: COLORS.border2, backgroundColor: item.done ? COLORS.green : 'transparent' }]}>
                    {item.done && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
                <Text style={[styles.itemText, item.done && styles.itemTextDone]}>{item.text}</Text>
                <Pill color="muted">{item.category}</Pill>
                <TouchableOpacity onPress={() => deleteItem(item.id, item.text)} style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* ── Modal ── */}
      <Modal visible={modalVisible} animationType="slide" transparent={false} onRequestClose={closeModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalRoot} keyboardVerticalOffset={0} enabled={true}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 16 }]}>
            <TouchableOpacity onPress={closeModal}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Add Product</Text>
            <View style={styles.modalHeaderRight} />
          </View>

          <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
            <TextInput
              style={styles.input}
              placeholder="What do you need to buy?"
              placeholderTextColor={COLORS.textSub}
              value={formText}
              onChangeText={setFormText}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={addItem}
            />

            <Text style={styles.fieldLabel}>Category:</Text>
            <View style={styles.catRow}>
              {CATEGORIES.map(c => (
                <TouchableOpacity key={c} onPress={() => setFormCat(c)}
                  style={[styles.catChip, formCat === c && styles.catChipActive, { marginRight: 8, marginBottom: 8 }]}>
                  <Text style={[styles.catChipText, formCat === c && { color: COLORS.accent }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity onPress={closeModal} style={[styles.modalFooterBtn, styles.modalFooterBtnCancel]}>
              <Text style={styles.modalFooterBtnCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={addItem} style={[styles.modalFooterBtn, styles.modalFooterBtnSave]}>
              <Text style={styles.modalFooterBtnSaveText}>Create</Text>
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
  content: { padding: 16, paddingBottom: 32 },
  header:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title:   { fontSize: 28, fontWeight: '700', color: COLORS.text },
  addFab:  { backgroundColor: COLORS.accent, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  addFabText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  countersRow: { flexDirection: 'row', marginBottom: 14 },
  counterChip: { flex: 1, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, alignItems: 'center' },
  counterNum:  { fontSize: 22, fontWeight: '700', color: COLORS.accent },
  counterLbl:  { fontSize: 11, color: COLORS.textSub, marginTop: 2 },

  filtersRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  filters:         { flexDirection: 'row' },
  filterPill:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.bg2 },
  filterPillActive:{ backgroundColor: COLORS.accentGlow },
  filterText:      { fontSize: 12, color: COLORS.textMuted },
  clearAllText:    { fontSize: 12, color: COLORS.red, fontWeight: '600' },
  emptyText:       { fontSize: 13, color: COLORS.textSub, textAlign: 'center', marginTop: 20 },

  itemCard:    { marginBottom: 8, padding: 12 },
  itemRow:     { flexDirection: 'row', alignItems: 'center' },
  checkboxWrap:{ padding: 2, marginRight: 10 },
  checkbox:    { width: 20, height: 20, borderWidth: 1.5, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  checkmark:   { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  itemText:    { flex: 1, fontSize: 14, color: COLORS.text, marginRight: 10 },
  itemTextDone:{ textDecorationLine: 'line-through', color: COLORS.textSub },
  deleteBtn:   { padding: 4, marginLeft: 10 },
  deleteBtnText: { fontSize: 14, color: COLORS.textSub },

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
  input:       { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 14, marginBottom: 12 },
  fieldLabel:  { color: COLORS.textSub, fontSize: 13, marginBottom: 8 },
  catRow:      { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  catChip:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12, backgroundColor: COLORS.bg4 },
  catChipActive:{ backgroundColor: COLORS.accentGlow },
  catChipText: { fontSize: 13, color: COLORS.textMuted },
});
