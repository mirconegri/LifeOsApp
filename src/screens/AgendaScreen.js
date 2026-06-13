import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Card } from '../components/Card';
import { Pill } from '../components/Pill';
import { COLORS } from '../config/colors';
import { todayKey, diffDays } from '../data/helpers';

export default function AgendaScreen({ tasks, setTasks }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [formText, setFormText] = useState('');
  const [formMateria, setFormMateria] = useState('');
  const [formPriorita, setFormPriorita] = useState('media');
  const [formData, setFormData] = useState(todayKey());

  const apriModal = () => {
    setFormText(''); setFormMateria(''); setFormPriorita('media'); setFormData(todayKey());
    setModalVisible(true);
  };

  const aggiungiTask = () => {
    const t = formText.trim();
    if (!t) { Alert.alert('Errore', 'Inserisci una descrizione'); return; }
    
    const newId = Math.max(0, ...tasks.map(x => x.id || 0)) + 1;
    setTasks(prev => [
      ...prev,
      { id: newId, text: t, materia: formMateria.trim(), priorita: formPriorita, data: formData || todayKey(), done: false }
    ]);
    setModalVisible(false);
  };

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const eliminaTask = (id) => {
    Alert.alert('Elimina impegno', 'Vuoi rimuovere questo impegno?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: () => setTasks(prev => prev.filter(t => t.id !== id)) }
    ]);
  };

  const prioritaColor = (p) => p === 'alta' ? 'red' : p === 'media' ? 'amber' : 'green';

  // Raggruppa i task per data
  const groupedTasks = useMemo(() => {
    const groups = {};
    tasks.forEach(t => {
      const d = t.data || todayKey();
      if (!groups[d]) groups[d] = [];
      groups[d].push(t);
    });
    // Ordina le date dalla più recente
    const sortedKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b));
    return sortedKeys.map(k => ({ data: k, items: groups[k] }));
  }, [tasks]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>📅 Agenda</Text>
        <TouchableOpacity onPress={apriModal} style={styles.addFab}>
          <Text style={styles.addFabText}>+ Impegno</Text>
        </TouchableOpacity>
      </View>

      {groupedTasks.length === 0 ? (
        <Card><Text style={styles.emptyText}>Nessun impegno in agenda.</Text></Card>
      ) : (
        groupedTasks.map(group => (
          <View key={group.data} style={styles.dateGroup}>
            <Text style={styles.dateTitle}>
              {group.data === todayKey() ? 'Oggi' : diffDays(group.data) === 1 ? 'Domani' : group.data}
            </Text>
            {group.items.map(t => (
              <Card key={t.id} style={t.done ? styles.cardDone : styles.cardActive}>
                <View style={styles.taskRow}>
                  <TouchableOpacity onPress={() => toggleTask(t.id)} style={styles.checkWrap}>
                    <View style={[styles.checkbox, t.done && styles.checkboxChecked]}>
                      {t.done && <Text style={styles.checkText}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskText, t.done && styles.taskTextStriked]}>{t.text}</Text>
                    {t.materia ? <Text style={styles.taskMateria}>{t.materia}</Text> : null}
                  </View>
                  <Pill color={prioritaColor(t.priorita)}>{t.priorita}</Pill>
                  <TouchableOpacity onPress={() => eliminaTask(t.id)} style={styles.trashBtn}>
                    <Text style={styles.trashIcon}>✕</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        ))
      )}

      {/* Modal Aggiungi */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Nuovo Impegno</Text>
            <TextInput style={styles.input} placeholder="Cosa devi fare?" placeholderTextColor={COLORS.textSub} value={formText} onChangeText={setFormText} />
            <TextInput style={styles.input} placeholder="Materia o Categoria (opzionale)" placeholderTextColor={COLORS.textSub} value={formMateria} onChangeText={setFormMateria} />
            <TextInput style={styles.input} placeholder={`Data (es. ${todayKey()})`} placeholderTextColor={COLORS.textSub} value={formData} onChangeText={setFormData} />
            
            <Text style={styles.fieldLabel}>Priorità:</Text>
            <View style={styles.pillRow}>
              {['bassa', 'media', 'alta'].map(p => (
                <TouchableOpacity key={p} onPress={() => setFormPriorita(p)} style={[styles.prioritaBtn, formPriorita === p && styles.prioritaBtnActive]}>
                  <Text style={[styles.prioritaText, formPriorita === p && {color: COLORS.accent}]}>{p.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.cancelBtn}>Annulla</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={aggiungiTask}><Text style={styles.confirmBtnText}>Salva</Text></TouchableOpacity>
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
  emptyText: { color: COLORS.textSub, textAlign: 'center', marginVertical: 20 },
  dateGroup: { marginBottom: 20 },
  dateTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  cardActive: { marginBottom: 8, padding: 12 },
  cardDone: { marginBottom: 8, padding: 12, opacity: 0.6 },
  taskRow: { flexDirection: 'row', alignItems: 'center' },
  checkWrap: { marginRight: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.border2, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  checkText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  taskInfo: { flex: 1 },
  taskText: { fontSize: 15, color: COLORS.text },
  taskTextStriked: { textDecorationLine: 'line-through', color: COLORS.textSub },
  taskMateria: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  trashBtn: { padding: 8, marginLeft: 8 },
  trashIcon: { color: COLORS.textSub, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: COLORS.bg2, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 15, marginBottom: 12 },
  fieldLabel: { color: COLORS.textSub, fontSize: 13, marginBottom: 8 },
  pillRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  prioritaBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: COLORS.bg3, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  prioritaBtnActive: { backgroundColor: COLORS.accentGlow, borderColor: COLORS.accent },
  prioritaText: { fontSize: 12, color: COLORS.textSub, fontWeight: '600' },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cancelBtn: { color: COLORS.textSub, fontSize: 16, padding: 10 },
  confirmBtn: { backgroundColor: COLORS.accent, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});