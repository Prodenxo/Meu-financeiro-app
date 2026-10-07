import { apiClient } from '../lib/apiClient'

export type ActivationStepStatus = 'pending' | 'completed'

export type ActivationStep = {
  id: string
  title: string
  description: string
  status: ActivationStepStatus
  required: boolean
  route: string
  completedAt: string | null
}

export type ActivationProgress = {
  completed: number
  totalRequired: number
  completedAll: number
  totalAll: number
  percent: number
  percentAll?: number
  pendingCount?: number
  /** Essenciais (5) concluídos */
  isComplete: boolean
  isCoreComplete?: boolean
  /** Inclui os recomendados */
  isFullyComplete?: boolean
  hasPendingSteps?: boolean
  dismissStorage?: 'client'
}

export type ActivationPayload = {
  progress: ActivationProgress
  steps: ActivationStep[]
}

const isMeiStep = (step: ActivationStep) => step.id.startsWith('mei_') || step.route.startsWith('mei:')

/** O app não tem área MEI: tira esses passos e recalcula o progresso geral sem eles. */
export function withoutMeiSteps (payload: ActivationPayload): ActivationPayload {
  const steps = payload.steps.filter((s) => !isMeiStep(s))
  if (steps.length === payload.steps.length) return payload
  const totalAll = steps.length
  const completedAll = steps.filter((s) => s.status === 'completed').length
  const pendingCount = totalAll - completedAll
  return {
    steps,
    progress: {
      ...payload.progress,
      completedAll,
      totalAll,
      percentAll: totalAll > 0 ? Math.round((completedAll / totalAll) * 100) : 100,
      pendingCount,
      isFullyComplete: pendingCount === 0,
      hasPendingSteps: pendingCount > 0,
    },
  }
}

export async function fetchActivationProgress (): Promise<ActivationPayload | null> {
  try {
    const payload = await apiClient.get<ActivationPayload>('/users/me/activation')
    return payload ? withoutMeiSteps(payload) : payload
  } catch {
    return null
  }
}
