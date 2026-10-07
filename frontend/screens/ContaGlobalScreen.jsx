import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useNavigationDrawer } from '@/lib/navigationContext';
import { useContaGlobalData } from '@/hooks/useContaGlobalData';
import { deleteContaMoedaGlobal, saveContaMoedaGlobal } from '@/lib/financeApi';
import { buildContaGlobalScreen, deleteMoedaMessage, formatIsoDayBr, localIsoDay } from '@/lib/finance/contaGlobalScreen';
import { ToastNotice } from '@/components/ToastNotice';
import { getOverviewTokens } from './Dashboard/overview/overviewTokens';
import { OverviewError, StaleBanner } from './Dashboard/overview/OverviewStates';
import { ContaConfirmSheet } from './Contas/ContaSheets';
import { CategoriasHeader } from './Categorias/CategoriasHeader';
import { ContaGlobalSummary, ReferenceNotice } from './ContaGlobal/ContaGlobalSummary';
import { MoedaList } from './ContaGlobal/MoedaList';
import { ContaGlobalEmpty, ContaGlobalSkeleton } from './ContaGlobal/ContaGlobalStates';
import { AboutConversionSheet, MoedaMenuSheet } from './ContaGlobal/ContaGlobalSheets';
import { MoedaFormModal } from './ContaGlobal/MoedaFormModal';

const CONTENT_MAX = 720;

const fieldErrorsOf = (error) => (error?.errors && Object.keys(error.errors).length ? error.errors : null);

