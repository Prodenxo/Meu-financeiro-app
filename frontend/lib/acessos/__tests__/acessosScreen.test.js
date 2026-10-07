import { buildUsersPage, computeStats, filterVisibleUsers, getManagedUserActions } from '../acessos';
import {
  applyCnpjLookup,
  buildEmpresaPayload,
  buildUserPayload,
  countMeiActive,
  dedupeUsers,
  deleteEmpresaMessage,
  empresaFormInitial,
  empresaLimitChips,
  filterEmpresasBySearch,
  formatCnpj,
  mergeUsers,
  parseDateInput,
  rangeLabel,
  userDisplayName,
  userEmpresaLabel,
  userFormInitial,
  userFormRules,
  validateResetPassword,
} from '../acessosScreen';

const EMP_A = '11111111-1111-1111-1111-111111111111';
const EMP_B = '22222222-2222-2222-2222-222222222222';

const makeUsers = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: `u${String(i).padStart(3, '0')}`,
    email: `pessoa${i}@ex.com`,
    displayName: `Pessoa ${String(i).padStart(3, '0')}`,
    role: i === 0 ? 'admin' : 'usuario',
    empresaId: i % 2 ? EMP_A : EMP_B,
    status: i % 10 !== 0,
  }));

describe('identificação do usuário', () => {
  it('usa nome, depois e-mail, telefone e id', () => {
    expect(userDisplayName({ displayName: ' Ana ', email: 'a@x.com' })).toBe('Ana');
    expect(userDisplayName({ displayName: '', email: 'a@x.com' })).toBe('a@x.com');
    expect(userDisplayName({ phone: '11999990000' })).toBe('11999990000');
    expect(userDisplayName({ id: 'abcdef123456' })).toBe('Usuário abcdef12');
  });

  it('diferencia sem empresa e sem vínculo (conta órfã)', () => {
    expect(userEmpresaLabel({ empresaId: EMP_A, empresaName: 'Loja' })).toBe('Loja');
    expect(userEmpresaLabel({ empresaId: null, empresaName: 'SEM VÍNCULO' })).toBe('Sem vínculo');
    expect(userEmpresaLabel({ empresaId: null })).toBe('Sem empresa');
  });

  it('remove duplicados por id e junta a busca do servidor', () => {
    const base = [{ id: '1' }, { id: '1' }, { id: '2' }];
    expect(dedupeUsers(base)).toHaveLength(2);
    expect(mergeUsers(base, [{ id: '2' }, { id: '3', empresaName: 'SEM VÍNCULO' }]).map((u) => u.id)).toEqual(['1', '2', '3']);
  });
});

describe('lista, páginas e totais', () => {
  const users = makeUsers(60);

  it('totais vêm do conjunto completo, não da página', () => {
    const page = buildUsersPage(users, { q: '', status: 'todos', perfil: 'todos', ordem: 'asc', pagina: 1, porPagina: 25, empresa: '' });
    expect(page.items).toHaveLength(25);
    expect(page.total).toBe(60);
    const stats = computeStats(users, [{ id: EMP_A }, { id: EMP_B }]);
    expect(stats).toMatchObject({ usuarios: 60, empresas: 2, ativos: 54, bloqueados: 6 });
  });

  it('filtro por empresa e busca agem sobre tudo; página fora do intervalo volta para a última', () => {
    const page = buildUsersPage(users, { q: 'pessoa', status: 'todos', perfil: 'todos', ordem: 'desc', pagina: 9, porPagina: 25, empresa: EMP_A });
    expect(page.total).toBe(30);
    expect(page.page).toBe(2);
    expect(page.items[0].displayName).toBe('Pessoa 009');
    expect(rangeLabel(page)).toBe('26 – 30 de 30');
    expect(rangeLabel({ total: 0 })).toBe('0 de 0');
  });

  it('admin não vê superadmin nem convidado', () => {
    const list = [{ id: 'a', role: 'superadmin' }, { id: 'b', role: 'outsider' }, { id: 'c', role: 'usuario' }];
    expect(filterVisibleUsers(list, 'admin').map((u) => u.id)).toEqual(['c']);
    expect(filterVisibleUsers(list, 'superadmin')).toHaveLength(3);
  });
});

