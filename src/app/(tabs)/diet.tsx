import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MacroBar } from '../../components/MacroBar';
import { Theme } from '../../constants/theme';
import { FaciliGymStorage, MealItem, UserProfile } from '../../services/api';
import { IconPlus, IconTrash, IconLeaf } from '../../components/Icons';
import { useAppModal } from '../../context/ModalContext';

function CalorieRing({ current, target }: { current: number; target: number }) {
  const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  const size = 110;
  const thick = 10;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: size/2, borderWidth: thick, borderColor: Theme.colors.bgInput }} />
      <View style={{
        position: 'absolute', width: size, height: size, borderRadius: size/2, borderWidth: thick,
        borderColor: 'transparent',
        borderTopColor: Theme.colors.red,
        borderRightColor: pct > 25 ? Theme.colors.red : 'transparent',
        borderBottomColor: pct > 50 ? Theme.colors.redLight : 'transparent',
        borderLeftColor: pct > 75 ? Theme.colors.red : 'transparent',
        transform: [{ rotate: '-90deg' }],
      }} />
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: '900', color: Theme.colors.textPrimary }}>{current}</Text>
        <Text style={{ fontSize: 9, color: Theme.colors.red, fontWeight: '700' }}>/ {target} kcal</Text>
      </View>
    </View>
  );
}

