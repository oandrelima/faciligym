import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../constants/theme';
import { FaciliGymStorage, UserProfile } from '../services/api';
import { useAppModal } from '../context/ModalContext';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showModal, hideModal } = useAppModal();

  const [email, setEmail]       = useState('oandreluislima@gmail.com');
  const [password, setPassword] = useState('123456789');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Informe o e-mail e a senha.');
      return;
    }
    setLoading(true);
    try {
      const user = await FaciliGymStorage.login(email, password);
      setLoading(false);

      if (!user.onboarding_completed) {
        openOnboardingModal(user);
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Erro ao entrar', err.message || 'Credenciais inválidas.');
    }
  };

  const openOnboardingModal = (user: UserProfile) => {
    let weeklyGoal = 4;
    let currentW   = '80.0';
    let targetW    = '75.0';

    showModal(
      <View style={styles.modal}>
        <Text style={styles.modalBadge}>PRIMEIRO ACESSO</Text>
        <Text style={styles.modalTitle}>Bem-vindo ao FaciliGym!</Text>
        <Text style={styles.modalSub}>Defina suas metas para personalizarmos seu treino e evolução.</Text>

        <Text style={styles.inputLabel}>Meta de Treinos Semanais (dias)</Text>
        <View style={styles.goalRow}>
          {[1, 2, 3, 4, 5, 6, 7].map(d => (
            <TouchableOpacity
              key={d}
              style={[styles.goalPill, weeklyGoal === d && styles.goalPillActive]}
              onPress={() => {
                weeklyGoal = d;
                openOnboardingModal(user);
              }}
            >
              <Text style={[styles.goalText, weeklyGoal === d && styles.goalTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Peso Atual (kg)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              defaultValue={currentW}
              onChangeText={(v) => { currentW = v; }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Meta de Peso (kg)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              defaultValue={targetW}
              onChangeText={(v) => { targetW = v; }}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={async () => {
            const cw = parseFloat(currentW);
            const tw = parseFloat(targetW);
            if (isNaN(cw) || isNaN(tw) || cw <= 0 || tw <= 0) {
              Alert.alert('Atenção', 'Informe valores de peso válidos.');
              return;
            }
            try {
              await FaciliGymStorage.saveOnboarding(user.id, weeklyGoal, cw, tw);
              hideModal();
              router.replace('/(tabs)');
            } catch (err: any) {
              Alert.alert('Erro', err.message || 'Falha ao salvar onboarding.');
            }
          }}
        >
          <Text style={styles.saveText}>Salvar e Começar</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const topInset = Math.max(insets.top + 20, 60);

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>FACILIGYM</Text>
        </View>
        <Text style={styles.title}>Entrar na sua conta</Text>
        <Text style={styles.sub}>Acesse seu plano de treino, dieta e evolução</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.inputLabel}>E-mail</Text>
        <TextInput
          style={styles.input}
          placeholder="atleta@faciligym.app"
          placeholderTextColor={Theme.colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.inputLabel}>Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={Theme.colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginBtnText}>Entrar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.bgPage, padding: Theme.spacing.lg, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 28 },
  logoBadge: { backgroundColor: Theme.colors.red, paddingHorizontal: 16, paddingVertical: 6, borderRadius: Theme.radius.full, marginBottom: 12 },
  logoText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  title: { fontSize: 26, fontWeight: '900', color: Theme.colors.textPrimary, letterSpacing: -0.5 },
  sub: { fontSize: 13, color: Theme.colors.textSecondary, marginTop: 4, textAlign: 'center' },

  card: { backgroundColor: Theme.colors.bg, borderRadius: Theme.radius.lg, padding: Theme.spacing.lg, ...Theme.shadow.card },
  inputLabel: { fontSize: 11, fontWeight: '700', color: Theme.colors.textMuted, letterSpacing: 0.8, marginBottom: 6, marginTop: 8 },
  input: { backgroundColor: Theme.colors.bgInput, color: Theme.colors.textPrimary, borderRadius: Theme.radius.sm, padding: 12, fontSize: 14, borderWidth: 1, borderColor: Theme.colors.border, marginBottom: 8 },

  loginBtn: { backgroundColor: Theme.colors.red, borderRadius: Theme.radius.sm, paddingVertical: 14, alignItems: 'center', marginTop: 16, shadowColor: Theme.colors.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  loginBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  modal: { padding: Theme.spacing.lg },
  modalBadge: { fontSize: 10, fontWeight: '900', color: Theme.colors.red, letterSpacing: 1.5, marginBottom: 4 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Theme.colors.textPrimary },
  modalSub: { fontSize: 12, color: Theme.colors.textSecondary, marginTop: 4, marginBottom: 14 },
  goalRow: { flexDirection: 'row', gap: 6, marginVertical: 8 },
  goalPill: { flex: 1, height: 38, borderRadius: 10, backgroundColor: Theme.colors.bgInput, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Theme.colors.border },
  goalPillActive: { backgroundColor: Theme.colors.red, borderColor: Theme.colors.red },
  goalText: { fontSize: 14, fontWeight: '700', color: Theme.colors.textPrimary },
  goalTextActive: { color: '#fff' },

  saveBtn: { backgroundColor: Theme.colors.red, borderRadius: Theme.radius.sm, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '900' },
});
