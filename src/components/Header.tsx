import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Theme } from '../constants/theme';
import { IconGear } from './Icons';

interface HeaderProps {
  title: string;
  subtitle?: string;
  streakCount?: number;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, streakCount, rightAction }) => {
  return (
    <View style={styles.container}>
      <View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.right}>
        {streakCount !== undefined && (
          <View style={styles.streak}>
            <View style={styles.streakDot} />
            <Text style={styles.streakText}>{streakCount} dias</Text>
          </View>
        )}
        {rightAction}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: Theme.colors.bg,
  },
  subtitle: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginBottom: 2,
    fontWeight: '400',
  },
  title: {
    fontSize: Theme.font.xl,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.redDim,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
    borderColor: Theme.colors.redBorder,
  },
  streakDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.red,
  },
  streakText: {
    fontSize: 12,
    color: Theme.colors.red,
    fontWeight: '700',
  },
});