export default function DietScreen() {
  const insets = useSafeAreaInsets();
  const { showModal, hideModal } = useAppModal();

  const [user, setUser]   = useState<UserProfile | null>(null);
  const [meals, setMeals] = useState<MealItem[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const u = await FaciliGymStorage.getSession();
    setUser(u);
    const m = await FaciliGymStorage.getMeals(u?.id);
    setMeals(m);
  };

  const goals = {
    calories: user?.diet_calories || 0,
    protein: user?.diet_protein_g || 0,
    carbs: user?.diet_carbs_g || 0,
    fats: user?.diet_fats_g || 0,
  };

  const totals = meals.reduce(
    (a, m) => ({ calories: a.calories+(m.calories||0), protein: a.protein+(m.protein_g||0), carbs: a.carbs+(m.carbs_g||0), fats: a.fats+(m.fats_g||0) }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const openConfigureDietModal = () => {
    let calVal  = String(goals.calories || 2000);
    let protVal = String(goals.protein || 150);
    let carbVal = String(goals.carbs || 200);
    let fatVal  = String(goals.fats || 50);

    showModal(
      <View style={styles.modal}>
        <Text style={styles.modalTitle}>Configurar Nova Dieta</Text>
        <Text style={styles.modalSub}>Defina suas metas diárias de calorias e macronutrientes.</Text>

        <Text style={styles.inputLabel}>Meta Calórica Diária (kcal)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          defaultValue={calVal}
          onChangeText={(v) => { calVal = v; }}
        />

        <View style={styles.formRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Proteínas (g)</Text>
            <TextInput style={styles.input} keyboardType="numeric" defaultValue={protVal} onChangeText={(v) => { protVal = v; }} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Carboidratos (g)</Text>
            <TextInput style={styles.input} keyboardType="numeric" defaultValue={carbVal} onChangeText={(v) => { carbVal = v; }} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Gorduras (g)</Text>
            <TextInput style={styles.input} keyboardType="numeric" defaultValue={fatVal} onChangeText={(v) => { fatVal = v; }} />
          </View>
        </View>

        <View style={styles.modalBtns}>
          <TouchableOpacity style={styles.cancelBtn} onPress={hideModal}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={async () => {
              const c = parseInt(calVal) || 0;
              const p = parseFloat(protVal) || 0;
              const cb = parseFloat(carbVal) || 0;
              const f = parseFloat(fatVal) || 0;
              if (c <= 0 || p <= 0) {
                Alert.alert('Atenção', 'Informe metas válidas de calorias e proteínas.');
                return;
              }
              if (!user) return;
              const updated = await FaciliGymStorage.saveDietGoals(user.id, c, p, cb, f);
              setUser(updated);
              hideModal();
            }}
          >
            <Text style={styles.saveText}>Salvar Metas</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleSaveMeal = async (n: string, timeStr: string, calStr: string, protStr: string, carbStr: string, fatStr: string, itemsStr: string) => {
    if (!n.trim()) return;
    const m: MealItem = {
      id: String(Date.now()),
      name: n.trim(),
      meal_time: timeStr,
      calories: parseInt(calStr)||0,
      protein_g: parseFloat(protStr)||0,
      carbs_g: parseFloat(carbStr)||0,
      fats_g: parseFloat(fatStr)||0,
      items: itemsStr ? itemsStr.split('\n').filter(Boolean) : ['—']
    };
    setMeals(await FaciliGymStorage.saveMeal(m));
    hideModal();
  };

  const openAddMealModal = () => {
    let nameVal = '';
    let timeVal = '08:00';
    let calVal  = '400';
    let protVal = '30';
    let carbVal = '40';
    let fatVal  = '10';
    let itemsVal = '';

    showModal(
      <View style={styles.modal}>
        <Text style={styles.modalTitle}>Nova Refeição</Text>
        <View style={styles.formRow}>
          <View style={{ flex: 2 }}>
            <Text style={styles.inputLabel}>Nome</Text>
            <TextInput
              style={styles.input}
              placeholder="Café da manhã"
              placeholderTextColor={Theme.colors.textMuted}
              defaultValue={nameVal}
              onChangeText={(v) => { nameVal = v; }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Horário</Text>
            <TextInput
              style={styles.input}
              defaultValue={timeVal}
              onChangeText={(v) => { timeVal = v; }}
            />
          </View>
        </View>
        <View style={styles.formRow}>
          {[
            { l:'Kcal', v:calVal, set:(v:string)=>{calVal=v;} },
            { l:'Prot', v:protVal, set:(v:string)=>{protVal=v;} },
            { l:'Carb', v:carbVal, set:(v:string)=>{carbVal=v;} },
            { l:'Gord', v:fatVal, set:(v:string)=>{fatVal=v;} }
          ].map(f => (
            <View key={f.l} style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>{f.l}</Text>
              <TextInput style={styles.input} keyboardType="numeric" defaultValue={f.v} onChangeText={f.set} />
            </View>
          ))}
        </View>
        <Text style={styles.inputLabel}>Alimentos (1 por linha)</Text>
        <TextInput
          style={[styles.input,{height:70,textAlignVertical:'top'}]}
          placeholder={'Ovos\nPão integral'}
          placeholderTextColor={Theme.colors.textMuted}
          multiline
          defaultValue={itemsVal}
          onChangeText={(v) => { itemsVal = v; }}
        />
        <View style={styles.modalBtns}>
          <TouchableOpacity style={styles.cancelBtn} onPress={hideModal}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => handleSaveMeal(nameVal, timeVal, calVal, protVal, carbVal, fatVal, itemsVal)}
          >
            <Text style={styles.saveText}>Salvar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const topInset = Math.max(insets.top + 8, 54);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.topBar, { paddingTop: topInset }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle}>Dieta</Text>
          <Text style={styles.topSub}>Plano nutricional</Text>
        </View>
        {(meals.length > 0 || user?.diet_configured) && (
          <TouchableOpacity style={styles.configureDietBtn} onPress={openConfigureDietModal}>
            <IconLeaf color="#fff" size={14} />
            <Text style={styles.configureDietText}>Editar Dieta</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Summary / Unconfigured state ───────── */}
        {!user?.diet_configured ? (
          <View style={styles.unconfiguredCard}>
            <IconLeaf color={Theme.colors.red} size={36} />
            <Text style={styles.unconfiguredTitle}>Configure sua Meta Nutricional</Text>
            <Text style={styles.unconfiguredText}>Defina suas metas diárias de Kcal e macronutrientes para acompanhar seu consumo diário do zero.</Text>
            <TouchableOpacity style={styles.startBtn} onPress={openConfigureDietModal}>
              <Text style={styles.startText}>+ Criar Dieta</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.summaryCard}>
            <View style={styles.ringRow}>
              <CalorieRing current={totals.calories} target={goals.calories} />
              <View style={styles.macroGrid}>
                {[
                  { label: 'Proteína', val: totals.protein, target: goals.protein, unit: 'g', color: Theme.colors.red },
                  { label: 'Carboidrato', val: totals.carbs, target: goals.carbs, unit: 'g', color: '#FF8C42' },
                  { label: 'Gordura', val: totals.fats, target: goals.fats, unit: 'g', color: '#666' },
                ].map(m => (
                  <View key={m.label} style={styles.macroChip}>
                    <Text style={[styles.macroVal, { color: m.color }]}>{Math.round(m.val)}<Text style={styles.macroUnit}>{m.unit}</Text></Text>
                    <Text style={styles.macroLabel}>{m.label}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.bars}>
              <MacroBar label="Proteínas" current={totals.protein} target={goals.protein} unit="g" color={Theme.colors.red} />
              <MacroBar label="Carboidratos" current={totals.carbs} target={goals.carbs} unit="g" color="#FF8C42" />
              <MacroBar label="Gorduras" current={totals.fats} target={goals.fats} unit="g" color="#999" />
            </View>
          </View>
        )}

        {/* ── Meals ────────────────────────────── */}
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Refeições de Hoje</Text>
          {meals.length > 0 && (
            <TouchableOpacity style={styles.addBtn} onPress={openAddMealModal}>
              <IconPlus color="#fff" size={12} />
              <Text style={styles.addBtnText}>Adicionar</Text>
            </TouchableOpacity>
          )}
        </View>

        {meals.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Vamos montar seu primeiro plano de dieta</Text>
            <Text style={styles.emptySubText}>Cadastre suas refeições diárias e acompanhe suas calorias e macronutrientes.</Text>
            <TouchableOpacity style={styles.startBtn} onPress={openAddMealModal}>
              <IconPlus color="#fff" size={16} />
              <Text style={styles.startText}>Adicionar Primeira Refeição</Text>
            </TouchableOpacity>
          </View>
        )}

        {meals.map(meal => (
          <View key={meal.id} style={styles.mealCard}>
            <View style={styles.mealTop}>
              <View style={styles.timeTag}>
                <Text style={styles.timeText}>{meal.meal_time}</Text>
              </View>
              <Text style={styles.mealName}>{meal.name}</Text>
              <Text style={styles.mealCal}>{meal.calories} kcal</Text>
              <TouchableOpacity onPress={async () => setMeals(await FaciliGymStorage.deleteMeal(meal.id))}>
                <IconTrash color={Theme.colors.red} size={14} />
              </TouchableOpacity>
            </View>
            <View style={styles.macroBadges}>
              {[
                { label: `P: ${meal.protein_g}g`, color: Theme.colors.red },
                { label: `C: ${meal.carbs_g}g`, color: '#FF8C42' },
                { label: `G: ${meal.fats_g}g`, color: '#999' },
              ].map(b => (
                <View key={b.label} style={[styles.badge, { backgroundColor: b.color + '18' }]}>
                  <Text style={[styles.badgeText, { color: b.color }]}>{b.label}</Text>
                </View>
              ))}
            </View>
            {meal.items.map((item, i) => <Text key={i} style={styles.itemText}>· {item}</Text>)}
            {/* mini red progress */}
            <View style={styles.mealProgress}>
              <View style={[styles.mealProgressFill, { width: `${Math.min(100, goals.calories > 0 ? Math.round((meal.calories/goals.calories)*100*meals.length) : 0)}%` as any }]} />
            </View>
          </View>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.bgPage },
  topBar: { backgroundColor: Theme.colors.bg, paddingHorizontal: Theme.spacing.md, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', ...Theme.shadow.card },
  topTitle: { fontSize: 24, fontWeight: '800', color: Theme.colors.textPrimary, letterSpacing: -0.5 },
  topSub: { fontSize: 12, color: Theme.colors.textSecondary, marginTop: 1 },
  configureDietBtn: { backgroundColor: Theme.colors.red, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Theme.radius.full },
  configureDietText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  scroll: { padding: Theme.spacing.md, paddingBottom: 110 },

  unconfiguredCard: { backgroundColor: Theme.colors.bg, borderRadius: Theme.radius.lg, padding: 24, alignItems: 'center', gap: 10, marginBottom: Theme.spacing.lg, ...Theme.shadow.card },
  unconfiguredTitle: { fontSize: 18, fontWeight: '900', color: Theme.colors.textPrimary, textAlign: 'center' },
  unconfiguredText: { fontSize: 13, color: Theme.colors.textMuted, textAlign: 'center' },

  summaryCard: { backgroundColor: Theme.colors.bg, borderRadius: Theme.radius.lg, padding: Theme.spacing.md, marginBottom: Theme.spacing.lg, ...Theme.shadow.card },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  macroGrid: { flex: 1, gap: 8 },
  macroChip: { backgroundColor: Theme.colors.bgInput, borderRadius: Theme.radius.sm, padding: 10 },
  macroVal: { fontSize: 17, fontWeight: '900' },
  macroUnit: { fontSize: 10, fontWeight: '400', color: Theme.colors.textSecondary },
  macroLabel: { fontSize: 10, color: Theme.colors.textMuted, marginTop: 1 },
  bars: { gap: 6 },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Theme.colors.textPrimary },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Theme.colors.red, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Theme.radius.full, ...Theme.shadow.card },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  emptyState: { paddingTop: 40, alignItems: 'center', gap: 8, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: Theme.colors.textPrimary, textAlign: 'center' },
  emptySubText: { fontSize: 13, color: Theme.colors.textMuted, textAlign: 'center', marginBottom: 12 },
  startBtn: { backgroundColor: Theme.colors.red, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 22, paddingVertical: 12, borderRadius: Theme.radius.full },
  startText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  mealCard: { backgroundColor: Theme.colors.bg, borderRadius: Theme.radius.md, padding: Theme.spacing.md, marginBottom: 10, ...Theme.shadow.card },
  mealTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  timeTag: { backgroundColor: Theme.colors.redDim, borderRadius: Theme.radius.xs, paddingHorizontal: 7, paddingVertical: 3 },
  timeText: { fontSize: 10, color: Theme.colors.red, fontWeight: '800' },
  mealName: { flex: 1, fontSize: 14, fontWeight: '700', color: Theme.colors.textPrimary },
  mealCal: { fontSize: 12, color: Theme.colors.textSecondary, fontWeight: '600' },
  macroBadges: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Theme.radius.xs },
  badgeText: { fontSize: 11, fontWeight: '700' },
  itemText: { fontSize: 12, color: Theme.colors.textMuted },
  mealProgress: { height: 3, backgroundColor: Theme.colors.bgInput, borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  mealProgressFill: { height: '100%', backgroundColor: Theme.colors.red, borderRadius: 2 },

  modal: { padding: Theme.spacing.lg },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Theme.colors.textPrimary },
  modalSub: { fontSize: 12, color: Theme.colors.textSecondary, marginBottom: 12, marginTop: 2 },
  formRow: { flexDirection: 'row', gap: 8 },
  inputLabel: { fontSize: 11, fontWeight: '600', color: Theme.colors.textSecondary, marginBottom: 4, marginTop: 6 },
  input: { backgroundColor: Theme.colors.bgInput, color: Theme.colors.textPrimary, borderRadius: Theme.radius.sm, padding: 10, fontSize: 13, marginBottom: 8 },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 12 },
  cancelText: { color: Theme.colors.textSecondary, fontWeight: '600' },
  saveBtn: { backgroundColor: Theme.colors.red, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Theme.radius.sm },
  saveText: { color: '#fff', fontWeight: '800' },
});
