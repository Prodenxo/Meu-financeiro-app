# Story - App etapa 6: Agenda em JavaScript

**Status:** InReview
**Origem:** `AGENTS.md` → Produto → etapa (6) "agenda"; pedido do dono com imagem de referência (2026-10-07).
**Referências:** site `web/lib/finance/agenda.js` (cópia em `frontend/lib/finance/agenda.js`), edge `google-calendar`.

## Descrição

Agenda com vistas Mês / Semana / Dia juntando lançamentos e compromissos do Google Agenda, criação e edição de
compromissos e estados de conexão reais. Código entregue no commit `2374ef5`.

## Critérios de aceite

- [x] Rota `app/(app)/agenda.jsx`, tela `screens/AgendaScreen.jsx`, componentes `screens/Agenda/*.jsx`.
- [x] Dados reais: lançamentos e contas pela API; eventos pelo edge `google-calendar` (`lib/googleCalendarApi.js`, renova a
      sessão uma vez em 401).
- [x] Evento de vários dias aparece em cada dia; lembrete do Google igual a um lançamento não duplica.
- [x] Teste `lib/finance/__tests__/agendaScreen.test.js` (o arquivo foi commitado vazio por falta de espaço; reescrito).
- [ ] Teste manual no Android e no iOS (Expo Go).

## Change Log

- 2026-10-07 — Implementação (@dev); teste reescrito junto da etapa 7.
