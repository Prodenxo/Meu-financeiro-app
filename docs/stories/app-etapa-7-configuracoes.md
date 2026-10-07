# Story - App etapa 7: Configurações em JavaScript

**Status:** InReview
**Origem:** `AGENTS.md` → Produto → etapa (7) "configurações"; pedido do dono com imagem de referência (2026-10-07).
**Referências:** tela anterior `screens/SettingsScreen.tsx` (comportamentos), `store/authStore.ts`, `store/themeStore.ts`,
`lib/google-auth-flow.ts`, `lib/googleCalendarApi.js`, edge `manage-access-requests` e backend `/api/admin/access-requests/*`
do `Meu-financeiro-clone`.

## Descrição

A tela de Configurações era um formulário longo em TypeScript. O dono pediu o visual da imagem (topo compacto, linha de
perfil, grupos Suporte / Equipe / Preferências, "Sair da conta" no fim), JavaScript, edição de perfil em tela própria,
estado real do Google Agenda e "Solicitações de acesso" só para superadmin, inclusive na rota.

## Critérios de aceite

- [x] Rotas `app/(app)/configuracoes/{index,perfil,usuarios,solicitacoes}.jsx`; telas `screens/SettingsScreen.jsx`,
      `screens/ProfileEditScreen.jsx`, componentes `screens/Settings/*.jsx`, `components/settings/PhoneField.jsx`.
      Removidos os TS só desta tela (`SettingsScreen.tsx`, `SettingsProfileField`, `SettingsPhoneField`,
      `SettingsActionLink`, `settingsUi`). Ficaram os TS usados por outras partes (`authStore`, `themeStore`,
      `phoneCountries`, `internationalPhone`, `CountryFlagImage`, `SignOutHeaderButton`, `settingsRoutes`).
- [x] Topo com menu (some onde há navegação no topo), "Configurações", "Sua conta, do seu jeito" e avatar com iniciais.
- [x] Linha de perfil com nome (ou e-mail) do usuário logado → tela "Dados pessoais".
- [x] Dados pessoais: Nome, Telefone (país + formatação) e E-mail, cada um com seu botão, validação, carregando, erro e
      sucesso; estado compartilhado atualizado (`updateDisplayName`, `updatePhone` → `/auth/update-phone`,
      `supabase.auth.updateUser({ email })` com link de confirmação e aviso de troca pendente).
- [x] Suporte: Abrir chamado (`SupportTicketModal`), Fale com o agente e Grupo de suporte (mesmos links do WhatsApp; aviso
      quando não abre).
- [x] Equipe: "Gerenciar usuários" para admin/superadmin; "Solicitações de acesso" só superadmin. Papel relido do vínculo
      com a empresa (`resolveRoleAndEmpresa`). Rotas protegidas por `RoleGate` (link direto mostra "Acesso restrito").
      O servidor já recusa não-superadmin (edge `manage-access-requests` → 403; backend `requireSuperAdmin`).
- [x] Google Agenda: estado real (Conectado / Não conectado / Reconexão necessária / falha ao verificar), folha para
      conectar, reconectar, verificar e desconectar com confirmação. Conectar não cria eventos.
- [x] Aparência: Claro / Automático / Escuro pelo `themeStore` (salvo no aparelho; Automático segue o sistema).
- [x] "Sair da conta" usa o fluxo real (`requestSignOut` → confirmação → limpa sessão e volta ao login).
- [x] Áreas seguras, toques ≥ 44 px, fonte grande (aparência empilha em tela estreita), tema escuro.
- [x] Testes: `lib/__tests__/settingsProfile.test.js`; teste da Agenda que estava vazio (`agendaScreen.test.js`).
- [ ] Teste manual no Android e no iOS (Expo Go).

## Verificação (2026-10-07)

- `npm run lint`: 5 erros antigos, nenhum nos arquivos novos.
- `npm run typecheck`: 58 erros antigos (eram 62), nenhum nos arquivos novos.
- `npm test`: 338 passando; 7 suítes antigas em `.ts` continuam falhando.
- `npx expo export --platform android --platform ios`: os dois pacotes gerados.

## File List

- `frontend/app/(app)/configuracoes/index.jsx`, `perfil.jsx`, `usuarios.jsx`, `solicitacoes.jsx`
- `frontend/screens/SettingsScreen.jsx`, `frontend/screens/ProfileEditScreen.jsx`
- `frontend/screens/Settings/SettingsRows.jsx`, `GoogleAgendaSheet.jsx`, `RoleGate.jsx`
- `frontend/components/settings/PhoneField.jsx`
- `frontend/hooks/useCurrentRole.js`, `frontend/hooks/useGoogleConnection.js`
- `frontend/lib/settingsProfile.js`, `frontend/lib/settingsRoutes.ts` (rota `perfil`)
- `frontend/lib/__tests__/settingsProfile.test.js`, `frontend/lib/finance/__tests__/agendaScreen.test.js`

## Change Log

- 2026-10-07 — Implementação (@dev).
