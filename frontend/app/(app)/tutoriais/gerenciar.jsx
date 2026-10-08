import React from 'react';
import { useRouter } from 'expo-router';
import TutoriaisAdminScreen from '@/screens/TutoriaisAdminScreen';
import { canManageTutorials } from '@/lib/tutoriais/tutoriais';
import { RoleGate } from '@/screens/Settings/RoleGate';
import { goBackToTutoriais } from '@/screens/Tutoriais/tutoriaisRoutes';

export default function TutoriaisGerenciarRoute() {
  const router = useRouter();
  return (
    <RoleGate allow={canManageTutorials} onBack={() => goBackToTutoriais(router)}>
      <TutoriaisAdminScreen />
    </RoleGate>
  );
}
