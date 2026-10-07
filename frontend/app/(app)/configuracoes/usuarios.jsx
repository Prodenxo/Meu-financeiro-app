import React from 'react';
import { useRouter } from 'expo-router';
import ManageUsersScreen from '@/screens/ManageUsersScreen';
import { SCREEN_TO_HREF } from '@/lib/appNavConfig';
import { resolvePostAuthHref } from '@/lib/authRedirect';
import { goBackToSettings } from '@/lib/settingsRoutes';
import { canManageUsers } from '@/lib/settingsProfile';
import { RoleGate } from '@/screens/Settings/RoleGate';

export default function ConfiguracoesUsuariosRoute() {
  const router = useRouter();
  const back = () => goBackToSettings(router);
  return (
    <RoleGate allow={canManageUsers} onBack={back}>
      <ManageUsersScreen
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
