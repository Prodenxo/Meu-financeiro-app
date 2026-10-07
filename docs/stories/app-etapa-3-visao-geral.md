# Story — App etapa 3: Visão geral em JavaScript com dados da API

**Status:** InReview
**Origem:** `AGENTS.md` → Produto → etapa (3) "visão geral"; pedido do dono com imagem de referência (2026-10-07).
**Referências:** `..\Meu-financeiro-clone\web\lib\finance\*` (regras), `web/app/(app)/visao-geral` (funcionalidades),
API `..\Meu-financeiro-clone\backend` (dados).

## Descrição

A Visão geral do app lia lançamentos, categorias, orçamentos e contas direto do Supabase, com cálculos espalhados
pela tela em TypeScript. O dono pediu: (1) converter a tela e suas dependências para JavaScript; (2) aplicar o
visual da imagem (fundo lavanda, cards brancos, saldo azul-marinho, entradas verdes, saídas coral); (3) buscar os
dados pela API do Meu Financeiro, com as mesmas regras do site, sem dados simulados.

## Critérios de aceite

- [x] Rota `app/(app)/index.jsx` e tela `screens/DashboardScreen.jsx` em JavaScript; componentes em
      `screens/Dashboard/overview/*.jsx` e Visão BPO em `screens/Dashboard/DashboardBpoView.jsx`.
- [x] Regras financeiras iguais às do site: `frontend/lib/finance/*.js` são cópias de `web/lib/finance/*`;
      testes do site portados para Jest (`lib/finance/__tests__/dashboard.test.js`).
- [x] Dados pela API com o token da sessão: `GET /api/transactions`, `/api/contas-financeiras` (nova),
      `/api/categories`, `/api/categories/budgets/summary`, `/dre-matrix`, `/yearly`. Em 401 a sessão é renovada
      e a chamada repetida uma vez; se não renovar, a tela pede para entrar de novo.
- [x] Sem a rota de contas no servidor (404), as contas são lidas com o token do próprio usuário (RLS), como o site.
- [x] Cabeçalho com logo, saudação e avatar (abre Configurações); seletor de mês e botão Visão BPO; filtro de conta
      (Todas · contas · Sem conta vinculada) com rolagem só horizontal.
- [x] Saldo, Entradas e Saídas com mesma largura, altura e espaçamento; Resumo do mês em 2 colunas com títulos completos;
      Conta global; Orçamento por categoria (Entrada/Saída, faixas OK/Dentro do orçamento · Atenção · Cuidado · Alerta);
      Precisa de atenção; Movimentação de hoje (só no mês atual); Saldo no mês (gráfico); Movimentações do mês
      (Pagos/A pagar por categoria); Últimas movimentações com "Ver todas"; Solicitações de acesso (superadmin).
- [x] Atualiza ao trocar mês/conta, ao voltar para a tela e ao puxar para atualizar; respostas antigas são descartadas.
- [x] Carregando (esqueleto), vazio, erro com "Tentar de novo" e aviso quando a atualização falha mas os dados anteriores
      ficam na tela. Falha de rede nunca vira R$ 0,00.
- [x] Troca de usuário (ex.: "Acessar como") não mostra dados do usuário anterior.
- [x] `lint` sem erros nos arquivos novos; `typecheck` caiu de 80 para 69 erros (todos em arquivos não tocados);
      testes novos passam; bundles Android e iOS gerados com `expo export`.

## Fora do escopo

- Área MEI. Filtro por empresa/espaço (não existe na Visão geral do site nem do app).
- Componentes pesados da Visão BPO (matriz e gráficos por categoria) continuam em TypeScript e são reaproveitados.

## Diferenças conhecidas (backend × site)

- Resumo de orçamento do backend conta entradas `pago` além de `recebido` (site: só `recebido`); afeta só lançamentos antigos.
- Backend usa só orçamentos do usuário; o site também soma linhas com `user_id` nulo.

## File List

- `frontend/app/(app)/index.jsx` (novo; substitui `index.tsx`)
- `frontend/screens/DashboardScreen.jsx` (novo; substitui `DashboardScreen.tsx`)
- `frontend/screens/Dashboard/DashboardBpoView.jsx` (novo)
- `frontend/screens/Dashboard/overview/*.jsx`, `overviewTokens.js` (novos)
- `frontend/hooks/useDashboardData.js` (novo)
- `frontend/lib/financeApi.js` (novo) + `lib/__tests__/financeApi.test.js`
- `frontend/lib/finance/{normalize,status,contas,format,dashboard}.js` (novos) + `lib/finance/__tests__/dashboard.test.js`
- `frontend/package.json` (Jest: testes `.js/.jsx` e alias `@/`), `frontend/eslint.config.js` (globais do Jest em `.js`)
- Removidos: `DashboardScreen.tsx`, `Dashboard/{DashboardMissionControl,DashboardBudgetCard,DashboardSaldoChart,
  DashboardDailyFlow,DashboardExpenseSection,DashboardRecentActivity,DashboardContasResumo,DashboardContaGlobalLink,
  DashboardAccessRequests,DashboardPageHeader,DashboardSectionHeader}.tsx`, `dashboardInsights.ts`,
  `lib/__tests__/dashboardDailyFlow.test.ts`, `hooks/{useDashboardCategories,useDashboardBudgetSummary,useDashboardBpo,useBpoMatrix}.ts`
- Backend (`Meu-financeiro-clone`, branch `feat/api-contas-financeiras`): `routes/contas-financeiras.routes.js`,
  `controllers/contas-financeiras.controller.js`, `routes/index.js`, `tests/contas-financeiras.routes.contract.test.js`

## Change Log

- 2026-10-07 — Story criada e implementada (etapa 3).
