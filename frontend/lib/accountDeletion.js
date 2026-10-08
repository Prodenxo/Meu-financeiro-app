import { apiClient } from '@/lib/apiClient';

/** Palavra que a pessoa digita para confirmar (a API exige a mesma). */
export const ACCOUNT_DELETE_WORD = 'EXCLUIR';

export const ACCOUNT_DELETE_ITEMS = [
  'Lançamentos, contas, categorias, orçamentos e agenda',
  'Conexões com bancos e a assinatura da sincronização automática',
  'Seu login: o e-mail fica livre para um novo cadastro',
];

export const isAccountDeleteConfirmed = (text) =>
  String(text || '').trim().toUpperCase() === ACCOUNT_DELETE_WORD;

const FALLBACK_MESSAGE = 'Não foi possível excluir sua conta. Tente de novo em alguns minutos.';

/** Mensagem para a pessoa: a API já devolve o motivo em português (bloqueio, cobrança, rede). */
export const accountDeletionErrorMessage = (error) => {
  const message = String(error?.message || '').trim();
  if (!message || message === 'User not authenticated.') return FALLBACK_MESSAGE;
  return message;
};

export const deleteMyAccount = (confirmation) =>
  apiClient.delete('/users/me', { confirmacao: String(confirmation || '').trim() });
