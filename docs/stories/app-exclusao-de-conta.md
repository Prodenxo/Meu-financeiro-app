# Story — Excluir a própria conta no app

**Status:** InReview
**Motivo:** exigência da App Store (diretriz 5.1.1(v)) e do Google Play para apps com cadastro; bloqueava o envio da versão 2.3.0.

## Critérios de aceite

- [x] Configurações tem o item "Excluir minha conta" (abaixo de "Sair da conta").
- [x] A confirmação mostra o que será apagado e só libera o botão com a palavra `EXCLUIR`.
- [x] A API (`DELETE /api/users/me`, branch `feat/api-excluir-conta` do `Meu-financeiro-clone`) exige a mesma palavra.
- [x] Superadmin não se exclui; admin com outros usuários ativos na empresa é bloqueado com explicação.
- [x] Antes de apagar, a assinatura da sincronização bancária (Asaas e Stripe) é cancelada; se falhar, nada é apagado.
- [x] Conexões com bancos (Pluggy), convites criados, dados das tabelas do usuário e o login são removidos.
- [x] Depois da exclusão o app encerra a sessão no aparelho e volta para a entrada.

## Pendências

- [ ] Publicar a branch `feat/api-excluir-conta` (backend) antes do build da loja.
- [ ] Teste manual com uma conta descartável no celular.
- [ ] Link de exclusão para o formulário do Google Play (pode apontar para o suporte ou uma página do site).

## File List

- `frontend/lib/accountDeletion.js`, `frontend/lib/__tests__/accountDeletion.test.js`
- `frontend/screens/Settings/DeleteAccountSheet.jsx`, `frontend/screens/SettingsScreen.jsx`
- `frontend/lib/apiClient.ts` (`delete` aceita corpo)
- Backend: `backend/src/services/account-deletion.service.js`, `backend/tests/account-deletion.service.test.js`, `users.controller.js`, `users.routes.js`
