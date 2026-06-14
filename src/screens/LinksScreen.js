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
  const [formNome, setFormNome]         = useState('');
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
        title: 'Limite raggiunto',
        message: `Puoi aggiungere al massimo ${MAX_STARRED} link in evidenza. Rimuovine uno per aggiungerne un altro.`,
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }],
      });
      return;
    }
    setLinks(prev => prev.map(l => l.id === id ? { ...l, starred: !l.starred } : l));
  };

  const aggiungiLink = () => {
    if (!formNome.trim() || !formUrl.trim()) {
      showAlert({
        title: 'Errore',
        message: 'Inserisci nome e URL del link',
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }],
      });
      return;
    }
    const newId   = Math.max(0, ...links.map(l => l.id || 0)) + 1;
    let finalUrl  = formUrl.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    setLinks(prev => [...prev, {
      id: newId, nome: formNome.trim(),
      url: finalUrl, icon: formIcon || '🔗', starred: false,
    }]);
    setFormNome(''); setFormUrl(''); setFormIcon('🔗');
    setModalVisible(false);
  };

  const eliminaLink = (id, nome) => {
    showAlert({
      title: 'Elimina Link',
      message: `Rimuovere "${nome}"?`,
      buttons: [
        { text: 'Annulla', style: 'cancel', onPress: () => setAlertConfig(null) },
        { text: 'Elimina', style: 'destructive', onPress: () => {
          setLinks(prev => prev.filter(l => l.id !== id));
          setAlertConfig(null);
        }},
      ],
    });
  };

  const apriLink = async (url) => {
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) await Linking.openURL(url);
      else showAlert({
        title: 'Errore', message: 'Impossibile aprire questo URL',
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }],
      });
    } catch {
      showAlert({
        title: 'Errore', message: 'Problema aprendo il link',
        buttons: [{ text: 'OK', style: 'cancel', onPress: () => setAlertConfig(null) }],
      });
    }
  };

  const starred    = links.filter(l => l.starred);
  const nonStarred = links.filter(l => !l.starred);

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>🔗 Link</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addFab}>
            <Text style={styles.addFabText}>+ Nuovo</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Starred (in evidenza) ─── */}
        {starred.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>
              ⭐ In Evidenza ({starred.length}/{MAX_STARRED})
            </Text>
            <View style={styles.grid}>
              {starred.map(link => (
                <Card key={link.id} style={styles.linkCard}>
                  <TouchableOpacity style={styles.linkClickArea} onPress={() => apriLink(link.url)}>
                    <View style={styles.iconCircle}>
                      <Text style={styles.linkIcon}>{link.icon}</Text>
                    </View>
                    <Text style={styles.linkNome} numberOfLines={1}>{link.nome}</Text>
                    <Text style={styles.linkUrl} numberOfLines={1}>
                      {link.url.replace('https://', '').replace('http://', '')}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => toggleStarred(link.id)} style={styles.starBtn}>
                      <Text style={[styles.starIcon, styles.starIconActive]}>★</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => eliminaLink(link.id, link.nome)} style={styles.trashBtn}>
                      <Text style={styles.trashIcon}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))}
            </View>
          </>
        )}

        {/* ─── All links ─── */}
        {nonStarred.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Tutti i Link</Text>
            <View style={styles.grid}>
              {nonStarred.map(link => (
                <Card key={link.id} style={styles.linkCard}>
                  <TouchableOpacity style={styles.linkClickArea} onPress={() => apriLink(link.url)}>
                    <View style={styles.iconCircle}>
                      <Text style={styles.linkIcon}>{link.icon}</Text>
                    </View>
                    <Text style={styles.linkNome} numberOfLines={1}>{link.nome}</Text>
                    <Text style={styles.linkUrl} numberOfLines={1}>
                      {link.url.replace('https://', '').replace('http://', '')}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      onPress={() => toggleStarred(link.id)}
                      style={styles.starBtn}
                      disabled={!link.starred && starredCount >= MAX_STARRED}
                    >
                      <Text style={[
                        styles.starIcon,
                        !link.starred && starredCount >= MAX_STARRED && styles.starIconDisabled,
                      ]}>☆</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => eliminaLink(link.id, link.nome)} style={styles.trashBtn}>
                      <Text style={styles.trashIcon}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))}
            </View>
          </>
        )}

        {links.length === 0 && (
          <Card><Text style={styles.emptyText}>Nessun link salvato.</Text></Card>
        )}
      </ScrollView>

      {/* ─── Modal Aggiungi ─── */}
      <Modal visible={modalVisible} transparent animationType="slide">
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
            <Text style={styles.modalTitle}>Nuovo Link</Text>
            <View style={styles.formRow}>
              <TextInput
                style={[styles.input, styles.iconInput]}
                value={formIcon}
                onChangeText={setFormIcon}
                maxLength={2}
                placeholder="🔗"
                placeholderTextColor={COLORS.textSub}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Nome (es. Moodle)"
                placeholderTextColor={COLORS.textSub}
                value={formNome}
                onChangeText={setFormNome}
                autoFocus
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="URL (es. google.com)"
              placeholderTextColor={COLORS.textSub}
              value={formUrl}
              onChangeText={setFormUrl}
              autoCapitalize="none"
              keyboardType="url"
              returnKeyType="done"
              onSubmitEditing={aggiungiLink}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtn}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={aggiungiLink}>
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
  root:   { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  content:{ padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title:  { fontSize: 28, fontWeight: '700', color: COLORS.text },
  addFab: { backgroundColor: COLORS.accent, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  addFabText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  sectionLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 8 },
  emptyText: { color: COLORS.textSub, textAlign: 'center', marginVertical: 20 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 8 },
  linkCard: { width: '48%', marginBottom: 14, padding: 12 },
  linkClickArea: { alignItems: 'center' },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.bg3, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  linkIcon:   { fontSize: 24 },
  linkNome:   { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 4, textAlign: 'center' },
  linkUrl:    { fontSize: 11, color: COLORS.accent, textAlign: 'center', marginBottom: 8 },

  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  starBtn:  { padding: 4 },
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
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.bg4, alignSelf: 'center', marginBottom: 16 },
  modalTitle:  { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 16, textAlign: 'center' },
  formRow:     { flexDirection: 'row', gap: 10, marginBottom: 12 },
  input:       { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 15, marginBottom: 12 },
  iconInput:   { width: 60, textAlign: 'center', fontSize: 20, marginBottom: 0 },
  modalBtns:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  cancelBtn:   { color: COLORS.textSub, fontSize: 15, padding: 10 },
  confirmBtn:  { backgroundColor: COLORS.accent, paddingVertical: 12, paddingHorizontal: 22, borderRadius: 10 },
  confirmBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});