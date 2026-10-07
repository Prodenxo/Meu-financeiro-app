# Story - App etapa 7: Gerenciar acessos em JavaScript

**Status:** InReview
**Origem:** `AGENTS.md` → Produto → etapa (7) "acessos"; pedido do dono com três imagens (Usuários, Convites, Empresas) em 2026-10-07.
**Referências:** backend `Meu-financeiro-clone/backend` (`/api/users*`, `/api/users/empresas*`, `/api/invites*`,
`/api/auth/impersonate`, branch `feat/api-acessos-app`), site `web/lib/acessos/acessos.js` e `web/components/acessos/*`.

## Descrição

Tela "Gerenciar acessos" no padrão novo: cabeçalho compacto com voltar, 4 indicadores (Usuários, Empresas, Ativos,
Bloqueados) em 2 colunas, abas Usuários / Convites / Empresas (Empresas só para superadmin), listas compactas com
separadores e menu ⋮ com ações nomeadas.

## Regras preservadas

- Quem pode o quê é decidido no servidor (403 fora do escopo). Admin só gerencia perfil Usuário da própria empresa;
  ninguém bloqueia/exclui a si mesmo nem troca o próprio perfil; superadmin não altera outro superadmin.
- "Acessar como": o servidor agora confere perfil/empresa do alvo e registra no log quem fez; a volta é pela faixa
  "Sair do modo usuário" (sessão do admin guardada no aparelho, como antes).
- Senha: link por e-mail (nada aparece na tela) ou senha provisória mostrada uma vez com copiar.
- Convite: empresa obrigatória para superadmin (admin usa a dele), reutilizável ou uso único, validade fixa de 7 dias,
  quem entra vira Usuário. Link de uso único só pode ser copiado logo após gerar (o servidor não guarda o token).
- Excluir empresa remove os vínculos e os convites pendentes; contas e dados financeiros das pessoas continuam.
- Excluir usuário apaga a conta e os dados dela (como no site), com confirmação.
- O backend não pagina: as listas completas vêm da API e busca, filtros, ordem, páginas e totais são calculados sobre
  o conjunto inteiro. Superadmin buscando também consulta `GET /users?search=` (acha contas sem empresa).
- Cobrança de vagas MEI (Stripe) ficou fora do app por decisão do dono.

## Critérios de aceite

- [x] Rota `app/(app)/configuracoes/usuarios.jsx` (RoleGate) → `screens/AcessosScreen.jsx` + `screens/Acessos/*.jsx`;
      TS antigos removidos (`ManageUsersScreen.tsx`, `components/admin/*`, `EmpresaModal.tsx`, `lib/user-management.ts`,
      `lib/managedUserActions.ts`, `lib/matchManagedUserSearch.ts`).
- [x] Regras do site copiadas sem mudança (`lib/acessos/acessos.js`); extras do app em `lib/acessos/acessosScreen.js`;
      chamadas em `lib/acessosApi.js`; dados em `hooks/useAcessosData.js`.
- [x] Usuários: busca (nome, e-mail, telefone, empresa), filtros (situação, perfil, empresa), A–Z/Z–A, páginas de 25
      com contagem real, criar/editar (perfil, empresa, MEI, validade), detalhes completos, acessar como, redefinir
      senha, bloquear/liberar, excluir, ver equipe — tudo no menu com confirmação nas ações destrutivas.
- [x] Convites: gerar link (botão desabilitado sem empresa), resultado com copiar, lista de pendentes com usos, autor,
      criação, validade e tipo; copiar e revogar com confirmação; lista e totais recarregam.
- [x] Empresas: busca por nome/CNPJ, filtro MEI com contagem, criar/editar (CNPJ com preenchimento automático, vagas MEI,
      limite sem MEI), detalhes com usuários vinculados, ver usuários, excluir.
- [x] Estados: carregando, vazio, sem resultado, erro com tentar de novo, dados desatualizados; aba mantida ao voltar
      dos formulários.
- [x] Backend: guarda do "acessar como", lista filtrada para admin no servidor, autor do convite, convite reutilizável
      aceito várias vezes sem contar em dobro no cadastro, CNPJ na lista de empresas (+ testes).
- [x] Testes: `lib/acessos/__tests__/acessosScreen.test.js`, `backend/tests/access-management-rules.test.js`.
- [ ] Publicar a branch do backend (`feat/api-acessos-app`).
- [ ] Teste manual no Android e no iOS (Expo Go) com superadmin e com admin.

## Pendências conhecidas

- Sem tabela de auditoria: o "acessar como" fica só no log do servidor.
- Colunas `is_reusable`, `uses_count`, `raw_token` e a função `increment_invite_uses` existem no banco mas não nas
  migrations do repositório.
- Superadmin pode redefinir a senha de outro superadmin (acesso de emergência, regra do backend).
- Usuário com mais de um vínculo aparece uma vez (o vínculo mais recente).

## Change Log

- 2026-10-07 — Implementação (@dev).
