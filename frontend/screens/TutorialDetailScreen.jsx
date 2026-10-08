import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useNavigationDrawer } from '@/lib/navigationContext';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { useTutorialDetail } from '@/hooks/useTutoriaisData';
import { canManageTutorials, canReadTutorial } from '@/lib/tutoriais/tutoriais';
import { moduleIonicon, videoHostLabel, videoLinkFor } from '@/lib/tutoriais/tutoriaisScreen';
import { TUTORIAIS_UNAVAILABLE_MESSAGE } from '@/lib/tutoriaisApi';
import { ToastNotice } from '@/components/ToastNotice';
import { getOverviewTokens, OVERVIEW_RADIUS, TOUCH_MIN } from './Dashboard/overview/overviewTokens';
import { OverviewError, StaleBanner } from './Dashboard/overview/OverviewStates';
import { Chip, EmptyState, ListSkeleton, PrimaryButton, SecondaryButton } from './Acessos/AcessosParts';
import { InfoBox, RemoteImage, TutorialMeta } from './Tutoriais/TutoriaisParts';
import { TutorialEditorLayer, useTutorialEditor } from './Tutoriais/TutorialEditorLayer';
import { goBackToTutoriais } from './Tutoriais/tutoriaisRoutes';

const CONTENT_MAX = 720;

function BackHeader({ tokens, onBack }) {
  return (
    <Pressable
      onPress={onBack}
      accessibilityRole="button"
      accessibilityLabel="Voltar para a central de tutoriais"
      hitSlop={4}
      style={({ pressed }) => [styles.back, pressed && { opacity: 0.6 }]}
    >
      <Ionicons name="chevron-back" size={22} color={tokens.primary} />
      <Text style={[styles.backText, { color: tokens.primary }]}>Tutoriais</Text>
    </Pressable>
  );
}

