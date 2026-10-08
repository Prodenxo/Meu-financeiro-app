import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useNavigationDrawer } from '@/lib/navigationContext';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { useTutoriaisData } from '@/hooks/useTutoriaisData';
import { canManageTutorials, filterTutorials, pickFeatured } from '@/lib/tutoriais/tutoriais';
import { sectionSubtitle } from '@/lib/tutoriais/tutoriaisScreen';
import { TUTORIAIS_UNAVAILABLE_MESSAGE } from '@/lib/tutoriaisApi';
import { ToastNotice } from '@/components/ToastNotice';
import SupportTicketModal from '@/components/support/SupportTicketModal';
import { getOverviewTokens } from './Dashboard/overview/overviewTokens';
import { OverviewError, StaleBanner } from './Dashboard/overview/OverviewStates';
import { CategoriasHeader } from './Categorias/CategoriasHeader';
import { EmptyState, PrimaryButton, SecondaryButton } from './Acessos/AcessosParts';
import { InfoBox, ModuleChips, StartBanner, SupportCard, TutorialCard, TutoriaisSkeleton, TutorialSearch } from './Tutoriais/TutoriaisParts';
import { TutorialEditorLayer, useTutorialEditor } from './Tutoriais/TutorialEditorLayer';
import { TUTORIAIS_ROUTES } from './Tutoriais/tutoriaisRoutes';

const CONTENT_MAX = 720;

export default function TutoriaisScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);
  const user = useAuthStore((s) => s.user);
  const phone = useAuthStore((s) => s.phone);
  const displayName = useAuthStore((s) => s.displayName);
  const { isDarkMode } = useThemeStore();
  const { navigateTo, openDrawer, hasGlobalNav, requestSignOut } = useNavigationDrawer();
  const tokens = useMemo(() => getOverviewTokens(isDarkMode), [isDarkMode]);
  const { role } = useCurrentRole();
  const canManage = canManageTutorials(role);

  const data = useTutoriaisData(userId, 'published');
  const { tutorials } = data;
  const [query, setQuery] = useState('');
  const [modulo, setModulo] = useState('todos');
  const featured = useMemo(() => pickFeatured(tutorials), [tutorials]);
  const visible = useMemo(() => filterTutorials(tutorials, { query, modulo }), [tutorials, query, modulo]);

  const [supportOpen, setSupportOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const notify = useCallback((message, variant = 'success') => setToast({ message, variant }), []);
  const editor = useTutorialEditor({ mutate: data.mutate, notify });

  const openTutorial = useCallback((tutorial) => router.push(TUTORIAIS_ROUTES.detail(tutorial.id)), [router]);
  const clearFilters = () => {
    setQuery('');
    setModulo('todos');
  };

  let list;
  if (data.unavailable) {
    list = <InfoBox tokens={tokens} text={TUTORIAIS_UNAVAILABLE_MESSAGE} />;
  } else if (tutorials.length === 0) {
    list = (
      <EmptyState
        tokens={tokens}
        icon="book-outline"
        title="Nenhum tutorial publicado"
        text="Quando houver um guia publicado, ele aparece aqui."
        actionLabel={canManage ? 'Criar tutorial' : undefined}
        onAction={canManage ? editor.openCreate : undefined}
      />
    );
  } else if (visible.length === 0) {
    list = (
      <EmptyState
        tokens={tokens}
        icon="search"
        title="Nenhum tutorial encontrado"
        text="Tente outro termo ou outro módulo."
        actionLabel="Limpar busca e filtro"
        onAction={clearFilters}
      />
    );
  } else {
    list = (
      <View style={styles.cards}>
        {visible.map((tutorial) => (
          <TutorialCard key={tutorial.id} tokens={tokens} tutorial={tutorial} onPress={openTutorial} />
        ))}
      </View>
    );
  }

  let body;
  if (data.status === 'loading') {
    body = <TutoriaisSkeleton tokens={tokens} />;
  } else if (data.status === 'error') {
    body = <OverviewError tokens={tokens} error={data.error} onRetry={data.retry} onSignIn={requestSignOut} />;
  } else {
    body = (
      <>
        {data.error ? <StaleBanner tokens={tokens} error={data.error} onRetry={data.refresh} /> : null}
        <StartBanner tokens={tokens} featured={featured} onOpen={openTutorial} />
        {tutorials.length > 0 ? (
          <>
            <TutorialSearch tokens={tokens} value={query} onChange={setQuery} />
            <ModuleChips tokens={tokens} value={modulo} onChange={setModulo} />
          </>
        ) : null}
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: tokens.text }]} accessibilityRole="header">
            Explore os tutoriais
          </Text>
          <Text style={[styles.sectionText, { color: tokens.textSecondary }]}>{sectionSubtitle(modulo)}</Text>
        </View>
        {list}
        <SupportCard tokens={tokens} onPress={() => setSupportOpen(true)} />
      </>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.canvas }]} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={data.refreshing} onRefresh={data.refresh} tintColor={tokens.primary} colors={[tokens.primary]} />
        }
      >
        <CategoriasHeader
          tokens={tokens}
          title="Tutoriais"
          subtitle="Aprenda a usar o Meu Financeiro no seu ritmo"
          displayName={displayName}
          showMenu={!hasGlobalNav}
          onOpenMenu={openDrawer}
          onOpenProfile={() => navigateTo('Configuracoes')}
        />
        {canManage ? (
          <View style={styles.adminRow}>
            <PrimaryButton tokens={tokens} icon="add" label="Novo tutorial" onPress={editor.openCreate} style={styles.adminBtn} />
            <SecondaryButton
              tokens={tokens}
              icon="list-outline"
              label="Gerenciar tutoriais"
              onPress={() => router.push(TUTORIAIS_ROUTES.manage)}
              style={styles.adminBtn}
            />
          </View>
        ) : null}
        {body}
      </ScrollView>

      <TutorialEditorLayer tokens={tokens} editor={editor} onView={openTutorial} />

      <SupportTicketModal
        visible={supportOpen}
        onClose={() => setSupportOpen(false)}
        defaultNome={displayName || ''}
        defaultEmail={user?.email || ''}
        defaultTelefone={phone || ''}
      />

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
  adminRow: { flexDirection: 'row', gap: 10 },
  adminBtn: { flex: 1, minHeight: 50, borderRadius: 14, paddingHorizontal: 10 },
  sectionHead: { gap: 2 },
  sectionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.2 },
  sectionText: { fontSize: 14, lineHeight: 20 },
  cards: { gap: 12 },
});
