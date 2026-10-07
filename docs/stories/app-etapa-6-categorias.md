# Story - App etapa 6: Categorias em JavaScript

**Status:** InReview
**Origem:** `AGENTS.md` → Produto → etapa (6) "categorias"; pedido do dono com imagem de referência (2026-10-07).
**Referências:** site `web/lib/finance/categorias.js` e `categoryColors.js` (cópias em `frontend/lib/finance/`),
backend `Meu-financeiro-clone/backend` branch `feat/api-categorias-app`.

## Descrição

Tela de Categorias no padrão novo: mês, abas Saídas/Entradas, card de resumo, barra de distribuição, busca e filtros,
grupos "Com movimento" / "Sem movimento", criar, editar e excluir categoria com regras do servidor.

## Critérios de aceite

- [x] Rota `app/(app)/categorias.jsx`, tela `screens/CategoriasScreen.jsx`, componentes `screens/Categorias/*.jsx`;
      arquivos TS antigos removidos (`CategoriasScreen.tsx`, `CategoryDashboardRow`, `CategoriasSummary`, `CategoriaModal`,
      `categoriasPageChrome`, `useCategoryMonthSpending`).
- [x] Valores pela mesma regra do site (`buildCategoriaRows`): saída = todos os status; entrada = recebido (cai para
      todos se não houver); lançamentos sem categoria válida viram "Sem categoria".
- [x] Totais calculados sobre todos os lançamentos: `GET /transactions` agora pagina em blocos de 1000 (antes cortava
      em 1000 linhas pelo limite do Supabase).
- [x] Percentual seguro (total zero, estorno, valor negativo); "Outras (n)" só na barra de distribuição.
- [x] Expandir mostra os lançamentos do mês da categoria e leva para Transações já filtrado.
- [x] Menu ⋮ só para categoria do próprio usuário; "Sem categoria" sem editar/excluir.
- [x] Backend: `PUT /categories` valida nome (1–60), tipo e duplicado; renomeia `classificacao` dos lançamentos.
      `DELETE /categories` move os lançamentos para a categoria padrão ("Outros" 62/228) antes de apagar e recusa
      apagar a própria padrão. Testes em `backend/tests/categories-write-rules.test.js`.
- [x] Estados: carregando, vazio, sem resultados, erro com tentar de novo; confirmação antes de excluir.
- [x] Testes `lib/finance/__tests__/categoriasScreen.test.js`.
- [ ] Publicar a branch do backend (`feat/api-categorias-app`).
- [ ] Teste manual no Android e no iOS (Expo Go).

## Pendências conhecidas

- `GET /api/categories` copia as categorias globais para o usuário a cada chamada: categoria vinda de uma global volta
  depois de excluída (comportamento anterior, `ensureGlobalCategoriesCopiedForUser`).
- O carregador do site (`web/lib/data/dashboard.js`) ainda lê no máximo 1000 lançamentos.
- Ícone e cor são automáticos (nome e id); a tabela não guarda ícone/cor.

## Change Log

- 2026-10-07 — Implementação (@dev).