function VideoCard({ tokens, tutorial, onOpen }) {
  const host = videoHostLabel(tutorial);
  return (
    <View style={[styles.video, { backgroundColor: tokens.primarySoft }]}>
      <RemoteImage key={tutorial.capaUrl} uri={tutorial.capaUrl} style={StyleSheet.absoluteFill} />
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Assistir vídeo: ${tutorial.titulo}${host ? `, abre no ${host}` : ''}`}
        style={({ pressed }) => [styles.playBig, { backgroundColor: tokens.primary }, pressed && { opacity: 0.85 }]}
      >
        <Ionicons name="play" size={30} color="#ffffff" />
      </Pressable>
    </View>
  );
}

function Steps({ tokens, steps }) {
  return (
    <View style={styles.steps}>
      {steps.map((step, index) => (
        <View key={`${step.titulo}-${index}`} style={[styles.step, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }]}>
          <View style={[styles.stepNum, { backgroundColor: tokens.primary }]}>
            <Text style={styles.stepNumText}>{index + 1}</Text>
          </View>
          <View style={styles.stepBody}>
            {step.titulo ? (
              <Text style={[styles.stepTitle, { color: tokens.text }]} accessibilityRole="header">
                {step.titulo}
              </Text>
            ) : null}
            {step.texto ? <Text style={[styles.stepText, { color: tokens.textSecondary }]}>{step.texto}</Text> : null}
            {step.imagemUrl ? (
              <RemoteImage
                uri={step.imagemUrl}
                style={[styles.stepImg, { backgroundColor: tokens.track }]}
                resizeMode="contain"
                accessibilityLabel={step.titulo || `Imagem da etapa ${index + 1}`}
              />
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

export default function TutorialDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const tutorialId = Array.isArray(id) ? id[0] : id;
  const userId = useAuthStore((s) => s.userId);
  const { isDarkMode } = useThemeStore();
  const { requestSignOut } = useNavigationDrawer();
  const tokens = useMemo(() => getOverviewTokens(isDarkMode), [isDarkMode]);
  const { role } = useCurrentRole();
  const canManage = canManageTutorials(role);

  const data = useTutorialDetail(userId, tutorialId);
  const tutorial = data.tutorial && canReadTutorial(data.tutorial, role) ? data.tutorial : null;
  const back = useCallback(() => goBackToTutoriais(router), [router]);

  const [toast, setToast] = useState(null);
  const notify = useCallback((message, variant = 'success') => setToast({ message, variant }), []);
  const editor = useTutorialEditor({ mutate: data.mutate, notify, onDeleted: back });

  const openVideo = async () => {
    const url = videoLinkFor(tutorial);
    if (!url) {
      notify('Este vídeo não tem um link válido.', 'error');
      return;
    }
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      notify('Não foi possível abrir o vídeo agora.', 'error');
    }
  };

  let body;
  if (data.status === 'loading') {
    body = <ListSkeleton tokens={tokens} rows={4} />;
  } else if (data.status === 'error') {
    body = <OverviewError tokens={tokens} error={data.error} onRetry={data.retry} onSignIn={requestSignOut} />;
  } else if (data.unavailable) {
    body = <InfoBox tokens={tokens} text={TUTORIAIS_UNAVAILABLE_MESSAGE} />;
  } else if (!tutorial) {
    body = (
      <EmptyState
        tokens={tokens}
        icon="book-outline"
        title="Tutorial não encontrado"
        text="Ele pode ter sido removido ou ainda não foi publicado."
        actionLabel="Ver todos os tutoriais"
        onAction={back}
      />
    );
  } else {
    const hasSteps = tutorial.tipo === 'passo-a-passo' && tutorial.etapas.length > 0;
    const hasVideo = tutorial.tipo === 'video' && Boolean(tutorial.video);
    body = (
      <>
        {data.error ? <StaleBanner tokens={tokens} error={data.error} onRetry={data.refresh} /> : null}
        <View style={[styles.card, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }]}>
          <View style={styles.titleRow}>
            <View style={[styles.moduleIcon, { backgroundColor: tokens.primarySoft }]}>
              <Ionicons name={moduleIonicon(tutorial.modulo)} size={20} color={tokens.primary} />
            </View>
            <TutorialMeta tokens={tokens} tutorial={tutorial}>
              {!tutorial.publicado ? <Chip tokens={tokens} label="Rascunho" tone="warning" /> : null}
            </TutorialMeta>
          </View>
          <Text style={[styles.title, { color: tokens.text }]} accessibilityRole="header">
            {tutorial.titulo}
          </Text>
          {tutorial.descricao ? <Text style={[styles.subtitle, { color: tokens.textSecondary }]}>{tutorial.descricao}</Text> : null}
          {canManage ? (
            <View style={styles.adminRow}>
              <SecondaryButton tokens={tokens} icon="create-outline" label="Editar" onPress={() => editor.openEdit(tutorial)} style={styles.adminBtn} />
              <SecondaryButton tokens={tokens} icon="ellipsis-horizontal" label="Mais ações" onPress={() => editor.openMenu(tutorial)} style={styles.adminBtn} />
            </View>
          ) : null}
        </View>

        {hasVideo ? (
          <>
            <VideoCard tokens={tokens} tutorial={tutorial} onOpen={openVideo} />
            <PrimaryButton tokens={tokens} icon="play-circle-outline" label="Assistir vídeo" onPress={openVideo} />
            <Text style={[styles.note, { color: tokens.textTertiary }]}>
              O vídeo abre no {videoHostLabel(tutorial)}. Feche para voltar ao app.
            </Text>
          </>
        ) : null}
        {hasSteps ? <Steps tokens={tokens} steps={tutorial.etapas} /> : null}
        {!hasVideo && !hasSteps ? (
          <InfoBox tokens={tokens} text="Este tutorial ainda não tem conteúdo. Volte mais tarde." />
        ) : null}
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
        <BackHeader tokens={tokens} onBack={back} />
        {body}
      </ScrollView>

      <TutorialEditorLayer tokens={tokens} editor={editor} />

      <ToastNotice visible={Boolean(toast)} message={toast?.message || ''} variant={toast?.variant} onDismiss={() => setToast(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 14,
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
    flexGrow: 1,
  },
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 2, minHeight: TOUCH_MIN, marginLeft: -6 },
  backText: { fontSize: 16, fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: OVERVIEW_RADIUS, padding: 16, gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  moduleIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4, lineHeight: 30 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  adminRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  adminBtn: { flex: 1 },
  video: { height: 200, borderRadius: OVERVIEW_RADIUS, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  playBig: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  note: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
  steps: { gap: 10 },
  step: { flexDirection: 'row', gap: 12, borderWidth: 1, borderRadius: OVERVIEW_RADIUS, padding: 14 },
  stepNum: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  stepBody: { flex: 1, minWidth: 0, gap: 6 },
  stepTitle: { fontSize: 16, fontWeight: '800', lineHeight: 22 },
  stepText: { fontSize: 15, lineHeight: 22 },
  stepImg: { width: '100%', aspectRatio: 16 / 10, borderRadius: 12, marginTop: 4 },
});
