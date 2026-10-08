import React, { useCallback, useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useGoogleCalendarStore } from '@/store/googleCalendarStore';
import { useNavigationDrawer } from '@/lib/navigationContext';
import { SETTINGS_ROUTES } from '@/lib/settingsRoutes';
import { startGoogleAuthFlow } from '@/lib/google-auth-flow';
import { disconnectGoogle } from '@/lib/googleCalendarApi';
import { accountDeletionErrorMessage, deleteMyAccount } from '@/lib/accountDeletion';
import { supabase } from '@/lib/supabase';
import { canManageUsers, canReviewAccessRequests } from '@/lib/settingsProfile';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { useGoogleConnection } from '@/hooks/useGoogleConnection';
import { ToastNotice } from '@/components/ToastNotice';
import SupportTicketModal from '@/components/support/SupportTicketModal';
import { ActivationSettingsEntry } from '@/components/activation/ActivationSettingsEntry';
import { getOverviewTokens } from './Dashboard/overview/overviewTokens';
import { initialsOf } from './Dashboard/overview/OverviewHeader';
import { AppearanceSelector, GoogleCalendarIcon, SettingsRow, SettingsSection, SettingsTopBar } from './Settings/SettingsRows';
import { GoogleAgendaSheet, googleStatusAppearance } from './Settings/GoogleAgendaSheet';
import { DeleteAccountSheet } from './Settings/DeleteAccountSheet';

const CONTENT_MAX = 720;
const AGENT_WHATSAPP_URL = 'https://wa.me/5521974526796';
const SUPPORT_GROUP_URL = 'https://chat.whatsapp.com/G0F3SaEFfvNI066k5MYKDT';

