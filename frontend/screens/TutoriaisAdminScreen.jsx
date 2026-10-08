import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useNavigationDrawer } from '@/lib/navigationContext';
import { useTutoriaisData } from '@/hooks/useTutoriaisData';
import { adminCounts, moduleIonicon } from '@/lib/tutoriais/tutoriaisScreen';
import { TUTORIAIS_UNAVAILABLE_MESSAGE } from '@/lib/tutoriaisApi';
import { ToastNotice } from '@/components/ToastNotice';
import { getOverviewTokens, TOUCH_MIN } from './Dashboard/overview/overviewTokens';
import { OverviewError, StaleBanner } from './Dashboard/overview/OverviewStates';
import { Chip, EmptyState, ListGroup, ListSkeleton, MoreButton, PrimaryButton } from './Acessos/AcessosParts';
import { InfoBox } from './Tutoriais/TutoriaisParts';
import { TutorialEditorLayer, useTutorialEditor } from './Tutoriais/TutorialEditorLayer';
import { goBackToTutoriais, TUTORIAIS_ROUTES } from './Tutoriais/tutoriaisRoutes';

const CONTENT_MAX = 720;

function Header({ tokens, onBack }) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Voltar para a central de tutoriais"
        hitSlop={4}
        style={({ pressed }) => [styles.backBtn, pressed && { backgroundColor: tokens.track }]}
      >
        <Ionicons name="chevron-back" size={24} color={tokens.text} />
      </Pressable>
      <View style={styles.headerText}>
        <Text style={[styles.headerTitle, { color: tokens.text }]} accessibilityRole="header" numberOfLines={1}>
          Gerenciar tutoriais
        </Text>
        <Text style={[styles.headerSub, { color: tokens.textSecondary }]} numberOfLines={1}>
          Rascunhos ficam só com o super admin
        </Text>
      </View>
    </View>
  );
}

function Counts({ tokens, counts }) {
  const items = [
    { key: 'total', label: 'Total', value: counts.total, color: tokens.primary },
    { key: 'publicados', label: 'Publicados', value: counts.publicados, color: tokens.income },
    { key: 'rascunhos', label: 'Rascunhos', value: counts.rascunhos, color: tokens.warning },
  ];
  return (
    <View style={styles.counts}>
      {items.map((item) => (
        <View
          key={item.key}
          style={[styles.count, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }]}
          accessible
          accessibilityLabel={`${item.label}: ${item.value}`}
        >
          <Text style={[styles.countValue, { color: item.color }]}>{item.value}</Text>
          <Text style={[styles.countLabel, { color: tokens.textSecondary }]} numberOfLines={1}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function AdminRow({ tokens, tutorial, onOpen, onMenu }) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onOpen(tutorial)}
        accessibilityRole="button"
        accessibilityLabel={`${tutorial.titulo}, ${tutorial.publicado ? 'publicado' : 'rascunho'}. Abrir`}
        style={({ pressed }) => [styles.rowMain, pressed && { opacity: 0.7 }]}
      >
        <View style={[styles.rowIcon, { backgroundColor: tokens.primarySoft }]}>
          <Ionicons name={moduleIonicon(tutorial.modulo)} size={18} color={tokens.primary} />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: tokens.text }]} numberOfLines={2}>
            {tutorial.titulo}
          </Text>
          <Text style={[styles.rowSub, { color: tokens.textSecondary }]} numberOfLines={1}>
            {tutorial.moduloLabel} · {tutorial.tipoLabel} · Ordem {tutorial.ordem}
          </Text>
          <View style={styles.chips}>
            <Chip tokens={tokens} label={tutorial.publicado ? 'Publicado' : 'Rascunho'} tone={tutorial.publicado ? 'income' : 'warning'} />
            {tutorial.destaque ? <Chip tokens={tokens} label="Destaque" tone="accent" icon="star" /> : null}
          </View>
        </View>
      </Pressable>
      <MoreButton tokens={tokens} label={`Ações de ${tutorial.titulo}`} onPress={() => onMenu(tutorial)} />
    </View>
  );
}

export default function TutoriaisAdminScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);
  const { isDarkMode } = useThemeStore();
  const { requestSignOut } = useNavigationDrawer();
  const tokens = useMemo(() => getOverviewTokens(isDarkMode), [isDarkMode]);

  const data = useTutoriaisData(userId, 'all');
  const { tutorials } = data;
  const counts = useMemo(() => adminCounts(tutorials), [tutorials]);

  const [toast, setToast] = useState(null);
  const notify = useCallback((message, variant = 'success') => setToast({ message, variant }), []);
  const editor = useTutorialEditor({ mutate: data.mutate, notify });
  const openTutorial = useCallback((tutorial) => router.push(TUTORIAIS_ROUTES.detail(tutorial.id)), [router]);

  let body;
  if (data.status === 'loading') {
    body = <ListSkeleton tokens={tokens} />;
  } else if (data.status === 'error') {
    body = <OverviewError tokens={tokens} error={data.error} onRetry={data.retry} onSignIn={requestSignOut} />;
  } else if (data.unavailable) {
    body = <InfoBox tokens={tokens} text={TUTORIAIS_UNAVAILABLE_MESSAGE} />;
  } else if (tutorials.length === 0) {
    body = (
      <EmptyState
        tokens={tokens}
        icon="book-outline"
        title="Nenhum tutorial cadastrado"
        text="Crie o primeiro quando quiser publicar um guia."
        actionLabel="Criar tutorial"
        onAction={editor.openCreate}
      />
    );
  } else {
    body = (
      <>
        {data.error ? <StaleBanner tokens={tokens} error={data.error} onRetry={data.refresh} /> : null}
        <Counts tokens={tokens} counts={counts} />
        <ListGroup tokens={tokens}>
          {tutorials.map((tutorial) => (
            <AdminRow key={tutorial.id} tokens={tokens} tutorial={tutorial} onOpen={openTutorial} onMenu={editor.openMenu} />
          ))}
        </ListGroup>
      </>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.canvas }]} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={data.refreshing} onRefresh={data.refresh} tintColor={tokens.primary} colors={[tokens.primary]} />
        }
      >
        <Header tokens={tokens} onBack={() => goBackToTutoriais(router)} />
        {data.status === 'ready' && !data.unavailable ? (
          <PrimaryButton tokens={tokens} icon="add" label="Novo tutorial" onPress={editor.openCreate} />
        ) : null}
        {body}
      </ScrollView>

      <TutorialEditorLayer tokens={tokens} editor={editor} onView={openTutorial} />

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
    gap: 14,
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
    flexGrow: 1,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: -8 },
  backBtn: { width: TOUCH_MIN, height: TOUCH_MIN, borderRadius: TOUCH_MIN / 2, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  headerSub: { fontSize: 13 },
  counts: { flexDirection: 'row', gap: 10 },
  count: { flex: 1, borderWidth: 1, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 10, alignItems: 'center', gap: 2 },
  countValue: { fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
  countLabel: { fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 14, paddingRight: 4, paddingVertical: 10, gap: 6 },
  rowMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  rowText: { flex: 1, minWidth: 0, gap: 4 },
  rowTitle: { fontSize: 16, fontWeight: '700', lineHeight: 21 },
  rowSub: { fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
