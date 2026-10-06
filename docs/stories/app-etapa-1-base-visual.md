# Story — App etapa 1: base visual (cores, botões, cards, menu inferior)

**Status:** InReview
**Origem:** `AGENTS.md` → Produto → etapa (1) "base visual: cores, botões, cards, menu inferior".
**Referência de design:** `..\Meu-financeiro-clone\web\app\globals.css` (tokens) e `web/components/ui/ui.module.css` (botão, card, pill).

## Descrição

O app de celular ainda usa a paleta antiga (azul + ciano "tech", fundo com grade). O site novo usa
roxo `#5b4fe9`, fundo `#f5f5fa`, cards brancos com borda `#ececf3` e sombra suave; no escuro,
fundo `#0f0f1c` e cards `#181830`. Esta etapa troca a base visual do app para a mesma linguagem,
sem mexer em regras de negócio nem em telas específicas (isso vem nas etapas 2–7).

## Critérios de aceite

- [x] `lib/theme.ts` expõe a paleta do site (claro e escuro) nos tokens já usados pelas telas
      (`primary`, `background`, `card`, `border`, `text*`, semântica financeira) e novos tokens
      (`primaryHover`, `primarySoft`, `cardMuted`, `borderStrong`, `info*`, `warningLight`, `navy*`, `textOnDark`).
- [x] Fundo do app (`shellTokens`, `techDesign.getDashboardCanvasStyle`) passa a ser liso, sem grade,
      na cor `--mf-bg` do site.
- [x] Tokens "tech" (`getTechTokens`) seguem a nova paleta (acento = `primary`) para as telas antigas
      não ficarem com duas cores de marca.
- [x] Componente `MfButton` (`components/ui`): variantes `primary | outline | ghost | danger`,
      tamanhos `md` (40) e `sm` (32), `block`, `loading`, `disabled`, ícone opcional.
- [x] `MfCard` com sombra suave por padrão (igual ao site) e cabeçalho opcional (`title`, `subtitle`, `right`).
- [x] Menu inferior (`AppBottomNav`) renderizado no celular e no web estreito: Início, Transações,
      Contas, Agenda e "Mais" (abre o menu lateral). Item ativo com fundo `primarySoft` e cor `primary`.
      Sem aba MEI (área MEI fica fora do app).
- [x] Telas não ganham espaço vazio por baixo quando o menu inferior está visível
      (inset inferior zerado para o conteúdo).
- [x] `lint`, `typecheck` e `test` sem erros **nos arquivos desta story**. Os gates completos já falhavam
      antes da etapa em arquivos não tocados (testes que importam `vitest`, AsyncStorage sem mock, erros TS
      em telas MEI/legado) — pendência separada.

## Fora do escopo

- Telas de login (etapa 2), visão geral (etapa 3) e demais telas.
- Remover arquivos/estilos "tech" que ainda são usados pelas telas antigas.

## File List

- `frontend/lib/theme.ts`
- `frontend/lib/techDesign.ts`
- `frontend/lib/webScrollbar.ts`
- `frontend/lib/appNavConfig.ts`
- `frontend/components/shell/shellTokens.ts`
- `frontend/components/shell/AppShell.tsx`
- `frontend/components/shell/AppBottomNav.tsx`
- `frontend/components/ui/MfButton.tsx` (novo)
- `frontend/components/ui/MfCard.tsx`
- `frontend/components/ui/types.ts`
- `frontend/components/ui/index.ts`
- `frontend/app/(app)/_layout.tsx`
- `frontend/lib/__tests__/theme.test.ts`
- `frontend/lib/__tests__/appNavConfig.test.ts` (novo)
- `frontend/components/__tests__/MfButton.test.tsx` (novo)
- `frontend/docs/DESIGN-TOKENS.md`

## Change Log

- 2026-10-06 — Story criada e implementada (etapa 1).
