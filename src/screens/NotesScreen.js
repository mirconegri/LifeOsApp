// src/screens/NotesScreen.js
//
// M3 Expressive Notes: tonal note cards inside the reorderable list, notes
// tone empty state, and a full-screen add/edit form with labelled filled
// fields and a sticky CtaButton footer. Handlers, storage shape, ids,
// validation and the DraggableList wiring are unchanged.
import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { M3, MODULE_TONES } from '../config/colors';
import { SHAPE, SPACING } from '../config/designSystem';
import { TEXT } from '../ui/type';
import { AppScrollView } from '../ui/AppScrollView';
import { ScreenHeader } from '../ui/ScreenHeader';
import { SpringPressable } from '../ui/SpringPressable';
import { IconButton } from '../ui/IconButton';
import { CtaButton } from '../ui/CtaButton';
import { EmptyState } from '../ui/EmptyState';
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

  // Tapping a note opens it here pre-filled, so notes are editable instead
  // of create-only.
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
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >
        <ScreenHeader
          title="Notes"
          subtitle={`${notes.length} note${notes.length === 1 ? '' : 's'}`}
          style={styles.headerFlush}
          right={(
            <IconButton
              icon="plus"
              onPress={openAddModal}
              accessibilityLabel="Add note"
            />
          )}
        />

        {notes.length === 0 ? (
          <EmptyState
            icon="file-text"
            title="No notes yet"
            body="Start typing to capture an idea, a reminder, or anything worth keeping."
            tone={MODULE_TONES.notes}
            action={<CtaButton label="New note" variant="tonal" onPress={openAddModal} />}
          />
        ) : (
          <>
            <View style={styles.listMetaRow}>
              {notes.length > 1 ? (
                <Text style={[TEXT.labelSmall, styles.reorderHint]}>
                  Hold and drag a note to reorder
                </Text>
              ) : <View />}
              <SpringPressable
                onPress={confirmClearAll}
                haptic="selection"
                accessibilityLabel="Clear all notes"
                style={styles.clearAll}
                contentStyle={styles.clearAllContent}
              >
                <Text style={[TEXT.labelLarge, styles.clearAllText]}>Clear all</Text>
              </SpringPressable>
            </View>

            <DraggableList
              items={notes}
              keyExtractor={(n) => String(n.id)}
              onReorder={handleReorder}
              itemHeight={164}
              scrollRef={scrollRef}
              scrollYRef={scrollYRef}
              renderItem={(n) => (
                <SpringPressable
                  onPress={() => openEditModal(n)}
                  haptic="selection"
                  accessibilityLabel={`Edit ${n.title || 'untitled note'}`}
                  style={styles.noteCard}
                  contentStyle={styles.noteCardContent}
                >
                  <View style={styles.noteHeader}>
                    <Text style={[TEXT.titleMedium, styles.noteTitle]} numberOfLines={1}>
                      {n.title || 'Untitled'}
                    </Text>
                    <IconButton
                      icon="trash-2"
                      size={32}
                      tone="surfaceContainerHighest"
                      color={M3.outline}
                      onPress={() => deleteNote(n.id)}
                      accessibilityLabel={`Delete ${n.title || 'note'}`}
                    />
                  </View>

                  <Text style={[TEXT.labelSmall, styles.noteDate]}>{n.date}</Text>

                  {n.content ? (
                    <Text style={[TEXT.bodyMedium, styles.noteContent]} numberOfLines={2}>
                      {n.content}
                    </Text>
                  ) : null}

                  {n.tags && n.tags.length > 0 && (
                    <View style={styles.tagRow}>
                      {n.tags.map(t => (
                        <View key={t} style={styles.tagChip}>
                          <Text style={[TEXT.labelSmall, styles.tagText]}>#{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </SpringPressable>
              )}
            />
          </>
        )}
      </AppScrollView>

      {/* Add / Edit modal — full screen, opaque, own insets. */}
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
            <IconButton icon="x" onPress={closeModal} accessibilityLabel="Close note form" />
            <Text style={[TEXT.titleLargeEmphasized, styles.modalTitle]}>
              {editingId ? 'Edit Note' : 'New Note'}
            </Text>
            <View style={styles.modalHeaderRight} />
          </View>

          <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="always">
            <Text style={[TEXT.labelMedium, styles.fieldLabel]}>Title</Text>
            <TextInput
              style={[styles.input, TEXT.bodyLarge]}
              placeholder="Title..."
              placeholderTextColor={M3.outline}
              value={formTitle}
              onChangeText={setFormTitle}
            />

            <Text style={[TEXT.labelMedium, styles.fieldLabel]}>Content</Text>
            <TextInput
              style={[styles.input, styles.contentInput, TEXT.bodyLarge]}
              placeholder="Write something brilliant..."
              placeholderTextColor={M3.outline}
              value={formContent}
              onChangeText={setFormContent}
              multiline
              textAlignVertical="top"
            />

            {/* TagInput keeps its full API: committed tags, autocomplete
                from allKnownTags and the create-new option all live inside
                the component. */}
            <Text style={[TEXT.labelMedium, styles.fieldLabel]}>Tags</Text>
            <TagInput
              tags={formTags}
              onChangeTags={setFormTags}
              allKnownTags={allKnownTags}
              placeholder="Type a tag and pick from the list..."
            />
          </ScrollView>

          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 12 }]}>
            {editingId ? (
              <CtaButton
                label="Delete"
                variant="destructive"
                onPress={() => deleteNote(editingId)}
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
              label={editingId ? 'Save Changes' : 'Create'}
              onPress={saveNote}
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
  content: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.lg },
  headerFlush: { paddingHorizontal: 0 },

  listMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
    marginTop: 4,
  },
  reorderHint: { color: M3.outline },
  clearAll: { borderRadius: SHAPE.full, marginLeft: 'auto' },
  clearAllContent: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: SHAPE.full,
  },
  clearAllText: { color: M3.error },

  // Tonal note card: 24 radius, 2 px gap between rows.
  noteCard: {
    backgroundColor: M3.surfaceContainerHigh,
    borderRadius: SHAPE.xxl,
    marginBottom: 2,
    overflow: 'hidden',
  },
  noteCardContent: { padding: SPACING.md },
  noteHeader: { flexDirection: 'row', alignItems: 'center' },
  noteTitle: { flex: 1, color: M3.onSurface, marginRight: 8 },
  noteDate: { color: M3.onSurfaceVariant, marginTop: 2 },
  noteContent: { color: M3.onSurfaceVariant, marginTop: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginTop: 10 },
  tagChip: {
    backgroundColor: MODULE_TONES.notes.container,
    borderRadius: SHAPE.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: { color: MODULE_TONES.notes.on },

  // Modal — full screen, opaque, own insets.
  modalRoot: { flex: 1, backgroundColor: M3.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: 12,
  },
  modalHeaderRight: { width: 40 },
  modalTitle: { color: M3.onSurface },
  modalScrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
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
  contentInput: { minHeight: 140, paddingTop: 16, textAlignVertical: 'top' },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  footerBtn: { flex: 1 },
  footerPrimary: { flex: 1.4 },
});
