import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../constants/theme';

interface MacroBarProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
}

export const MacroBar: React.FC<MacroBarProps> = ({ label, current, target, unit, color }) => {
  const pct = Math.min(Math.round((current / target) * 100), 100);
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.values}>
          <Text style={{ color, fontWeight: '700' }}>{current}</Text>
          <Text style={{ color: Theme.colors.textMuted }}> / {target} {unit}</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginVertical: 6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 12, color: Theme.colors.textSecondary, fontWeight: '600' },
  values: { fontSize: 12 },
  track: {
    height: 5,
    backgroundColor: Theme.colors.bgInput,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 3 },
});