export default function SettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const userId = useAuthStore((s) => s.userId);
  const phone = useAuthStore((s) => s.phone);
  const displayName = useAuthStore((s) => s.displayName);
  const { isDarkMode, preference, setPreference } = useThemeStore();
  const { openDrawer, hasGlobalNav, requestSignOut } = useNavigationDrawer();
  const tokens = useMemo(() => getOverviewTokens(isDarkMode), [isDarkMode]);
  const { width, fontScale } = useWindowDimensions();
  const compactAppearance = (Math.min(width, CONTENT_MAX) - 64) / Math.max(fontScale || 1, 1) < 300;

  const { role } = useCurrentRole();
  const google = useGoogleConnection(userId);

  const [supportOpen, setSupportOpen] = useState(false);
  const [googleSheet, setGoogleSheet] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteSheet, setDeleteSheet] = useState(null);
  const notify = useCallback((message, variant = 'success') => setToast({ message, variant }), []);

  const name = displayName || user?.email || 'Usuário';
  const openProfile = () => router.push(SETTINGS_ROUTES.perfil);

  const openExternal = async (url, unavailable) => {
    try {
      if (!(await Linking.canOpenURL(url))) {
        notify(unavailable, 'error');
        return;
      }
      await Linking.openURL(url);
    } catch {
      notify(unavailable, 'error');
    }
  };

  const handleConnect = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const ok = await startGoogleAuthFlow();
      if (ok === true) {
        useGoogleCalendarStore.getState().notifyConnectionChanged();
        setGoogleSheet(null);
        notify('Google Agenda conectada.');
      } else if (ok === false) {
        await google.check();
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await disconnectGoogle();
      useGoogleCalendarStore.getState().notifyConnectionChanged();
      setGoogleSheet(null);
      notify('Google Agenda desconectada.');
    } catch (error) {
      setGoogleSheet((s) => (s ? { ...s, error: error?.message || 'Não foi possível desconectar.' } : s));
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAccount = async (confirmation) => {
    if (deleteSheet?.busy) return;
    setDeleteSheet({ busy: true, error: null });
    try {
      await deleteMyAccount(confirmation);
    } catch (error) {
      setDeleteSheet({ busy: false, error: accountDeletionErrorMessage(error) });
      return;
    }
    // O login já não existe no servidor: encerra só neste aparelho e volta para a entrada.
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    await useAuthStore.getState().signOut().catch(() => {});
  };

  const showTeam = canManageUsers(role);
  const showRequests = canReviewAccessRequests(role);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.canvas }]} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <SettingsTopBar
          tokens={tokens}
          title="Configurações"
          subtitle="Sua conta, do seu jeito"
          displayName={name}
          showMenu={!hasGlobalNav}
          onOpenMenu={openDrawer}
          onOpenProfile={openProfile}
        />

        <ActivationSettingsEntry />

        <SettingsSection tokens={tokens}>
          <SettingsRow
            tokens={tokens}
            iconNode={
              <View style={[styles.profileAvatar, { backgroundColor: tokens.primarySoft }]}>
                <Text style={[styles.profileInitials, { color: tokens.primary }]} allowFontScaling={false}>
                  {initialsOf(name)}
                </Text>
              </View>
            }
            title={name}
            subtitle="Dados pessoais e acesso"
            accessibilityLabel={`${name}. Editar dados pessoais e acesso`}
            onPress={openProfile}
            last
          />
        </SettingsSection>

        <SettingsSection tokens={tokens} title="Suporte">
          <SettingsRow tokens={tokens} icon="ticket-outline" title="Abrir chamado" subtitle="Suporte técnico" onPress={() => setSupportOpen(true)} />
          <SettingsRow
            tokens={tokens}
            icon="logo-whatsapp"
            title="Fale com o agente"
            subtitle="Seu consultor no WhatsApp"
            onPress={() => void openExternal(AGENT_WHATSAPP_URL, 'Não foi possível abrir o WhatsApp neste aparelho.')}
          />
          <SettingsRow
            tokens={tokens}
            icon="people-outline"
            title="Grupo de suporte"
            subtitle="Comunidade de usuários"
            accessibilityLabel="Grupo de suporte, comunidade de usuários no WhatsApp"
            onPress={() => void openExternal(SUPPORT_GROUP_URL, 'Não foi possível abrir o grupo de suporte.')}
            last
          />
        </SettingsSection>

        {showTeam ? (
          <SettingsSection tokens={tokens} title="Equipe">
            <SettingsRow
              tokens={tokens}
              icon="people-circle-outline"
              title="Gerenciar usuários"
              subtitle="Convites e permissões"
              onPress={() => router.push(SETTINGS_ROUTES.usuarios)}
              last={!showRequests}
            />
            {showRequests ? (
              <SettingsRow
                tokens={tokens}
                icon="shield-checkmark-outline"
                title="Solicitações de acesso"
                subtitle="Analisar novos pedidos"
                onPress={() => router.push(SETTINGS_ROUTES.solicitacoes)}
                last
              />
            ) : null}
          </SettingsSection>
        ) : null}

        <SettingsSection tokens={tokens} title="Preferências">
          <SettingsRow
            tokens={tokens}
            iconNode={<GoogleCalendarIcon tokens={tokens} />}
            title="Google Agenda"
            status={googleStatusAppearance(tokens, google.status)}
            busy={google.status === 'loading'}
            onPress={() => setGoogleSheet({ confirming: false, error: null })}
          />
          <AppearanceSelector tokens={tokens} value={preference} onChange={(v) => void setPreference(v)} compact={compactAppearance} />
        </SettingsSection>

        <SettingsSection tokens={tokens}>
          <SettingsRow tokens={tokens} icon="log-out-outline" title="Sair da conta" tone="danger" onPress={requestSignOut} />
          <SettingsRow
            tokens={tokens}
            icon="trash-outline"
            title="Excluir minha conta"
            subtitle="Apaga seus dados e o login"
            tone="danger"
            onPress={() => setDeleteSheet({ busy: false, error: null })}
            last
          />
        </SettingsSection>
      </ScrollView>

      <SupportTicketModal
        visible={supportOpen}
        onClose={() => setSupportOpen(false)}
        defaultNome={displayName || ''}
        defaultEmail={user?.email || ''}
        defaultTelefone={phone || ''}
      />

      {googleSheet ? (
        <GoogleAgendaSheet
          tokens={tokens}
          connection={google}
          busy={busy}
          confirming={googleSheet.confirming}
          error={googleSheet.error}
          onConnect={() => void handleConnect()}
          onRecheck={() => void google.check()}
          onAskDisconnect={() => setGoogleSheet({ confirming: true, error: null })}
          onCancelDisconnect={() => setGoogleSheet({ confirming: false, error: null })}
          onDisconnect={() => void handleDisconnect()}
          onClose={() => setGoogleSheet(null)}
        />
      ) : null}

      {deleteSheet ? (
        <DeleteAccountSheet
          tokens={tokens}
          email={user?.email || ''}
          busy={deleteSheet.busy}
          error={deleteSheet.error}
          onConfirm={(text) => void handleDeleteAccount(text)}
          onClose={() => setDeleteSheet(null)}
        />
      ) : null}

      <ToastNotice visible={Boolean(toast)} message={toast?.message || ''} variant={toast?.variant} onDismiss={() => setToast(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 18,
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
    flexGrow: 1,
  },
  profileAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  profileInitials: { fontSize: 18, fontWeight: '700' },
});
