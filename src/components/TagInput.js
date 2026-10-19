// src/components/TagInput.js
//
// Chip-style tag input with autocomplete against previously used tags.
// Behaviour is unchanged (lowercase single-word tags, space commits, the
// create-new suggestion, deferred blur, focus returns to the field).
// M3 pass: tonal chips, a filled 56 field and a solid tonal dropdown.
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
} from 'react-native';

import { M3 } from '../config/colors';
import { SHAPE } from '../config/designSystem';
import { TEXT } from '../ui/type';
import { SpringPressable } from '../ui/SpringPressable';

// Cleans a raw tag candidate down to the allowed shape: lowercase, single
// word, no leading/trailing junk. Used both while typing and on commit.
function sanitizeTag(raw) {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, ''); // letters/digits/hyphen only, no spaces
}

export function TagInput({ tags, onChangeTags, allKnownTags = [], placeholder = 'Add a tag...' }) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const blurTimer = useRef(null);

  const cleanQuery = sanitizeTag(query);

  const existingMatches = cleanQuery
    ? allKnownTags.filter(t => t.startsWith(cleanQuery) && !tags.includes(t))
    : allKnownTags.filter(t => !tags.includes(t));

  const showCreateOption = cleanQuery.length > 0 && !allKnownTags.includes(cleanQuery);
  const suggestions = showCreateOption ? [cleanQuery, ...existingMatches] : existingMatches;

  function commitTag(tag) {
    const clean = sanitizeTag(tag);
    if (!clean) return;
    if (!tags.includes(clean)) {
      onChangeTags([...tags, clean]);
    }
    setQuery('');
    clearTimeout(blurTimer.current);
    setFocused(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function removeTag(tag) {
    onChangeTags(tags.filter(t => t !== tag));
  }

  function handleChangeText(text) {
    // A space commits whatever's been typed so far as a tag, rather than
    // becoming part of it — this enforces "one word per tag".
    if (text.endsWith(' ')) {
      commitTag(text.slice(0, -1));
      return;
    }
    setQuery(sanitizeTag(text));
  }

  return (
    <View style={styles.wrapper}>
      {tags.length > 0 ? (
        <View style={styles.chipRow}>
          {tags.map(tag => (
            <SpringPressable
              key={tag}
              onPress={() => removeTag(tag)}
              haptic="selection"
              accessibilityLabel={`Remove tag ${tag}`}
              style={styles.chip}
              contentStyle={styles.chipContent}
            >
              <Text style={[TEXT.labelMedium, styles.chipText]}>#{tag}</Text>
              <Text style={[TEXT.labelSmall, styles.chipRemove]}>✕</Text>
            </SpringPressable>
          ))}
        </View>
      ) : null}

      <TextInput
        ref={inputRef}
        style={[styles.input, TEXT.bodyLarge]}
        placeholder={placeholder}
        placeholderTextColor={M3.outline}
        value={query}
        onChangeText={handleChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setFocused(false), 150);
        }}
        onSubmitEditing={() => commitTag(query)}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
      />

      {focused && suggestions.length > 0 ? (
        <View style={styles.dropdown}>
          <ScrollView
            nestedScrollEnabled
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
          >
            {suggestions.slice(0, 6).map((s) => (
              <SpringPressable
                key={s}
                onPressIn={() => commitTag(s)}
                haptic="selection"
                accessibilityLabel={`Add tag ${s}`}
                style={styles.option}
                contentStyle={styles.optionContent}
              >
                <Text style={[TEXT.bodyMedium, styles.optionText]}>
                  {s === cleanQuery && showCreateOption && !allKnownTags.includes(s) ? `Create "#${s}"` : `#${s}`}
                </Text>
              </SpringPressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12, zIndex: 100, elevation: 100 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  chip: {
    backgroundColor: M3.primaryContainer,
    borderRadius: SHAPE.full,
    marginRight: 6,
    marginBottom: 6,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: SHAPE.full,
  },
  chipText: { color: M3.onPrimaryContainer, marginRight: 6 },
  chipRemove: { color: M3.onPrimaryContainer },

  input: {
    backgroundColor: M3.surfaceContainerHigh,
    borderRadius: SHAPE.lg,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: M3.onSurface,
  },

  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: M3.surfaceContainerHigh,
    borderRadius: SHAPE.lg,
    marginTop: 4,
    zIndex: 999,
    elevation: 999,
    overflow: 'hidden',
    maxHeight: 220,
    paddingVertical: 4,
  },
  option: { borderRadius: SHAPE.sm, marginHorizontal: 4 },
  optionContent: { paddingHorizontal: 12, paddingVertical: 11, borderRadius: SHAPE.sm },
  optionText: { color: M3.onSurface },
});
