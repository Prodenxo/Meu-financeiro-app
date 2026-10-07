# Story - App: remover a área MEI

**Status:** InReview
**Origem:** `AGENTS.md` → Produto → "Área MEI fica de fora (decisão do dono)"; pedido do dono (2026-10-07).

## Descrição

O app ainda carregava a área "Meu MEI" (notas fiscais, guias DAS, catálogos, limite de faturamento, cobrança Stripe do MEI)
e controles de MEI no gerenciamento de usuários. O dono pediu para tirar tudo isso do app. O site continua com o MEI.

## Critérios de aceite

- [x] Sem rota `/mei`, sem item "Meu MEI" no menu (lateral, superior e inferior) e sem `MeuMei` na navegação.
- [x] Apagados tela, modais, componentes (`components/mei/*`, `NotaFiscal*`, `EmpresaStripeMeiBillingModal`), serviços
      (`meiNotasService`, `guidesMeiService`, `meiPrestadorPrefillService`, `adminUserDataService`, `adminBillingService`),
      regras `lib/mei*`, `nfse*`, `plugnotas*` e seus testes. Removida também `AdminUserDataScreen` (sem rota; só emitia nota)
      e os componentes de admin que só ela usava.
- [x] Gerenciar usuários: sem chave "Habilitar MEI", tipos de nota, filtro/contador MEI e cobrança Stripe. A edição
      **não envia** `mei`, então o backend mantém o MEI de quem usa no site (`requestedMei === undefined`).
- [x] Empresa: sem "Módulo MEI"/vagas; o valor salvo (`max_mei`) é reenviado como veio, sem zerar. Cartão mostra só o
      limite de usuários.
- [x] Ativação: passos `mei_*` filtrados em `fetchActivationProgress` com o progresso geral recalculado sem eles.
- [x] Busca de CNPJ do cadastro da empresa continua (só a chamada ao backend; o "plano B" repetia a mesma rota).
- [x] Textos de login/recuperação/suporte sem menção a MEI.
- [ ] Teste manual no Android e no iOS (Expo Go).

## Fica (não é área MEI)

- Gate de CNPJ da empresa (`empresa-cnpj`), regime tributário "MEI" no cadastro da empresa, campo `mei` no `authStore`
  (vem do vínculo; não é usado por tela), nomes `getMeiApi*`/`EXPO_PUBLIC_MEI_API_URL` (cliente do backend geral).

## Verificação (2026-10-07)

- `eslint` nos arquivos alterados: 0 erros.
- `tsc --noEmit`: 24 erros antigos (eram 58), nenhum novo.
- `jest`: 252 passando; 5 suítes antigas continuam falhando (eram 7; 2 eram de MEI).
- `npx expo export --platform android --platform ios`: os dois pacotes gerados.

## Change Log

- 2026-10-07 — Implementação (@dev).
