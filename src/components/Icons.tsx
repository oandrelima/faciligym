import React from 'react';
import { ViewStyle } from 'react-native';
import {
  House,
  Barbell,
  ChatTeardropText,
  ForkKnife,
  Gear,
  Trophy,
  Plus,
  Trash,
  TrendUp,
  User,
  Bell,
  Check,
  CaretRight,
  PencilSimple
} from 'phosphor-react-native';

export interface IconProps {
  color?: string;
  size?: number;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  style?: ViewStyle;
}

export const IconHome = ({ color = '#fff', size = 20, weight = 'bold', style }: IconProps) => (
  <House color={color} size={size} weight={weight} style={style} />
);

export const IconDumbbell = ({ color = '#fff', size = 20, weight = 'bold', style }: IconProps) => (
  <Barbell color={color} size={size} weight={weight} style={style} />
);

export const IconMessage = ({ color = '#fff', size = 20, weight = 'bold', style }: IconProps) => (
  <ChatTeardropText color={color} size={size} weight={weight} style={style} />
);

export const IconRing = ({ color = '#fff', size = 20, weight = 'bold', style }: IconProps) => (
  <ForkKnife color={color} size={size} weight={weight} style={style} />
);

export const IconLeaf = ({ color = '#fff', size = 20, weight = 'bold', style }: IconProps) => (
  <ForkKnife color={color} size={size} weight={weight} style={style} />
);

export const IconGear = ({ color = '#fff', size = 20, weight = 'bold', style }: IconProps) => (
  <Gear color={color} size={size} weight={weight} style={style} />
);

export const IconTrophy = ({ color = '#fff', size = 20, weight = 'bold', style }: IconProps) => (
  <Trophy color={color} size={size} weight={weight} style={style} />
);

export const IconTrendingUp = ({ color = '#fff', size = 20, weight = 'bold', style }: IconProps) => (
  <TrendUp color={color} size={size} weight={weight} style={style} />
);

export const IconPlus = ({ color = '#fff', size = 16, weight = 'bold', style }: IconProps) => (
  <Plus color={color} size={size} weight={weight} style={style} />
);

export const IconTrash = ({ color = '#fff', size = 16, weight = 'bold', style }: IconProps) => (
  <Trash color={color} size={size} weight={weight} style={style} />
);

export const IconUser = ({ color = '#fff', size = 20, weight = 'bold', style }: IconProps) => (
  <User color={color} size={size} weight={weight} style={style} />
);

export const IconBell = ({ color = '#fff', size = 20, weight = 'bold', style }: IconProps) => (
  <Bell color={color} size={size} weight={weight} style={style} />
);

export const IconCheck = ({ color = '#fff', size = 16, weight = 'bold', style }: IconProps) => (
  <Check color={color} size={size} weight={weight} style={style} />
);

export const IconArrow = ({ color = '#fff', size = 16, weight = 'bold', style }: IconProps) => (
  <CaretRight color={color} size={size} weight={weight} style={style} />
);

export const IconEdit = ({ color = '#fff', size = 16, weight = 'bold', style }: IconProps) => (
  <PencilSimple color={color} size={size} weight={weight} style={style} />
);
