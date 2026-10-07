# Story - App etapa 6: Orçamentos em JavaScript

**Status:** InReview
**Origem:** `AGENTS.md` → Produto → etapa (6) "orçamentos"; pedido do dono com imagem de referência (2026-10-07).
**Referências:** backend `Meu-financeiro-clone/backend` (`/api/categories/budgets*`, branch `feat/api-orcamentos-app`),
site `web/lib/finance/orcamentos.js` e `web/app/(app)/orcamentos/actions.js`.

## Descrição

Tela de Orçamentos no padrão novo: mês, cards Orçado/Realizado, uso do orçamento, novo orçamento, duplicar mês e lista
por categoria com editar/excluir. Orçado e realizado vêm do servidor (`GET /categories/budgets/summary`).

## Regras preservadas

- Uma linha de `orçamentos` por categoria e mês (`date` = dia 1); `valor_orçado` nulo = sem orçamento.
- Realizado (servidor): saída = todas as saídas do mês pela data do lançamento, qualquer status; entrada = recebidas.
- Totais somam só categorias com orçamento (como a tela anterior; metas de receita entram na soma, com aviso).
- Excluir orçamento grava `valor_orçado` nulo: categoria e lançamentos não mudam.
- Duplicar mês copia só os limites do mês anterior (`POST /categories/budgets/duplicate`).

## Critérios de aceite

- [x] Rota `app/(app)/orcamentos.jsx`, tela `screens/OrcamentosScreen.jsx`, componentes `screens/Orcamentos/*.jsx`;
      TS antigos removidos (`OrcamentosScreen.tsx`, `BudgetCategoryRow`, `BudgetModal`, `OrcamentosMetrics`,
      `orcamentosPageChrome`).
- [x] Percentual sem NaN/infinito: limite zero mostra "Sem limite definido"; estornos contam como 0% de uso; acima de
      100% o texto mostra o valor real e a barra fica cheia.
- [x] Estados de consumo: despesa sem gasto neutra (nunca "economia"), dentro, perto (≥75%), no limite, acima;
      receita: nada recebido, em andamento, meta atingida.
- [x] Novo orçamento só oferece categorias sem limite no mês; o servidor recusa duplicidade (409, `only_if_empty`).
- [x] Duplicar mês mostra origem → destino, o que será criado, o que mudaria de valor e o que já é igual; com limites
      diferentes a pessoa escolhe substituir ou manter os atuais. Lançamentos e realizado não são copiados.
- [x] Carregando, mês sem orçamentos, erro com tentar de novo e aviso de dados desatualizados (realizado zero ≠ falha).
- [x] Backend: data do mês lida sem fuso (antes, servidor no fuso do Brasil gravava "2026-10-01" em setembro);
      valor negativo/inválido recusado; resumo do mês pagina os lançamentos (passa de 1000); duplicação confere erros.
- [x] Testes: `lib/finance/__tests__/orcamentosScreen.test.js`, `backend/tests/budgets-write-rules.test.js`.
- [ ] Publicar a branch do backend (`feat/api-orcamentos-app`).
- [ ] Teste manual no Android e no iOS (Expo Go).

## Pendências conhecidas

- Entrada com status `pago` conta como recebida no servidor (`recebido` ou `pago`); o site conta só `recebido`.
- Linhas de orçamento globais (`user_id` nulo) não entram no resumo do servidor (o site lê as duas).
- "Manter os atuais" grava um limite por vez pelo app; num servidor sem esta versão o `only_if_empty` é ignorado.

## Change Log

- 2026-10-07 — Implementação (@dev).
