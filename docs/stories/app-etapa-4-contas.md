# Story - App etapa 4: Contas em JavaScript com dados da API

**Status:** InReview
**Origem:** `AGENTS.md` → Produto → etapa (4) "contas"; pedido do dono com imagem de referência (2026-10-07).
**Referências:** `..\Meu-financeiro-clone\web\app\(app)\contas` (`actions.js`, `openFinanceActions.js`),
`web/components/contas/*` (funcionalidades), `web/lib/finance/contasPage.js` e `bankCatalog.js` (regras),
API `..\Meu-financeiro-clone\backend` (dados).

## Descrição

A tela Contas do app estava em TypeScript, gravava direto no Supabase e usava cartões grandes por conta. O dono
pediu o visual da imagem (cartão azul-marinho com o total, lista única com divisórias, botão "Adicionar conta"),
JavaScript, dados reais pela API e as mesmas funções do site, sem inventar recursos de cartão de crédito.

## Critérios de aceite

- [x] Rota `app/(app)/contas.jsx`, tela `screens/ContasScreen.jsx`, componentes em `screens/Contas/*.jsx`; arquivos TS
      só desta tela removidos (`ContasScreen.tsx`, `ContaCard`, `ContaModal`, `ContasMetrics`, `contasPageChrome`,
      `BankPickerGrid`). Ficaram os TS usados por outras telas (`contaFinanceiraStore`, `BankIcon`, `bankCatalog.ts`,
      `contaFinanceiraTypes`, `contaFinanceiraDefault`, `bancoBrasilSvg`).
- [x] Topo com menu (abre o menu lateral; some onde há navegação no topo), "Contas" e avatar; título "Contas e cartões".
- [x] Cartão com "TOTAL NAS CONTAS" = soma do saldo atual das contas **ativas** (saldo inicial + lançamentos pagos /
      recebidos), quantidade de contas ativas e aviso de contas desativadas (não entram no total). Sem campo de moeda
      nas contas: tudo em R$, nada é convertido.
- [x] Mostrar/ocultar valores: esconde o total, os saldos e o limite de cada conta; fica salvo no aparelho.
- [x] "Minhas contas" com contador e lista única: logo real (logo do banco sincronizado → ícone do catálogo → iniciais),
      nome completo (até 2 linhas, leitor de tela lê tudo), "Padrão" (regra do site), "Sincronizada", tipo cadastrado,
      limite só se for cartão com limite, saldo negativo em coral com "−", menu ⋮.
- [x] Tela estreita ou fonte grande: o saldo desce para baixo do nome e nunca é cortado.
- [x] Menu da conta: Editar conta, Ver movimentações (abre Transações filtrada pela conta), Atualizar extrato e
      Desconectar banco (só conta sincronizada; mesmas rotas do site), Excluir conta.
- [x] Formulário igual ao site: banco do catálogo (com busca) ou "Outra conta", nome, tipo, saldo inicial, limite e dias
      só para cartão, cor. Mesmas validações e mensagens; erro do servidor aparece no campo; campos continuam
      preenchidos se falhar; um envio por vez.
- [x] Exclusão com confirmação que diz quantos lançamentos ficam sem conta; nenhum lançamento é apagado nem tem o valor
      alterado (o banco faz `ON DELETE SET NULL`).
- [x] Estados: esqueleto na primeira carga, vazio com "Cadastrar primeira conta", erro com "Tentar de novo" (ou "Entrar
      novamente" se a sessão acabou), aviso quando a atualização falha mantendo os dados, puxar para atualizar.
- [x] Depois de gravar: recarrega a tela e os stores antigos (seletores de conta em TS); Visão geral e Transações
      recarregam ao voltar para elas.
- [x] Backend (`feat/api-contas-app` do clone): `POST /api/contas-financeiras`, `PUT /:id`, `DELETE /:id` com auth,
      filtro por `user_id`, 404 para conta de outro usuário e as validações do site (`conta-financeira-input.js`).
      Funções do robô (WhatsApp) sem mudança.
- [x] Servidor ainda sem as rotas (404 sem JSON): grava com o token do usuário, como o site (RLS).

## Fora do escopo

- Conectar banco (compra da sincronização e widget) — fica na etapa da sincronização bancária.
- "Definir conta padrão": não existe campo; a padrão continua sendo a regra do site.
- Gráfico de evolução, distribuição por instituição e últimas movimentações da página do site.

## Verificação

- `node --test` (backend): `conta-financeira-input`, `contas-financeiras.routes.contract`, testes de conta padrão,
  saldo e robô — todos passam.
- `npm run lint`: só os 5 erros antigos (imports de vitest); arquivos novos sem avisos.
- `npm run typecheck`: 62 erros antigos (eram 66; os da tela antiga saíram), nenhum desta tela.
- `npm test`: 313 passam; as 7 suítes que falham já falhavam antes.
- `npx expo export --platform android --platform ios`: os dois pacotes geram sem erro.
- Pendente: conferir no aparelho (Android e iOS) com dados reais depois de publicar o backend.

## File List

- `frontend/app/(app)/contas.jsx` (novo; removido `contas.tsx`)
- `frontend/screens/ContasScreen.jsx` (novo; removido `ContasScreen.tsx`)
- `frontend/screens/Contas/ContasTopBar.jsx`, `ContasSummaryCard.jsx`, `ContaRow.jsx`, `ContaFormSheet.jsx`,
  `ContaSheets.jsx`, `ContasStates.jsx`, `__tests__/ContaRow.test.jsx` (novos)
- `frontend/screens/Contas/ContaCard.tsx`, `ContaModal.tsx`, `ContasMetrics.tsx`, `contasPageChrome.tsx` (removidos)
- `frontend/components/contas/BankLogo.jsx` (novo); `BankPickerGrid.tsx` (removido)
- `frontend/lib/finance/contasPage.js`, `bankCatalog.js` (cópias do site, não editar)
- `frontend/lib/finance/contasScreen.js` + `__tests__/contasScreen.test.js` (novos)
- `frontend/lib/financeApi.js` (`createConta`, `updateConta`, `deleteConta`, `syncContaExtrato`,
  `disconnectContaSync`; erro com `errors` e `routeMissing`) + `lib/__tests__/financeApi.test.js`
- `frontend/hooks/useContasData.js`, `frontend/store/valuesVisibilityStore.js` (novos)
- Backend: `src/services/conta-financeira-input.js`, `contas-financeiras.service.js`,
  `src/controllers/contas-financeiras.controller.js`, `src/routes/contas-financeiras.routes.js`,
  `tests/conta-financeira-input.test.js`, `tests/contas-financeiras.routes.contract.test.js`

## Change Log

- 2026-10-07 — @dev: implementação e verificação; status InReview.
