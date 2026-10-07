import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useTransactionsViewStore } from '@/store/transactionsViewStore';
import { useValuesVisibilityStore } from '@/store/valuesVisibilityStore';
import { useNavigationDrawer } from '@/lib/navigationContext';
import { useContasData } from '@/hooks/useContasData';
import { createConta, deleteConta, disconnectContaSync, syncContaExtrato, updateConta } from '@/lib/financeApi';
import { buildContasScreenModel, countLinkedTransactions, deleteContaMessage } from '@/lib/finance/contasScreen';
import { ToastNotice } from '@/components/ToastNotice';
import { getOverviewTokens, TOUCH_MIN } from './Dashboard/overview/overviewTokens';
import { OverviewError, StaleBanner } from './Dashboard/overview/OverviewStates';
import { ContasTopBar } from './Contas/ContasTopBar';
import { ContasSummaryCard } from './Contas/ContasSummaryCard';
import { ContasList } from './Contas/ContaRow';
import { ContaFormSheet } from './Contas/ContaFormSheet';
import { ContaConfirmSheet, ContaMenuSheet } from './Contas/ContaSheets';
import { ContasEmpty, ContasSkeleton } from './Contas/ContasStates';

const CONTENT_MAX = 720;
/** Largura fixa da linha fora do texto: margens, logo, espaços e botão ⋮. */
const ROW_CHROME = 32 + 18 + 40 + 14 + TOUCH_MIN;
const MIN_ROW_TEXT = 200;

const DISCONNECT_MESSAGE = (nome) =>
  `A conta “${nome}” deixa de receber extrato automático do banco. Os lançamentos que já entraram permanecem. ` +
  'Se o mesmo login tiver outras contas importadas juntas, todas serão desvinculadas — use “Conectar meu banco” ' +
  'de novo para autorizar outra vez.';

