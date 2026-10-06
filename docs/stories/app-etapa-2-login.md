# Story — App etapa 2: telas de acesso (login) no visual do site

**Status:** InReview
**Origem:** `AGENTS.md` → Produto → etapa (2) "login".
**Referência de design:** `..\Meu-financeiro-clone\web\app\login`, `web/app/forgot`, `web/components/auth/auth.module.css`
(versão mobile do `AuthShell`) e textos de `web/lib/auth/actions.js`.

## Descrição

As telas de acesso do app ainda usavam o visual "tech" antigo (cartão com vidro, fundo com grade, acento ciano,
botão em pílula com brilho). No site, a versão de celular mostra a marca no topo, o seletor de tema à direita
e o formulário direto sobre o fundo, com a paleta roxa da etapa 1. Esta etapa aplica esse visual e os textos
do site às telas de entrar, recuperar senha, cadastro com convite, solicitar acesso e redefinir senha.

## Critérios de aceite

- [x] `authTokens.getAuthPalette` deriva todas as cores de `lib/theme.ts` (claro e escuro), sem cores fixas.
- [x] Layout do celular (`AuthLayoutMobile`): barra superior com a marca (quadrado `primarySoft` + "Meu Financeiro")
      e seletor de tema; formulário sem cartão, largura máxima 420 (ou larga em "solicitar acesso"); rótulo
      em maiúsculas na cor da marca, título e subtítulo; espaço opcional de rodapé.
- [x] Campos e botão com altura 46 e cantos de 12; botão sem brilho; asterisco de obrigatório na cor de erro do tema.
- [x] Seletor de tema usa as cores da marca (sem ciano e sem efeito de vidro).
- [x] Login com os textos do site: "Bem-vindo de volta", "Esqueci minha senha", "Entrar"/"Entrando…", separador "ou",
      "Ainda não tem conta? Cadastre-se" (abre "solicitar acesso"), aviso de convite e aviso de termos.
- [x] Recuperar senha, cadastro com convite, solicitar acesso e redefinir senha com título, subtítulo e rótulo do site.
- [x] Novos componentes `AuthDivider` e `AuthBottomText` com teste.
- [x] `lint`, `typecheck` e `test` sem erros **nos arquivos desta story** (falhas antigas em outros arquivos continuam).

## Fora do escopo

- Layout de computador no web (`AuthLayoutWeb`) — só herda a nova paleta.
- Regras de autenticação, convites e solicitação de acesso (sem mudança de comportamento).

## File List

- `frontend/components/shell/BrandMark.tsx` (novo)
- `frontend/components/auth/authTokens.ts`
- `frontend/components/auth/AuthLayoutMobile.tsx`
- `frontend/components/auth/AuthEyebrow.tsx`
- `frontend/components/auth/AuthThemeToggle.tsx`
- `frontend/components/auth/AuthFormControls.tsx`
- `frontend/components/AuthLegalFooter.tsx`
- `frontend/app/(auth)/login.tsx`
- `frontend/app/(auth)/forgot.tsx`
- `frontend/screens/auth/RegisterAuthForm.tsx`
- `frontend/screens/auth/AccessRequestForm.tsx`
- `frontend/screens/auth/ResetPasswordScreen.tsx`
- `frontend/components/__tests__/AuthFormControls.test.tsx` (novo)

## Change Log

- 2026-10-06 — Story criada e implementada (etapa 2).
