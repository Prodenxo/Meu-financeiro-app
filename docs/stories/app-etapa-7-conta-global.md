# Story - App etapa 7: Conta global em JavaScript

**Status:** InReview
**Origem:** `AGENTS.md` → Produto → etapa (7) "conta global"; pedido do dono com duas imagens de referência (2026-10-07).
**Referências:** backend `Meu-financeiro-clone/backend` (`/api/moedas-globais/cotacoes`, `/currencies`, branch
`feat/api-conta-global-app`), site `web/lib/finance/moedas.js`, `web/lib/finance/contaGlobal.js` e
`web/app/(app)/conta-global/actions.js`.

## Descrição

Tela Conta global no padrão novo: resumo "Equivalente em reais", aviso de valor de referência, lista compacta das
moedas (bandeira, código, nome, apelido, saldo original, ≈ R$ e cotação usada), menu com atualizar saldo / editar /
excluir, botão "Adicionar moeda" e "Sobre a conversão". Formulário em tela cheia com seletor de moedas.

## Regras preservadas

- Tabela `contas_moeda_global` (`valor` NUMERIC(18,4) ≥ 0, BRL fora); leitura e gravação com o token do usuário (RLS),
  como o site — o backend não tem rotas de CRUD dessa tabela.
- Zero permitido, negativo recusado, várias linhas na mesma moeda permitidas; apelido até 80 caracteres.
- Cotação só do backend (Frankfurter/BCE com ExchangeRate-API de reserva); o saldo original não muda; arredonda só na tela.
- Os saldos não entram na Visão geral (lá existe só o atalho para a tela).

## Critérios de aceite

- [x] Rota `app/(app)/conta-global.jsx`, tela `screens/ContaGlobalScreen.jsx`, componentes `screens/ContaGlobal/*.jsx`;
      TS antigos removidos (tela, carrossel, cards, modal, store, service e helpers `lib/moeda*.ts`).
- [x] Contagem real com rótulo do modelo ("2 saldos cadastrados" / "3 saldos em 2 moedas").
- [x] Cotação faltando aparece como "Sem cotação", nunca zero; total parcial é marcado como parcial; sem nenhuma cotação
      o resumo mostra "Conversão indisponível" com tentar de novo.
- [x] Data da cotação só quando o servidor informa (`sources`); mais de 4 dias = aviso de cotação antiga.
- [x] Formulário: moeda (catálogo do servidor, busca, "Já cadastrada"), apelido opcional, saldo com o código da moeda,
      teclado numérico, casas decimais da moeda (USD 2, JPY 0, KWD 3), prévia ≈ R$, sem envio duplo, erros por campo,
      voltar/fechar/cancelar retornam à lista, teclado e áreas seguras tratados.
- [x] Editar, atualizar saldo e excluir com confirmação; lista e total recarregam após gravar.
- [x] Carregando, vazio, erro de conexão com tentar de novo e aviso de dados desatualizados.
- [x] Backend: `/moedas-globais/cotacoes` devolve `sources` (fonte + data por moeda) e `missing`; reserva usada só para
      o que faltou no Frankfurter.
- [x] Testes: `lib/finance/__tests__/contaGlobalScreen.test.js`, `backend/tests/frankfurter-rates-detailed.test.js`.
- [ ] Publicar a branch do backend (`feat/api-conta-global-app`).
- [ ] Teste manual no Android e no iOS (Expo Go).

## Pendências conhecidas

- Servidor sem esta versão não manda `sources`: a tela funciona, mas sem data da cotação.
- O serviço do backend (assistente) exclui com `ativo = false`; site e app apagam a linha.
- O site esconde no seletor moedas já cadastradas; o app permite (com aviso "Já cadastrada").

## Change Log

- 2026-10-07 — Implementação (@dev).
