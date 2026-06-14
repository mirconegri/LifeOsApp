import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Card } from '../components/Card';
import { COLORS } from '../config/colors';
import { CustomAlert } from '../components/CustomAlert';
import { todayKey, last7Days } from '../data/helpers';

export default function HabitsScreen({ habits, setHabits }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [formName, setFormName]         = useState('');
  const [formIcon, setFormIcon]         = useState('🌟');
  const [alertConfig, setAlertConfig]   = useState(null);

  const today    = todayKey();
  const pastWeek = last7Days();

  const showAlert = (config) => setAlertConfig(config);

  const toggleHabit = (id) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      const history = { ...(h.history || {}) };
      if (history[today]) {
        delete history[today];
      } else {
        history[today] = 1;
      }
      let streak = 0;
      const d = new Date();
      while (true) {
        const dateStr = d.toISOString().slice(0, 10);
        if (history[dateStr]) { streak++; d.setDate(d.getDate() - 1); }
        else break;
      }
      return { ...h, history, streak };
    }));
  };

  const aggiungiHabit = () => {
    const nome = formName.trim();
    if (!nome) {
      showAlert({
        title: 'Errore',
        message: "Inserisci un nome per l'abitudine",
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }],
      });
      return;
    }
    const newId = Math.max(0, ...habits.map(h => h.id || 0)) + 1;
    setHabits(prev => [
      ...prev,
      { id: newId, name: nome, icon: formIcon || '🌟', streak: 0, history: {} },
    ]);
    setFormName(''); setFormIcon('🌟');
    setModalVisible(false);
  };

  const eliminaHabit = (id, nome) => {
    showAlert({
      title: 'Elimina Abitudine',
      message: `Vuoi rimuovere "${nome}"?`,
      buttons: [
        { text: 'Annulla', style: 'cancel', onPress: () => setAlertConfig(null) },
        { text: 'Elimina', style: 'destructive', onPress: () => {
          setHabits(prev => prev.filter(h => h.id !== id));
          setAlertConfig(null);
        }},
      ],
    });
  };

  return (
    <View style={styles.root}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>🌱 Abitudini</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addFab}>
            <Text style={styles.addFabText}>+ Nuova</Text>
          </TouchableOpacity>
        </View>

        {habits.length === 0 ? (
          <Card><Text style={styles.emptyText}>Non hai ancora abitudini da tracciare.</Text></Card>
        ) : (
          habits.map(h => {
            const isDoneToday = h.history && h.history[today];
            return (
              <Card key={h.id} style={styles.habitCard}>
                <View style={styles.habitTop}>
                  <View style={styles.titleArea}>
                    <Text style={styles.habitIcon}>{h.icon}</Text>
                    <View>
                      <Text style={styles.habitName}>{h.name}</Text>
                      <Text style={styles.habitStreak}>🔥 {h.streak} giorni di fila</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => toggleHabit(h.id)}
                    style={[styles.checkBtn, isDoneToday && styles.checkBtnDone]}
                  >
                    <Text style={[styles.checkBtnText, isDoneToday && { color: '#fff' }]}>
                      {isDoneToday ? '✓ FATTO' : 'COMPLETA'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.weekGraph}>
                  {pastWeek.map(date => {
                    const done  = h.history && h.history[date];
                    const isOggi = date === today;
                    return (
                      <View key={date} style={styles.dayCol}>
                        <View style={[
                          styles.dayDot,
                          done ? styles.dayDotDone : styles.dayDotMissed,
                          isOggi && styles.dayDotOggi,
                        ]} />
                        <Text style={styles.dayLabel}>
                          {new Date(date).toLocaleDateString('it-IT', { weekday: 'short' }).charAt(0)}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                <TouchableOpacity onPress={() => eliminaHabit(h.id, h.name)} style={styles.deleteBtn}>
                  <Text style={styles.deleteText}>Elimina abitudine</Text>
                </TouchableOpacity>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* ─── Modal Aggiunta — keyboard-safe ─── */}
      <Modal visible={modalVisible} transparent animationType="slide">
        {/* KeyboardAvoidingView spinge il modal sopra la tastiera */}
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
            <Text style={styles.modalTitle}>Nuova Abitudine</Text>

            <View style={styles.formRow}>
              <TextInput
                style={[styles.input, styles.iconInput]}
                value={formIcon}
                onChangeText={setFormIcon}
                maxLength={2}
                placeholder="🌟"
                placeholderTextColor={COLORS.textSub}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Nome (es. Bere 2L d'acqua)"
                placeholderTextColor={COLORS.textSub}
                value={formName}
                onChangeText={setFormName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={aggiungiHabit}
              />
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtn}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={aggiungiHabit}>
                <Text style={styles.confirmBtnText}>Salva</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CustomAlert config={alertConfig} />
    </View>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1 },
  content:   { padding: 16, paddingBottom: 40 },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:     { fontSize: 28, fontWeight: '700', color: COLORS.text },
  addFab:    { backgroundColor: COLORS.green, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  addFabText:{ color: '#111', fontSize: 14, fontWeight: '700' },
  emptyText: { color: COLORS.textSub, textAlign: 'center', marginVertical: 20 },

  habitCard:  { marginBottom: 16, padding: 16 },
  habitTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  titleArea:  { flexDirection: 'row', alignItems: 'center', flex: 1 },
  habitIcon:  { fontSize: 32, marginRight: 12 },
  habitName:  { fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  habitStreak:{ fontSize: 12, color: COLORS.amber, fontWeight: '600' },
  checkBtn:   { borderWidth: 1, borderColor: COLORS.border, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12 },
  checkBtnDone:{ backgroundColor: COLORS.green, borderColor: COLORS.green },
  checkBtnText:{ color: COLORS.text, fontSize: 12, fontWeight: 'bold' },

  weekGraph: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.bg3, padding: 12, borderRadius: 12, marginBottom: 12 },
  dayCol:    { alignItems: 'center' },
  dayDot:    { width: 24, height: 24, borderRadius: 6, marginBottom: 6 },
  dayDotDone:   { backgroundColor: COLORS.green },
  dayDotMissed: { backgroundColor: COLORS.bg4 },
  dayDotOggi:   { borderWidth: 2, borderColor: COLORS.text },
  dayLabel:  { fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase' },

  deleteBtn: { alignSelf: 'flex-end' },
  deleteText:{ color: COLORS.red, fontSize: 11 },

  // Modal
  modalWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modal: {
    backgroundColor: COLORS.bg2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.bg4,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 20, textAlign: 'center' },
  formRow:    { flexDirection: 'row', gap: 10, marginBottom: 20 },
  input:      { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 15 },
  iconInput:  { width: 60, textAlign: 'center', fontSize: 24 },
  modalBtns:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cancelBtn:  { color: COLORS.textSub, fontSize: 16, padding: 10 },
  confirmBtn: { backgroundColor: COLORS.green, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  confirmBtnText: { color: '#111', fontSize: 15, fontWeight: '700' },
});