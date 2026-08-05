import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Switch, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../../constants/theme';
import { IconUser } from '../../components/Icons';
import { useAppModal } from '../../context/ModalContext';

const Divider = () => <View style={styles.divider} />;

function SettingRow({ label, sub, right }: { label: string; sub?: string; right: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      {right}
    </View>
  );
}

import { useRouter } from 'expo-router';
import { FaciliGymStorage } from '../../services/api';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showModal, hideModal } = useAppModal();

  const [name, setName]   = useState('Atleta FaciliGym');
  const [email, setEmail] = useState('atleta@faciligym.app');
  const [selectedUnit, setSelectedUnit] = useState('Métrico (kg, cm, km)');

  const [darkMode, setDarkMode]           = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [weeklyReport, setWeeklyReport]   = useState(false);

  React.useEffect(() => {
    FaciliGymStorage.getSession().then(user => {
      if (user) {
        setName(user.name);
        setEmail(user.email);
      }
    });
  }, []);

  const handleLogout = async () => {
    Alert.alert('Sair da conta', 'Deseja encerrar sua sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair', style: 'destructive', onPress: async () => {
          await FaciliGymStorage.logout();
          router.replace('/login');
        }
      }
    ]);
  };

  const openEditField = (field: 'name' | 'email') => {
    let tempVal = field === 'name' ? name : email;

    showModal(
      <View style={styles.editModal}>
        <Text style={styles.editTitle}>{field === 'name' ? 'Alterar nome' : 'Alterar e-mail'}</Text>
        <TextInput
          style={styles.editInput}
          defaultValue={tempVal}
          onChangeText={(v) => { tempVal = v; }}
          autoFocus
          keyboardType={field === 'email' ? 'email-address' : 'default'}
        />
        <View style={styles.editBtns}>
          <TouchableOpacity onPress={hideModal} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (tempVal.trim()) {
                if (field === 'name') setName(tempVal.trim());
                if (field === 'email') setEmail(tempVal.trim());
              }
              hideModal();
            }}
            style={styles.saveBtn}
          >
            <Text style={styles.saveText}>Salvar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const openUnitsModal = () => {
    const unitsOptions = [
      { label: 'Métrico (kg, cm, km)', desc: 'Sistema internacional padrão' },
      { label: 'Imperial (lbs, in, mi)', desc: 'Libras, polegadas e milhas' },
      { label: 'Personalizado (kg, mi)', desc: 'Quilos com distância em milhas' },
    ];

    showModal(
      <View style={styles.editModal}>
        <Text style={styles.editTitle}>Unidades Métricas</Text>

        <View style={{ gap: 8, marginVertical: 10 }}>
          {unitsOptions.map(opt => {
            const isSel = selectedUnit === opt.label;
            return (
              <TouchableOpacity
                key={opt.label}
                style={[styles.unitOption, isSel && styles.unitOptionSelected]}
                onPress={() => {
                  setSelectedUnit(opt.label);
                  hideModal();
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.unitLabel, isSel && styles.unitLabelSelected]}>{opt.label}</Text>
                  <Text style={styles.unitDesc}>{opt.desc}</Text>
                </View>
                {isSel && <View style={styles.selectedDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.editBtns}>
          <TouchableOpacity onPress={hideModal} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const RED = Theme.colors.red;
  const topInset = Math.max(insets.top + 8, 54);

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: topInset }]}>
        <Text style={styles.topTitle}>Configurações</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Profile block ─────────────── */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <IconUser color={Theme.colors.red} size={26} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{name}</Text>
            <Text style={styles.profileEmail}>{email}</Text>
          </View>
          <TouchableOpacity style={styles.editProfileBtn} onPress={() => openEditField('name')}>
            <Text style={styles.editProfileText}>Editar</Text>
          </TouchableOpacity>
        </View>

        {/* ── Evolução de Peso ──────────── */}
        <Text style={styles.sectionLabel}>EVOLUÇÃO</Text>
        <TouchableOpacity
          style={styles.evolutionCard}
          onPress={() => router.push('/progress')}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.evolutionTitle}>Minha Evolução</Text>
            <Text style={styles.evolutionSub}>Acompanhe seu gráfico de peso, histórico e progresso.</Text>
          </View>
          <View style={styles.chevron} />
        </TouchableOpacity>

        {/* ── Conta ────────────────────── */}
        <Text style={styles.sectionLabel}>CONTA</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => openEditField('name')}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Nome</Text>
              <Text style={styles.rowValue}>{name}</Text>
            </View>
            <View style={styles.chevron} />
          </TouchableOpacity>
          <Divider />
          <TouchableOpacity style={styles.row} onPress={() => openEditField('email')}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>E-mail</Text>
              <Text style={styles.rowValue}>{email}</Text>
            </View>
            <View style={styles.chevron} />
          </TouchableOpacity>
          <Divider />
          <TouchableOpacity style={styles.row} onPress={() => Alert.alert('Alterar senha', 'Link enviado para ' + email)}>
            <Text style={styles.rowLabel}>Alterar senha</Text>
            <View style={styles.chevron} />
          </TouchableOpacity>
        </View>

        {/* ── Aparência ────────────────── */}
        <Text style={styles.sectionLabel}>APARÊNCIA</Text>
        <View style={styles.card}>
          <SettingRow label="Modo escuro" sub="Interface escura" right={
            <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ false: '#E0E0E0', true: RED }} thumbColor="#fff" />
          } />
        </View>

        {/* ── Preferências ─────────────── */}
        <Text style={styles.sectionLabel}>PREFERÊNCIAS</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={openUnitsModal}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Unidades métricas</Text>
              <Text style={styles.rowSub}>{selectedUnit}</Text>
            </View>
            <View style={styles.chevron} />
          </TouchableOpacity>
          <Divider />
          <SettingRow label="Notificações" sub="Lembretes de treino" right={
            <Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: '#E0E0E0', true: RED }} thumbColor="#fff" />
          } />
          <Divider />
          <SettingRow label="Resumo semanal" sub="Relatório todo domingo" right={
            <Switch value={weeklyReport} onValueChange={setWeeklyReport} trackColor={{ false: '#E0E0E0', true: RED }} thumbColor="#fff" />
          } />
        </View>

        {/* ── Sobre ────────────────────── */}
        <Text style={styles.sectionLabel}>SOBRE</Text>
        <View style={styles.card}>
          <SettingRow label="Versão" sub="FaciliGym 1.0.0" right={
            <View style={styles.versionBadge}><Text style={styles.versionText}>Atual</Text></View>
          } />
          <Divider />
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowLabel}>Política de Privacidade</Text>
            <View style={styles.chevron} />
          </TouchableOpacity>
          <Divider />
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowLabel}>Termos de Uso</Text>
            <View style={styles.chevron} />
          </TouchableOpacity>
        </View>

        {/* ── Perigo ───────────────────── */}
        <Text style={styles.sectionLabel}>SESSÃO E PERIGO</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleLogout}>
            <Text style={[styles.rowLabel, { color: Theme.colors.red }]}>Sair da conta</Text>
            <View style={styles.chevron} />
          </TouchableOpacity>
          <Divider />
          <TouchableOpacity style={styles.row} onPress={() =>
            Alert.alert('Apagar dados?', 'Isso apagará todos os registros.', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Apagar', style: 'destructive', onPress: () => {} },
            ])
          }>
            <Text style={[styles.rowLabel, { color: Theme.colors.textMuted }]}>Apagar todos os dados</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.bgPage },
  topBar: { backgroundColor: Theme.colors.bg, paddingHorizontal: Theme.spacing.md, paddingBottom: 14, ...Theme.shadow.card },
  topTitle: { fontSize: 24, fontWeight: '800', color: Theme.colors.textPrimary, letterSpacing: -0.5 },
  scroll: { padding: Theme.spacing.md, paddingBottom: 110 },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Theme.colors.bg, borderRadius: Theme.radius.lg,
    padding: Theme.spacing.md, marginBottom: Theme.spacing.lg,
    ...Theme.shadow.card,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Theme.colors.redDim, borderWidth: 2, borderColor: Theme.colors.redBorder, alignItems: 'center', justifyContent: 'center' },
  profileName: { fontSize: 17, fontWeight: '800', color: Theme.colors.textPrimary },
  profileEmail: { fontSize: 12, color: Theme.colors.textSecondary, marginTop: 2 },
  editProfileBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Theme.radius.full, backgroundColor: Theme.colors.redDim, borderWidth: 1, borderColor: Theme.colors.redBorder },
  editProfileText: { fontSize: 12, color: Theme.colors.red, fontWeight: '700' },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: Theme.colors.textMuted, letterSpacing: 1.2, marginBottom: 8, marginLeft: 2 },
  evolutionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.bg, borderRadius: Theme.radius.lg, padding: Theme.spacing.md, marginBottom: Theme.spacing.lg, ...Theme.shadow.card },
  evolutionTitle: { fontSize: 15, fontWeight: '800', color: Theme.colors.textPrimary },
  evolutionSub: { fontSize: 11, color: Theme.colors.textMuted, marginTop: 2 },
  card: { backgroundColor: Theme.colors.bg, borderRadius: Theme.radius.lg, marginBottom: Theme.spacing.lg, overflow: 'hidden', ...Theme.shadow.card },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Theme.spacing.md, paddingVertical: 14 },
  rowLabel: { fontSize: 14, fontWeight: '600', color: Theme.colors.textPrimary },
  rowSub: { fontSize: 11, color: Theme.colors.textMuted, marginTop: 2 },
  rowValue: { fontSize: 12, color: Theme.colors.red, marginTop: 2 },
  divider: { height: 1, backgroundColor: Theme.colors.border, marginHorizontal: Theme.spacing.md },
  chevron: { width: 7, height: 7, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: Theme.colors.textMuted, transform: [{ rotate: '45deg' }] },
  versionBadge: { backgroundColor: Theme.colors.redDim, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Theme.radius.full },
  versionText: { fontSize: 11, color: Theme.colors.red, fontWeight: '700' },

  editModal: { backgroundColor: Theme.colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Theme.spacing.lg, borderTopWidth: 1, borderColor: Theme.colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 20 },
  editTitle: { fontSize: 18, fontWeight: '800', color: Theme.colors.textPrimary, marginBottom: 14 },
  editInput: { backgroundColor: Theme.colors.bgInput, color: Theme.colors.textPrimary, borderRadius: Theme.radius.sm, padding: 12, fontSize: 15, marginBottom: 16, borderWidth: 2, borderColor: Theme.colors.red },
  editBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 12 },
  cancelText: { color: Theme.colors.textSecondary, fontWeight: '600' },
  saveBtn: { backgroundColor: Theme.colors.red, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Theme.radius.sm },
  saveText: { color: '#fff', fontWeight: '800' },

  unitOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.bgInput, padding: 14, borderRadius: Theme.radius.sm, borderWidth: 1, borderColor: 'transparent' },
  unitOptionSelected: { backgroundColor: Theme.colors.redDim, borderColor: Theme.colors.redBorder },
  unitLabel: { fontSize: 14, fontWeight: '700', color: Theme.colors.textPrimary },
  unitLabelSelected: { color: Theme.colors.red },
  unitDesc: { fontSize: 11, color: Theme.colors.textMuted, marginTop: 2 },
  selectedDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Theme.colors.red },
});
