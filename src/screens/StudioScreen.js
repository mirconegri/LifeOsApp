import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../config/colors';
import { Card } from '../components/Card';
import { Pill } from '../components/Pill';
import { todayKey } from '../data/helpers';

export default function StudioScreen({
  tasks, setTasks,
  timerSec, timerRunning, timerMateria,
  onTimerToggle, onTimerReset, onTimerMateria,
}) {
  const [filter, setFilter] = useState('today');
  const [showForm, setShowForm] = useState(false);
  const [formText, setFormText] = useState('');
  const [formMateria, setFormMateria] = useState('');
  const [formPriorita, setFormPriorita] = useState('media');
  const [formData, setFormData] = useState(todayKey());

  const today = todayKey();
  const endOfWeek = new Date();
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
  const weekKey = endOfWeek.toISOString().slice(0, 10);

  const filtered = tasks.filter(t => {
    if (filter === 'today') return t.data === today;
    if (filter === 'week') return t.data >= today && t.data <= weekKey;
    return true;
  });

  const doneCount = filtered.filter(t => t.done).length;

  const padTime = n => String(n || 0).padStart(2, '0');
  const fmtTimer = s => `${padTime(Math.floor(s / 3600))}:${padTime(Math.floor((s % 3600) / 60))}:${padTime(s % 60)}`;

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTask = (id) => {
    Alert.alert('Elimina', 'Rimuovere questo task?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: () => setTasks(prev => prev.filter(t => t.id !== id)) },
    ]);
  };

  const aggiungiTask = () => {
    if (!formText.trim()) { Alert.alert('Errore', 'Inserisci la descrizione'); return; }
    const newId = Math.max(0, ...tasks.map(t => t.id)) + 1;
    setTasks(prev => [...prev, {
      id: newId,
      text: formText.trim(),
      done: false,
      materia: formMateria.trim(),
      priorita: formPriorita,
      data: formData || today,
    }]);
    setFormText('');
    setFormMateria('');
    setFormPriorita('media');
    setFormData(today);
    setShowForm(false);
  };

  const prioritaColor = (p) => {
    if (p === 'alta') return 'red';
    if (p === 'media') return 'amber';
    return 'muted';
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Timer Widget */}
      <Card style={styles.timerCard}>
        <Text style={styles.timerTitle}>⏱️ Timer Studio</Text>
        <TextInput
          style={styles.materiaInput}
          placeholder="Materia (opzionale)"
          placeholderTextColor={COLORS.textSub}
          value={timerMateria}
          onChangeText={onTimerMateria}
        />
        <Text style={styles.timerDisplay}>{fmtTimer(timerSec)}</Text>
        <View style={styles.timerBtns}>
          <TouchableOpacity
            style={[styles.timerBtn, { backgroundColor: timerRunning ? COLORS.red : COLORS.green }]}
            onPress={onTimerToggle}
          >
            <Text style={styles.timerBtnText}>{timerRunning ? '⏸ Pausa' : '▶ Avvia'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.timerBtn, styles.timerBtnReset]} onPress={onTimerReset}>
            <Text style={styles.timerBtnText}>↺ Reset</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Filtri */}
      <View style={styles.filters}>
        {[['today', 'Oggi'], ['week', 'Settimana'], ['all', 'Tutti']].map(([f, label]) => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.filterPill, filter === f && styles.filterPillActive]}>
            <Text style={[styles.filterText, filter === f && { color: COLORS.accent }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contatore */}
      <View style={styles.counterRow}>
        <Text style={styles.counterText}>
          {doneCount}/{filtered.length} completati
        </Text>
      </View>

      {/* Form aggiungi */}
      <TouchableOpacity onPress={() => setShowForm(!showForm)} style={styles.addToggle}>
        <Text style={styles.addToggleText}>{showForm ? '✕ Chiudi' : '+ Aggiungi Task'}</Text>
      </TouchableOpacity>

      {showForm && (
        <Card style={styles.formCard}>
          <TextInput
            style={styles.input}
            placeholder="Descrizione task"
            placeholderTextColor={COLORS.textSub}
            value={formText}
            onChangeText={setFormText}
          />
          <TextInput
            style={styles.input}
            placeholder="Materia"
            placeholderTextColor={COLORS.textSub}
            value={formMateria}
            onChangeText={setFormMateria}
          />
          <TextInput
            style={styles.input}
            placeholder="Data (YYYY-MM-DD)"
            placeholderTextColor={COLORS.textSub}
            value={formData}
            onChangeText={setFormData}
          />
          <View style={styles.prioritaRow}>
            {['alta', 'media', 'bassa'].map(p => (
              <TouchableOpacity key={p} onPress={() => setFormPriorita(p)} style={[styles.prioritaChip, formPriorita === p && styles.prioritaChipActive]}>
                <Text style={[styles.prioritaChipText, formPriorita === p && { color: COLORS.accent }]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.submitBtn} onPress={aggiungiTask}>
            <Text style={styles.submitBtnText}>Aggiungi</Text>
          </TouchableOpacity>
        </Card>
      )}

      {/* Lista task */}
      {filtered.length === 0 ? (
        <Text style={styles.emptyText}>Nessun task 🎉</Text>
      ) : (
        filtered.map(t => (
          <Card key={t.id} style={styles.taskCard}>
            <View style={styles.taskRow}>
              <TouchableOpacity onPress={() => toggleTask(t.id)} style={styles.checkboxWrap}>
                <View style={[
                  styles.checkbox,
                  { borderColor: COLORS.border2, backgroundColor: t.done ? COLORS.green : 'transparent' },
                ]}>
                  {t.done && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
              <Text style={[styles.taskText, t.done && styles.taskTextDone]}>{t.text}</Text>
              <TouchableOpacity onPress={() => deleteTask(t.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pillsRow}>
              {t.materia ? <Pill color="muted">{t.materia}</Pill> : null}
              <Pill color={prioritaColor(t.priorita)}>{t.priorita}</Pill>
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
  timerCard: { marginBottom: 16, alignItems: 'center' },
  timerTitle: { fontSize: 13, color: COLORS.textMuted, marginBottom: 8 },
  materiaInput: { width: '100%', backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: COLORS.text, fontSize: 13, marginBottom: 10 },
  timerDisplay: { fontSize: 40, fontWeight: 'bold', color: COLORS.accent, fontVariant: ['tabular-nums'], marginBottom: 12 },
  timerBtns: { flexDirection: 'row', gap: 10 },
  timerBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  timerBtnReset: { backgroundColor: COLORS.bg4 },
  timerBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.bg2 },
  filterPillActive: { backgroundColor: COLORS.accentGlow },
  filterText: { fontSize: 12, color: COLORS.textMuted },
  counterRow: { marginBottom: 8 },
  counterText: { fontSize: 12, color: COLORS.textSub },
  addToggle: { marginBottom: 12 },
  addToggleText: { fontSize: 13, color: COLORS.accent, fontWeight: '600' },
  formCard: { marginBottom: 12 },
  input: { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: COLORS.text, fontSize: 13, marginBottom: 8 },
  prioritaRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  prioritaChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, backgroundColor: COLORS.bg4 },
  prioritaChipActive: { backgroundColor: COLORS.accentGlow },
  prioritaChipText: { fontSize: 12, color: COLORS.textMuted },
  submitBtn: { backgroundColor: COLORS.accent, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  emptyText: { fontSize: 13, color: COLORS.textSub, textAlign: 'center', marginTop: 20 },
  taskCard: { marginBottom: 8, padding: 12 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkboxWrap: { padding: 2 },
  checkbox: { width: 20, height: 20, borderWidth: 1.5, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  checkmark: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  taskText: { flex: 1, fontSize: 13, color: COLORS.text },
  taskTextDone: { textDecorationLine: 'line-through', color: COLORS.textSub },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 14, color: COLORS.textSub },
  pillsRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
});