/** Regras do perfil em Configurações (mesmas mensagens da tela anterior). */
import { getBrazilPhoneValidationError, normalizePhoneDigits, phonesMatch } from '@/lib/internationalPhone';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateDisplayName(value, current) {
  const name = String(value || '').trim();
  if (!name) return 'Por favor, insira um nome válido.';
  if (name === String(current || '').trim()) return 'Informe um nome diferente do atual.';
  return null;
}

export function validateEmailChange(value, current) {
  const email = String(value || '').trim().toLowerCase();
  if (!email) return 'Por favor, insira um e-mail.';
  if (!EMAIL_RE.test(email)) return 'E-mail inválido.';
  if (email === String(current || '').trim().toLowerCase()) return 'Informe um e-mail diferente do atual.';
  return null;
}

/** Devolve `{ digits }` válido ou `{ error }`. */
export function validatePhone(value, current) {
  const digits = normalizePhoneDigits(value);
  if (!digits || digits.length < 10) return { error: 'Por favor, insira um número de telefone válido.' };
  const brError = getBrazilPhoneValidationError(digits);
  if (brError) return { error: brError };
  if (phonesMatch(value, current)) return { error: 'Informe um telefone diferente do atual.' };
  return { digits };
}

export function phoneSaveErrorMessage(error) {
  if (error?.code === 'PHONE_ALREADY_LINKED') {
    return 'Este número de WhatsApp já está em outra conta. Entre na conta certa ou peça ao suporte para desvincular.';
  }
  const message = typeof error?.message === 'string' ? error.message.trim() : '';
  return message && message !== '{}' ? message : 'Erro ao salvar telefone. Por favor, tente novamente.';
}

/** Mesma regra da tela anterior: equipe só para admin (superadmin inclui). */
export const canManageUsers = (role) => role === 'admin' || role === 'superadmin';
export const canReviewAccessRequests = (role) => role === 'superadmin';
