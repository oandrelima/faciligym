import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Theme } from '../constants/theme';
import { AttendanceRecord } from '../services/api';

interface Props {
  attendanceList?: AttendanceRecord[];
  attendance?: AttendanceRecord[];
  onSelectDate?: (date: string) => void;
  onCheckInToday?: () => void;
}

export const CalendarView: React.FC<Props> = ({ attendanceList, attendance, onSelectDate, onCheckInToday }) => {
  const records = attendanceList || attendance || [];
  const [current] = useState(new Date());

  const year  = current.getFullYear();
  const month = current.getMonth();
  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const DAYS   = ['D','S','T','Q','Q','S','S'];

  const todayStr = current.toISOString().split('T')[0];
  const safeRecords = Array.isArray(records) ? records : [];
  const trainedSet = new Set(safeRecords.map(a => a?.date).filter(Boolean));

  const fmtDate = (d: number) =>
    `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  const todayTrained = trainedSet.has(todayStr);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.top}>
        <Text style={styles.monthLabel}>{MONTHS[month]} {year}</Text>
        {onCheckInToday ? (
          <TouchableOpacity
            style={[styles.checkBtn, todayTrained && styles.checkBtnDone]}
            onPress={onCheckInToday}
          >
            <View style={styles.checkDot} />
            <Text style={styles.checkBtnText}>
              {todayTrained ? 'Treino feito' : 'Check-in hoje'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Weekday row — strictly 7 columns */}
      <View style={styles.weekRow}>
        {DAYS.map((d, i) => (
          <Text key={i} style={styles.dayName}>{d}</Text>
        ))}
      </View>

      {/* Grid — strictly 7 columns per row */}
      <View style={styles.grid}>
        {/* Empty cells */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <View key={`e${i}`} style={styles.emptyCell} />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = i + 1;
          const dateStr = fmtDate(d);
          const trained = trainedSet.has(dateStr);
          const isToday = dateStr === todayStr;
          const isFuture = new Date(dateStr) > current && !isToday;

          return (
            <TouchableOpacity
              key={d}
              style={[
                styles.dayCell,
                trained && styles.dayCellTrained,
                isToday && !trained && styles.dayCellToday,
              ]}
              onPress={() => !isFuture && onSelectDate?.(dateStr)}
              disabled={isFuture}
            >
              <Text style={[
                styles.dayText,
                trained && styles.dayTextTrained,
                isToday && !trained && styles.dayTextToday,
                isFuture && styles.dayTextFuture,
              ]}>
                {d}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.bgCard,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: Theme.spacing.md,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  monthLabel: {
    fontSize: Theme.font.md,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  checkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.red,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Theme.radius.full,
  },
  checkBtnDone: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Theme.colors.redBorder,
  },
  checkDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Theme.colors.textInverse,
  },
  checkBtnText: {
    fontSize: 12,
    color: Theme.colors.textInverse,
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  dayName: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textMuted,
    paddingBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyCell: {
    width: '14.28%',
    height: 36,
  },
  dayCell: {
    width: '14.28%',
    height: 36,
    borderRadius: Theme.radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellTrained: {
    backgroundColor: Theme.colors.red,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: Theme.colors.red,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '500',
    color: Theme.colors.textSecondary,
  },
  dayTextTrained: {
    color: Theme.colors.textInverse,
    fontWeight: '800',
  },
  dayTextToday: {
    color: Theme.colors.red,
    fontWeight: '700',
  },
  dayTextFuture: {
    color: Theme.colors.textMuted,
    opacity: 0.4,
  },
});