export default function ContasScreen() {
  const userId = useAuthStore((s) => s.userId);
  const displayName = useAuthStore((s) => s.displayName);
  const { isDarkMode } = useThemeStore();
  const { navigateTo, openDrawer, hasGlobalNav, requestSignOut } = useNavigationDrawer();
  const tokens = useMemo(() => getOverviewTokens(isDarkMode), [isDarkMode]);
  const hidden = useValuesVisibilityStore((s) => s.hidden);
  const toggleHidden = useValuesVisibilityStore((s) => s.toggle);
  const setTxFilters = useTransactionsViewStore((s) => s.setFilters);
  const { width, fontScale } = useWindowDimensions();

  const contasData = useContasData(userId);
  const { data, mutate } = contasData;
  const model = useMemo(() => (data ? buildContasScreenModel(data.contas, data.transactions) : null), [data]);

  const rowText = (Math.min(width, CONTENT_MAX) - ROW_CHROME) / Math.max(fontScale || 1, 1);
  const stacked = rowText < MIN_ROW_TEXT;

  const [sheet, setSheet] = useState(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [toast, setToast] = useState(null);
  const notify = useCallback((message, variant = 'success') => setToast({ message, variant }), []);
  const closeSheet = useCallback(() => {
    if (!busyRef.current) setSheet(null);
  }, []);

  /** Uma gravação por vez (evita envio duplicado com toques repetidos). */
  const runExclusive = async (operation) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await operation();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const openCreate = useCallback(() => setSheet({ type: 'form', conta: null }), []);
  const openMenu = useCallback((row) => setSheet({ type: 'menu', conta: row.conta }), []);

  const handleSubmit = (payload) =>
    runExclusive(async () => {
      const conta = sheet?.conta;
      setSheet((s) => (s ? { ...s, serverErrors: null, formError: null } : s));
      try {
        await mutate(() => (conta ? updateConta(conta.id, payload) : createConta(payload)));
        setSheet(null);
        notify(conta ? 'Conta atualizada.' : 'Conta cadastrada.');
      } catch (error) {
        const fieldErrors = error?.errors && Object.keys(error.errors).length ? error.errors : null;
        setSheet((s) =>
          s?.type === 'form'
            ? { ...s, serverErrors: fieldErrors, formError: error?.message || 'Não foi possível salvar a conta.' }
            : s,
        );
      }
    });

  const handleDelete = () =>
    runExclusive(async () => {
      const conta = sheet?.conta;
      if (!conta) return;
      try {
        await mutate(() => deleteConta(conta.id));
        setSheet(null);
        notify('Conta excluída.');
      } catch (error) {
        setSheet((s) => (s ? { ...s, error: error?.message || 'Não foi possível excluir a conta.' } : s));
      }
    });

  const handleDisconnect = () =>
    runExclusive(async () => {
      const conta = sheet?.conta;
      if (!conta) return;
      try {
        await mutate(() => disconnectContaSync(conta.id));
        setSheet(null);
        notify('Sincronização automática desligada.');
      } catch (error) {
        setSheet((s) => (s ? { ...s, error: error?.message || 'Não foi possível desconectar.' } : s));
      }
    });

  const handleSync = (conta) => {
    setSheet(null);
    void runExclusive(async () => {
      notify('Atualizando extrato…', 'info');
      try {
        await mutate(() => syncContaExtrato(conta.id));
        notify('Extrato atualizado.');
      } catch (error) {
        notify(error?.message || 'Não foi possível atualizar o extrato.', 'error');
      }
    });
  };

  const handleViewMovements = (conta) => {
    setSheet(null);
    setTxFilters({ contaFilter: conta.id });
    navigateTo('Transacoes');
  };

  let body;
  if (contasData.status === 'loading' && !data) {
    body = <ContasSkeleton tokens={tokens} />;
  } else if (!model) {
    body = <OverviewError tokens={tokens} error={contasData.error} onRetry={contasData.retry} onSignIn={requestSignOut} />;
  } else {
    body = (
      <>
        {contasData.error ? <StaleBanner tokens={tokens} error={contasData.error} onRetry={contasData.refresh} /> : null}
        <ContasSummaryCard
          tokens={tokens}
          total={model.total}
          activeCount={model.activeCount}
          inactiveCount={model.inactiveCount}
          hidden={hidden}
          onToggleHidden={toggleHidden}
        />
        {model.rows.length === 0 ? (
          <ContasEmpty tokens={tokens} onCreate={openCreate} />
        ) : (
          <>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: tokens.text }]} accessibilityRole="header">
                Minhas contas
              </Text>
              <View style={[styles.badge, { backgroundColor: tokens.primarySoft }]}>
                <Text style={[styles.badgeText, { color: tokens.primary }]} accessibilityLabel={`${model.rows.length} contas`}>
                  {model.rows.length}
                </Text>
              </View>
            </View>
            <ContasList rows={model.rows} tokens={tokens} hidden={hidden} stacked={stacked} onOpenMenu={openMenu} />
            <Pressable
              onPress={openCreate}
              accessibilityRole="button"
              style={({ pressed }) => [styles.addBtn, { backgroundColor: tokens.primary }, tokens.shadow, pressed && { opacity: 0.88 }]}
            >
              <Ionicons name="add" size={22} color="#ffffff" />
              <Text style={styles.addText}>Adicionar conta</Text>
            </Pressable>
            <Text style={[styles.hint, { color: tokens.textSecondary }]}>Gerencie suas contas pelo menu de cada item.</Text>
          </>
        )}
      </>
    );
  }

  const sheetConta = sheet?.conta;
  const linked = sheet?.type === 'delete' && data ? countLinkedTransactions(data.transactions, sheetConta.id) : 0;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.canvas }]} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={contasData.refreshing}
            onRefresh={contasData.refresh}
            tintColor={tokens.primary}
            colors={[tokens.primary]}
          />
        }
      >
        <ContasTopBar
          tokens={tokens}
          displayName={displayName}
          showMenu={!hasGlobalNav}
          onOpenMenu={openDrawer}
          onOpenProfile={() => navigateTo('Configuracoes')}
        />
        <Text style={[styles.title, { color: tokens.text }]} accessibilityRole="header">
          Contas e cartões
        </Text>
        {body}
      </ScrollView>

      {sheet?.type === 'menu' ? (
        <ContaMenuSheet
          tokens={tokens}
          conta={sheetConta}
          onClose={closeSheet}
          onEdit={(conta) => setSheet({ type: 'form', conta })}
          onViewMovements={handleViewMovements}
          onSync={handleSync}
          onDisconnect={(conta) => setSheet({ type: 'disconnect', conta })}
          onDelete={(conta) => setSheet({ type: 'delete', conta })}
        />
      ) : null}

      {sheet?.type === 'form' ? (
        <ContaFormSheet
          key={sheetConta?.id || 'nova'}
          tokens={tokens}
          conta={sheetConta}
          saving={busy}
          serverErrors={sheet.serverErrors}
          formError={sheet.formError}
          onSubmit={handleSubmit}
          onClose={closeSheet}
        />
      ) : null}

      {sheet?.type === 'delete' ? (
        <ContaConfirmSheet
          tokens={tokens}
          title="Excluir conta"
          message={deleteContaMessage(sheetConta.nome, linked)}
          confirmLabel="Excluir conta"
          busyLabel="Excluindo…"
          busy={busy}
          error={sheet.error}
          onConfirm={handleDelete}
          onClose={closeSheet}
        />
      ) : null}

      {sheet?.type === 'disconnect' ? (
        <ContaConfirmSheet
          tokens={tokens}
          title="Desligar sincronização automática"
          message={DISCONNECT_MESSAGE(sheetConta.nome)}
          confirmLabel="Desconectar"
          confirmIcon="unlink-outline"
          busyLabel="Desconectando…"
          busy={busy}
          error={sheet.error}
          onConfirm={handleDisconnect}
          onClose={closeSheet}
        />
      ) : null}

      <ToastNotice
        visible={Boolean(toast)}
        message={toast?.message || ''}
        variant={toast?.variant}
        onDismiss={() => setToast(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 32,
    gap: 16,
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
    flexGrow: 1,
  },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.4 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: -4 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  badge: { minWidth: 26, height: 22, borderRadius: 11, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  addBtn: {
    flexDirection: 'row',
    gap: 8,
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  addText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  hint: { fontSize: 13, textAlign: 'center', marginTop: -6 },
});
