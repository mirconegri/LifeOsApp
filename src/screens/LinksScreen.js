import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, Linking, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS } from '../config/colors';
import { Card } from '../components/Card';
import { CustomAlert } from '../components/CustomAlert';

const MAX_STARRED = 6;

export default function LinksScreen({ links, setLinks }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [formName, setFormName]         = useState('');
  const [formUrl,  setFormUrl]          = useState('');
  const [formIcon, setFormIcon]         = useState('🔗');
  const [alertConfig, setAlertConfig]   = useState(null);

  const showAlert = (cfg) => setAlertConfig(cfg);

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
            setAlertConfig(null);
          }
        },
      ],
    });
  };

  const handleSave = () => {
    if (!formName.trim() || !formUrl.trim()) {
      showAlert({ title: 'Error', message: 'Name and URL are required.',
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }] });
      return;
    }
    let validUrl = formUrl.trim();
    if (!validUrl.startsWith('http')) validUrl = 'https://' + validUrl;

    const newLink = {
      id: Date.now(),
      name: formName.trim(),
      url: validUrl,
      icon: formIcon.trim() || '🔗',
      starred: false,
    };
    setLinks(prev => [...prev, newLink]);
    setModalVisible(false);
  };

  const openAddModal = () => {
    setFormName('');
    setFormUrl('');
    setFormIcon('🔗');
    setModalVisible(true);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>🌐 Useful Links</Text>
          <TouchableOpacity onPress={openAddModal} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>All Links</Text>
        {links.length === 0 ? (
          <Text style={styles.emptyText}>No saved links.</Text>
        ) : (
          links.map(l => (
            <Card key={l.id} style={styles.linkCard}>
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
                <TouchableOpacity onPress={() => deleteLink(l.id, l.name)} style={styles.trashBtn}>
                  <Text style={styles.trashIcon}>✕</Text>
                </TouchableOpacity>
              </View>
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
            <Text style={styles.modalTitle}>New Link</Text>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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

              <View style={styles.modalBtns}>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.btn, styles.btnCancel]}>
                  <Text style={styles.btnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={[styles.btn, styles.btnSave]}>
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

  sectionTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  emptyText:    { fontSize: 14, color: COLORS.textSub, textAlign: 'center', marginTop: 20 },

  linkCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: 14 },
  linkInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  linkIcon: { fontSize: 24, marginRight: 12 },
  linkTexts:{ flex: 1 },
  linkName: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  linkUrl:  { fontSize: 12, color: COLORS.accent },

  actions:  { flexDirection: 'row', alignItems: 'center' },
  starBtn:  { padding: 8, marginRight: 4 },
  starIcon: { fontSize: 18, color: COLORS.amber },
  starIconActive:   { color: COLORS.amber },
  starIconDisabled: { color: COLORS.textSub },
  trashBtn: { padding: 4 },
  trashIcon:{ color: COLORS.textSub, fontSize: 14 },

  // Modal
  modalWrapper:  { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modal: {
    backgroundColor: COLORS.bg2,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    borderTopWidth: 1, borderColor: COLORS.border,
    maxHeight: '88%',
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.bg4, alignSelf: 'center', marginBottom: 16 },
  modalTitle:  { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 16, textAlign: 'center' },
  formRow:     { flexDirection: 'row', marginBottom: 12 },
  input:       { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 15, marginBottom: 12 },
  iconInput:   { width: 60, marginRight: 10, textAlign: 'center' },
  
  modalBtns:   { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btn:         { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  btnCancel:   { backgroundColor: COLORS.bg4, marginRight: 10 },
  btnCancelText:{ color: COLORS.textMuted, fontWeight: '600' },
  btnSave:     { backgroundColor: COLORS.accent },
  btnSaveText: { color: '#fff', fontWeight: '700' },
});
