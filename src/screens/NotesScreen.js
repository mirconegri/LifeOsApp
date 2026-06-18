import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS } from '../config/colors';
import { Card } from '../components/Card';
import { Pill } from '../components/Pill';
import { CustomAlert } from '../components/CustomAlert';
import { todayKey } from '../data/helpers';

export default function NotesScreen({ notes, setNotes }) {
  const [modalVisible,  setModalVisible]  = useState(false);
  const [formTitle,     setFormTitle]     = useState('');
  const [formContent,   setFormContent]   = useState('');
  const [formTags,      setFormTags]      = useState('');
  const [alertConfig,   setAlertConfig]   = useState(null);

  const showAlert = (cfg) => setAlertConfig(cfg);

  const addNote = () => {
    if (!formTitle.trim() && !formContent.trim()) {
      showAlert({ title: 'Error', message: 'Enter a title or some content.',
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }] });
      return;
    }
    const newId    = Math.max(0, ...notes.map(n => n.id || 0)) + 1;
    const tagArray = formTags.split(',').map(t => t.trim()).filter(t => t);

    const newNote = {
      id: newId,
      title: formTitle.trim(),
      content: formContent.trim(),
      tags: tagArray,
      date: todayKey(),
    };

    setNotes(prev => [newNote, ...prev]);
    setModalVisible(false);
    setFormTitle('');
    setFormContent('');
    setFormTags('');
  };

  const deleteNote = (id) => {
    showAlert({
      title: 'Delete Note',
      message: 'Are you sure you want to delete this note?',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => setAlertConfig(null) },
        { text: 'Delete', style: 'destructive', onPress: () => {
            setNotes(prev => prev.filter(n => n.id !== id));
            setAlertConfig(null);
          }
        },
      ],
    });
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>📝 Notes</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {notes.length === 0 ? (
          <Text style={styles.emptyText}>No notes found. Start typing!</Text>
        ) : (
          notes.map(n => (
            <Card key={n.id} style={styles.noteCard}>
              <View style={styles.noteHeader}>
                <Text style={styles.noteTitle}>{n.title || 'Untitled'}</Text>
                <TouchableOpacity onPress={() => deleteNote(n.id)} style={styles.trashBtn}>
                  <Text style={styles.trashIcon}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.noteDate}>{n.date}</Text>
              {n.content ? <Text style={styles.noteContent}>{n.content}</Text> : null}
              
              {n.tags && n.tags.length > 0 && (
                <View style={styles.tagRow}>
                  {n.tags.map(t => (
                    <View key={t} style={{ marginRight: 6, marginBottom: 6 }}>
                      <Pill color="accent">#{t}</Pill>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          ))
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalWrapper}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>New Note</Text>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <TextInput
                style={[styles.input, styles.titleInput]}
                placeholder="Title..."
                placeholderTextColor={COLORS.textSub}
                value={formTitle}
                onChangeText={setFormTitle}
              />

              <TextInput
                style={[styles.input, styles.contentInput]}
                placeholder="Write something brilliant..."
                placeholderTextColor={COLORS.textSub}
                value={formContent}
                onChangeText={setFormContent}
                multiline
                textAlignVertical="top"
              />

              <TextInput
                style={styles.input}
                placeholder="Tags (comma separated)..."
                placeholderTextColor={COLORS.textSub}
                value={formTags}
                onChangeText={setFormTags}
              />

              <View style={styles.modalBtns}>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.btn, styles.btnCancel]}>
                  <Text style={styles.btnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={addNote} style={[styles.btn, styles.btnSave]}>
                  <Text style={styles.btnSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
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
  content: { padding: 16, paddingBottom: 40 },
  header:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:   { fontSize: 28, fontWeight: '700', color: COLORS.text },
  addBtn:  { backgroundColor: COLORS.accent, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  addBtnText:{ color: '#fff', fontSize: 14, fontWeight: '700' },

  emptyText: { fontSize: 14, color: COLORS.textSub, textAlign: 'center', marginTop: 20 },
  
  noteCard:    { marginBottom: 12, padding: 16 },
  noteHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  noteTitle:   { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  trashIcon:   { color: COLORS.textMuted, fontSize: 14 },
  trashBtn:    { marginLeft: 8, padding: 4 },
  noteDate:    { fontSize: 11, color: COLORS.textSub, marginTop: 4, marginBottom: 8 },
  noteContent: { fontSize: 14, color: COLORS.textMuted, lineHeight: 22, marginBottom: 12 },
  tagRow:      { flexDirection: 'row', flexWrap: 'wrap' },

  // Modal
  modalWrapper:  { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modal: {
    backgroundColor: COLORS.bg2,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    borderTopWidth: 1, borderColor: COLORS.border,
    maxHeight: '85%',
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.bg4, alignSelf: 'center', marginBottom: 16 },
  modalTitle:  { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 16, textAlign: 'center' },
  input:       { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 14, marginBottom: 10 },
  titleInput:  { fontWeight: '600', fontSize: 16 },
  contentInput:{ height: 120, paddingTop: 12 },
  
  modalBtns:   { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btn:         { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  btnCancel:   { backgroundColor: COLORS.bg4, marginRight: 10 },
  btnCancelText:{ color: COLORS.textMuted, fontWeight: '600' },
  btnSave:     { backgroundColor: COLORS.accent },
  btnSaveText: { color: '#fff', fontWeight: '700' },
});
