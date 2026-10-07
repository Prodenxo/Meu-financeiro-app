import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useNavigationDrawer } from '@/lib/navigationContext';
import { useAcessosData } from '@/hooks/useAcessosData';
import {
  DEFAULT_PAGE_SIZE,
  buildEmpresasPage,
  buildUsersPage,
  canSeeEmpresasTab,
  computeStats,
  empresaDisplayName,
  filterVisibleUsers,
  formatManageUserError,
  getManagedUserActions,
  roleLabel,
} from '@/lib/acessos/acessos';
import {
  blockUserMessage,
  countMeiActive,
  deleteEmpresaMessage,
  deleteUserMessage,
  empresaLimitChips,
  empresaNameById,
  filterEmpresasBySearch,
  formatCnpj,
  mergeUsers,
  revokeInviteMessage,
  userDisplayName,
  validateResetPassword,
} from '@/lib/acessos/acessosScreen';
import {
  createInvite,
  createManagedUser,
  deleteEmpresa,
  deleteManagedUser,
  resetManagedUserPassword,
  revokeInvite,
  saveEmpresa,
  searchManagedUsers,
  sendManagedUserResetEmail,
  setManagedUserBlocked,
  updateManagedUser,
} from '@/lib/acessosApi';
import { buildInviteRegisterUrl } from '@/lib/inviteRegisterUrl';
import { copyText } from '@/lib/copyText';
import { ToastNotice } from '@/components/ToastNotice';
import { getOverviewTokens } from './Dashboard/overview/overviewTokens';
import { OverviewError, StaleBanner } from './Dashboard/overview/OverviewStates';
import { AcessosHeader, KpiGrid, ListSkeleton, TabsBar } from './Acessos/AcessosParts';
import { UsersTab } from './Acessos/UsersTab';
import { InvitesTab } from './Acessos/InvitesTab';
import { EmpresasTab } from './Acessos/EmpresasTab';
import {
  ConfirmSheet,
  EmpresaDetailsSheet,
  EmpresaMenuSheet,
  InviteMenuSheet,
  PickerSheet,
  ResetPasswordSheet,
  SecretResultSheet,
  UserDetailsSheet,
  UserFiltersSheet,
  UserMenuSheet,
} from './Acessos/AcessosSheets';
import { UserFormModal } from './Acessos/UserFormModal';
import { EmpresaFormModal } from './Acessos/EmpresaFormModal';

const CONTENT_MAX = 720;
const SEARCH_DEBOUNCE_MS = 400;
const NO_USER_FILTERS = { status: 'todos', perfil: 'todos', empresa: '' };
const NO_USERS = [];
const STATUS_TEXT = { ativos: 'Ativos', bloqueados: 'Bloqueados' };

const errorText = (error, fallback) => formatManageUserError(error?.message) || fallback;

/**
 * Gerenciar acessos: usuários, convites e (só superadmin) empresas.
 * Listas completas vêm da API; busca, filtros, ordem, páginas e totais são calculados sobre o conjunto inteiro.
 */
