# Story — Atualizar o app para o Expo SDK 57

**Status:** InReview
**Origem:** o Expo Go das lojas (iPhone e Android) só abre projetos SDK 57; o app estava no SDK 55
e não abria no celular. Decisão do dono: atualizar o projeto (2026-10-06).

## Critérios de aceite

- [x] `expo` 57 e todas as dependências alinhadas (`npx expo install --check` = "up to date").
- [x] `expo-doctor` sem falhas novas (única falha restante: pasta `android/` versionada junto com config
      de prebuild — já existia).
- [x] `app.json`: `splash` movido para o plugin `expo-splash-screen` (campo antigo não é aceito no SDK 57).
- [x] Quebras do React Native 0.86 corrigidas: `StyleSheet.absoluteFillObject` removido em runtime →
      `StyleSheet.absoluteFill` (20 arquivos; sem isso os véus de modais e do menu lateral sumiam).
- [x] Quebra do Expo Router 57: tipo `Router` não é mais exportado (`lib/settingsRoutes.ts`).
- [x] TypeScript 6: `types: ["jest", "node"]` no `tsconfig.json` (o TS 6 não carrega mais `@types/*` sozinho).
- [x] Gates sem regressão contra a linha de base: typecheck 85 → 80 erros (nenhum arquivo novo),
      lint 5 erros (iguais aos de antes), Jest com as mesmas 8 suítes antigas falhando.
- [x] Bundle iOS e Android gerado com `npx expo export`.
- [ ] Teste manual no Expo Go (iPhone e Android).

## Decisões

- `userInterfaceStyle` de `light` → `automatic`: com `light` o celular sempre dizia "modo claro" e a opção
  "seguir o sistema" do tema nunca acompanhava o modo escuro do aparelho.
- Regras novas do `eslint-config-expo` 57 (`react-hooks/set-state-in-effect`, `refs`, `immutability`,
  `preserve-manual-memoization`) ficam como **aviso**: são ~117 ocorrências em código anterior, limpeza gradual.
- `package-lock.json` da raiz regenerado com `npm install --prefer-dedupe` (o lock antigo deixava cópias
  duplicadas de `expo-constants`/`expo-linking`; regenerar sem `--prefer-dedupe` gerou árvore quebrada sem
  `ansi-escapes@4`).

## File List

- `frontend/package.json`, `package-lock.json` (raiz)
- `frontend/app.json`, `frontend/tsconfig.json`, `frontend/eslint.config.js`
- `frontend/lib/settingsRoutes.ts`
- 20 arquivos com `StyleSheet.absoluteFill` (componentes, telas, `lib/techDesign.ts`)
- `AGENTS.md`, `.cursor/rules/app-repo.mdc`

## Change Log

- 2026-10-06 — Story criada e implementada.
