# Story — App etapa 5: Transações em JavaScript com dados da API

**Status:** InReview
**Origem:** `AGENTS.md` → Produto → etapa (5) "transações"; pedido do dono com imagem de referência (2026-10-07).
**Referências:** `..\Meu-financeiro-clone\web\lib\finance\transactions.js`, `recorrencias.js`, `transactionModal.js`
(regras), `web/app/(app)/transacoes` (funcionalidades), API `..\Meu-financeiro-clone\backend` (dados).

## Descrição

A tela Transações do app (5 mil linhas em TypeScript) lia e gravava direto no Supabase e não tinha detalhes,
ordenação nem período personalizado funcionando no celular. O dono pediu: converter a tela para JavaScript, aplicar o
visual da imagem (mesma identidade da Visão geral), usar a API com as regras do site e manter todas as funções.

## Critérios de aceite

- [x] Rota `app/(app)/transacoes.jsx`, tela `screens/TransactionsScreen.jsx` e componentes em `screens/Transactions/*.jsx`;
      arquivos TS antigos da tela removidos (nenhuma outra tela os usava). Libs TS ainda usadas por outras telas ficaram.
- [x] Topo: voltar, "Transações", exportar/compartilhar e avatar. Seletor ‹ mês 📅 › (setas só no modo mês; o calendário
      abre o período).
- [x] "Resumo do mês" com Entradas e Saídas em duas colunas que quebram linha se não couberem; "Detalhes" mostra saldo,
      contagens e o que os totais consideram (critério do site: período + busca + categoria + conta, com pendentes,
      sem previsões; avisa quando o filtro de tipo/situação não entra nos totais).
- [x] Busca por categoria, observação ou valor ("4000", "4.000,00"); botão de filtros com selo; chips Todas / Entradas /
      Saídas / Pendentes como filtros reais (Pendentes = a pagar / a receber).
- [x] Filtros: período (Hoje, Esta semana, Mês, Personalizado com validação), tipo, situação, conta (inclui Sem conta),
      categoria e ordenação (mais recentes, mais antigas, maior e menor valor). Contagem "N movimentações".
- [x] Lista `SectionList` virtualizada, chave = id, um cabeçalho por dia ("22 de outubro • quinta-feira") nas ordenações
      por data e lista única nas por valor; linhas compactas; valor sempre inteiro (passa para a linha de baixo em tela
      estreita ou fonte grande); sinal só na apresentação.
- [x] Linha pendente com "Marcar como pago/recebido"; previsão de recorrência com "Prevista" e "Lançar agora".
- [x] Detalhes do lançamento e menu ⋯ com Editar, Duplicar, Marcar como pago/recebido, Excluir.
- [x] Formulário com tipo, valor, categoria do tipo, conta (opcional = Sem conta), data, já pago/recebido, observação
      (500), "Repetir todo mês" (sem limite, 3, 6, 12 ou 1–1200) e "Lembrar no Google Agenda" para pendentes (pede
      autorização do Google quando falta). Mensagens de validação iguais às do site.
- [x] Exclusão simples ou, para recorrentes: apenas este (registra o mês pulado), este e os futuros (desativa a
      recorrência) ou toda a recorrência.
- [x] Exportar planilha (xlsx) com os filtros atuais pelo botão do topo, sem previsões.
- [x] "+ Nova" flutuante sem cobrir conteúdo: a lista reserva espaço no fim; o menu inferior fica fora da área da tela.
- [x] Atualiza ao voltar para a tela, ao puxar e depois de toda gravação; respostas antigas são descartadas; a posição da
      lista é mantida (a lista não é remontada ao atualizar).
- [x] Carregando (esqueleto), vazio, sem resultados (com "Limpar filtros"), erro com "Tentar de novo" e aviso quando a
      atualização falha com dados anteriores na tela. Falha de rede nunca vira lista vazia nem R$ 0,00.
- [x] Backend (`feat/api-transacoes-app` no clone): POST aceita `sem_conta` e vínculo com recorrência do próprio usuário;
      PUT não deixa trocar dono, id nem vínculo e valida a conta; DELETE com `escopo`; `GET /api/recorrencias/skips`.

## Endpoints usados

`GET/POST/PUT/DELETE /api/transactions`, `GET/POST /api/recorrencias`, `GET /api/recorrencias/skips` (nova),
`GET /api/contas-financeiras`, `GET /api/categories`; Google Agenda pelo `createCalendarEvent` já existente
(`check-auth` + `create-event`).

## Verificação

- Jest: regras do site (`transactions.test.js`, `transactionModal.test.js`), `transactionsScreen.test.js`,
  `transactionSave.test.js`, `financeApi.test.js` passam. Falhas restantes são as antigas (vitest, AsyncStorage, 2 asserts).
- `lint`: 0 erros/avisos nos arquivos novos (5 erros antigos de testes com vitest).
- `typecheck`: 69 → 66 erros, todos em arquivos não tocados.
- `expo export` Android + iOS: bundles gerados.
- Backend: `node --test` de `transactions.service`, `recorrencias-routes.contract`, `openclaw-bot.service`,
  `openclaw-transaction-payload` — 26/26.

## Pendências

- Publicar o backend com as rotas novas. Até lá, no servidor antigo: "Sem conta" vira a conta padrão, "Lançar agora"
  e "Repetir todo mês" gravam sem o vínculo e a exclusão por escopo apaga só o lançamento (os meses pulados já são lidos
  direto do banco quando a rota não existe).
- `/api/transactions` não tem paginação; a base inteira é carregada (necessária para os totais) e a lista é virtualizada.
- Teste manual em aparelho Android e iOS.

## Fora do escopo

- Área MEI. Seleção múltipla e ações em lote do site.

## File List

- `frontend/app/(app)/transacoes.jsx` (novo; `transacoes.tsx` removido)
- `frontend/screens/TransactionsScreen.jsx` (novo; `TransactionsScreen.tsx` removido)
- `frontend/screens/Transactions/BottomSheet.jsx`, `TransactionsTopBar.jsx`, `TransactionsSummaryCard.jsx`,
  `TransactionsSearchBar.jsx`, `TransactionRow.jsx`, `TransactionDetailsSheet.jsx`, `TransactionsFiltersSheet.jsx`,
  `TransactionFormSheet.jsx`, `DeleteTransactionSheet.jsx`, `TransactionsStates.jsx` (novos; 7 `.tsx` removidos)
- `frontend/screens/Dashboard/overview/OverviewHeader.jsx` (exporta `initialsOf`)
- `frontend/hooks/useTransactionsData.js`, `frontend/store/transactionsViewStore.js` (novos)
- `frontend/lib/financeApi.js` (+ `financeRequest`, recorrências, gravações) e `lib/__tests__/financeApi.test.js`
- `frontend/lib/finance/transactions.js`, `recorrencias.js`, `transactionModal.js`, `money.js` (cópias do site)
- `frontend/lib/finance/transactionsScreen.js`, `transactionSave.js` (novos) e testes em `lib/finance/__tests__/`
- Backend (clone): `services/transactions.service.js`, `services/recorrencias.service.js`,
  `controllers/recorrencias.controller.js`, `routes/recorrencias.routes.js` e testes

## Change Log

- 2026-10-07 — Implementação (@dev).
