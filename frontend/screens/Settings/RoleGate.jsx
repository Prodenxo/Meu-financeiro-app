import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { getOverviewTokens, TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

/**
 * Bloqueia a rota no app quando o papel não permite. O servidor também recusa
 * (403) as operações; isto evita abrir a tela por link direto ou histórico.
 */
export function RoleGate({ allow, onBack, children }) {
  const { role, status } = useCurrentRole();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const tokens = useMemo(() => getOverviewTokens(isDarkMode), [isDarkMode]);

  if (status === 'ready' && allow(role)) return children;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.canvas }]} edges={['top', 'left', 'right']}>
      {status === 'loading' ? (
        <View style={styles.center} accessibilityLabel="Verificando permissões">
          <ActivityIndicator color={tokens.primary} />
        </View>
      ) : (
        <View style={styles.center}>
          <View style={[styles.icon, { backgroundColor: tokens.primarySoft }]}>
            <Ionicons name="lock-closed-outline" size={26} color={tokens.primary} />
          </View>
          <Text style={[styles.title, { color: tokens.text }]} accessibilityRole="header">
            {status === 'error' ? 'Não foi possível verificar seu acesso' : 'Acesso restrito'}
          </Text>
          <Text style={[styles.body, { color: tokens.textSecondary }]}>
            {status === 'error'
              ? 'Confira sua conexão e tente de novo.'
              : 'Sua conta não tem permissão para abrir esta área.'}
          </Text>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            style={({ pressed }) => [styles.btn, { backgroundColor: tokens.primary }, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.btnText}>Voltar para Configurações</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  body: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  btn: { marginTop: 8, minHeight: TOUCH_MIN, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
