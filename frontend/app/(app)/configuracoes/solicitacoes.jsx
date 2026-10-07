import React from 'react';
import { useRouter } from 'expo-router';
import AccessApprovalsScreen from '@/screens/AccessApprovalsScreen';
import { goBackToSettings } from '@/lib/settingsRoutes';
import { canReviewAccessRequests } from '@/lib/settingsProfile';
import { RoleGate } from '@/screens/Settings/RoleGate';

export default function ConfiguracoesSolicitacoesRoute() {
  const router = useRouter();
  const back = () => goBackToSettings(router);
  return (
    <RoleGate allow={canReviewAccessRequests} onBack={back}>
      <AccessApprovalsScreen onBack={back} />
    </RoleGate>
  );
}
