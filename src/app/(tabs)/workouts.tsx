import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../../constants/theme';
import { FaciliGymStorage, WorkoutRoutine, Exercise } from '../../services/api';
import { IconPlus, IconEdit, IconTrash, IconCheck } from '../../components/Icons';
import { useAppModal } from '../../context/ModalContext';

// ── Exercise inline form ─────────────────────────────────
function ExerciseForm({ onSave, onCancel, initial }: {
  onSave: (ex: Partial<Exercise>) => void;
  onCancel: () => void;
  initial?: Partial<Exercise>;
}) {
  const [name, setName]     = useState(initial?.name ?? '');
  const [sets, setSets]     = useState(String(initial?.sets ?? 4));
  const [reps, setReps]     = useState(initial?.reps ?? '10-12');
  const [weight, setWeight] = useState(String(initial?.weight_kg ?? 0));
  const [rest, setRest]     = useState(String(initial?.rest_seconds ?? 60));

  return (
    <View style={exStyles.card}>
      <TextInput
        style={exStyles.nameInput}
        placeholder="Nome do exercício"
        placeholderTextColor={Theme.colors.textMuted}
        value={name}
        onChangeText={setName}
      />
      <View style={exStyles.row}>
        {[
          { label: 'Séries', val: sets, set: setSets },
          { label: 'Reps', val: reps, set: setReps },
          { label: 'Kg', val: weight, set: setWeight },
          { label: 'Descanso (s)', val: rest, set: setRest },
        ].map(f => (
          <View key={f.label} style={{ flex: 1 }}>
            <Text style={exStyles.label}>{f.label}</Text>
            <TextInput style={exStyles.input} value={f.val} onChangeText={f.set} />
          </View>
        ))}
      </View>
      <View style={exStyles.btns}>
        <TouchableOpacity onPress={onCancel} style={exStyles.cancelBtn}>
          <Text style={exStyles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={exStyles.saveBtn}
          onPress={() => onSave({ name, sets: parseInt(sets)||4, reps, weight_kg: parseFloat(weight)||0, rest_seconds: parseInt(rest)||60 })}
        >
          <Text style={exStyles.saveText}>Salvar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const exStyles = StyleSheet.create({
  card: { backgroundColor: Theme.colors.bgPage, borderRadius: Theme.radius.md, padding: Theme.spacing.md, marginBottom: 8, borderWidth: 2, borderColor: Theme.colors.red },
  nameInput: { color: Theme.colors.textPrimary, fontSize: 15, fontWeight: '600', borderBottomWidth: 1, borderBottomColor: Theme.colors.border, paddingBottom: 8, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  label: { fontSize: 10, color: Theme.colors.textMuted, fontWeight: '700', marginBottom: 4 },
  input: { backgroundColor: Theme.colors.bg, color: Theme.colors.textPrimary, borderRadius: 8, padding: 8, fontSize: 13, borderWidth: 1, borderColor: Theme.colors.border },
  btns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  cancelText: { color: Theme.colors.textSecondary, fontWeight: '600', fontSize: 13 },
  saveBtn: { backgroundColor: Theme.colors.red, paddingHorizontal: 18, paddingVertical: 8, borderRadius: Theme.radius.sm },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});

// ── Main Screen ──────────────────────────────────────────
export default function WorkoutsScreen() {
  const insets = useSafeAreaInsets();
  const { showModal, hideModal } = useAppModal();

  const [routines, setRoutines]       = useState<WorkoutRoutine[]>([]);
  const [activeId, setActiveId]       = useState<string|null>(null);
  const [addingEx, setAddingEx]       = useState(false);
  const [editingExId, setEditingExId] = useState<string|null>(null);
  const [activeMode, setActiveMode]   = useState(false);
  const [completed, setCompleted]     = useState<Record<string, boolean[]>>({});
  const [timerSec, setTimerSec]       = useState(0);
  const [timerOn, setTimerOn]         = useState(false);

  useEffect(() => { load(); }, []);
  useEffect(() => {
    let t: any;
    if (timerOn) t = setInterval(() => setTimerSec(s => s+1), 1000);
    return () => clearInterval(t);
  }, [timerOn]);

  const load = async () => {
    const data = await FaciliGymStorage.getRoutines();
    setRoutines(data);
    if (data.length && !activeId) setActiveId(data[0].id);
  };

  const activeRoutine = routines.find(r => r.id === activeId) ?? null;
  const fmt = (s: number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const toggleSet = (exId: string, idx: number) => {
    setCompleted(prev => {
      const arr = [...(prev[exId]??[])];
      arr[idx] = !arr[idx];
      return { ...prev, [exId]: arr };
    });
  };

  const handleSaveEx = async (data: Partial<Exercise>) => {
    if (!activeRoutine) return;
    const exercises = editingExId
      ? activeRoutine.exercises.map(e => e.id === editingExId ? { ...e, ...data } : e)
      : [...activeRoutine.exercises, { id: String(Date.now()), ...data } as Exercise];
    const updated = { ...activeRoutine, exercises };
    const all = await FaciliGymStorage.saveRoutine(updated);
    setRoutines(all); setAddingEx(false); setEditingExId(null);
  };

  const handleDeleteEx = async (exId: string) => {
    if (!activeRoutine) return;
    Alert.alert('Remover?', '', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        const updated = { ...activeRoutine, exercises: activeRoutine.exercises.filter(e => e.id !== exId) };
        setRoutines(await FaciliGymStorage.saveRoutine(updated));
      }}
    ]);
  };

  const handleDeleteRoutine = async (id: string) => {
    Alert.alert('Remover ficha?', '', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        const all = await FaciliGymStorage.deleteRoutine(id);
        setRoutines(all); setActiveId(all[0]?.id ?? null);
      }}
    ]);
  };

  const handleSaveRoutine = async (editingRoutine: WorkoutRoutine | null, rName: string, rCat: string, rDesc: string) => {
    if (!rName.trim()) return;
    const routine: WorkoutRoutine = { id: editingRoutine?.id ?? String(Date.now()), title: rName.trim(), category: rCat, description: rDesc, exercises: editingRoutine?.exercises ?? [] };
    const all = await FaciliGymStorage.saveRoutine(routine);
    setRoutines(all); setActiveId(routine.id); hideModal();
  };

  const openRoutineModal = (r?: WorkoutRoutine) => {
    let nameVal = r?.title ?? '';
    let catVal  = r?.category ?? 'Musculação';
    let descVal = r?.description ?? '';

    showModal(
      <View style={styles.modal}>
        <Text style={styles.modalTitle}>{r ? 'Editar Ficha' : 'Nova Ficha'}</Text>
        <Text style={styles.inputLabel}>Nome</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Treino A – Peito e Tríceps"
          placeholderTextColor={Theme.colors.textMuted}
          defaultValue={nameVal}
          onChangeText={(v) => { nameVal = v; }}
        />
        <Text style={styles.inputLabel}>Categoria</Text>
        <View style={styles.pills}>
          {['Musculação','Cardio','Funcional','Calistenia'].map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.pill, catVal === c && styles.pillActive]}
              onPress={() => {
                catVal = c;
                openRoutineModal(r ? { ...r, title: nameVal, category: catVal, description: descVal } : { id: '', title: nameVal, category: catVal, description: descVal, exercises: [] });
              }}
            >
              <Text style={[styles.pillText, catVal === c && styles.pillTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.inputLabel}>Descrição (opcional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Foco e observações"
          placeholderTextColor={Theme.colors.textMuted}
          defaultValue={descVal}
          onChangeText={(v) => { descVal = v; }}
        />
        <View style={styles.modalBtns}>
          <TouchableOpacity style={styles.cancelBtn} onPress={hideModal}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => handleSaveRoutine(r ?? null, nameVal, catVal, descVal)}
          >
            <Text style={styles.saveText}>Salvar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleFinish = async () => {
    setTimerOn(false); setActiveMode(false);
    if (!activeRoutine) return;
    await FaciliGymStorage.addAttendance({ date: new Date().toISOString().split('T')[0], workout_type: activeRoutine.title, notes: `Concluído em ${fmt(timerSec)}` });
    Alert.alert('Treino concluído!', `${activeRoutine.title} — ${fmt(timerSec)}`);
  };

  const totalSets = activeRoutine?.exercises.reduce((a,e) => a+e.sets, 0) ?? 0;
  const doneSets = Object.values(completed).reduce((a,arr) => a + arr.filter(Boolean).length, 0);
  const progress = totalSets ? Math.round((doneSets/totalSets)*100) : 0;

  const topInset = Math.max(insets.top + 8, 54);

  return (
    <View style={styles.container}>
      {/* ── Top header ──────────────────────────── */}
      <View style={[styles.topBar, { paddingTop: topInset }]}>
        <View>
          <Text style={styles.topTitle}>Treinos</Text>
          <Text style={styles.topSub}>Fichas e exercícios</Text>
        </View>
        <TouchableOpacity style={styles.addRoutineBtn} onPress={() => openRoutineModal()}>
          <IconPlus color="#fff" size={14} />
          <Text style={styles.addRoutineText}>Nova ficha</Text>
        </TouchableOpacity>
      </View>

      {/* ── Routine Tab Scroll ───────────────────── */}
      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {routines.map(r => (
            <TouchableOpacity
              key={r.id}
              style={[styles.routineTab, activeId===r.id && styles.routineTabActive]}
              onPress={() => setActiveId(r.id)}
            >
              <Text style={[styles.routineTabText, activeId===r.id && styles.routineTabTextActive]}>
                {r.title.split(' - ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {activeRoutine ? (
          <>
            {/* ── Hero card ─────────────────────── */}
            <View style={styles.heroCard}>
              {/* Dark left stripe with title */}
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>{activeRoutine.title}</Text>
                <View style={[styles.catTag, { backgroundColor: Theme.colors.redDim }]}>
                  <Text style={[styles.catTagText, { color: Theme.colors.red }]}>{activeRoutine.category}</Text>
                </View>
                {activeRoutine.description ? <Text style={styles.heroDesc}>{activeRoutine.description}</Text> : null}
              </View>

              {/* Stats row */}
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatVal}>{activeRoutine.exercises.length}</Text>
                  <Text style={styles.heroStatLabel}>exercícios</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatVal}>{totalSets}</Text>
                  <Text style={styles.heroStatLabel}>séries</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatVal}>{progress}%</Text>
                  <Text style={styles.heroStatLabel}>concluído</Text>
                </View>
              </View>

              {/* Progress bar */}
              {activeMode && (
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
                </View>
              )}
            </View>

            {/* ── CTA ─────────────────────────── */}
            {activeMode ? (
              <View style={styles.timerCard}>
                <View style={styles.timerDot} />
                <Text style={styles.timerText}>{fmt(timerSec)}</Text>
                <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
                  <Text style={styles.finishText}>Finalizar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.startBtn}
                onPress={() => { setActiveMode(true); setTimerSec(0); setTimerOn(true); setCompleted({}); }}
              >
                <Text style={styles.startText}>Iniciar treino</Text>
              </TouchableOpacity>
            )}

            {/* ── Routine actions ─────────────── */}
            <View style={styles.routineActionsRow}>
              <TouchableOpacity style={styles.routineActionBtn} onPress={() => openRoutineModal(activeRoutine)}>
                <IconEdit color={Theme.colors.textSecondary} size={14} />
                <Text style={styles.routineActionText}>Editar ficha</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.routineActionBtn, styles.routineDeleteBtn]} onPress={() => handleDeleteRoutine(activeRoutine.id)}>
                <IconTrash color={Theme.colors.red} size={14} />
                <Text style={[styles.routineActionText, { color: Theme.colors.red }]}>Remover</Text>
              </TouchableOpacity>
            </View>

            {/* ── Exercises ───────────────────── */}
            <View style={styles.exHeader}>
              <Text style={styles.sectionTitle}>Exercícios ({activeRoutine.exercises.length})</Text>
              <TouchableOpacity style={styles.addExBtn} onPress={() => { setAddingEx(true); setEditingExId(null); }}>
                <IconPlus color={Theme.colors.red} size={12} />
                <Text style={styles.addExText}>Adicionar</Text>
              </TouchableOpacity>
            </View>

            {addingEx && !editingExId && (
              <ExerciseForm onSave={handleSaveEx} onCancel={() => setAddingEx(false)} />
            )}

            {activeRoutine.exercises.map((ex, idx) => (
              <View key={ex.id}>
                {editingExId === ex.id ? (
                  <ExerciseForm initial={ex} onSave={handleSaveEx} onCancel={() => setEditingExId(null)} />
                ) : (
                  <View style={styles.exCard}>
                    <View style={styles.exNum}>
                      <Text style={styles.exNumText}>{idx+1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.exName}>{ex.name}</Text>
                      <Text style={styles.exMeta}>{ex.sets} séries · {ex.reps} reps · {ex.weight_kg}kg · {ex.rest_seconds??60}s</Text>
                      <View style={styles.setsRow}>
                        {Array.from({ length: ex.sets }).map((_, si) => {
                          const done = completed[ex.id]?.[si];
                          return (
                            <TouchableOpacity
                              key={si}
                              style={[styles.setBox, done && styles.setBoxDone]}
                              onPress={() => toggleSet(ex.id, si)}
                            >
                              {done && <IconCheck color="#fff" size={10} />}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                    <View style={styles.exActions}>
                      <TouchableOpacity onPress={() => { setEditingExId(ex.id); setAddingEx(false); }}>
                        <IconEdit color={Theme.colors.textMuted} size={14} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteEx(ex.id)}>
                        <IconTrash color={Theme.colors.red} size={14} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ))}

            {activeRoutine.exercises.length === 0 && (
              <Text style={styles.emptyText}>Nenhum exercício. Toque em "Adicionar" acima.</Text>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Vamos montar seu primeiro treino!</Text>
            <Text style={styles.emptyText}>Crie suas fichas personalizadas com exercícios, séries e cargas.</Text>
            <TouchableOpacity style={styles.emptyStartBtn} onPress={() => openRoutineModal()}>
              <IconPlus color="#fff" size={16} />
              <Text style={styles.emptyStartText}>Criar Primeira Ficha</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.bgPage },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Theme.colors.bg,
    paddingHorizontal: Theme.spacing.md, paddingTop: 16, paddingBottom: 14,
    ...Theme.shadow.card,
  },
  topTitle: { fontSize: 24, fontWeight: '800', color: Theme.colors.textPrimary, letterSpacing: -0.5 },
  topSub: { fontSize: 12, color: Theme.colors.textSecondary, marginTop: 1 },
  addRoutineBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Theme.colors.red, paddingHorizontal: 14, paddingVertical: 9, borderRadius: Theme.radius.full, ...Theme.shadow.card },
  addRoutineText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  tabsWrap: { backgroundColor: Theme.colors.bg, paddingHorizontal: Theme.spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  routineTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Theme.radius.full, backgroundColor: Theme.colors.bgInput, marginRight: 8 },
  routineTabActive: { backgroundColor: Theme.colors.dark },
  routineTabText: { fontSize: 12, color: Theme.colors.textSecondary, fontWeight: '600' },
  routineTabTextActive: { color: '#fff', fontWeight: '800' },

  scroll: { padding: Theme.spacing.md, paddingBottom: 110 },

  heroCard: {
    backgroundColor: Theme.colors.bg,
    borderRadius: Theme.radius.lg,
    overflow: 'hidden',
    marginBottom: 12,
    ...Theme.shadow.card,
  },
  heroContent: { padding: Theme.spacing.md },
  heroTitle: { fontSize: 20, fontWeight: '800', color: Theme.colors.textPrimary },
  catTag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Theme.radius.full, marginTop: 4 },
  catTagText: { fontSize: 11, fontWeight: '700' },
  heroDesc: { fontSize: 12, color: Theme.colors.textSecondary, marginTop: 6 },
  heroStats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Theme.colors.border, paddingVertical: 12 },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatVal: { fontSize: 18, fontWeight: '900', color: Theme.colors.textPrimary },
  heroStatLabel: { fontSize: 10, color: Theme.colors.textSecondary, fontWeight: '600', marginTop: 1 },
  heroStatDivider: { width: 1, height: 28, backgroundColor: Theme.colors.border, alignSelf: 'center' },
  progressTrack: { height: 4, backgroundColor: Theme.colors.bgInput, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Theme.colors.red },

  startBtn: { backgroundColor: Theme.colors.red, paddingVertical: 16, borderRadius: Theme.radius.lg, alignItems: 'center', marginBottom: 12, ...Theme.shadow.strong },
  startText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 0.3 },

  timerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.bg, borderRadius: Theme.radius.lg, padding: 14, marginBottom: 12, gap: 12, ...Theme.shadow.card },
  timerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Theme.colors.red },
  timerText: { fontSize: 24, fontWeight: '900', color: Theme.colors.textPrimary, flex: 1 },
  finishBtn: { backgroundColor: Theme.colors.dark, paddingHorizontal: 18, paddingVertical: 9, borderRadius: Theme.radius.sm },
  finishText: { color: '#fff', fontWeight: '800' },

  routineActionsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  routineActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Theme.colors.bg, borderRadius: Theme.radius.sm, paddingVertical: 10, ...Theme.shadow.card },
  routineDeleteBtn: { },
  routineActionText: { fontSize: 12, color: Theme.colors.textSecondary, fontWeight: '600' },

  exHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Theme.colors.textPrimary },
  addExBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Theme.colors.redDim, borderWidth: 1, borderColor: Theme.colors.redBorder, paddingHorizontal: 12, paddingVertical: 7, borderRadius: Theme.radius.full },
  addExText: { fontSize: 12, color: Theme.colors.red, fontWeight: '700' },

  exCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Theme.colors.bg, borderRadius: Theme.radius.md, padding: Theme.spacing.md, marginBottom: 8, gap: 10, ...Theme.shadow.card },
  exNum: { width: 28, height: 28, borderRadius: 8, backgroundColor: Theme.colors.bgInput, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  exNumText: { fontSize: 12, fontWeight: '700', color: Theme.colors.textSecondary },
  exName: { fontSize: 14, fontWeight: '700', color: Theme.colors.textPrimary },
  exMeta: { fontSize: 11, color: Theme.colors.textMuted, marginTop: 2 },
  setsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 8 },
  setBox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: Theme.colors.border, backgroundColor: Theme.colors.bgInput, alignItems: 'center', justifyContent: 'center' },
  setBoxDone: { backgroundColor: Theme.colors.red, borderColor: Theme.colors.red },
  exActions: { gap: 8, marginTop: 2 },

  emptyState: { paddingTop: 40, alignItems: 'center', gap: 8, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: Theme.colors.textPrimary, textAlign: 'center' },
  emptyText: { fontSize: 13, color: Theme.colors.textMuted, textAlign: 'center', marginBottom: 12 },
  emptyStartBtn: { backgroundColor: Theme.colors.red, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 22, paddingVertical: 12, borderRadius: Theme.radius.full },
  emptyStartText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: Theme.colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Theme.spacing.lg },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Theme.colors.textPrimary, marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: Theme.colors.textSecondary, marginBottom: 6 },
  textInput: { backgroundColor: Theme.colors.bgInput, color: Theme.colors.textPrimary, borderRadius: Theme.radius.sm, padding: 12, fontSize: 13, marginBottom: 14 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  pill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Theme.radius.full, backgroundColor: Theme.colors.bgInput },
  pillActive: { backgroundColor: Theme.colors.red },
  pillText: { fontSize: 12, color: Theme.colors.textSecondary, fontWeight: '600' },
  pillTextActive: { color: '#fff', fontWeight: '700' },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 12 },
  cancelText: { color: Theme.colors.textSecondary, fontWeight: '600' },
  saveBtn: { backgroundColor: Theme.colors.red, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Theme.radius.sm },
  saveText: { color: '#fff', fontWeight: '800' },
});
