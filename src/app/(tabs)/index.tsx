import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../../constants/theme';
import { FaciliGymStorage, AttendanceRecord, UserProfile, WorkoutRoutine, formatDateBR } from '../../services/api';
import { useAppModal } from '../../context/ModalContext';
import { CalendarView } from '../../components/CalendarView';
import { IconUser, IconGear, IconTrendingUp, IconCheck } from '../../components/Icons';

type Filter = 'month' | 'year' | 'all';

// ── Mini bar chart for activity ──────────────────────────
function ActivityChart({ data }: { data: { label: string; value: number; active?: boolean }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <View style={chartStyles.wrap}>
      {data.map((item, i) => (
        <View key={i} style={chartStyles.col}>
          {item.active && (
            <View style={chartStyles.tooltip}>
              <Text style={chartStyles.tooltipText}>Treinou</Text>
            </View>
          )}
          <View style={chartStyles.track}>
            <View style={[
              chartStyles.bar,
              { height: `${Math.round((item.value / max) * 100)}%` as any },
              item.active && chartStyles.barActive,
            ]} />
          </View>
          <Text style={chartStyles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 100, marginTop: 8 },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', marginHorizontal: 3 },
  track: { width: '100%', height: 80, justifyContent: 'flex-end', borderRadius: 6, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.2)' },
  bar: { width: '100%', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.35)' },
  barActive: { backgroundColor: '#fff' },
  label: { fontSize: 9, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontWeight: '600' },
  tooltip: {
    position: 'absolute',
    top: -22,
    backgroundColor: Theme.colors.dark,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 10,
  },
  tooltipText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});

export default function AttendanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showModal, hideModal } = useAppModal();

  const [user, setUser]                 = useState<UserProfile | null>(null);
  const [attendance, setAttendance]     = useState<AttendanceRecord[]>([]);
  const [userRoutines, setUserRoutines] = useState<WorkoutRoutine[]>([]);
  const [filter, setFilter]             = useState<Filter>('month');
  const [streak, setStreak]             = useState(0);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const u = await FaciliGymStorage.getSession();
    if (!u || !u.onboarding_completed) {
      router.replace('/login');
      return;
    }
    setUser(u);
    const data = await FaciliGymStorage.getAttendance(u.id);
    setAttendance(data);
    const routines = await FaciliGymStorage.getRoutines(u.id);
    setUserRoutines(routines);
    const s = await FaciliGymStorage.calculateStreak(u.id);
    setStreak(s);
  };

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const todayStr = now.toISOString().split('T')[0];

  const filtered = attendance.filter(a => {
    const d = new Date(a.date);
    if (filter === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    if (filter === 'year')  return d.getFullYear() === now.getFullYear();
    return true;
  });

  // Calculate current week workouts count
  const startOfWeek = new Date(now);
  const dayOfWeek = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek); // Sunday
  const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

  const currentWeekWorkouts = attendance.filter(a => a.date >= startOfWeekStr && a.date <= todayStr).length;
  const weeklyGoal = user?.weekly_goal || 4;
  const goalPct = Math.min(100, Math.round((currentWeekWorkouts / weeklyGoal) * 100));

  const handleCheckInToday = async () => {
    const defaultType = userRoutines.length > 0 ? userRoutines[0].title : 'Treino Geral';
    try {
      const updated = await FaciliGymStorage.addAttendance({ date: todayStr, workout_type: defaultType, notes: '' });
      setAttendance(updated);
      setStreak(await FaciliGymStorage.calculateStreak(user?.id));
      Alert.alert('Check-in feito!', 'Treino registrado com sucesso.');
    } catch (err: any) {
      Alert.alert('Check-in bloqueado', err.message || 'Erro ao realizar check-in.');
    }
  };

  const handleSave = async (date: string, type: string, n: string) => {
    if (!date) return;
    try {
      const updated = await FaciliGymStorage.addAttendance({ date, workout_type: type, notes: n });
      setAttendance(updated);
      setStreak(await FaciliGymStorage.calculateStreak(user?.id));
      hideModal();
      Alert.alert('Check-in feito!', 'Treino registrado com sucesso.');
    } catch (err: any) {
      Alert.alert('Check-in bloqueado', err.message || 'Erro ao realizar check-in.');
    }
  };

  const openLogModal = (dateStr: string, initialType?: string, initialNotes?: string) => {
    if (dateStr > todayStr) {
      Alert.alert('Não permitido', 'Não é possível realizar check-in em uma data futura.');
      return;
    }

    const routineTitles = userRoutines.map(r => r.title);
    const options = routineTitles.length > 0
      ? [...routineTitles, 'Cardio', 'Descanso']
      : ['Treino Geral', 'Musculação', 'Cardio', 'Descanso'];

    let currentType = initialType ?? options[0];
    let currentNotes = initialNotes ?? '';

    showModal(
      <View style={styles.modal}>
        <Text style={styles.modalTitle}>Registrar Treino</Text>
        <Text style={styles.modalDate}>{formatDateBR(dateStr, true)}</Text>

        <Text style={styles.inputLabel}>Selecione sua Ficha / Tipo</Text>
        <View style={styles.pills}>
          {options.map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.pill, currentType === t && styles.pillActive]}
              onPress={() => openLogModal(dateStr, t, currentNotes)}
            >
              <Text style={[styles.pillText, currentType === t && styles.pillTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {userRoutines.length === 0 && (
          <TouchableOpacity onPress={() => { hideModal(); router.push('/workouts'); }}>
            <Text style={styles.createRoutineHint}>+ Criar ficha de treino personalizada</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.inputLabel}>Observações</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Ex: Carga máxima no agachamento"
          placeholderTextColor={Theme.colors.textMuted}
          defaultValue={currentNotes}
          onChangeText={(v) => { currentNotes = v; }}
          multiline
        />

        <View style={styles.modalBtns}>
          <TouchableOpacity style={styles.cancelBtn} onPress={hideModal}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => handleSave(dateStr, currentType, currentNotes)}
          >
            <Text style={styles.saveText}>Salvar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Open Athlete Badge Card
  const openAthleteCardModal = () => {
    if (!user) return;
    showModal(
      <View style={styles.athleteModal}>
        <View style={styles.athleteHeader}>
          <View style={styles.largeAvatar}>
            <Text style={styles.largeAvatarText}>{(user.name || 'A')[0].toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.athleteName}>{user.name}</Text>
            <Text style={styles.athleteBadge}>Atleta FaciliGym</Text>
            <Text style={styles.athleteSub}>{user.email}</Text>
          </View>
        </View>

        <View style={styles.athleteStatsGrid}>
          <View style={styles.athleteStatBox}>
            <Text style={styles.athleteStatVal}>{attendance.length}</Text>
            <Text style={styles.athleteStatLabel}>Total Treinos</Text>
          </View>
          <View style={styles.athleteStatBox}>
            <Text style={styles.athleteStatVal}>{streak} dias</Text>
            <Text style={styles.athleteStatLabel}>Sequência Atual</Text>
          </View>
          <View style={styles.athleteStatBox}>
            <Text style={styles.athleteStatVal}>{user.current_weight} kg</Text>
            <Text style={styles.athleteStatLabel}>Peso Atual</Text>
          </View>
          <View style={styles.athleteStatBox}>
            <Text style={styles.athleteStatVal}>{user.target_weight} kg</Text>
            <Text style={styles.athleteStatLabel}>Meta de Peso</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.evolutionRedirectBtn}
          onPress={() => {
            hideModal();
            router.push('/progress');
          }}
        >
          <IconTrendingUp color="#fff" size={16} />
          <Text style={styles.settingsRedirectText}>Minha Evolução (Gráfico e Peso)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsRedirectBtn}
          onPress={() => {
            hideModal();
            router.push('/settings');
          }}
        >
          <IconGear color="#fff" size={16} />
          <Text style={styles.settingsRedirectText}>Gerenciar Conta e Preferências</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Build 7-day chart data
  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const str = d.toISOString().split('T')[0];
    const label = ['D','S','T','Q','Q','S','S'][d.getDay()];
    const trained = attendance.some(a => a.date === str);
    return {
      label,
      value: trained ? 85 : 20,
      active: trained
    };
  });

  const todayTrained = attendance.some(a => a.date === todayStr);
  const filterLabel: Record<Filter, string> = { month: 'Mensal', year: 'Anual', all: 'All Time' };
  const topInset = Math.max(insets.top + 8, 54);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ──────────────────────────────── */}
        <View style={[styles.header, { paddingTop: topInset }]}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.userName}>{user?.name || 'Atleta'}</Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={openAthleteCardModal}>
            <Text style={styles.avatarText}>{(user?.name || 'A')[0].toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Activity Stats Card (Red) ──────────── */}
        <View style={styles.activityCard}>
          <View style={styles.activityTop}>
            <Text style={styles.activityTitle}>Sua atividade</Text>
            <View style={styles.filterRow}>
              {(['month','year','all'] as Filter[]).map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                  onPress={() => setFilter(f)}
                >
                  <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                    {filterLabel[f]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <ActivityChart data={last7} />

          {/* Bottom stats row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{filtered.length}</Text>
              <Text style={styles.statLabel}>Treinos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{streak}</Text>
              <Text style={styles.statLabel}>Sequência (dias)</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{goalPct}%</Text>
              <Text style={styles.statLabel}>Meta Semanal</Text>
            </View>
          </View>
        </View>

        {/* ── Calendar Grid ────────────────────────── */}
        <View style={styles.calendarCard}>
          <Text style={styles.calendarTitle}>Seu histórico de treinos</Text>
          <Text style={styles.calendarSub}>Toque em um dia no calendário para registrar seu treino</Text>

          <CalendarView attendance={attendance} onSelectDate={(dateStr) => openLogModal(dateStr)} />

          <View style={styles.todayCheckInRow}>
            {todayTrained ? (
              <View style={styles.todayDoneCounterBox}>
                <IconCheck color="#fff" size={16} />
                <Text style={styles.todayDoneCounterText}>
                  Treino de hoje concluído ({currentWeekWorkouts}/{weeklyGoal} na semana)
                </Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.todayCheckInBtn} onPress={handleCheckInToday}>
                <Text style={styles.todayCheckInText}>Registrar Treino de Hoje</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Recent Workouts List ────────────────── */}
        <Text style={styles.recentSectionTitle}>Treinos Recentes</Text>
        {attendance.length === 0 ? (
          <View style={styles.emptyRecentCard}>
            <Text style={styles.emptyRecentText}>Nenhum treino registrado ainda. Faça seu primeiro check-in!</Text>
          </View>
        ) : (
          attendance.slice(0, 5).map(record => (
            <TouchableOpacity key={record.id} style={styles.recentCard} onPress={() => openLogModal(record.date, record.workout_type, record.notes)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.recentDate}>{formatDateBR(record.date, true)}</Text>
                <Text style={styles.recentType}>{record.workout_type}</Text>
                {record.notes ? <Text style={styles.recentNotes}>{record.notes}</Text> : null}
              </View>
              <View style={styles.recentBadge}>
                <Text style={styles.recentBadgeText}>Concluído</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.bgPage },
  scroll: { padding: Theme.spacing.md, paddingBottom: 110 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greeting: { fontSize: 13, color: Theme.colors.textSecondary },
  userName: { fontSize: 24, fontWeight: '900', color: Theme.colors.textPrimary, letterSpacing: -0.5 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.colors.redDim, borderWidth: 2, borderColor: Theme.colors.redBorder, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: Theme.colors.red },

  activityCard: { backgroundColor: Theme.colors.red, borderRadius: Theme.radius.lg, padding: Theme.spacing.md, marginBottom: Theme.spacing.lg, ...Theme.shadow.strong },
  activityTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activityTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },

  filterRow: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: Theme.radius.full, padding: 2 },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Theme.radius.full },
  filterBtnActive: { backgroundColor: '#fff' },
  filterText: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '700' },
  filterTextActive: { color: Theme.colors.red, fontWeight: '900' },

  statsRow: { flexDirection: 'row', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '900', color: '#fff' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'center' },

  calendarCard: { backgroundColor: Theme.colors.bg, borderRadius: Theme.radius.lg, padding: Theme.spacing.md, marginBottom: Theme.spacing.lg, ...Theme.shadow.card },
  calendarTitle: { fontSize: 16, fontWeight: '800', color: Theme.colors.textPrimary },
  calendarSub: { fontSize: 12, color: Theme.colors.textSecondary, marginTop: 2, marginBottom: 14 },

  todayCheckInRow: { marginTop: 14 },
  todayCheckInBtn: { backgroundColor: Theme.colors.red, borderRadius: Theme.radius.md, paddingVertical: 14, alignItems: 'center', ...Theme.shadow.card },
  todayCheckInText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  recentSectionTitle: { fontSize: 15, fontWeight: '800', color: Theme.colors.textPrimary, marginBottom: 10 },
  emptyRecentCard: { backgroundColor: Theme.colors.bg, padding: 20, borderRadius: Theme.radius.md, alignItems: 'center', ...Theme.shadow.card },
  emptyRecentText: { fontSize: 12, color: Theme.colors.textMuted, textAlign: 'center' },
  recentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.bg, padding: 14, borderRadius: Theme.radius.md, marginBottom: 8, ...Theme.shadow.card },
  recentDate: { fontSize: 11, fontWeight: '700', color: Theme.colors.textMuted },
  recentType: { fontSize: 14, fontWeight: '800', color: Theme.colors.textPrimary, marginTop: 2 },
  recentNotes: { fontSize: 11, color: Theme.colors.textSecondary, marginTop: 2 },
  recentBadge: { backgroundColor: Theme.colors.redDim, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Theme.radius.full },
  recentBadgeText: { fontSize: 10, fontWeight: '800', color: Theme.colors.red },

  modal: { padding: Theme.spacing.lg },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Theme.colors.textPrimary },
  modalDate: { fontSize: 12, color: Theme.colors.red, fontWeight: '700', marginBottom: 14 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: Theme.colors.textMuted, marginBottom: 6, marginTop: 10 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Theme.radius.full, backgroundColor: Theme.colors.bgInput },
  pillActive: { backgroundColor: Theme.colors.red },
  pillText: { fontSize: 12, color: Theme.colors.textSecondary, fontWeight: '600' },
  pillTextActive: { color: '#fff', fontWeight: '700' },
  createRoutineHint: { color: Theme.colors.red, fontSize: 12, fontWeight: '700', marginTop: 8 },
  textInput: { backgroundColor: Theme.colors.bgInput, color: Theme.colors.textPrimary, borderRadius: Theme.radius.sm, padding: 12, fontSize: 13, minHeight: 60 },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelText: { color: Theme.colors.textSecondary, fontWeight: '600' },
  saveBtn: { backgroundColor: Theme.colors.red, paddingHorizontal: 20, paddingVertical: 10, borderRadius: Theme.radius.sm },
  saveText: { color: '#fff', fontWeight: '800' },

  athleteModal: { padding: Theme.spacing.lg },
  athleteHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  largeAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Theme.colors.redDim, borderWidth: 2, borderColor: Theme.colors.redBorder, alignItems: 'center', justifyContent: 'center' },
  largeAvatarText: { fontSize: 24, fontWeight: '900', color: Theme.colors.red },
  athleteName: { fontSize: 18, fontWeight: '900', color: Theme.colors.textPrimary },
  athleteBadge: { fontSize: 11, fontWeight: '800', color: Theme.colors.red, marginTop: 1 },
  athleteSub: { fontSize: 11, color: Theme.colors.textMuted },

  athleteStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  athleteStatBox: { flex: 1, minWidth: '45%', backgroundColor: Theme.colors.bgInput, padding: 12, borderRadius: Theme.radius.sm, alignItems: 'center' },
  athleteStatVal: { fontSize: 18, fontWeight: '900', color: Theme.colors.textPrimary },
  athleteStatLabel: { fontSize: 10, color: Theme.colors.textMuted, fontWeight: '700', marginTop: 2 },

  todayDoneCounterBox: { backgroundColor: Theme.colors.redDim, borderWidth: 1, borderColor: Theme.colors.redBorder, borderRadius: Theme.radius.md, paddingVertical: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  todayDoneCounterText: { color: Theme.colors.red, fontSize: 13, fontWeight: '800' },

  settingsRedirectBtn: { backgroundColor: Theme.colors.red, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: Theme.radius.sm },
  evolutionRedirectBtn: { backgroundColor: Theme.colors.dark, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: Theme.radius.sm, marginBottom: 8 },
  settingsRedirectText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