export default function AcessosScreen({ role, onBack, onImpersonateSuccess }) {
  const userId = useAuthStore((s) => s.userId);
  const impersonate = useAuthStore((s) => s.impersonate);
  const { isDarkMode } = useThemeStore();
  const { requestSignOut } = useNavigationDrawer();
  const tokens = useMemo(() => getOverviewTokens(isDarkMode), [isDarkMode]);
  const isSuperadmin = role === 'superadmin';

  const data = useAcessosData(userId);
  const { mutate } = data;

  const [tab, setTab] = useState('usuarios');
  const [query, setQuery] = useState('');
  const [userFilters, setUserFilters] = useState(NO_USER_FILTERS);
  const [ordem, setOrdem] = useState('asc');
  const [page, setPage] = useState(1);
  const [serverSearch, setServerSearch] = useState({ term: '', users: [] });

  const [eQuery, setEQuery] = useState('');
  const [eMei, setEMei] = useState('todos');
  const [eOrdem, setEOrdem] = useState('asc');
  const [ePage, setEPage] = useState(1);

  const [inviteEmpresaId, setInviteEmpresaId] = useState('');
  const [inviteReusable, setInviteReusable] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);

  const [sheet, setSheet] = useState(null);
  const [busy, setBusy] = useState(null);
  const busyRef = useRef(false);
  const [toast, setToast] = useState(null);
  const notify = useCallback((message, variant = 'success') => setToast({ message, variant }), []);
  const closeSheet = useCallback(() => {
    if (!busyRef.current) setSheet(null);
  }, []);

  /** Uma gravação por vez (evita envio duplicado com toques repetidos). */
  const runExclusive = async (label, operation) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(label);
    try {
      await operation();
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  };

  /* Superadmin: a busca também consulta o servidor, que acha contas sem empresa (fora da lista normal). */
  const serverTerm = isSuperadmin && query.trim().length >= 2 ? query.trim() : '';
  useEffect(() => {
    if (!serverTerm) return undefined;
    let alive = true;
    const timer = setTimeout(() => {
      searchManagedUsers(serverTerm)
        .then((found) => alive && setServerSearch({ term: serverTerm, users: found }))
        .catch(() => alive && setServerSearch({ term: serverTerm, users: [] }));
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [serverTerm]);
  const extraUsers = serverTerm && serverSearch.term === serverTerm ? serverSearch.users : NO_USERS;
  const searchingServer = Boolean(serverTerm) && serverSearch.term !== serverTerm;

  const authorizedUsers = useMemo(() => filterVisibleUsers(data.users, role), [data.users, role]);
  const listUsers = useMemo(() => filterVisibleUsers(mergeUsers(data.users, extraUsers), role), [data.users, extraUsers, role]);
  const stats = useMemo(() => computeStats(authorizedUsers, data.empresas), [authorizedUsers, data.empresas]);

  const usersPage = useMemo(
    () => buildUsersPage(listUsers, { q: query.trim(), ...userFilters, ordem, pagina: page, porPagina: DEFAULT_PAGE_SIZE }),
    [listUsers, query, userFilters, ordem, page],
  );

  const empresasPage = useMemo(
    () =>
      buildEmpresasPage(filterEmpresasBySearch(data.empresas, eQuery), {
        q: '',
        mei: eMei,
        ordem: eOrdem,
        pagina: ePage,
        porPagina: DEFAULT_PAGE_SIZE,
      }),
    [data.empresas, eQuery, eMei, eOrdem, ePage],
  );

  const memberCounts = useMemo(() => {
    const map = new Map();
    for (const u of authorizedUsers) if (u.empresaId) map.set(u.empresaId, (map.get(u.empresaId) || 0) + 1);
    return map;
  }, [authorizedUsers]);

  const empresaOptions = useMemo(
    () =>
      data.empresas.map((e) => ({
        key: e.id,
        label: empresaDisplayName(e),
        sub: [e.cnpj ? formatCnpj(e.cnpj) : null, ...empresaLimitChips(e).map((c) => c.label)].filter(Boolean).join(' · '),
        search: String(e.cnpj || ''),
      })),
    [data.empresas],
  );
  const empresaNameOf = useCallback((id) => empresaNameById(data.empresas, id), [data.empresas]);

  const tabs = useMemo(
    () => [
      { key: 'usuarios', label: 'Usuários' },
      { key: 'convites', label: 'Convites' },
      ...(canSeeEmpresasTab(role) ? [{ key: 'empresas', label: 'Empresas' }] : []),
    ],
    [role],
  );
  const activeTab = tabs.some((t) => t.key === tab) ? tab : 'usuarios';

  const filterCount = (userFilters.status !== 'todos') + (userFilters.perfil !== 'todos') + Boolean(userFilters.empresa);
  const filterSummary = filterCount
    ? [
        STATUS_TEXT[userFilters.status],
        userFilters.perfil !== 'todos' ? roleLabel(userFilters.perfil) : null,
        userFilters.empresa ? empresaNameOf(userFilters.empresa) || 'Empresa' : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : null;
  const perfilOptions = isSuperadmin
    ? ['todos', 'superadmin', 'admin', 'usuario', 'outsider'].map((k) => ({ key: k, label: k === 'todos' ? 'Todos' : roleLabel(k) }))
    : ['todos', 'admin', 'usuario'].map((k) => ({ key: k, label: k === 'todos' ? 'Todos' : roleLabel(k) }));

  const changeQuery = (q) => {
    setQuery(q);
    setPage(1);
  };
  const clearUserFilters = () => {
    setQuery('');
    setUserFilters(NO_USER_FILTERS);
    setPage(1);
  };
  const showEmpresaUsers = (empresaId) => {
    setSheet(null);
    setQuery('');
    setUserFilters({ ...NO_USER_FILTERS, empresa: empresaId });
    setPage(1);
    setTab('usuarios');
  };

  const actionsFor = (user) => getManagedUserActions(role, user, userId);

  /* ---------- Usuários ---------- */

  const submitUser = (body, { emailChanged } = {}) =>
    runExclusive('save', async () => {
      const target = sheet?.user;
      setSheet((s) => (s ? { ...s, formError: null } : s));
      try {
        if (target) {
          await mutate(() => updateManagedUser(target.id, body));
          setSheet(null);
          notify(emailChanged ? 'Dados salvos. O login agora usa o novo e-mail.' : 'Dados do usuário atualizados.');
        } else {
          const created = await mutate(() => createManagedUser(body));
          if (created?.generatedPassword) {
            setSheet({
              type: 'secret',
              title: 'Usuário criado',
              message: `Senha gerada para ${created.email || body.email}. Repasse por um canal seguro; a pessoa pode trocá-la depois.`,
              value: created.generatedPassword,
            });
          } else {
            setSheet(null);
            notify('Usuário criado.');
          }
        }
      } catch (error) {
        setSheet((s) => (s?.type === 'userForm' ? { ...s, formError: errorText(error, 'Não foi possível salvar o usuário.') } : s));
      }
    });

  const confirmToggleBlock = () =>
    runExclusive('block', async () => {
      const user = sheet?.user;
      if (!user) return;
      const blocking = user.status !== false;
      try {
        await mutate(() => setManagedUserBlocked(user.id, blocking));
        setSheet(null);
        notify(blocking ? `${userDisplayName(user)} foi bloqueado.` : `${userDisplayName(user)} foi liberado.`);
      } catch (error) {
        setSheet((s) => (s ? { ...s, error: errorText(error, 'Não foi possível alterar o acesso.') } : s));
      }
    });

  const confirmDeleteUser = () =>
    runExclusive('delete', async () => {
      const user = sheet?.user;
      if (!user) return;
      try {
        await mutate(() => deleteManagedUser(user.id));
        setSheet(null);
        notify(`${userDisplayName(user)} foi excluído.`);
      } catch (error) {
        setSheet((s) => (s ? { ...s, error: errorText(error, 'Não foi possível excluir o usuário.') } : s));
      }
    });

  const confirmImpersonate = () =>
    runExclusive('impersonate', async () => {
      const user = sheet?.user;
      if (!user) return;
      try {
        await impersonate(user.id);
        setSheet(null);
        onImpersonateSuccess?.();
      } catch (error) {
        setSheet((s) => (s ? { ...s, error: error?.message || 'Não foi possível acessar como este usuário.' } : s));
      }
    });

  const sendResetEmail = () =>
    runExclusive('reset', async () => {
      const user = sheet?.user;
      if (!user) return;
      try {
        await sendManagedUserResetEmail(user.id);
        setSheet(null);
        notify(`Link de nova senha enviado para ${user.email}.`);
      } catch (error) {
        setSheet((s) => (s ? { ...s, error: errorText(error, 'Não foi possível enviar o e-mail.') } : s));
      }
    });

  const setTempPassword = (custom) =>
    runExclusive('reset', async () => {
      const user = sheet?.user;
      if (!user) return;
      const { error: invalid, password } = validateResetPassword(custom);
      if (invalid) {
        setSheet((s) => (s ? { ...s, error: invalid } : s));
        return;
      }
      try {
        const result = await resetManagedUserPassword(user.id, password);
        setSheet({
          type: 'secret',
          title: 'Senha provisória criada',
          message: `Nova senha de ${userDisplayName(user)}. Repasse por um canal seguro.`,
          value: result?.password || password,
        });
      } catch (error) {
        setSheet((s) => (s ? { ...s, error: errorText(error, 'Não foi possível redefinir a senha.') } : s));
      }
    });

  const copySecret = async () => {
    const ok = await copyText(sheet?.value);
    notify(ok ? 'Senha copiada.' : 'Não foi possível copiar. Selecione a senha e copie manualmente.', ok ? 'success' : 'error');
  };

  /* ---------- Empresas ---------- */

  const submitEmpresa = (body) =>
    runExclusive('save', async () => {
      const target = sheet?.empresa;
      setSheet((s) => (s ? { ...s, formError: null } : s));
      try {
        await mutate(() => saveEmpresa(target?.id || null, body));
        setSheet(null);
        notify(target ? 'Empresa atualizada.' : 'Empresa criada.');
      } catch (error) {
        setSheet((s) => (s?.type === 'empresaForm' ? { ...s, formError: errorText(error, 'Não foi possível salvar a empresa.') } : s));
      }
    });

  const confirmDeleteEmpresa = () =>
    runExclusive('delete', async () => {
      const empresa = sheet?.empresa;
      if (!empresa) return;
      try {
        await mutate(() => deleteEmpresa(empresa.id));
        setSheet(null);
        if (userFilters.empresa === empresa.id) setUserFilters((f) => ({ ...f, empresa: '' }));
        if (inviteEmpresaId === empresa.id) setInviteEmpresaId('');
        notify(`${empresaDisplayName(empresa)} foi excluída.`);
      } catch (error) {
        setSheet((s) => (s ? { ...s, error: errorText(error, 'Não foi possível excluir a empresa.') } : s));
      }
    });

  /* ---------- Convites ---------- */

  const ownEmpresaName = !isSuperadmin && data.empresas.length === 1 ? empresaDisplayName(data.empresas[0]) : null;
  const inviteEmpresaLabel = isSuperadmin ? empresaNameOf(inviteEmpresaId) : ownEmpresaName;
  const canGenerate = data.status === 'ready' && (!isSuperadmin || Boolean(inviteEmpresaLabel)) && busy !== 'invite';

  const generateInvite = () =>
    runExclusive('invite', async () => {
      try {
        const res = await mutate(() => createInvite({ empresaId: inviteEmpresaId, isReusable: inviteReusable, isSuperadmin }));
        const url = res?.inviteUrl || (res?.invite?.raw_token ? buildInviteRegisterUrl(res.invite.raw_token) : '');
        if (!url) throw new Error('O servidor não devolveu o link do convite.');
        setInviteResult({ url, reusable: Boolean(res?.invite?.is_reusable ?? inviteReusable) });
      } catch (error) {
        notify(error?.message || 'Não foi possível gerar o link.', 'error');
      }
    });

  const copyInviteUrl = async (url) => {
    const ok = await copyText(url);
    notify(ok ? 'Link copiado.' : 'Não foi possível copiar. Selecione o link e copie manualmente.', ok ? 'success' : 'error');
  };

  const confirmRevoke = () =>
    runExclusive('revoke', async () => {
      const invite = sheet?.invite;
      if (!invite) return;
      try {
        await mutate(() => revokeInvite(invite.id));
        setSheet(null);
        notify('Convite revogado. O link não funciona mais.');
      } catch (error) {
        setSheet((s) => (s ? { ...s, error: errorText(error, 'Não foi possível revogar o convite.') } : s));
      }
    });

  /* ---------- Render ---------- */

  let body;
  if (data.status === 'loading') {
    body = <ListSkeleton tokens={tokens} rows={6} />;
  } else if (data.status === 'error') {
    body = <OverviewError tokens={tokens} error={data.error} onRetry={data.retry} onSignIn={requestSignOut} />;
  } else if (activeTab === 'usuarios') {
    body = (
      <UsersTab
        tokens={tokens}
        page={usersPage}
        query={query}
        onQueryChange={changeQuery}
        ordem={ordem}
        onToggleOrdem={() => {
          setOrdem((o) => (o === 'asc' ? 'desc' : 'asc'));
          setPage(1);
        }}
        filterCount={filterCount}
        onOpenFilters={() => setSheet({ type: 'userFilters', draft: userFilters })}
        filterSummary={filterSummary}
        onClearFilters={clearUserFilters}
        onPageChange={setPage}
        onCreate={() => setSheet({ type: 'userForm', user: null })}
        onOpen={(user) => setSheet({ type: 'userDetails', user })}
        onMenu={(user) => setSheet({ type: 'userMenu', user })}
        actorUserId={userId}
        searchingServer={searchingServer}
        totalUsers={authorizedUsers.length}
      />
    );
  } else if (activeTab === 'convites') {
    body = (
      <InvitesTab
        tokens={tokens}
        isSuperadmin={isSuperadmin}
        generator={{
          empresaLabel: inviteEmpresaLabel,
          onPickEmpresa: () => setSheet({ type: 'pickInviteEmpresa' }),
          reusable: inviteReusable,
          onToggleReusable: setInviteReusable,
          canGenerate,
          busy: busy === 'invite',
          onGenerate: generateInvite,
          result: inviteResult,
          onCopyResult: () => copyInviteUrl(inviteResult?.url),
          onDismissResult: () => setInviteResult(null),
        }}
        invites={data.invites}
        invitesStatus={data.invitesStatus}
        invitesError={data.invitesError}
        onRetry={data.retry}
        onRefresh={data.refresh}
        refreshing={data.refreshing}
        empresaNameOf={empresaNameOf}
        onMenu={(invite) => setSheet({ type: 'inviteMenu', invite })}
      />
    );
  } else {
    body = (
      <EmpresasTab
        tokens={tokens}
        page={empresasPage}
        query={eQuery}
        onQueryChange={(q) => {
          setEQuery(q);
          setEPage(1);
        }}
        ordem={eOrdem}
        onToggleOrdem={() => {
          setEOrdem((o) => (o === 'asc' ? 'desc' : 'asc'));
          setEPage(1);
        }}
        mei={eMei}
        onMeiChange={(m) => {
          setEMei(m);
          setEPage(1);
        }}
        meiActiveCount={countMeiActive(data.empresas)}
        totalEmpresas={data.empresas.length}
        memberCounts={memberCounts}
        onPageChange={setEPage}
        onCreate={() => setSheet({ type: 'empresaForm', empresa: null })}
        onOpen={(empresa) => setSheet({ type: 'empresaDetails', empresa })}
        onMenu={(empresa) => setSheet({ type: 'empresaMenu', empresa })}
        onClearFilters={() => {
          setEQuery('');
          setEMei('todos');
          setEPage(1);
        }}
      />
    );
  }

  const sUser = sheet?.user;
  const sEmpresa = sheet?.empresa;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.canvas }]} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={data.refreshing} onRefresh={data.refresh} tintColor={tokens.primary} colors={[tokens.primary]} />}
      >
        <AcessosHeader tokens={tokens} onBack={onBack} />
        {data.status === 'ready' ? (
          <>
            {data.error ? <StaleBanner tokens={tokens} error={data.error} onRetry={data.refresh} /> : null}
            <KpiGrid tokens={tokens} stats={stats} />
            <TabsBar tokens={tokens} tabs={tabs} value={activeTab} onChange={setTab} />
          </>
        ) : null}
        {body}
      </ScrollView>

      {sheet?.type === 'userMenu' ? (
        <UserMenuSheet
          tokens={tokens}
          user={sUser}
          actions={actionsFor(sUser)}
          onClose={closeSheet}
          onDetails={(user) => setSheet({ type: 'userDetails', user })}
          onImpersonate={(user) => setSheet({ type: 'impersonate', user })}
          onEdit={(user) => setSheet({ type: 'userForm', user })}
          onResetPassword={(user) => setSheet({ type: 'resetPassword', user })}
          onToggleBlock={(user) => setSheet({ type: 'block', user })}
          onDelete={(user) => setSheet({ type: 'deleteUser', user })}
          onViewTeam={(user) => showEmpresaUsers(user.empresaId)}
        />
      ) : null}

      {sheet?.type === 'userDetails' ? (
        <UserDetailsSheet tokens={tokens} user={sUser} actions={actionsFor(sUser)} onClose={closeSheet} onOpenMenu={(user) => setSheet({ type: 'userMenu', user })} />
      ) : null}

      {sheet?.type === 'userForm' ? (
        <UserFormModal
          key={sUser?.id || 'novo'}
          tokens={tokens}
          user={sUser}
          actorRole={role}
          actorUserId={userId}
          empresas={data.empresas}
          defaultEmpresaId={isSuperadmin ? userFilters.empresa : ''}
          saving={busy === 'save'}
          formError={sheet.formError}
          onSubmit={submitUser}
          onClose={closeSheet}
        />
      ) : null}

      {sheet?.type === 'impersonate' ? (
        <ConfirmSheet
          tokens={tokens}
          title="Acessar como este usuário"
          message={`Você vai usar o app como ${userDisplayName(sUser)}, vendo e alterando os dados dessa pessoa. Para voltar à sua conta, toque em "Sair do modo usuário" na faixa do topo.`}
          confirmLabel="Acessar como"
          confirmIcon="log-in-outline"
          tone="accent"
          busy={busy === 'impersonate'}
          busyLabel="Entrando…"
          error={sheet.error}
          onConfirm={confirmImpersonate}
          onClose={closeSheet}
        />
      ) : null}

      {sheet?.type === 'block' ? (
        <ConfirmSheet
          tokens={tokens}
          title={sUser.status !== false ? 'Bloquear acesso' : 'Liberar acesso'}
          message={sUser.status !== false ? blockUserMessage(sUser) : `Liberar ${userDisplayName(sUser)}? A pessoa volta a entrar no app normalmente.`}
          confirmLabel={sUser.status !== false ? 'Bloquear' : 'Liberar'}
          confirmIcon={sUser.status !== false ? 'ban-outline' : 'lock-open-outline'}
          tone={sUser.status !== false ? 'danger' : 'accent'}
          busy={busy === 'block'}
          busyLabel="Salvando…"
          error={sheet.error}
          onConfirm={confirmToggleBlock}
          onClose={closeSheet}
        />
      ) : null}

      {sheet?.type === 'deleteUser' ? (
        <ConfirmSheet
          tokens={tokens}
          title="Excluir usuário"
          message={deleteUserMessage(sUser)}
          confirmLabel="Excluir definitivamente"
          confirmIcon="trash-outline"
          busy={busy === 'delete'}
          busyLabel="Excluindo…"
          error={sheet.error}
          onConfirm={confirmDeleteUser}
          onClose={closeSheet}
        />
      ) : null}

      {sheet?.type === 'resetPassword' ? (
        <ResetPasswordSheet
          tokens={tokens}
          user={sUser}
          busy={busy === 'reset'}
          error={sheet.error}
          onSendEmail={sendResetEmail}
          onSetPassword={setTempPassword}
          onClose={closeSheet}
        />
      ) : null}

      {sheet?.type === 'secret' ? (
        <SecretResultSheet tokens={tokens} title={sheet.title} message={sheet.message} value={sheet.value} onCopy={copySecret} onClose={closeSheet} />
      ) : null}

      {sheet?.type === 'userFilters' ? (
        <UserFiltersSheet
          tokens={tokens}
          value={sheet.draft}
          onChange={(draft) => setSheet((s) => ({ ...s, draft }))}
          perfilOptions={perfilOptions}
          showEmpresa={isSuperadmin}
          empresaLabel={empresaNameOf(sheet.draft.empresa) || ''}
          onPickEmpresa={() => setSheet((s) => ({ ...s, type: 'pickFilterEmpresa' }))}
          onApply={(next) => {
            setUserFilters(next);
            setPage(1);
            setSheet(null);
          }}
          onClose={closeSheet}
        />
      ) : null}

      {sheet?.type === 'pickFilterEmpresa' ? (
        <PickerSheet
          tokens={tokens}
          title="Filtrar por empresa"
          options={empresaOptions}
          selected={sheet.draft.empresa}
          searchPlaceholder="Buscar empresa ou CNPJ"
          onSelect={(id) => setSheet((s) => ({ type: 'userFilters', draft: { ...s.draft, empresa: id } }))}
          onClose={() => setSheet((s) => ({ ...s, type: 'userFilters' }))}
        />
      ) : null}

      {sheet?.type === 'pickInviteEmpresa' ? (
        <PickerSheet
          tokens={tokens}
          title="Empresa do convite"
          options={empresaOptions}
          selected={inviteEmpresaId}
          searchPlaceholder="Buscar empresa ou CNPJ"
          onSelect={(id) => {
            setInviteEmpresaId(id);
            setInviteResult(null);
            setSheet(null);
          }}
          onClose={closeSheet}
        />
      ) : null}

      {sheet?.type === 'inviteMenu' ? (
        <InviteMenuSheet
          tokens={tokens}
          invite={sheet.invite}
          canCopy={Boolean(sheet.invite.raw_token)}
          onCopy={() => {
            const url = buildInviteRegisterUrl(sheet.invite.raw_token);
            setSheet(null);
            void copyInviteUrl(url);
          }}
          onRevoke={() => setSheet({ type: 'revoke', invite: sheet.invite })}
          onClose={closeSheet}
        />
      ) : null}

      {sheet?.type === 'revoke' ? (
        <ConfirmSheet
          tokens={tokens}
          title="Revogar convite"
          message={revokeInviteMessage}
          confirmLabel="Revogar"
          confirmIcon="close-circle-outline"
          busy={busy === 'revoke'}
          busyLabel="Revogando…"
          error={sheet.error}
          onConfirm={confirmRevoke}
          onClose={closeSheet}
        />
      ) : null}

      {sheet?.type === 'empresaMenu' ? (
        <EmpresaMenuSheet
          tokens={tokens}
          empresa={sEmpresa}
          onClose={closeSheet}
          onDetails={(empresa) => setSheet({ type: 'empresaDetails', empresa })}
          onEdit={(empresa) => setSheet({ type: 'empresaForm', empresa })}
          onViewUsers={(empresa) => showEmpresaUsers(empresa.id)}
          onDelete={(empresa) => setSheet({ type: 'deleteEmpresa', empresa })}
        />
      ) : null}

      {sheet?.type === 'empresaDetails' ? (
        <EmpresaDetailsSheet
          tokens={tokens}
          empresa={sEmpresa}
          members={authorizedUsers.filter((u) => u.empresaId === sEmpresa.id)}
          onOpenUser={(user) => setSheet({ type: 'userMenu', user })}
          onEdit={(empresa) => setSheet({ type: 'empresaForm', empresa })}
          onClose={closeSheet}
        />
      ) : null}

      {sheet?.type === 'empresaForm' ? (
        <EmpresaFormModal
          key={sEmpresa?.id || 'nova'}
          tokens={tokens}
          empresa={sEmpresa}
          saving={busy === 'save'}
          formError={sheet.formError}
          onSubmit={submitEmpresa}
          onClose={closeSheet}
        />
      ) : null}

      {sheet?.type === 'deleteEmpresa' ? (
        <ConfirmSheet
          tokens={tokens}
          title="Excluir empresa"
          message={deleteEmpresaMessage(sEmpresa, memberCounts.get(sEmpresa.id) || 0)}
          confirmLabel="Excluir empresa"
          confirmIcon="trash-outline"
          busy={busy === 'delete'}
          busyLabel="Excluindo…"
          error={sheet.error}
          onConfirm={confirmDeleteEmpresa}
          onClose={closeSheet}
        />
      ) : null}

      <ToastNotice visible={Boolean(toast)} message={toast?.message || ''} variant={toast?.variant} onDismiss={() => setToast(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 14,
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
    flexGrow: 1,
  },
});
