import {
  canManageUsers,
  canReviewAccessRequests,
  phoneSaveErrorMessage,
  validateDisplayName,
  validateEmailChange,
  validatePhone,
} from '@/lib/settingsProfile';

describe('validateDisplayName', () => {
  it('exige nome e diferente do atual', () => {
    expect(validateDisplayName('  ', 'Ana')).toBe('Por favor, insira um nome válido.');
    expect(validateDisplayName(' Ana ', 'Ana')).toBe('Informe um nome diferente do atual.');
    expect(validateDisplayName('Ana Lima', 'Ana')).toBeNull();
  });
});

describe('validateEmailChange', () => {
  it('valida formato e ignora caixa ao comparar com o atual', () => {
    expect(validateEmailChange('', 'a@b.com')).toBe('Por favor, insira um e-mail.');
    expect(validateEmailChange('sem-arroba', 'a@b.com')).toBe('E-mail inválido.');
    expect(validateEmailChange(' A@B.com ', 'a@b.com')).toBe('Informe um e-mail diferente do atual.');
    expect(validateEmailChange('novo@b.com', 'a@b.com')).toBeNull();
  });
});

describe('validatePhone', () => {
  it('recusa número curto e Brasil sem DDD completo', () => {
    expect(validatePhone('123', '')).toEqual({ error: 'Por favor, insira um número de telefone válido.' });
    expect(validatePhone('55119999999999', '').error).toMatch(/DDD/);
  });

  it('recusa o mesmo número e devolve só dígitos quando válido', () => {
    expect(validatePhone('5511999998888', '+55 (11) 99999-8888')).toEqual({ error: 'Informe um telefone diferente do atual.' });
    expect(validatePhone('+55 (11) 99999-8888', '')).toEqual({ digits: '5511999998888' });
    expect(validatePhone('14155550123', '')).toEqual({ digits: '14155550123' });
  });
});

describe('phoneSaveErrorMessage', () => {
  it('traduz número já vinculado e usa mensagem padrão quando vazia', () => {
    expect(phoneSaveErrorMessage({ code: 'PHONE_ALREADY_LINKED' })).toMatch(/outra conta/);
    expect(phoneSaveErrorMessage({ message: 'Falhou' })).toBe('Falhou');
    expect(phoneSaveErrorMessage({ message: '{}' })).toBe('Erro ao salvar telefone. Por favor, tente novamente.');
    expect(phoneSaveErrorMessage(null)).toBe('Erro ao salvar telefone. Por favor, tente novamente.');
  });
});

describe('permissões da Equipe', () => {
  it('gerenciar usuários: admin e superadmin', () => {
    expect(canManageUsers('superadmin')).toBe(true);
    expect(canManageUsers('admin')).toBe(true);
    expect(canManageUsers('usuario')).toBe(false);
    expect(canManageUsers('outsider')).toBe(false);
    expect(canManageUsers(null)).toBe(false);
  });

  it('solicitações de acesso: somente superadmin', () => {
    expect(canReviewAccessRequests('superadmin')).toBe(true);
    expect(canReviewAccessRequests('admin')).toBe(false);
    expect(canReviewAccessRequests('usuario')).toBe(false);
    expect(canReviewAccessRequests(undefined)).toBe(false);
  });
});
