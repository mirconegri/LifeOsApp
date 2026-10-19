// src/screens/LinksScreen.js
//
// M3 Expressive Links: tonal rows with an emoji tile in the links tone,
// star/edit/delete actions, links tone empty state and a full-screen
// add/edit form with labelled filled fields and a sticky CtaButton footer.
// Handlers, starring limit, URL normalisation, ids, validation and the
// DraggableList wiring are unchanged.
import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  Linking, Modal, KeyboardAvoidingView, Platform,
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
import { DraggableList } from '../components/DraggableList';
import { Icon } from '../components/Icon';

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

  // Opens the same modal pre-filled for an existing link. Triggered by the
  // pencil button next to each row — separate from the star button so
  // starring and editing don't compete for the same tap.
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
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >
        <ScreenHeader
          title="Links"
          subtitle={`${links.length} link${links.length === 1 ? '' : 's'}`}
          style={styles.headerFlush}
          right={(
            <IconButton
              icon="plus"
              onPress={openAddModal}
              accessibilityLabel="Add link"
            />
          )}
        />

        {links.length === 0 ? (
          <EmptyState
            icon="globe"
            title="No links saved"
            body="Keep the pages you come back to in one place."
            tone={MODULE_TONES.links}
            action={<CtaButton label="Add link" variant="tonal" onPress={openAddModal} />}
          />
        ) : (
          <>
            <View style={styles.listMetaRow}>
              <Text style={[TEXT.titleSmall, styles.sectionLabel]}>All Links</Text>
              <SpringPressable
                onPress={confirmClearAll}
                haptic="selection"
                accessibilityLabel="Clear all links"
                style={styles.clearAll}
                contentStyle={styles.clearAllContent}
              >
                <Text style={[TEXT.labelLarge, styles.clearAllText]}>Clear all</Text>
              </SpringPressable>
            </View>
            {links.length > 1 ? (
              <Text style={[TEXT.labelSmall, styles.reorderHint]}>
                Hold and drag a link to reorder
              </Text>
            ) : null}

            <DraggableList
              items={links}
              keyExtractor={(l) => String(l.id)}
              onReorder={handleReorder}
              itemHeight={74}
              scrollRef={scrollRef}
              scrollYRef={scrollYRef}
              renderItem={(l) => (
                <View style={styles.linkRow}>
                  <SpringPressable
                    onPress={() => Linking.openURL(l.url)}
                    haptic="selection"
                    accessibilityLabel={`Open ${l.name}`}
                    style={styles.linkInfo}
                    contentStyle={styles.linkInfoContent}
                  >
                    <View style={styles.iconTile}>
                      <Text style={[TEXT.headlineSmall, styles.linkIcon]}>{l.icon}</Text>
                    </View>
                    <View style={styles.linkTexts}>
                      <Text style={[TEXT.titleMedium, styles.linkName]} numberOfLines={1}>
                        {l.name}
                      </Text>
                      <Text style={[TEXT.labelMedium, styles.linkUrl]} numberOfLines={1}>
                        {l.url}
                      </Text>
                    </View>
                  </SpringPressable>

                  <View style={styles.actions}>
                    <IconButton
                      icon="flame"
                      size={36}
                      tone={l.starred ? MODULE_TONES.links.container : 'surfaceContainerHigh'}
                      color={l.starred ? MODULE_TONES.links.on : M3.outline}
                      onPress={() => toggleStarred(l.id)}
                      accessibilityLabel={l.starred ? `Unstar ${l.name}` : `Star ${l.name}`}
                    />
                    <SpringPressable
                      onPress={() => openEditModal(l)}
                      haptic="selection"
                      accessibilityLabel={`Edit ${l.name}`}
                      style={styles.actionBtn}
                      contentStyle={styles.actionContent}
                    >
                      <Icon name="pencil" size={16} color={M3.onSurfaceVariant} />
                    </SpringPressable>
                    <SpringPressable
                      onPress={() => deleteLink(l.id, l.name)}
                      haptic="selection"
                      accessibilityLabel={`Delete ${l.name}`}
                      style={styles.actionBtn}
                      contentStyle={styles.actionContent}
                    >
                      <Icon name="trash-2" size={16} color={M3.outline} />
                    </SpringPressable>
                  </View>
                </View>
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
            <IconButton icon="x" onPress={closeModal} accessibilityLabel="Close link form" />
            <Text style={[TEXT.titleLargeEmphasized, styles.modalTitle]}>
              {editingId ? 'Edit Link' : 'New Link'}
            </Text>
            <View style={styles.modalHeaderRight} />
          </View>

          <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="always">
            <View style={styles.formRow}>
              <View style={styles.iconField}>
                <Text style={[TEXT.labelMedium, styles.fieldLabel]}>Icon</Text>
                <TextInput
                  style={[styles.input, styles.iconInput, TEXT.titleLarge]}
                  placeholder="Icon"
                  placeholderTextColor={M3.outline}
                  value={formIcon}
                  onChangeText={setFormIcon}
                  maxLength={2}
                />
              </View>
              <View style={styles.nameField}>
                <Text style={[TEXT.labelMedium, styles.fieldLabel]}>Name *</Text>
                <TextInput
                  style={[styles.input, TEXT.bodyLarge]}
                  placeholder="Site name..."
                  placeholderTextColor={M3.outline}
                  value={formName}
                  onChangeText={setFormName}
                />
              </View>
            </View>

            <Text style={[TEXT.labelMedium, styles.fieldLabel]}>URL *</Text>
            <TextInput
              style={[styles.input, TEXT.bodyLarge]}
              placeholder="URL (e.g. google.com)..."
              placeholderTextColor={M3.outline}
              value={formUrl}
              onChangeText={setFormUrl}
              keyboardType="url"
              autoCapitalize="none"
            />
          </ScrollView>

          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 12 }]}>
            {editingId ? (
              <CtaButton
                label="Delete"
                variant="destructive"
                onPress={() => deleteLink(editingId, formName)}
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
              label={editingId ? 'Save Changes' : 'Save'}
              onPress={handleSave}
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
    marginBottom: 6,
  },
  sectionLabel: { color: M3.onSurfaceVariant },
  reorderHint: { color: M3.outline, marginBottom: 6 },
  clearAll: { borderRadius: SHAPE.full },
  clearAllContent: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: SHAPE.full,
  },
  clearAllText: { color: M3.error },

  // Tonal row: 20 radius, 2 px gap, 56 emoji tile in the links container.
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: M3.surfaceContainerHigh,
    borderRadius: SHAPE.xl,
    marginBottom: 2,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  linkInfo: { flex: 1, borderRadius: SHAPE.lg },
  linkInfoContent: { flexDirection: 'row', alignItems: 'center' },
  iconTile: {
    width: 56,
    height: 56,
    borderRadius: SHAPE.lg,
    backgroundColor: MODULE_TONES.links.container,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  linkIcon: { color: MODULE_TONES.links.on },
  linkTexts: { flex: 1 },
  linkName: { color: M3.onSurface },
  linkUrl: { color: MODULE_TONES.links.on, marginTop: 2 },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 6 },
  actionBtn: { borderRadius: SHAPE.full, overflow: 'hidden' },
  actionContent: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },

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
  formRow: { flexDirection: 'row' },
  iconField: { width: 84, marginRight: 12 },
  nameField: { flex: 1 },
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
  iconInput: { textAlign: 'center', paddingHorizontal: 8 },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  footerBtn: { flex: 1 },
  footerPrimary: { flex: 1.4 },
});
