import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert, Linking } from 'react-native';
import { COLORS } from '../config/colors';
import { Card } from '../components/Card';

export default function LinksScreen({ links, setLinks }) {
  const [showForm, setShowForm] = useState(false);
  const [formNome, setFormNome] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formIcon, setFormIcon] = useState('🔗');

  const aggiungiLink = () => {
    if (!formNome.trim() || !formUrl.trim()) {
      Alert.alert('Errore', 'Inserisci nome e URL del link');
      return;
    }
    const newId = Math.max(0, ...links.map(l => l.id || 0)) + 1;
    let finalUrl = formUrl.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    setLinks(prev => [...prev, {
      id: newId,
      nome: formNome.trim(),
      url: finalUrl,
      icon: formIcon || '🔗'
    }]);

    setFormNome(''); setFormUrl(''); setFormIcon('🔗');
    setShowForm(false);
  };

  const eliminaLink = (id) => {
    Alert.alert('Elimina Link', 'Vuoi rimuovere questo collegamento?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: () => setLinks(prev => prev.filter(l => l.id !== id)) }
    ]);
  };

  const apriLink = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Errore', 'Impossibile aprire questo URL');
      }
    } catch (error) {
      Alert.alert('Errore', 'Si è verificato un problema aprendo il link');
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>🔗 Collegamenti</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)} style={styles.addFab}>
          <Text style={styles.addFabText}>{showForm ? '✕ Annulla' : '+ Nuovo'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <Card style={styles.formCard}>
          <View style={styles.formRow}>
            <TextInput style={[styles.input, styles.iconInput]} value={formIcon} onChangeText={setFormIcon} maxLength={2} />
            <TextInput style={[styles.input, {flex: 1}]} placeholder="Nome (es. Moodle)" placeholderTextColor={COLORS.textSub} value={formNome} onChangeText={setFormNome} />
          </View>
          <TextInput style={styles.input} placeholder="URL (es. google.com)" placeholderTextColor={COLORS.textSub} value={formUrl} onChangeText={setFormUrl} autoCapitalize="none" keyboardType="url" />
          <TouchableOpacity style={styles.submitBtn} onPress={aggiungiLink}>
            <Text style={styles.submitBtnText}>Salva Link</Text>
          </TouchableOpacity>
        </Card>
      )}

      {links.length === 0 ? (
        <Card><Text style={styles.emptyText}>Nessun link rapido salvato.</Text></Card>
      ) : (
        <View style={styles.grid}>
          {links.map(link => (
            <Card key={link.id} style={styles.linkCard}>
              <TouchableOpacity style={styles.linkClickArea} onPress={() => apriLink(link.url)}>
                <View style={styles.iconCircle}>
                  <Text style={styles.linkIcon}>{link.icon}</Text>
                </View>
                <Text style={styles.linkNome} numberOfLines={1}>{link.nome}</Text>
                <Text style={styles.linkUrl} numberOfLines={1}>{link.url.replace('https://', '').replace('http://', '')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.trashBtn} onPress={() => eliminaLink(link.id)}>
                <Text style={styles.trashIcon}>✕</Text>
              </TouchableOpacity>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text },
  addFab: { backgroundColor: COLORS.accent, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  addFabText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  emptyText: { color: COLORS.textSub, textAlign: 'center', marginVertical: 20 },
  formCard: { marginBottom: 20 },
  formRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  input: { backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 15, marginBottom: 12 },
  iconInput: { width: 60, textAlign: 'center', fontSize: 20, marginBottom: 0 },
  submitBtn: { backgroundColor: COLORS.accent, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  linkCard: { width: '48%', marginBottom: 14, padding: 12, position: 'relative' },
  linkClickArea: { alignItems: 'center' },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.bg3, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  linkIcon: { fontSize: 24 },
  linkNome: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 4, textAlign: 'center' },
  linkUrl: { fontSize: 11, color: COLORS.accent, textAlign: 'center' },
  trashBtn: { position: 'absolute', top: 8, right: 8, padding: 4 },
  trashIcon: { color: COLORS.textSub, fontSize: 12 },
});