// src/components/DatePicker.js
//
// Custom month calendar. Public props unchanged:
//   value: 'YYYY-MM-DD' | ''   onChange(dateStr)
//   mode: 'future' | 'future5' | 'past' | 'past5' | 'any'
//   maxYearsBack (default 5), label
//
// M3 pass: the trigger is a filled 56 field; the panel is a solid
// surfaceContainerHigh dialog (no blur, no border, no shadow) over a 70%
// scrim; day cells are spring pressables with the primary fill for the
// selected day. The calendar grid is still built as explicit rows of seven
// so the layout engine can never wrap a week.
//
// Hardware back closes this overlay (onRequestClose), not the app.
import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Modal,
} from 'react-native';

import { M3, alpha } from '../config/colors';
import { SHAPE } from '../config/designSystem';
import { TEXT } from '../ui/type';
import { SpringPressable } from '../ui/SpringPressable';
import { IconButton } from '../ui/IconButton';
import { Chip } from '../ui/Chip';
import { Icon } from './Icon';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const CELL = 40;

function pad(n) { return String(n).padStart(2, '0'); }

function toDateStr(y, m, d) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function parseDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return { y, m: m - 1, d };
}

export function DatePicker({ value, onChange, mode = 'any', maxYearsBack = 5, label }) {
  const [open, setOpen] = useState(false);

  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const parsed = parseDate(value);
  const [viewYear, setViewYear] = useState(parsed ? parsed.y : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed ? parsed.m : today.getMonth());

  function isDisabled(dateStr) {
    if (mode === 'future') return dateStr <= todayStr;
    if (mode === 'future5') {
      const limit = new Date(today);
      limit.setFullYear(limit.getFullYear() + maxYearsBack);
      const limitStr = toDateStr(limit.getFullYear(), limit.getMonth(), limit.getDate());
      return dateStr <= todayStr || dateStr > limitStr;
    }
    if (mode === 'past') return dateStr > todayStr;
    if (mode === 'past5') {
      const limit = new Date(today);
      limit.setFullYear(limit.getFullYear() - maxYearsBack);
      const limitStr = toDateStr(limit.getFullYear(), limit.getMonth(), limit.getDate());
      return dateStr > todayStr || dateStr < limitStr;
    }
    return false;
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function selectDate(dateStr) {
    if (isDisabled(dateStr)) return;
    onChange(dateStr);
    setOpen(false);
  }

  function handleToday() {
    if (!isDisabled(todayStr)) {
      onChange(todayStr);
      setOpen(false);
    }
  }

  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  const displayValue = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  return (
    <>
      <SpringPressable
        onPress={() => setOpen(true)}
        haptic="selection"
        accessibilityRole="button"
        accessibilityLabel={displayValue || label || 'Select date'}
        style={styles.trigger}
        contentStyle={styles.triggerContent}
      >
        <Icon name="calendar" size={18} color={M3.onSurfaceVariant} />
        <Text style={[TEXT.bodyLarge, styles.triggerText, !value && styles.placeholder]}>
          {displayValue || (label || 'Select date')}
        </Text>
        {value ? (
          <SpringPressable
            onPress={() => onChange('')}
            haptic={false}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Clear date"
            style={styles.clearBtn}
            contentStyle={styles.clearBtnContent}
          >
            <Icon name="x" size={16} color={M3.outline} />
          </SpringPressable>
        ) : null}
      </SpringPressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={[styles.backdrop, { backgroundColor: alpha(M3.scrim, 0.7) }]}
          onPress={() => setOpen(false)}
          accessibilityLabel="Close date picker"
        />
        <View style={styles.pickerContainer}>
          <View style={styles.header}>
            <IconButton
              icon="chevron-left"
              onPress={prevMonth}
              accessibilityLabel="Previous month"
            />
            <Text style={[TEXT.titleMedium, styles.monthLabel]}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <IconButton
              icon="chevron-right"
              onPress={nextMonth}
              accessibilityLabel="Next month"
            />
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map(d => (
              <Text key={d} style={[TEXT.labelSmall, styles.weekLabel]}>{d}</Text>
            ))}
          </View>

          <View>
            {rows.map((row, rowIdx) => (
              <View key={`row-${rowIdx}`} style={styles.gridRow}>
                {row.map((day, i) => {
                  if (!day) return <View key={`e-${rowIdx}-${i}`} style={styles.cell} />;
                  const dateStr = toDateStr(viewYear, viewMonth, day);
                  const disabled = isDisabled(dateStr);
                  const selected = dateStr === value;
                  const isToday = dateStr === todayStr;
                  return (
                    <View key={dateStr} style={styles.cell}>
                      <SpringPressable
                        onPress={() => selectDate(dateStr)}
                        disabled={disabled}
                        haptic="selection"
                        accessibilityRole="button"
                        accessibilityLabel={`${day} ${MONTHS[viewMonth]} ${viewYear}`}
                        accessibilityState={{ selected, disabled }}
                        style={[
                          styles.dayShell,
                          isToday && !selected && styles.dayToday,
                          disabled && styles.dayDisabled,
                        ]}
                        contentStyle={[
                          styles.dayContent,
                          selected && styles.daySelected,
                        ]}
                      >
                        <Text style={[
                          TEXT.bodyMedium,
                          styles.dayText,
                          selected && { color: M3.onPrimary },
                          isToday && !selected && { color: M3.primary },
                          disabled && { color: M3.outline },
                        ]}>
                          {day}
                        </Text>
                      </SpringPressable>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <Chip
              label="Today"
              onPress={handleToday}
              disabled={isDisabled(todayStr)}
            />
            <SpringPressable
              onPress={() => setOpen(false)}
              haptic="selection"
              accessibilityLabel="Close date picker"
              style={styles.closeBtn}
              contentStyle={styles.closeBtnContent}
            >
              <Text style={[TEXT.labelLarge, { color: M3.onSurfaceVariant }]}>Close</Text>
            </SpringPressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    backgroundColor: M3.surfaceContainerHigh,
    borderRadius: SHAPE.lg,
    marginBottom: 12,
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: SHAPE.lg,
  },
  triggerText: { flex: 1, color: M3.onSurface },
  placeholder: { color: M3.onSurfaceVariant },
  clearBtn: { borderRadius: SHAPE.full },
  clearBtnContent: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SHAPE.full,
  },

  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  pickerContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: '18%',
    borderRadius: SHAPE.xxxl,
    padding: 16,
    backgroundColor: M3.surfaceContainerHigh,
    overflow: 'hidden',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthLabel: { color: M3.onSurface },

  weekRow: { flexDirection: 'row', marginBottom: 8 },
  weekLabel: { width: CELL, textAlign: 'center', color: M3.onSurfaceVariant },

  gridRow: { flexDirection: 'row' },
  cell: { width: CELL, height: CELL, alignItems: 'center', justifyContent: 'center' },
  dayShell: { width: CELL - 4, height: CELL - 4, borderRadius: (CELL - 4) / 2 },
  dayContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: (CELL - 4) / 2,
  },
  daySelected: { backgroundColor: M3.primary },
  dayToday: { borderWidth: 1.5, borderColor: M3.primary },
  dayDisabled: { opacity: 0.32 },
  dayText: { color: M3.onSurface },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    alignItems: 'center',
  },
  closeBtn: { borderRadius: SHAPE.full },
  closeBtnContent: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: SHAPE.full },
});
