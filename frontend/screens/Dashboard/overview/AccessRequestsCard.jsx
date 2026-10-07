import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { invokeManageAccessRequests } from '@/lib/manage-access-requests';
import { useAuthStore } from '@/store/authStore';
import { MfConfirmDialog } from '@/components/ui/MfConfirmDialog';
import { SectionCard } from './SectionCard';

async function callList() {
  try {
    const data = await invokeManageAccessRequests({ action: 'list' });
    return data.requests ?? [];
  } catch {
    return [];
  }
}

/** Só superadmin e só quando há solicitações de acesso pendentes: aprovar, negar ou abrir a tela completa. */
export function AccessRequestsCard({ tokens }) {
  const role = useAuthStore((s) => s.role);
  const router = useRouter();
  const isSuper = role === 'superadmin';
  const theme = tokens.theme;

  const [requests, setRequests] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [actingId, setActingId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const load = useCallback(async () => {
    if (!isSuper) return;
    setRequests(await callList());
    setLoaded(true);
  }, [isSuper]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleApprove = async (req) => {
    setActingId(req.userId);
    try {
      await invokeManageAccessRequests({ action: 'approve', userId: req.userId });
      setRequests((prev) => prev.filter((r) => r.userId !== req.userId));
    } catch {
      /* widget da visão geral não derruba a tela */
    } finally {
      setActingId(null);
    }
  };

  const confirmReject = async () => {
    const req = rejectTarget;
    if (!req) return;
    setActingId(req.userId);
    try {
      await invokeManageAccessRequests({ action: 'reject', userId: req.userId });
      setRequests((prev) => prev.filter((r) => r.userId !== req.userId));
    } catch {
      /* silencioso */
    } finally {
      setRejectTarget(null);
      setActingId(null);
    }
  };

  if (!isSuper || !loaded || requests.length === 0) return null;

  const openAll = () => router.push('/(app)/solicitacoes');

  return (
    <SectionCard
      tokens={tokens}
      title="Solicitações de acesso"
      icon="notifications-outline"
      actionLabel="Ver todas"
      onAction={openAll}
      right={
        <View style={[styles.badge, { backgroundColor: tokens.primary }]}>
          <Text style={styles.badgeText}>{requests.length}</Text>
        </View>
      }
    >
      {requests.map((req) => {
        const acting = actingId === req.userId;
        return (
          <View key={req.userId} style={[styles.card, { backgroundColor: theme.backgroundMuted, borderColor: theme.borderLight }]}>
            <Text style={[styles.name, { color: tokens.text }]} numberOfLines={1}>
              {req.fullName || 'Sem nome'}
            </Text>
            <Text style={[styles.empresa, { color: tokens.textSecondary }]} numberOfLines={1}>
              {req.empresa?.nome || 'Empresa não informada'}
            </Text>
            <View style={styles.actions}>
              <Pressable
                onPress={() => setRejectTarget(req)}
                disabled={acting}
                accessibilityRole="button"
                accessibilityLabel="Negar"
                style={[styles.iconBtn, { borderWidth: 1.5, borderColor: theme.error }, acting && styles.disabled]}
              >
                {acting ? <ActivityIndicator size="small" color={theme.error} /> : <Ionicons name="close" size={18} color={theme.error} />}
              </Pressable>
              <Pressable
                onPress={() => void handleApprove(req)}
                disabled={acting}
                accessibilityRole="button"
                accessibilityLabel="Aceitar"
                style={[styles.iconBtn, { backgroundColor: theme.success }, acting && styles.disabled]}
              >
                {acting ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
              </Pressable>
              <Pressable
                onPress={openAll}
                accessibilityRole="button"
                accessibilityLabel="Detalhes"
                style={[styles.iconBtn, styles.detailBtn, { borderColor: theme.border, backgroundColor: theme.background }]}
              >
                <Ionicons name="eye-outline" size={18} color={theme.primary} />
              </Pressable>
            </View>
          </View>
        );
      })}

      <MfConfirmDialog
        visible={rejectTarget !== null}
        variant="confirm"
        confirmIntent="danger"
        iconName="trash-outline"
        title="Negar solicitação"
        message={
          rejectTarget
            ? `Negar e remover o cadastro de ${
                rejectTarget.fullName || rejectTarget.email || 'este solicitante'
              }? O usuário e a empresa serão excluídos do banco.`
            : ''
        }
        confirmLabel="Negar e excluir"
        cancelLabel="Cancelar"
        loading={rejectTarget !== null && actingId === rejectTarget.userId}
        onConfirm={() => void confirmReject()}
        onCancel={() => setRejectTarget(null)}
      />
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, minWidth: 22, alignItems: 'center' },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  card: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 2 },
  name: { fontSize: 14, fontWeight: '700' },
  empresa: { fontSize: 13 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  iconBtn: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  detailBtn: { borderWidth: 1, flex: 1 },
  disabled: { opacity: 0.6 },
});