export default function ContaGlobalScreen() {
  const userId = useAuthStore((s) => s.userId);
  const displayName = useAuthStore((s) => s.displayName);
  const { isDarkMode } = useThemeStore();
  const { navigateTo, openDrawer, hasGlobalNav, requestSignOut } = useNavigationDrawer();
  const tokens = useMemo(() => getOverviewTokens(isDarkMode), [isDarkMode]);

  const data = useContaGlobalData(userId);
  const { contas, rates, sources, ratesStatus, mutate } = data;
  const screen = useMemo(
    () => buildContaGlobalScreen({ contas, rates, sources, ratesStatus, today: localIsoDay() }),
    [contas, rates, sources, ratesStatus],
  );

  const [sheet, setSheet] = useState(null);
  const [busy, setBusy] = useState(null);
  const busyRef = useRef(false);
  const [toast, setToast] = useState(null);
  const notify = useCallback((message, variant = 'success') => setToast({ message, variant }), []);
  const closeSheet = useCallback(() => {
    if (!busyRef.current) setSheet(null);
  }, []);

  /** Uma gravação por vez (evita envio duplicado com toques repetidos). */
  const runExclusive = async (label, operation) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(label);
    try {
      await operation();
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  };

  const openCreate = useCallback(() => setSheet({ type: 'form', mode: 'create', row: null }), []);
  const openMenu = useCallback((row) => setSheet({ type: 'menu', row }), []);

  const handleSubmit = (payload) =>
    runExclusive('save', async () => {
      const row = sheet?.row;
      setSheet((s) => (s ? { ...s, serverErrors: null, formError: null } : s));
      try {
        await mutate(() => saveContaMoedaGlobal(row?.id || null, payload));
        setSheet(null);
        const label = payload.nome ? `${payload.nome} (${payload.moeda})` : payload.moeda;
        notify(row ? `Saldo de ${label} atualizado.` : `Saldo de ${label} adicionado à Conta global.`);
      } catch (error) {
        const fieldErrors = fieldErrorsOf(error);
        setSheet((s) =>
          s?.type === 'form'
            ? { ...s, serverErrors: fieldErrors, formError: fieldErrors ? null : error?.message || 'Não foi possível salvar a moeda.' }
            : s,
        );
      }
    });

  const handleDelete = () =>
    runExclusive('delete', async () => {
      const row = sheet?.row;
      if (!row) return;
      try {
        await mutate(() => deleteContaMoedaGlobal(row.id));
        setSheet(null);
        notify(`Saldo de ${row.nome ? `${row.nome} (${row.moeda})` : row.moeda} excluído da Conta global.`);
      } catch (error) {
        setSheet((s) => (s ? { ...s, error: error?.message || 'Não foi possível excluir a moeda.' } : s));
      }
    });

  let body;
  if (data.status === 'loading') {
    body = <ContaGlobalSkeleton tokens={tokens} />;
  } else if (data.status === 'error') {
    body = <OverviewError tokens={tokens} error={data.error} onRetry={data.retry} onSignIn={requestSignOut} />;
  } else if (screen.count === 0) {
    body = (
      <>
        {data.error ? <StaleBanner tokens={tokens} error={data.error} onRetry={data.refresh} /> : null}
        <ContaGlobalEmpty tokens={tokens} onCreate={openCreate} />
        <ReferenceNotice tokens={tokens} />
      </>
    );
  } else {
    body = (
      <>
        {data.error ? <StaleBanner tokens={tokens} error={data.error} onRetry={data.refresh} /> : null}
        <ContaGlobalSummary tokens={tokens} screen={screen} onRetryRates={data.refresh} />
        <ReferenceNotice tokens={tokens} />
        {screen.hasOldRate ? (
          <View style={[styles.warn, { backgroundColor: tokens.warningSoft }]}>
            <Ionicons name="time-outline" size={18} color={tokens.warning} />
            <Text style={[styles.warnText, { color: tokens.text }]}>
              Algumas cotações são antigas (a mais antiga é de {formatIsoDayBr(screen.oldestRateDate)}). O valor em reais pode estar defasado.
            </Text>
          </View>
        ) : null}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tokens.text }]} accessibilityRole="header">
            Suas moedas
          </Text>
          <MoedaList tokens={tokens} rows={screen.rows} ratesLoading={ratesStatus === 'loading'} onOpenMenu={openMenu} />
        </View>
        <Pressable
          onPress={openCreate}
          accessibilityRole="button"
          style={({ pressed }) => [styles.addBtn, { backgroundColor: tokens.primary }, tokens.shadow, pressed && { opacity: 0.88 }]}
        >
          <Ionicons name="add" size={22} color="#ffffff" />
          <Text style={styles.addText}>Adicionar moeda</Text>
        </Pressable>
      </>
    );
  }

  const sheetRow = sheet?.row;
  const ready = data.status === 'ready';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.canvas }]} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={data.refreshing} onRefresh={data.refresh} tintColor={tokens.primary} colors={[tokens.primary]} />
        }
      >
        <CategoriasHeader
          tokens={tokens}
          title="Conta global"
          subtitle="Seus saldos em outras moedas"
          displayName={displayName}
          showMenu={!hasGlobalNav}
          onOpenMenu={openDrawer}
          onOpenProfile={() => navigateTo('Configuracoes')}
        />
        {body}
        {ready ? (
          <Pressable
            onPress={() => setSheet({ type: 'about' })}
            accessibilityRole="button"
            style={({ pressed }) => [styles.aboutLink, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="help-circle-outline" size={18} color={tokens.primary} />
            <Text style={[styles.aboutText, { color: tokens.primary }]}>Sobre a conversão</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      {sheet?.type === 'menu' ? (
        <MoedaMenuSheet
          tokens={tokens}
          row={sheetRow}
          onClose={closeSheet}
          onUpdateBalance={(row) => setSheet({ type: 'form', mode: 'balance', row })}
          onEdit={(row) => setSheet({ type: 'form', mode: 'edit', row })}
          onDelete={(row) => setSheet({ type: 'delete', row })}
        />
      ) : null}

      {sheet?.type === 'form' ? (
        <MoedaFormModal
          key={`${sheet.mode}-${sheetRow?.id || 'novo'}`}
          tokens={tokens}
          mode={sheet.mode}
          row={sheetRow}
          usedCodes={screen.usedCodes}
          rates={ratesStatus === 'ready' ? rates : {}}
          saving={busy === 'save'}
          serverErrors={sheet.serverErrors}
          formError={sheet.formError}
          onSubmit={handleSubmit}
          onClose={closeSheet}
        />
      ) : null}

      {sheet?.type === 'delete' ? (
        <ContaConfirmSheet
          tokens={tokens}
          title="Excluir saldo"
          message={deleteMoedaMessage(sheetRow)}
          confirmLabel="Excluir"
          busyLabel="Excluindo…"
          busy={busy === 'delete'}
          error={sheet.error}
          onConfirm={handleDelete}
          onClose={closeSheet}
        />
      ) : null}

      {sheet?.type === 'about' ? <AboutConversionSheet tokens={tokens} sources={sources} onClose={closeSheet} /> : null}

      <ToastNotice visible={Boolean(toast)} message={toast?.message || ''} variant={toast?.variant} onDismiss={() => setToast(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 16,
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
    flexGrow: 1,
  },
  section: { gap: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.2 },
  warn: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 14, padding: 12 },
  warnText: { flex: 1, fontSize: 14, lineHeight: 20 },
  addBtn: {
    flexDirection: 'row',
    gap: 8,
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  addText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  aboutLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44 },
  aboutText: { fontSize: 15, fontWeight: '700' },
});