describe('permissões por linha', () => {
  it('admin só gerencia usuário; nunca bloqueia/exclui a si mesmo', () => {
    expect(getManagedUserActions('admin', { id: 'x', role: 'admin' }, 'me').canEdit).toBe(false);
    const self = getManagedUserActions('admin', { id: 'me', role: 'admin' }, 'me');
    expect(self).toMatchObject({ isSelf: true, canDelete: false, canBan: false });
    expect(getManagedUserActions('superadmin', { id: 'y', role: 'superadmin' }, 'me').canImpersonate).toBe(false);
  });
});

describe('formulário de usuário', () => {
  const ctxSuper = { user: null, actorRole: 'superadmin', actorUserId: 'me' };
  const ctxAdmin = { user: null, actorRole: 'admin', actorUserId: 'me' };

  it('admin cria sempre usuário, sem empresa no corpo e sem MEI', () => {
    const { body } = buildUserPayload({ ...userFormInitial(null), email: 'Nova@Ex.com', role: 'admin', empresaId: EMP_A }, ctxAdmin);
    expect(body).toEqual({ email: 'nova@ex.com', password: undefined, displayName: undefined, phone: undefined, role: 'usuario', mei: false });
  });

  it('superadmin precisa escolher empresa; senha opcional mas forte', () => {
    expect(buildUserPayload({ ...userFormInitial(null), email: 'a@b.co' }, ctxSuper).error).toBe('Escolha a empresa.');
    const weak = buildUserPayload({ ...userFormInitial(null), email: 'a@b.co', empresaId: EMP_A, password: 'fraca' }, ctxSuper);
    expect(weak.error).toMatch(/8 caracteres/);
    const ok = buildUserPayload({ ...userFormInitial(null), email: 'a@b.co', empresaId: EMP_A, role: 'outsider' }, ctxSuper);
    expect(ok.body).toMatchObject({ role: 'outsider', empresaId: EMP_A });
  });

  it('edição: e-mail só se mudou, validade em fim do dia, sem perfil/empresa para si mesmo', () => {
    const user = { id: 'u1', email: 'a@b.co', role: 'usuario', empresaId: EMP_A, mei: false };
    const form = { ...userFormInitial(user), expiresAt: '31/12/2026', mei: true };
    const { body, emailChanged } = buildUserPayload(form, { user, actorRole: 'superadmin', actorUserId: 'me' });
    expect(emailChanged).toBe(false);
    expect(body.email).toBeUndefined();
    expect(body).toMatchObject({ mei: true, role: 'usuario', empresaId: EMP_A });
    expect(new Date(body.expiresAt).getDate()).toBe(31);

    const self = { id: 'me', email: 'eu@b.co', role: 'admin', empresaId: EMP_A };
    const own = buildUserPayload({ ...userFormInitial(self), email: 'novo@b.co' }, { user: self, actorRole: 'admin', actorUserId: 'me' });
    expect(own.body.role).toBeUndefined();
    expect(own.body.empresaId).toBeUndefined();
    expect(own.emailChanged).toBe(true);
    expect(userFormRules({ user: self, actorRole: 'admin', actorUserId: 'me' }).roleLocked).toBe(true);
  });

  it('não envia perfil para alvo superadmin e rejeita data inválida', () => {
    const target = { id: 's', email: 's@b.co', role: 'superadmin', empresaId: EMP_A };
    const { body } = buildUserPayload(userFormInitial(target), { user: target, actorRole: 'superadmin', actorUserId: 'me' });
    expect(body.role).toBeUndefined();
    const user = { id: 'u', email: 'u@b.co', role: 'usuario', empresaId: EMP_A };
    expect(buildUserPayload({ ...userFormInitial(user), expiresAt: '2026/1/1' }, { user, actorRole: 'superadmin', actorUserId: 'me' }).error).toMatch(/Data/);
    expect(parseDateInput('')).toBe('');
    expect(parseDateInput('2026-01-05')).toBe('2026-01-05');
  });

  it('senha da redefinição: em branco gera no servidor; digitada precisa ser forte', () => {
    expect(validateResetPassword('')).toEqual({ password: undefined });
    expect(validateResetPassword('Forte@123').password).toBe('Forte@123');
    expect(validateResetPassword('semregra').error).toBeTruthy();
  });
});

