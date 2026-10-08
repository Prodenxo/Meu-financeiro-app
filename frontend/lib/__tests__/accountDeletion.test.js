import { apiClient } from '@/lib/apiClient';
import {
  ACCOUNT_DELETE_WORD,
  accountDeletionErrorMessage,
  deleteMyAccount,
  isAccountDeleteConfirmed,
} from '../accountDeletion';

jest.mock('@/lib/apiClient', () => ({
  apiClient: { delete: jest.fn(() => Promise.resolve({ userId: 'u-1' })) },
}));

describe('isAccountDeleteConfirmed', () => {
  it('aceita a palavra em qualquer caixa e com espaços', () => {
    expect(isAccountDeleteConfirmed('EXCLUIR')).toBe(true);
    expect(isAccountDeleteConfirmed('  excluir ')).toBe(true);
  });

  it('recusa vazio, parcial ou outra palavra', () => {
    expect(isAccountDeleteConfirmed('')).toBe(false);
    expect(isAccountDeleteConfirmed(null)).toBe(false);
    expect(isAccountDeleteConfirmed('EXCLUI')).toBe(false);
    expect(isAccountDeleteConfirmed('sim')).toBe(false);
  });
});

describe('accountDeletionErrorMessage', () => {
  it('mostra o motivo que a API devolveu', () => {
    const msg = 'Você é administrador de uma empresa com outros usuários.';
    expect(accountDeletionErrorMessage(new Error(msg))).toBe(msg);
  });

  it('usa mensagem padrão quando não há motivo legível', () => {
    expect(accountDeletionErrorMessage(null)).toMatch(/Não foi possível excluir/);
    expect(accountDeletionErrorMessage(new Error('User not authenticated.'))).toMatch(/Não foi possível excluir/);
  });
});

describe('deleteMyAccount', () => {
  it('chama DELETE /users/me com a confirmação', async () => {
    await deleteMyAccount(` ${ACCOUNT_DELETE_WORD} `);
    expect(apiClient.delete).toHaveBeenCalledWith('/users/me', { confirmacao: ACCOUNT_DELETE_WORD });
  });
});
