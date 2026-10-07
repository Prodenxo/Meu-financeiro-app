import { useEffect, useState } from 'react';
import { resolveRoleAndEmpresa } from '@/lib/auth-roles';
import { useAuthStore } from '@/store/authStore';

/**
 * Papel atual do usuário, relido do vínculo com a empresa (mesma consulta do login).
 * - `status`: 'loading' | 'ready' | 'error'. Em erro o papel fica nulo (nada restrito aparece).
 * O servidor continua sendo quem bloqueia de verdade; isto só decide o que mostrar.
 */
export function useCurrentRole() {
  const userId = useAuthStore((s) => s.userId);
  const storeRole = useAuthStore((s) => s.role);
  const [state, setState] = useState({ owner: null, role: null, status: 'loading' });

  useEffect(() => {
    if (!userId) return undefined;
    let alive = true;
    resolveRoleAndEmpresa(userId)
      .then((res) => {
        if (alive) setState({ owner: userId, role: res?.role ?? null, status: 'ready' });
      })
      .catch(() => {
        if (alive) setState({ owner: userId, role: null, status: 'error' });
      });
    return () => {
      alive = false;
    };
  }, [userId]);

  if (!userId) return { role: null, status: 'ready' };
  if (state.owner !== userId) return { role: storeRole, status: 'loading' };
  return { role: state.role, status: state.status };
}