describe('empresas', () => {
  const list = [
    { id: EMP_A, empresa: 'Alfa Ltda', nome_fantasia: 'Alfa', cnpj: '12345678000190', max_mei: 3, max_usuarios_nao_mei: null },
    { id: EMP_B, empresa: 'Beta', cnpj: null, max_mei: 0, max_usuarios_nao_mei: 5 },
  ];

  it('limites reais: MEI desligado / vagas e Não MEI sem limite / até N', () => {
    expect(empresaLimitChips(list[0]).map((c) => c.label)).toEqual(['MEI: 3 vagas', 'Não MEI: sem limite']);
    expect(empresaLimitChips(list[1]).map((c) => c.label)).toEqual(['MEI desligado', 'Não MEI: até 5']);
    expect(countMeiActive(list)).toBe(1);
  });

  it('busca por nome ou CNPJ com pontuação', () => {
    expect(filterEmpresasBySearch(list, 'beta').map((e) => e.id)).toEqual([EMP_B]);
    expect(filterEmpresasBySearch(list, '12.345.678').map((e) => e.id)).toEqual([EMP_A]);
    expect(formatCnpj('12345678000190')).toBe('12.345.678/0001-90');
  });

  it('formulário: MEI ligado exige vaga, ilimitado vira null, nome obrigatório ao criar', () => {
    const base = empresaFormInitial(null);
    expect(buildEmpresaPayload(base, { isEdit: false }).error).toMatch(/nome/);
    expect(buildEmpresaPayload({ ...base, empresa: 'X', cnpj: '123' }, { isEdit: false }).error).toMatch(/14 dígitos/);
    expect(buildEmpresaPayload({ ...base, empresa: 'X', meiEnabled: true, meiSlots: '0' }, { isEdit: false }).error).toMatch(/vaga MEI/);
    const { body } = buildEmpresaPayload({ ...base, empresa: 'X', estado: 'sp', meiEnabled: true, meiSlots: '2' }, { isEdit: false });
    expect(body).toMatchObject({ empresa: 'X', razao_social: 'X', estado: 'SP', max_mei: 2, max_usuarios_nao_mei: null });
    const edit = empresaFormInitial(list[1]);
    expect(edit).toMatchObject({ meiEnabled: false, naoMeiUnlimited: false, maxNaoMei: '5' });
  });

  it('dados do CNPJ não apagam o nome fantasia digitado', () => {
    const out = applyCnpjLookup({ ...empresaFormInitial(null), nome_fantasia: 'Minha' }, {
      razaoSocial: 'RAZAO SA',
      nomeFantasia: 'Outra',
      endereco: { descricaoCidade: 'Campinas', estado: 'SP' },
      telefone: { ddd: '19', numero: '30000000' },
    });
    expect(out).toMatchObject({ nome_fantasia: 'Minha', razao_social: 'RAZAO SA', cidade: 'Campinas', telefone: '1930000000' });
  });

  it('aviso de exclusão diz que contas e finanças continuam', () => {
    expect(deleteEmpresaMessage(list[0], 2)).toMatch(/2 usuários/);
    expect(deleteEmpresaMessage(list[0], 0)).toMatch(/dados financeiros das pessoas continuam/);
  });
});
