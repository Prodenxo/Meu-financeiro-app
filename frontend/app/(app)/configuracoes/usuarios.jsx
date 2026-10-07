import React from 'react';
import { useRouter } from 'expo-router';
import AcessosScreen from '@/screens/AcessosScreen';
import { SCREEN_TO_HREF } from '@/lib/appNavConfig';
import { resolvePostAuthHref } from '@/lib/authRedirect';
import { goBackToSettings } from '@/lib/settingsRoutes';
import { canManageUsers } from '@/lib/settingsProfile';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { RoleGate } from '@/screens/Settings/RoleGate';

function AcessosWithRole({ onBack, onImpersonateSuccess }) {
  const { role } = useCurrentRole();
  return <AcessosScreen role={role} onBack={onBack} onImpersonateSuccess={onImpersonateSuccess} />;
}

export default function ConfiguracoesUsuariosRoute() {
  const router = useRouter();
  const back = () => goBackToSettings(router);
  return (
    <RoleGate allow={canManageUsers} onBack={back}>
      <AcessosWithRole
        onBack={back}
        onImpersonateSuccess={() => {
          void resolvePostAuthHref(SCREEN_TO_HREF.Dashboard).then((href) => {
            router.replace(href);
          });
        }}
      />
    </RoleGate>
  );
}
