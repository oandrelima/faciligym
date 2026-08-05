import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../../constants/theme';
import {
  FaciliGymStorage, UserProfile, AttendanceRecord,
  CommunityItem, CommunityMessage
} from '../../services/api';
import { IconPlus, IconMessage } from '../../components/Icons';
import { useAppModal } from '../../context/ModalContext';

type RankFilter = 'week' | 'month' | 'year';

interface CommunityMemberRank {
  name: string;
  count: number;
  isCurrentUser?: boolean;
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { showModal, hideModal } = useAppModal();
  const pageScrollRef = useRef<ScrollView>(null);
  const chatListRef = useRef<ScrollView>(null);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeCommunity, setActiveCommunity] = useState<CommunityItem | null>(null);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [rankFilter, setRankFilter] = useState<RankFilter>('week');
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [isRankingExpanded, setIsRankingExpanded] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => chatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const loadInitialData = async () => {
    const u = await FaciliGymStorage.getSession();
    setUser(u);
    if (u) {
      const att = await FaciliGymStorage.getAttendance(u.id);
      setAttendanceList(att);
    }
    const comm = await FaciliGymStorage.getActiveCommunity();
    if (comm) {
      setActiveCommunity(comm);
      const msgs = await FaciliGymStorage.getCommunityMessages(comm.id);
      setMessages(msgs);
      setTimeout(() => chatListRef.current?.scrollToEnd({ animated: true }), 200);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !user || !activeCommunity) return;
    const txt = inputText.trim();
    setInputText('');

    const updated = await FaciliGymStorage.sendCommunityMessage(
      activeCommunity.id,
      user.id,
      user.name,
      txt
    );

    setMessages(updated);
    setTimeout(() => chatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleLeaveCommunity = async () => {
    if (!activeCommunity) return;
    Alert.alert(
      'Sair da Comunidade',
      `Deseja realmente sair da comunidade "${activeCommunity.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair da Comunidade',
          style: 'destructive',
          onPress: async () => {
            await FaciliGymStorage.leaveCommunity();
            setActiveCommunity(null);
            setMessages([]);
          },
        },
      ]
    );
  };

  // Modal: Criar Comunidade (Nome + Senha)
  const openCreateCommunityModal = () => {
    let commName = '';
    let commPassword = '';

    showModal(
      <View style={styles.modal}>
        <Text style={styles.modalTitle}>Criar Comunidade</Text>
        <Text style={styles.modalSub}>Informe o nome e defina uma senha de acesso para sua comunidade.</Text>

        <Text style={styles.inputLabel}>Nome da Comunidade</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Treino dos Amigos"
          placeholderTextColor={Theme.colors.textMuted}
          defaultValue={commName}
          onChangeText={(v) => { commName = v; }}
        />

        <Text style={styles.inputLabel}>Senha de Acesso</Text>
        <TextInput
          style={styles.input}
          placeholder="Defina uma senha de acesso"
          placeholderTextColor={Theme.colors.textMuted}
          secureTextEntry
          defaultValue={commPassword}
          onChangeText={(v) => { commPassword = v; }}
        />

        <View style={styles.modalBtns}>
          <TouchableOpacity style={styles.cancelBtn} onPress={hideModal}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={async () => {
              const u = user || (await FaciliGymStorage.getSession());
              if (!commName.trim() || !commPassword.trim()) {
                Alert.alert('Atenção', 'Informe o nome e a senha da comunidade.');
                return;
              }
              const userId = u?.id || 'user-' + Date.now();

              try {
                const item = await FaciliGymStorage.createCommunity(
                  commName.trim(),
                  commPassword.trim(),
                  userId
                );

                setActiveCommunity(item);
                const msgs = await FaciliGymStorage.getCommunityMessages(item.id);
                setMessages(msgs);
                hideModal();
                Alert.alert('Comunidade Criada!', `Sua comunidade ${item.name} foi criada com sucesso.`);
              } catch (err: any) {
                Alert.alert('Erro ao criar comunidade', err.message || 'Falha ao salvar comunidade.');
              }
            }}
          >
            <Text style={styles.saveText}>Criar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Modal: Entrar na Comunidade (Nome + Senha)
  const openJoinCommunityModal = () => {
    let commName = '';
    let commPassword = '';

    showModal(
      <View style={styles.modal}>
        <Text style={styles.modalTitle}>Entrar na Comunidade</Text>
        <Text style={styles.modalSub}>Digite o nome exato e a senha da comunidade.</Text>

        <Text style={styles.inputLabel}>Nome da Comunidade</Text>
        <TextInput
          style={styles.input}
          placeholder="Nome da comunidade"
          placeholderTextColor={Theme.colors.textMuted}
          defaultValue={commName}
          onChangeText={(v) => { commName = v; }}
        />

        <Text style={styles.inputLabel}>Senha de Acesso</Text>
        <TextInput
          style={styles.input}
          placeholder="Senha de acesso"
          placeholderTextColor={Theme.colors.textMuted}
          secureTextEntry
          defaultValue={commPassword}
          onChangeText={(v) => { commPassword = v; }}
        />

        <View style={styles.modalBtns}>
          <TouchableOpacity style={styles.cancelBtn} onPress={hideModal}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={async () => {
              if (!commName.trim() || !commPassword.trim()) {
                Alert.alert('Atenção', 'Informe o nome e a senha da comunidade.');
                return;
              }
              try {
                const item = await FaciliGymStorage.joinCommunity(
                  commName.trim(),
                  commPassword.trim()
                );

                setActiveCommunity(item);
                const msgs = await FaciliGymStorage.getCommunityMessages(item.id);
                setMessages(msgs);
                hideModal();
                Alert.alert('Conectado!', `Você entrou na comunidade ${item.name}`);
              } catch (err: any) {
                Alert.alert('Erro ao entrar', err.message || 'Comunidade não encontrada ou senha incorreta.');
              }
            }}
          >
            <Text style={styles.saveText}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Compute leaderboard
  const now = new Date();
  const filteredAttendance = attendanceList.filter(a => {
    const d = new Date(a.date);
    if (rankFilter === 'week') {
      const diffTime = Math.abs(now.getTime() - d.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    if (rankFilter === 'month') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    if (rankFilter === 'year') {
      return d.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const currentUserCount = filteredAttendance.length;
  const membersList: CommunityMemberRank[] = user ? [
    { name: user.name, count: currentUserCount, isCurrentUser: true }
  ] : [];

  const sortedLeaderboard = membersList.sort((a, b) => b.count - a.count);
  const top1 = sortedLeaderboard.length > 0 ? sortedLeaderboard[0] : null;

  const filterLabel: Record<RankFilter, string> = { week: 'Semana', month: 'Mês', year: 'Ano' };
  const topInset = Math.max(insets.top + 8, 54);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.topBar, { paddingTop: topInset }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle}>
            {activeCommunity ? activeCommunity.name : 'Comunidade'}
          </Text>
          <Text style={styles.topSub}>
            {activeCommunity ? 'Comunidade e ranking' : 'Grupos, ranking e mensagens'}
          </Text>
        </View>

        {activeCommunity ? (
          <TouchableOpacity style={styles.commAvatarBtn} onPress={handleLeaveCommunity}>
            <Text style={styles.commAvatarText}>
              {(activeCommunity.name || 'C')[0].toUpperCase()}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.headerBtn} onPress={openCreateCommunityModal}>
            <IconPlus color="#fff" size={14} />
            <Text style={styles.headerBtnText}>Criar Comunidade</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} ref={pageScrollRef}>

        {/* ── Unconnected State (Empty) ───────────── */}
        {!activeCommunity ? (
          <View style={styles.emptyCard}>
            <IconMessage color={Theme.colors.red} size={36} />
            <Text style={styles.emptyTitle}>Nenhuma comunidade selecionada</Text>
            <Text style={styles.emptySubText}>Crie sua comunidade com Nome e Senha ou entre em uma existente com os dados de acesso.</Text>
            <View style={styles.emptyBtnsRow}>
              <TouchableOpacity style={styles.emptyBtnPrimary} onPress={openCreateCommunityModal}>
                <Text style={styles.emptyBtnPrimaryText}>Criar Comunidade</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.emptyBtnSecondary} onPress={openJoinCommunityModal}>
                <Text style={styles.emptyBtnSecondaryText}>Entrar na Comunidade</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* ── Top 1 Leader Banner & Expandable Ranking ───── */}
            <View style={styles.rankingContainer}>
              <TouchableOpacity
                style={styles.top1Banner}
                onPress={() => setIsRankingExpanded(!isRankingExpanded)}
                activeOpacity={0.8}
              >
                <View style={styles.top1Avatar}>
                  <Text style={styles.top1AvatarText}>{(top1?.name || 'A')[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.top1Badge}>Top 1 do Ranking</Text>
                  <Text style={styles.top1Name}>{top1?.name || 'Sem registros'}</Text>
                  <Text style={styles.top1Count}>{top1?.count || 0} treinos concluídos</Text>
                </View>
                <View style={styles.filterPillsRow}>
                  {(['week', 'month', 'year'] as RankFilter[]).map(f => (
                    <TouchableOpacity
                      key={f}
                      style={[styles.filterPill, rankFilter === f && styles.filterPillActive]}
                      onPress={(e) => {
                        e.stopPropagation();
                        setRankFilter(f);
                      }}
                    >
                      <Text style={[styles.filterPillText, rankFilter === f && styles.filterPillTextActive]}>
                        {filterLabel[f]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>

              {/* Expandable Full Ranking List */}
              {isRankingExpanded && (
                <View style={styles.expandedRankingBox}>
                  <Text style={styles.expandedTitle}>Ranking Completo ({filterLabel[rankFilter]})</Text>
                  {sortedLeaderboard.map((member, idx) => (
                    <View key={member.name} style={styles.rankRow}>
                      <Text style={styles.rankIndex}>{idx + 1}º</Text>
                      <Text style={styles.rankName}>{member.name} {member.isCurrentUser ? '(Você)' : ''}</Text>
                      <Text style={styles.rankCount}>{member.count} treinos</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* ── Fixed Height Chat Room with Auto-Scroll ──────── */}
            <View style={styles.chatCard}>
              <Text style={styles.chatHeaderTitle}>Chat da Comunidade</Text>

              <View style={styles.chatMessagesWrapper}>
                <ScrollView
                  ref={chatListRef}
                  style={styles.chatMessagesScroll}
                  contentContainerStyle={styles.chatMessagesContent}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                  onContentSizeChange={() => chatListRef.current?.scrollToEnd({ animated: true })}
                >
                  {messages.length === 0 ? (
                    <View style={styles.emptyChat}>
                      <Text style={styles.emptyChatText}>Nenhuma mensagem enviada ainda. Envie a primeira mensagem!</Text>
                    </View>
                  ) : (
                    messages.map(m => {
                      const isMe = m.senderId === user?.id;
                      return (
                        <View key={m.id} style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
                          <Text style={styles.msgSender}>{m.senderName}</Text>
                          <View style={[styles.msgBubble, isMe ? styles.msgBubbleRight : styles.msgBubbleLeft]}>
                            <Text style={[styles.msgText, isMe ? styles.msgTextRight : styles.msgTextLeft]}>{m.text}</Text>
                          </View>
                        </View>
                      );
                    })
                  )}
                </ScrollView>
              </View>

              {/* Send Input */}
              <View style={styles.chatInputRow}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Digite sua mensagem..."
                  placeholderTextColor={Theme.colors.textMuted}
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={handleSendMessage}
                />
                <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}>
                  <Text style={styles.sendBtnText}>Enviar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
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
  headerBtn: { backgroundColor: Theme.colors.red, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Theme.radius.full },
  headerBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  commAvatarBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: Theme.colors.red, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Theme.colors.redBorder },
  commAvatarText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  scroll: { padding: Theme.spacing.md, paddingBottom: 110 },

  emptyCard: { backgroundColor: Theme.colors.bg, borderRadius: Theme.radius.lg, padding: 24, alignItems: 'center', gap: 10, marginTop: 20, ...Theme.shadow.card },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: Theme.colors.textPrimary, textAlign: 'center' },
  emptySubText: { fontSize: 13, color: Theme.colors.textMuted, textAlign: 'center', marginBottom: 10 },
  emptyBtnsRow: { flexDirection: 'row', gap: 10 },
  emptyBtnPrimary: { backgroundColor: Theme.colors.red, paddingHorizontal: 18, paddingVertical: 10, borderRadius: Theme.radius.sm },
  emptyBtnPrimaryText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  emptyBtnSecondary: { backgroundColor: Theme.colors.bgInput, paddingHorizontal: 18, paddingVertical: 10, borderRadius: Theme.radius.sm, borderWidth: 1, borderColor: Theme.colors.border },
  emptyBtnSecondaryText: { color: Theme.colors.textPrimary, fontWeight: '700', fontSize: 13 },

  rankingContainer: { marginBottom: Theme.spacing.lg },
  top1Banner: { backgroundColor: Theme.colors.red, borderRadius: Theme.radius.lg, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, ...Theme.shadow.strong },
  top1Avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  top1AvatarText: { fontSize: 20, fontWeight: '900', color: Theme.colors.red },
  top1Badge: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5 },
  top1Name: { fontSize: 16, fontWeight: '900', color: '#fff' },
  top1Count: { fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },

  filterPillsRow: { flexDirection: 'column', gap: 4 },
  filterPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Theme.radius.full, backgroundColor: 'rgba(0,0,0,0.2)' },
  filterPillActive: { backgroundColor: '#fff' },
  filterPillText: { fontSize: 9, color: 'rgba(255,255,255,0.8)', fontWeight: '700' },
  filterPillTextActive: { color: Theme.colors.red, fontWeight: '900' },

  expandedRankingBox: { backgroundColor: Theme.colors.bg, borderBottomLeftRadius: Theme.radius.lg, borderBottomRightRadius: Theme.radius.lg, padding: 14, marginTop: -6, paddingTop: 16, ...Theme.shadow.card },
  expandedTitle: { fontSize: 13, fontWeight: '800', color: Theme.colors.textPrimary, marginBottom: 8 },
  rankRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  rankIndex: { fontSize: 13, fontWeight: '900', color: Theme.colors.red, width: 28 },
  rankName: { flex: 1, fontSize: 13, fontWeight: '700', color: Theme.colors.textPrimary },
  rankCount: { fontSize: 12, fontWeight: '800', color: Theme.colors.textSecondary },

  chatCard: { backgroundColor: Theme.colors.bg, borderRadius: Theme.radius.lg, padding: Theme.spacing.md, ...Theme.shadow.card },
  chatHeaderTitle: { fontSize: 14, fontWeight: '800', color: Theme.colors.textPrimary, marginBottom: 10 },
  chatMessagesWrapper: { height: 280, backgroundColor: Theme.colors.bgPage, borderRadius: Theme.radius.md, padding: 10, marginBottom: 4 },
  chatMessagesScroll: { flex: 1 },
  chatMessagesContent: { paddingBottom: 8 },
  emptyChat: { padding: 24, alignItems: 'center' },
  emptyChatText: { fontSize: 12, color: Theme.colors.textMuted, textAlign: 'center' },

  msgRow: { marginBottom: 10, maxWidth: '80%' },
  msgRowLeft: { alignSelf: 'flex-start' },
  msgRowRight: { alignSelf: 'flex-end' },
  msgSender: { fontSize: 10, fontWeight: '700', color: Theme.colors.textMuted, marginBottom: 2 },
  msgBubble: { padding: 10, borderRadius: Theme.radius.md },
  msgBubbleLeft: { backgroundColor: Theme.colors.bgInput },
  msgBubbleRight: { backgroundColor: Theme.colors.red },
  msgText: { fontSize: 13 },
  msgTextLeft: { color: Theme.colors.textPrimary },
  msgTextRight: { color: '#fff', fontWeight: '600' },

  chatInputRow: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Theme.colors.border },
  chatInput: { flex: 1, backgroundColor: Theme.colors.bgInput, borderRadius: Theme.radius.sm, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: Theme.colors.textPrimary },
  sendBtn: { backgroundColor: Theme.colors.red, paddingHorizontal: 16, paddingVertical: 8, borderRadius: Theme.radius.sm, justifyContent: 'center' },
  sendBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  modal: { padding: Theme.spacing.lg },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Theme.colors.textPrimary, marginBottom: 4 },
  modalSub: { fontSize: 12, color: Theme.colors.textMuted, marginBottom: 12 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: Theme.colors.textMuted, marginBottom: 4, marginTop: 8 },
  input: { backgroundColor: Theme.colors.bgInput, color: Theme.colors.textPrimary, borderRadius: Theme.radius.sm, padding: 10, fontSize: 14, borderWidth: 1, borderColor: Theme.colors.border, marginBottom: 6 },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelText: { color: Theme.colors.textSecondary, fontWeight: '600' },
  saveBtn: { backgroundColor: Theme.colors.red, paddingHorizontal: 20, paddingVertical: 10, borderRadius: Theme.radius.sm },
  saveText: { color: '#fff', fontWeight: '800' },
});
