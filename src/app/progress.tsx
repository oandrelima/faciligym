import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../constants/theme';
import { FaciliGymStorage, UserProfile, WeightRecord, formatDateBR } from '../services/api';
import { IconPlus, IconTrash, IconTrendingUp } from '../components/Icons';
import { useAppModal } from '../context/ModalContext';

type Filter = 'month' | 'year' | 'all';

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { showModal, hideModal } = useAppModal();

  const [user, setUser]       = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<WeightRecord[]>([]);
  const [filter, setFilter]   = useState<Filter>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const u = await FaciliGymStorage.getSession();
    setUser(u);
    const records = await FaciliGymStorage.getWeightHistory(u?.id);
    setHistory(records);
  };

  const currentWeight = user?.current_weight || 80.0;
  const targetWeight  = user?.target_weight || 75.0;

  const diff = currentWeight - targetWeight;
  const diffText = diff > 0 ? `Faltam ${diff.toFixed(1)} kg para a meta` : diff < 0 ? `${Math.abs(diff).toFixed(1)} kg abaixo da meta` : 'Meta atingida!';

  const now = new Date();
  const filteredHistory = history.filter(h => {
    const d = new Date(h.date);
    if (filter === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    if (filter === 'year')  return d.getFullYear() === now.getFullYear();
    return true;
  });

  const sortedAsc = [...filteredHistory].sort((a, b) => a.date.localeCompare(b.date));
  const minWeight = sortedAsc.length ? Math.min(...sortedAsc.map(h => h.weight_kg)) - 1 : 60;
  const maxWeight = sortedAsc.length ? Math.max(...sortedAsc.map(h => h.weight_kg)) + 1 : 100;
  const range = Math.max(maxWeight - minWeight, 1);

  const openAddWeightModal = () => {
    let dateVal = new Date().toISOString().split('T')[0];
    let weightVal = String(currentWeight);
    let notesVal = '';

    showModal(
      <View style={styles.modal}>
        <Text style={styles.modalTitle}>Registrar Novo Peso</Text>

        <Text style={styles.inputLabel}>Data (AAAA-MM-DD)</Text>
        <TextInput
          style={styles.input}
          defaultValue={dateVal}
          onChangeText={(v) => { dateVal = v; }}
        />

        <Text style={styles.inputLabel}>Peso Atual (kg)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          defaultValue={weightVal}
          onChangeText={(v) => { weightVal = v; }}
        />

        <Text style={styles.inputLabel}>Observações (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Jejum matinal"
          placeholderTextColor={Theme.colors.textMuted}
          defaultValue={notesVal}
          onChangeText={(v) => { notesVal = v; }}
        />

        <View style={styles.modalBtns}>
          <TouchableOpacity style={styles.cancelBtn} onPress={hideModal}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={async () => {
              const w = parseFloat(weightVal);
              if (isNaN(w) || w <= 0) {
                Alert.alert('Atenção', 'Informe um peso válido.');
                return;
              }
              try {
                const updated = await FaciliGymStorage.addWeightRecord(dateVal, w, notesVal);
                setHistory(updated);
                setUser(await FaciliGymStorage.getSession());
                hideModal();
              } catch (err: any) {
                Alert.alert('Erro', err.message || 'Erro ao registrar peso.');
              }
            }}
          >
            <Text style={styles.saveText}>Salvar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleDelete = (id: string) => {
    Alert.alert('Remover registro?', '', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive', onPress: async () => {
          const updated = await FaciliGymStorage.deleteWeightRecord(id);
          setHistory(updated);
          setUser(await FaciliGymStorage.getSession());
        }
      }
    ]);
  };

  const openNewTargetModal = () => {
    let targetVal = String(targetWeight);

    showModal(
      <View style={styles.modal}>
        <Text style={styles.modalTitle}>Nova Meta de Peso</Text>
        <Text style={styles.modalSub}>Defina a sua nova meta de peso em kg.</Text>

        <Text style={styles.inputLabel}>Meta de Peso (kg)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          defaultValue={targetVal}
          onChangeText={(v) => { targetVal = v; }}
        />

        <View style={styles.modalBtns}>
          <TouchableOpacity style={styles.cancelBtn} onPress={hideModal}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={async () => {
              const tw = parseFloat(targetVal);
              if (isNaN(tw) || tw <= 0 || !user) {
                Alert.alert('Atenção', 'Informe uma meta de peso válida.');
                return;
              }
              try {
                await FaciliGymStorage.saveOnboarding(user.id, user.weekly_goal, user.current_weight, tw);
                setUser(await FaciliGymStorage.getSession());
                hideModal();
                Alert.alert('Meta atualizada!', `Sua nova meta é ${tw.toFixed(1)} kg.`);
              } catch (err: any) {
                Alert.alert('Erro', err.message || 'Erro ao atualizar meta.');
              }
            }}
          >
            <Text style={styles.saveText}>Salvar Meta</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const filterLabel: Record<Filter, string> = { month: 'Mensal', year: 'Anual', all: 'All Time' };
  const topInset = Math.max(insets.top + 8, 54);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.topBar, { paddingTop: topInset }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle}>Evolução</Text>
          <Text style={styles.topSub}>Histórico e métricas de peso</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity style={styles.targetBtn} onPress={openNewTargetModal}>
            <Text style={styles.targetBtnText}>Nova Meta</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={openAddWeightModal}>
            <IconPlus color="#fff" size={14} />
            <Text style={styles.addBtnText}>Novo peso</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Summary Card ──────────────────────────── */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>PESO ATUAL</Text>
              <Text style={styles.summaryVal}>{currentWeight.toFixed(1)} <Text style={styles.unit}>kg</Text></Text>
            </View>
            <TouchableOpacity style={{ alignItems: 'flex-end' }} onPress={openNewTargetModal}>
              <Text style={styles.summaryLabel}>META (toque p/ editar)</Text>
              <Text style={styles.summaryTarget}>{targetWeight.toFixed(1)} <Text style={styles.unit}>kg</Text></Text>
            </TouchableOpacity>
          </View>

          <View style={styles.diffBadge}>
            <Text style={styles.diffText}>{diffText}</Text>
          </View>
        </View>

        {/* ── Graphic Chart Header & Filters ───────── */}
        <View style={styles.chartHeaderRow}>
          <Text style={styles.sectionTitle}>Gráfico de Peso</Text>

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

        <View style={styles.chartCard}>
          {sortedAsc.length === 0 ? (
            <View style={styles.emptyChart}>
              <IconTrendingUp color={Theme.colors.textMuted} size={32} />
              <Text style={styles.emptyText}>Nenhum peso registrado no período.</Text>
            </View>
          ) : (
            <View style={styles.chartBody}>
              <View style={styles.lineGraphWrap}>
                {sortedAsc.slice(-7).map((item, idx) => {
                  const bottomPct = Math.min(85, Math.max(10, Math.round(((item.weight_kg - minWeight) / range) * 80)));
                  return (
                    <View key={item.id || idx} style={styles.pointCol}>
                      {/* Weight value above point */}
                      <Text style={styles.pointWeightVal}>{item.weight_kg.toFixed(1)}</Text>

                      <View style={styles.pointTrack}>
                        <View style={[styles.pointDot, { bottom: `${bottomPct}%` as any }]} />
                      </View>

                      {/* Readable formatted date (05 AGO) */}
                      <Text style={styles.pointDate}>{formatDateBR(item.date)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* ── History List ──────────────────────────── */}
        <Text style={styles.sectionTitle}>Histórico de Mediçōes</Text>
        {filteredHistory.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Clique em "+ Novo peso" para registrar sua medição.</Text>
          </View>
        ) : (
          filteredHistory.map(record => (
            <View key={record.id} style={styles.historyCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.recordDate}>{formatDateBR(record.date, true)}</Text>
                {record.notes ? <Text style={styles.recordNotes}>{record.notes}</Text> : null}
              </View>
              <Text style={styles.recordWeight}>{record.weight_kg.toFixed(1)} kg</Text>
              <TouchableOpacity onPress={() => handleDelete(record.id)} style={{ marginLeft: 12 }}>
                <IconTrash color={Theme.colors.red} size={16} />
              </TouchableOpacity>
            </View>
          ))
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.bgPage },
  topBar: { backgroundColor: Theme.colors.bg, paddingHorizontal: Theme.spacing.md, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', ...Theme.shadow.card },
  topTitle: { fontSize: 24, fontWeight: '800', color: Theme.colors.textPrimary, letterSpacing: -0.5 },
  topSub: { fontSize: 12, color: Theme.colors.textSecondary, marginTop: 1 },
  targetBtn: { backgroundColor: Theme.colors.bgInput, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: Theme.radius.full, borderWidth: 1, borderColor: Theme.colors.border },
  targetBtnText: { color: Theme.colors.textPrimary, fontSize: 12, fontWeight: '700' },
  addBtn: { backgroundColor: Theme.colors.red, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Theme.radius.full },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  scroll: { padding: Theme.spacing.md, paddingBottom: 110 },

  summaryCard: { backgroundColor: Theme.colors.bg, borderRadius: Theme.radius.lg, padding: Theme.spacing.md, marginBottom: Theme.spacing.lg, ...Theme.shadow.card },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 10, fontWeight: '800', color: Theme.colors.textMuted, letterSpacing: 1 },
  summaryVal: { fontSize: 32, fontWeight: '900', color: Theme.colors.textPrimary, marginTop: 2 },
  summaryTarget: { fontSize: 32, fontWeight: '900', color: Theme.colors.red, marginTop: 2 },
  unit: { fontSize: 14, fontWeight: '600', color: Theme.colors.textSecondary },

  diffBadge: { backgroundColor: Theme.colors.redDim, padding: 10, borderRadius: Theme.radius.md, alignItems: 'center', borderWidth: 1, borderColor: Theme.colors.redBorder },
  diffText: { fontSize: 13, fontWeight: '700', color: Theme.colors.red },

  chartHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Theme.colors.textPrimary },

  filterRow: { flexDirection: 'row', backgroundColor: Theme.colors.bgInput, borderRadius: Theme.radius.full, padding: 2 },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Theme.radius.full },
  filterBtnActive: { backgroundColor: Theme.colors.red },
  filterText: { fontSize: 10, color: Theme.colors.textMuted, fontWeight: '700' },
  filterTextActive: { color: '#fff', fontWeight: '900' },

  chartCard: { backgroundColor: Theme.colors.bg, borderRadius: Theme.radius.lg, padding: Theme.spacing.md, marginBottom: Theme.spacing.lg, ...Theme.shadow.card },
  emptyChart: { padding: 30, alignItems: 'center', gap: 10 },
  chartBody: { height: 160, paddingTop: 10 },

  lineGraphWrap: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' },
  pointCol: { alignItems: 'center', flex: 1 },
  pointWeightVal: { fontSize: 11, fontWeight: '900', color: Theme.colors.red, marginBottom: 4 },
  pointTrack: { width: '100%', height: 100, backgroundColor: Theme.colors.bgInput, borderRadius: 8, justifyContent: 'flex-end', alignItems: 'center', overflow: 'hidden' },
  pointDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Theme.colors.red, borderWidth: 2, borderColor: '#fff', position: 'absolute' },
  pointDate: { fontSize: 9, color: Theme.colors.textSecondary, marginTop: 6, fontWeight: '800' },

  historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.bg, padding: 14, borderRadius: Theme.radius.md, marginBottom: 8, ...Theme.shadow.card },
  recordDate: { fontSize: 14, fontWeight: '800', color: Theme.colors.textPrimary },
  recordNotes: { fontSize: 11, color: Theme.colors.textMuted, marginTop: 2 },
  recordWeight: { fontSize: 16, fontWeight: '900', color: Theme.colors.red },
  emptyCard: { backgroundColor: Theme.colors.bg, padding: 20, borderRadius: Theme.radius.md, alignItems: 'center', ...Theme.shadow.card },
  emptyText: { color: Theme.colors.textMuted, fontSize: 13, textAlign: 'center' },

  modal: { padding: Theme.spacing.lg },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Theme.colors.textPrimary },
  modalSub: { fontSize: 12, color: Theme.colors.textMuted, marginTop: 2, marginBottom: 12 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: Theme.colors.textMuted, marginBottom: 4, marginTop: 8 },
  input: { backgroundColor: Theme.colors.bgInput, color: Theme.colors.textPrimary, borderRadius: Theme.radius.sm, padding: 10, fontSize: 14, borderWidth: 1, borderColor: Theme.colors.border },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelText: { color: Theme.colors.textSecondary, fontWeight: '600' },
  saveBtn: { backgroundColor: Theme.colors.red, paddingHorizontal: 20, paddingVertical: 10, borderRadius: Theme.radius.sm },
  saveText: { color: '#fff', fontWeight: '800' },
});
