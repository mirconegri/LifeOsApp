import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS } from '../config/colors';
import { Card } from '../components/Card';
import { Pill } from '../components/Pill';
import { CustomAlert } from '../components/CustomAlert';
import { TagInput } from '../components/TagInput';
import { DraggableList } from '../components/DraggableList';
import { todayKey } from '../data/helpers';

export default function NotesScreen({ notes, setNotes }) {
  const [modalVisible,  setModalVisible]  = useState(false);
  const [editingId,     setEditingId]     = useState(null);
  const [formTitle,     setFormTitle]     = useState('');
  const [formContent,   setFormContent]   = useState('');
  const [formTags,      setFormTags]      = useState([]);
  const [alertConfig,   setAlertConfig]   = useState(null);

  const showAlert = (cfg) => setAlertConfig(cfg);

  // Every tag used across all existing notes, deduplicated — this is what
  // TagInput suggests from while typing a new tag.
  const allKnownTags = useMemo(() => {
    const set = new Set();
    notes.forEach(n => (n.tags || []).forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [notes]);

  const openAddModal = () => {
    setEditingId(null);
    setFormTitle(''); setFormContent(''); setFormTags([]);
    setModalVisible(true);
  };

  // New: tapping a note now opens it here pre-filled, instead of notes
  // being create-only with no way back in to change anything.
  const openEditModal = (note) => {
    setEditingId(note.id);
    setFormTitle(note.title || '');
    setFormContent(note.content || '');
    setFormTags(note.tags || []);
    setModalVisible(true);
  };

  const saveNote = () => {
    if (!formTitle.trim() && !formContent.trim()) {
      showAlert({ title: 'Error', message: 'Enter a title or some content.',
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }] });
      return;
    }

    if (editingId) {
      setNotes(prev => prev.map(n => n.id === editingId ? {
        ...n, title: formTitle.trim(), content: formContent.trim(), tags: formTags,
      } : n));
    } else {
      const newId = Math.max(0, ...notes.map(n => n.id || 0)) + 1;
      setNotes(prev => [{
        id: newId, title: formTitle.trim(), content: formContent.trim(),
        tags: formTags, date: todayKey(),
      }, ...prev]);
    }
    setModalVisible(false);
  };

  const deleteNote = (id) => {
    showAlert({
      title: 'Delete Note',
      message: 'Are you sure you want to delete this note?',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => setAlertConfig(null) },
        { text: 'Delete', style: 'destructive', onPress: () => {
            setNotes(prev => prev.filter(n => n.id !== id));
            setAlertConfig(null); setModalVisible(false);
          }
        },
      ],
    });
  };

  const handleReorder = (reordered) => setNotes(reordered);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>📝 Notes</Text>
          <TouchableOpacity onPress={openAddModal} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {notes.length === 0 ? (
          <Text style={styles.emptyText}>No notes found. Start typing!</Text>
        ) : (
          <>
            {notes.length > 1 && (
              <Text style={styles.reorderHint}>Hold and drag a note to reorder</Text>
            )}
            <DraggableList
              items={notes}
              keyExtractor={(n) => String(n.id)}
              onReorder={handleReorder}
              itemHeight={140}
              renderItem={(n) => (
                <TouchableOpacity onPress={() => openEditModal(n)} activeOpacity={0.8}>
                  <Card style={styles.noteCard}>
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
                </TouchableOpacity>
              )}
            />
          </>
        )}
      </ScrollView>

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalWrapper}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{editingId ? 'Edit Note' : 'New Note'}</Text>

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

              {/* Replaces the old single comma-separated text field. As you
                  type, a dropdown shows tags you've used on other notes
                  plus the option to create whatever you just typed; tapping
                  one commits it as a purple chip and keeps the keyboard up
                  so you can type the next tag right away. Tags are forced
                  lowercase, single-word. */}
              <Text style={styles.fieldLabel}>Tags</Text>
              <TagInput
                tags={formTags}
                onChangeTags={setFormTags}
                allKnownTags={allKnownTags}
                placeholder="Type a tag and pick from the list..."
              />

              <View style={styles.modalBtns}>
                {editingId ? (
                  <TouchableOpacity onPress={() => deleteNote(editingId)} style={[styles.btn, styles.btnDelete]}>
                    <Text style={styles.btnDeleteText}>Delete</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.btn, styles.btnCancel]}>
                    <Text style={styles.btnCancelText}>Cancel</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={saveNote} style={[styles.btn, styles.btnSave]}>
                  <Text style={styles.btnSaveText}>{editingId ? 'Save Changes' : 'Save'}</Text>
                </TouchableOpacity>
              </View>

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
  content: { padding: 16, paddingBottom: 40 },
  header:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:   { fontSize: 28, fontWeight: '700', color: COLORS.text },
  addBtn:  { backgroundColor: COLORS.accent, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  addBtnText:{ color: '#fff', fontSize: 14, fontWeight: '700' },

  emptyText: { fontSize: 14, color: COLORS.textSub, textAlign: 'center', marginTop: 20 },
  reorderHint: { fontSize: 11, color: COLORS.textSub, marginBottom: 10 },

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
  fieldLabel:  { color: COLORS.textSub, fontSize: 13, marginBottom: 8 },

  modalBtns:   { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btn:         { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  btnCancel:   { backgroundColor: COLORS.bg4, marginRight: 10 },
  btnCancelText:{ color: COLORS.textMuted, fontWeight: '600' },
  btnDelete:   { backgroundColor: COLORS.redDim, borderWidth: 1, borderColor: COLORS.red, marginRight: 10 },
  btnDeleteText:{ color: COLORS.red, fontWeight: '600' },
  btnSave:     { backgroundColor: COLORS.accent },
  btnSaveText: { color: '#fff', fontWeight: '700' },
});
