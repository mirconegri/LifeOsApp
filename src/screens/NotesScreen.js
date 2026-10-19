import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS } from '../config/colors';
import { AppScrollView } from '../ui/AppScrollView';
import { Card } from '../components/Card';
import { Pill } from '../components/Pill';
import { CustomAlert } from '../components/CustomAlert';
import { TagInput } from '../components/TagInput';
import { DraggableList } from '../components/DraggableList';
import { Icon } from '../components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { todayKey } from '../data/helpers';

export default function NotesScreen({ notes, setNotes }) {
  const [modalVisible,  setModalVisible]  = useState(false);
  const [editingId,     setEditingId]     = useState(null);
  const [formTitle,     setFormTitle]     = useState('');
  const [formContent,   setFormContent]   = useState('');
  const [formTags,      setFormTags]      = useState([]);
  const [alertConfig,   setAlertConfig]   = useState(null);
  const insets = useSafeAreaInsets();

  const showAlert = (cfg) => setAlertConfig(cfg);
  const closeModal = () => setModalVisible(false);

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

  const confirmClearAll = () => {
    showAlert({
      title: 'Clear All Notes',
      message: `This will permanently delete all ${notes.length} notes. This can't be undone.`,
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => setAlertConfig(null) },
        { text: 'Clear All', style: 'destructive', onPress: () => {
          setNotes([]);
          setAlertConfig(null);
        }},
      ],
    });
  };

  const handleReorder = (reordered) => setNotes(reordered);

  // Auto-scroll while dragging: DraggableList scrolls this ScrollView, so
  // it needs the ref plus the offset the ScrollView last reported.
  const scrollRef = useRef(null);
  const scrollYRef = useRef(0);

  return (
    <View style={styles.root}>
      <AppScrollView
        ref={scrollRef}
        onScroll={(e) => { scrollYRef.current = e.nativeEvent.contentOffset.y; }}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}><Icon name="file-text" size={24} color={COLORS.text} /><Text style={styles.title}> Notes</Text></View>
          <TouchableOpacity onPress={openAddModal} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {notes.length === 0 ? (
          <Text style={styles.emptyText}>No notes found. Start typing!</Text>
        ) : (
          <>
            <View style={styles.listMetaRow}>
              {notes.length > 1 && (
                <Text style={styles.reorderHint}>Hold and drag a note to reorder</Text>
              )}
              <TouchableOpacity onPress={confirmClearAll}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            </View>
            <DraggableList
              items={notes}
              keyExtractor={(n) => String(n.id)}
              onReorder={handleReorder}
              itemHeight={140}
              scrollRef={scrollRef}
              scrollYRef={scrollYRef}
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
      </AppScrollView>

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
            <TouchableOpacity onPress={closeModal}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>{editingId ? 'Edit Note' : 'New Note'}</Text>
            <View style={styles.modalHeaderRight} />
          </View>

          <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="always">
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
          </ScrollView>

          <View style={styles.modalFooter}>
            {editingId ? (
              <TouchableOpacity onPress={() => deleteNote(editingId)} style={[styles.modalFooterBtn, styles.modalFooterBtnDelete]}>
                <Text style={styles.modalFooterBtnDeleteText}>Delete</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={closeModal} style={[styles.modalFooterBtn, styles.modalFooterBtnCancel]}>
                <Text style={styles.modalFooterBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={saveNote} style={[styles.modalFooterBtn, styles.modalFooterBtnSave]}>
              <Text style={styles.modalFooterBtnSaveText}>{editingId ? 'Save Changes' : 'Create'}</Text>
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
  content: { padding: 16, paddingBottom: 40 },
  header:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:   { fontSize: 28, fontWeight: '700', color: COLORS.text },
  addBtn:  { backgroundColor: COLORS.accent, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  addBtnText:{ color: COLORS.onPrimary, fontSize: 14, fontWeight: '700' },

  emptyText: { fontSize: 14, color: COLORS.textSub, textAlign: 'center', marginTop: 20 },
  listMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  reorderHint: { fontSize: 11, color: COLORS.textSub },
  clearAllText: { fontSize: 12, color: COLORS.red, fontWeight: '600' },

  noteCard:    { marginBottom: 12, padding: 16 },
  noteHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  noteTitle:   { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  trashIcon:   { color: COLORS.textMuted, fontSize: 14 },
  trashBtn:    { marginLeft: 8, padding: 4 },
  noteDate:    { fontSize: 11, color: COLORS.textSub, marginTop: 4, marginBottom: 8 },
  noteContent: { fontSize: 14, color: COLORS.textMuted, lineHeight: 22, marginBottom: 12 },
  tagRow:      { flexDirection: 'row', flexWrap: 'wrap' },

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
  modalFooterBtnSaveText: { color: COLORS.onPrimary, fontWeight: '700', fontSize: 15 },
  modalFooterBtnCancel: { backgroundColor: COLORS.bg4, marginRight: 10 },
  modalFooterBtnCancelText: { color: COLORS.textMuted, fontWeight: '600' },
  modalFooterBtnDelete: { backgroundColor: COLORS.redDim, borderWidth: 1, borderColor: COLORS.red, marginRight: 10 },
  modalFooterBtnDeleteText: { color: COLORS.red, fontWeight: '600' },
  input:       { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 14, marginBottom: 10 },
  titleInput:  { fontWeight: '600', fontSize: 16 },
  contentInput:{ height: 120, paddingTop: 12 },
  fieldLabel:  { color: COLORS.textSub, fontSize: 13, marginBottom: 8 },
});
