import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../config/colors';
import { Card } from '../components/Card';
import { Pill } from '../components/Pill';

const CATEGORIE = ['supermercato', 'farmacia', 'casa', 'altro'];

export default function SpesaScreen({ spesa, setSpesa }) {
  const [showForm, setShowForm] = useState(false);
  const [formText, setFormText] = useState('');
  const [formCat, setFormCat] = useState('supermercato');
  const [filter, setFilter] = useState('tutte'); // 'tutte', 'da comprare', 'completate'

  const toggleItem = (id) => {
    setSpesa(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const deleteItem = (id) => {
    setSpesa(prev => prev.filter(item => item.id !== id));
  };

  const aggiungi = () => {
    if (!formText.trim()) { Alert.alert('Errore', 'Inserisci il nome del prodotto'); return; }
    const newId = Math.max(0, ...spesa.map(s => s.id)) + 1;
    setSpesa(prev => [{ id: newId, text: formText.trim(), cat: formCat, done: false }, ...prev]);
    setFormText('');
    setShowForm(false);
  };

  const filteredSpesa = spesa.filter(item => {
    if (filter === 'da comprare') return !item.done;
    if (filter === 'completate') return item.done;
    return true;
  });

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>🛒 Lista della Spesa</Text>

      <View style={styles.filters}>
        {['tutte', 'da comprare', 'completate'].map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.filterPill, filter === f && styles.filterPillActive]}>
            <Text style={[styles.filterText, filter === f && { color: COLORS.accent }]}>
              {f === 'tutte' ? 'Tutte' : f === 'da comprare' ? 'Da Comprare' : 'Completate'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={() => setShowForm(!showForm)} style={styles.addToggle}>
        <Text style={styles.addToggleText}>{showForm ? '✕ Chiudi' : '+ Aggiungi Prodotto'}</Text>
      </TouchableOpacity>

      {showForm && (
        <Card style={styles.formCard}>
          <TextInput
            style={styles.input}
            placeholder="Cosa devi comprare?"
            placeholderTextColor={COLORS.textSub}
            value={formText}
            onChangeText={setFormText}
          />
          <View style={styles.catRow}>
            {CATEGORIE.map(c => (
              <TouchableOpacity key={c} onPress={() => setFormCat(c)} style={[styles.catChip, formCat === c && styles.catChipActive]}>
                <Text style={[styles.catChipText, formCat === c && { color: COLORS.accent }]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.submitBtn} onPress={aggiungi}>
            <Text style={styles.submitBtnText}>Aggiungi alla lista</Text>
          </TouchableOpacity>
        </Card>
      )}

      {filteredSpesa.length === 0 ? (
        <Text style={styles.emptyText}>Lista vuota 🎉</Text>
      ) : (
        filteredSpesa.map(item => (
          <Card key={item.id} style={styles.itemCard}>
            <View style={styles.itemRow}>
              <TouchableOpacity onPress={() => toggleItem(item.id)} style={styles.checkboxWrap}>
                <View style={[styles.checkbox, { borderColor: COLORS.border2, backgroundColor: item.done ? COLORS.green : 'transparent' }]}>
                  {item.done && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
              <Text style={[styles.itemText, item.done && styles.itemTextDone]}>{item.text}</Text>
              <Pill color="muted">{item.cat}</Pill>
              <TouchableOpacity onPress={() => deleteItem(item.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 32 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16, marginTop: 6 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.bg2 },
  filterPillActive: { backgroundColor: COLORS.accentGlow },
  filterText: { fontSize: 12, color: COLORS.textMuted },
  addToggle: { marginBottom: 16 },
  addToggleText: { fontSize: 13, color: COLORS.accent, fontWeight: '600' },
  formCard: { marginBottom: 16 },
  input: { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: COLORS.text, fontSize: 13, marginBottom: 12 },
  catRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  catChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, backgroundColor: COLORS.bg4 },
  catChipActive: { backgroundColor: COLORS.accentGlow },
  catChipText: { fontSize: 12, color: COLORS.textMuted },
  submitBtn: { backgroundColor: COLORS.accent, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  emptyText: { fontSize: 13, color: COLORS.textSub, textAlign: 'center', marginTop: 20 },
  itemCard: { marginBottom: 8, padding: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkboxWrap: { padding: 2 },
  checkbox: { width: 20, height: 20, borderWidth: 1.5, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  checkmark: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  itemText: { flex: 1, fontSize: 14, color: COLORS.text },
  itemTextDone: { textDecorationLine: 'line-through', color: COLORS.textSub },
  deleteBtn: { padding: 4, marginLeft: 4 },
  deleteBtnText: { fontSize: 14, color: COLORS.textSub },
});