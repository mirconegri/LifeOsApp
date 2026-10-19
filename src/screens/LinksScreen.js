import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, Linking, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS } from '../config/colors';
import { AppScrollView } from '../ui/AppScrollView';
import { Card } from '../components/Card';
import { CustomAlert } from '../components/CustomAlert';
import { DraggableList } from '../components/DraggableList';
import { Icon } from '../components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MAX_STARRED = 6;

export default function LinksScreen({ links, setLinks }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId]       = useState(null);
  const [formName, setFormName]         = useState('');
  const [formUrl,  setFormUrl]          = useState('');
  const [formIcon, setFormIcon]         = useState('🔗');
  const [alertConfig, setAlertConfig]   = useState(null);
  const insets = useSafeAreaInsets();

  const showAlert = (cfg) => setAlertConfig(cfg);
  const closeModal = () => setModalVisible(false);

  const starredCount = links.filter(l => l.starred).length;

  const toggleStarred = (id) => {
    const link = links.find(l => l.id === id);
    if (!link) return;
    if (!link.starred && starredCount >= MAX_STARRED) {
      showAlert({
        title: 'Limit Reached',
        message: `You can add up to ${MAX_STARRED} starred links. Remove one to add another.`,
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }],
      });
      return;
    }
    setLinks(prev => prev.map(l => l.id === id ? { ...l, starred: !l.starred } : l));
  };

  const deleteLink = (id, name) => {
    showAlert({
      title: 'Remove Link',
      message: `Are you sure you want to delete "${name}"?`,
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => setAlertConfig(null) },
        { text: 'Delete', style: 'destructive', onPress: () => {
            setLinks(prev => prev.filter(l => l.id !== id));
            setAlertConfig(null); setModalVisible(false);
          }
        },
      ],
    });
  };

  const confirmClearAll = () => {
    showAlert({
      title: 'Clear All Links',
      message: `This will permanently delete all ${links.length} links. This can't be undone.`,
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => setAlertConfig(null) },
        { text: 'Clear All', style: 'destructive', onPress: () => {
          setLinks([]);
          setAlertConfig(null);
        }},
      ],
    });
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormName(''); setFormUrl(''); setFormIcon('🔗');
    setModalVisible(true);
  };

  // New: opens the same modal pre-filled for an existing link. Triggered by
  // the pencil button next to each row, as requested — separate from the
  // star button so starring and editing don't compete for the same tap.
  const openEditModal = (link) => {
    setEditingId(link.id);
    setFormName(link.name);
    setFormUrl(link.url);
    setFormIcon(link.icon);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formUrl.trim()) {
      showAlert({ title: 'Error', message: 'Name and URL are required.',
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }] });
      return;
    }
    let validUrl = formUrl.trim();
    if (!validUrl.startsWith('http')) validUrl = 'https://' + validUrl;

    if (editingId) {
      setLinks(prev => prev.map(l => l.id === editingId ? {
        ...l, name: formName.trim(), url: validUrl, icon: formIcon.trim() || '🔗',
      } : l));
    } else {
      setLinks(prev => [...prev, {
        id: Date.now(), name: formName.trim(), url: validUrl,
        icon: formIcon.trim() || '🔗', starred: false,
      }]);
    }
    setModalVisible(false);
  };

  const handleReorder = (reordered) => setLinks(reordered);

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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="globe" size={24} color={COLORS.text} />
            <Text style={styles.title}>Useful Links</Text>
          </View>
          <TouchableOpacity onPress={openAddModal} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listMetaRow}>
          <Text style={styles.sectionTitle}>All Links</Text>
          {links.length > 0 && (
            <TouchableOpacity onPress={confirmClearAll}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
        {links.length === 0 ? (
          <Text style={styles.emptyText}>No saved links.</Text>
        ) : (
          <>
            {links.length > 1 && (
              <Text style={styles.reorderHint}>Hold and drag a link to reorder</Text>
            )}
            <DraggableList
              items={links}
              keyExtractor={(l) => String(l.id)}
              onReorder={handleReorder}
              itemHeight={66}
              scrollRef={scrollRef}
              scrollYRef={scrollYRef}
              renderItem={(l) => (
                <Card style={styles.linkCard}>
                  <TouchableOpacity onPress={() => Linking.openURL(l.url)} style={styles.linkInfo}>
                    <Text style={styles.linkIcon}>{l.icon}</Text>
                    <View style={styles.linkTexts}>
                      <Text style={styles.linkName}>{l.name}</Text>
                      <Text style={styles.linkUrl} numberOfLines={1}>{l.url}</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.actions}>
                    <TouchableOpacity onPress={() => toggleStarred(l.id)} style={styles.starBtn}>
                      <Text style={[styles.starIcon, l.starred ? styles.starIconActive : styles.starIconDisabled]}>
                        ★
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openEditModal(l)} style={styles.editBtn}>
                      <Text style={styles.editIcon}>✎</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteLink(l.id, l.name)} style={styles.trashBtn}>
                      <Text style={styles.trashIcon}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
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
            <Text style={styles.modalTitle}>{editingId ? 'Edit Link' : 'New Link'}</Text>
            <View style={styles.modalHeaderRight} />
          </View>

          <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="always">
            <View style={styles.formRow}>
              <TextInput
                style={[styles.input, styles.iconInput]}
                placeholder="Icon"
                placeholderTextColor={COLORS.textSub}
                value={formIcon}
                onChangeText={setFormIcon}
                maxLength={2}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Site name..."
                placeholderTextColor={COLORS.textSub}
                value={formName}
                onChangeText={setFormName}
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="URL (e.g. google.com)..."
              placeholderTextColor={COLORS.textSub}
              value={formUrl}
              onChangeText={setFormUrl}
              keyboardType="url"
              autoCapitalize="none"
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            {editingId ? (
              <TouchableOpacity onPress={() => deleteLink(editingId, formName)} style={[styles.modalFooterBtn, styles.modalFooterBtnDelete]}>
                <Text style={styles.modalFooterBtnDeleteText}>Delete</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={closeModal} style={[styles.modalFooterBtn, styles.modalFooterBtnCancel]}>
                <Text style={styles.modalFooterBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleSave} style={[styles.modalFooterBtn, styles.modalFooterBtnSave]}>
              <Text style={styles.modalFooterBtnSaveText}>{editingId ? 'Save Changes' : 'Save'}</Text>
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

  listMetaRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  clearAllText: { fontSize: 12, color: COLORS.red, fontWeight: '600' },
  emptyText:    { fontSize: 14, color: COLORS.textSub, textAlign: 'center', marginTop: 20 },
  reorderHint:  { fontSize: 11, color: COLORS.textSub, marginBottom: 10 },

  linkCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: 14 },
  linkInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  linkIcon: { fontSize: 24, marginRight: 12 },
  linkTexts:{ flex: 1 },
  linkName: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  linkUrl:  { fontSize: 12, color: COLORS.accent },

  actions:  { flexDirection: 'row', alignItems: 'center' },
  starBtn:  { padding: 8 },
  starIcon: { fontSize: 18, color: COLORS.amber },
  starIconActive:   { color: COLORS.amber },
  starIconDisabled: { color: COLORS.textSub },
  editBtn:  { padding: 8 },
  editIcon: { fontSize: 15, color: COLORS.textMuted },
  trashBtn: { padding: 8 },
  trashIcon:{ color: COLORS.textSub, fontSize: 14 },

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
  formRow:     { flexDirection: 'row', marginBottom: 12 },
  input:       { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 15, marginBottom: 12 },
  iconInput:   { width: 60, marginRight: 10, textAlign: 'center' },
});
