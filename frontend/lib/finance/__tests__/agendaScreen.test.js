import {
  buildAgendaModel,
  dayHeading,
  describeEventWhen,
  dotsAccessibleLabel,
  endAfterStart,
  googleEventSpan,
  googleTimeRange,
  newEventForm,
  parseTransactionReminder,
  periodTitle,
  shiftDay,
  splitDayItems,
  todayKeyInAppTimeZone,
  viewRange,
} from '@/lib/finance/agendaScreen';

describe('datas e vistas', () => {
  it('hoje segue o fuso de São Paulo', () => {
    expect(todayKeyInAppTimeZone(new Date('2026-10-08T01:00:00Z'))).toBe('2026-10-07');
    expect(todayKeyInAppTimeZone(new Date('2026-10-08T04:00:00Z'))).toBe('2026-10-08');
  });

  it('viewRange cobre a grade do mês, a semana seg–dom e o dia', () => {
    expect(viewRange('month', '2026-10-07')).toEqual({ startKey: '2026-09-28', endKey: '2026-11-01' });
    expect(viewRange('week', '2026-10-07')).toEqual({ startKey: '2026-10-05', endKey: '2026-10-11' });
    expect(viewRange('day', '2026-10-07')).toEqual({ startKey: '2026-10-07', endKey: '2026-10-07' });
  });

  it('googleTimeRange vai até o início do dia seguinte', () => {
    expect(googleTimeRange({ startKey: '2026-10-05', endKey: '2026-10-11' })).toEqual({
      timeMin: '2026-10-05T00:00:00-03:00',
      timeMax: '2026-10-12T00:00:00-03:00',
    });
  });

  it('shiftDay limita o dia ao fim do mês e vira o ano', () => {
    expect(shiftDay('month', '2026-01-31', 1)).toBe('2026-02-28');
    expect(shiftDay('month', '2026-12-15', 1)).toBe('2027-01-15');
    expect(shiftDay('month', '2026-01-10', -1)).toBe('2025-12-10');
    expect(shiftDay('week', '2026-10-07', -1)).toBe('2026-09-30');
    expect(shiftDay('day', '2026-12-31', 1)).toBe('2027-01-01');
  });

  it('periodTitle mostra semana entre meses e anos', () => {
    expect(periodTitle('month', '2026-10-07')).toBe('Outubro 2026');
    expect(periodTitle('week', '2026-10-07')).toBe('Outubro 2026');
    expect(periodTitle('week', '2026-10-01')).toBe('Set – Out 2026');
    expect(periodTitle('week', '2026-12-30')).toBe('Dez 2026 – Jan 2027');
  });

  it('dayHeading inclui o ano só quando difere de hoje', () => {
    expect(dayHeading('2026-10-05', '2026-10-07')).toBe('Segunda-feira, 5 de outubro');
    expect(dayHeading('2026-10-05', '2025-12-01')).toBe('Segunda-feira, 5 de outubro de 2026');
  });
});

describe('googleEventSpan', () => {
  it('dia inteiro usa fim exclusivo', () => {
    const span = googleEventSpan({ start: { date: '2026-10-05' }, end: { date: '2026-10-08' } });
    expect(span.map((d) => d.key)).toEqual(['2026-10-05', '2026-10-06', '2026-10-07']);
  });

  it('evento que termina à meia-noite fica num dia só', () => {
    const span = googleEventSpan({
      start: { dateTime: '2026-10-06T22:00:00-03:00' },
      end: { dateTime: '2026-10-07T00:00:00-03:00' },
    });
    expect(span.map((d) => d.key)).toEqual(['2026-10-06']);
  });

  it('converte UTC para o dia de São Paulo e ocupa vários dias', () => {
    expect(googleEventSpan({ start: { dateTime: '2026-10-07T02:30:00Z' } })).toEqual([{ key: '2026-10-06', endTime: null }]);
    const span = googleEventSpan({
      start: { dateTime: '2026-10-05T20:00:00-03:00' },
      end: { dateTime: '2026-10-07T10:00:00-03:00' },
    });
    expect(span).toEqual([
      { key: '2026-10-05', endTime: '10:00' },
      { key: '2026-10-06', endTime: '10:00' },
      { key: '2026-10-07', endTime: '10:00' },
    ]);
  });
});

describe('parseTransactionReminder', () => {
  it('lê o formato do app e do site', () => {
    expect(
      parseTransactionReminder({ summary: 'Pagar: R$ 25,00', description: 'Categoria: Luz\nValor: R$ 25,00' }),
    ).toEqual({ tipo: 'saida', valor: 25, categoria: 'luz' });
    expect(
      parseTransactionReminder({ summary: 'Receber: R$\u00a01.250,50 — Salário', description: 'Categoria: Salário\nValor: R$ 1.250,50' }),
    ).toEqual({ tipo: 'entrada', valor: 1250.5, categoria: 'salário' });
  });

  it('ignora eventos comuns', () => {
    expect(parseTransactionReminder({ summary: 'Dentista', description: 'Categoria: Saúde\nValor: R$ 10' })).toBeNull();
    expect(parseTransactionReminder({ summary: 'Pagar: R$ 25,00', description: 'sem detalhes' })).toBeNull();
  });
});

describe('buildAgendaModel', () => {
  const transactions = [
    { id: 1, tipo: 'saida', valor: 25, status: 'pendente', classificacao: 'Luz', data: '2026-10-07', conta_id: 'c1' },
    { id: 2, tipo: 'entrada', valor: 100, status: 'recebido', classificacao: 'Salário', data: '2026-10-07' },
    { id: 3, tipo: 'saida', valor: 10, status: 'pago', classificacao: 'Fora', data: '2026-12-01' },
  ];
  const googleEvents = [
    { id: 'r1', summary: 'Pagar: R$ 25,00 — Luz', description: 'Categoria: Luz\nValor: R$ 25,00', start: { date: '2026-10-07' }, end: { date: '2026-10-08' } },
    { id: 'r2', summary: 'Pagar: R$ 99,00', description: 'Categoria: Luz\nValor: R$ 99,00', start: { date: '2026-10-07' }, end: { date: '2026-10-08' } },
    { id: 'm', summary: 'Viagem', start: { date: '2026-10-06' }, end: { date: '2026-10-09' } },
    {
      id: 'rec_1',
      recurringEventId: 'rec',
      summary: 'Academia',
      start: { dateTime: '2026-10-08T07:00:00-03:00' },
      end: { dateTime: '2026-10-08T08:00:00-03:00' },
    },
  ];
  const model = buildAgendaModel({
    transactions,
    googleEvents,
    contas: [{ id: 'c1', nome: 'Nubank' }],
    startKey: '2026-10-05',
    endKey: '2026-10-11',
  });
  const byId = Object.fromEntries(model.items.map((it) => [it.id, it]));

  it('inclui lançamentos do período com status e conta', () => {
    expect(byId['tx-1']).toMatchObject({ statusLabel: 'A pagar', contaName: 'Nubank', pending: true });
    expect(byId['tx-2']).toMatchObject({ statusLabel: 'Recebido', contaName: 'Sem conta', pending: false });
    expect(byId['tx-3']).toBeUndefined();
  });

  it('lembrete igual ao lançamento não duplica; sem correspondência continua na agenda', () => {
    expect(byId['tx-1'].googleEvent).toEqual({ id: 'r1', htmlLink: null });
    expect(byId['g-r1']).toBeUndefined();
    expect(byId['g-r2']).toBeDefined();
  });

  it('evento de vários dias aparece em cada dia com a posição', () => {
    expect(byId['g-m@2026-10-06'].timeLabel).toBe('Dia inteiro · dia 1 de 3');
    expect(byId['g-m@2026-10-07'].timeLabel).toBe('Dia inteiro · dia 2 de 3');
    expect(byId['g-m@2026-10-08'].timeLabel).toBe('Dia inteiro · dia 3 de 3');
  });

  it('marca recorrência e conta os marcadores por dia', () => {
    expect(byId['g-rec_1']).toMatchObject({ isRecurring: true, recurringEventId: 'rec', time: '07:00' });
    expect(model.dots['2026-10-07']).toEqual({ financeiro: 2, compromissos: 2 });
    expect(dotsAccessibleLabel(model.dots['2026-10-07'])).toBe('2 lançamentos, 2 compromissos');
    expect(dotsAccessibleLabel(undefined)).toBe('sem eventos');
  });

  it('splitDayItems separa sem horário e com horário', () => {
    const { untimed, timed } = splitDayItems(model.byDay['2026-10-08']);
    expect(timed.map((it) => it.id)).toEqual(['g-rec_1']);
    expect(untimed.map((it) => it.id)).toEqual(['g-m@2026-10-08']);
  });
});

describe('formulário de compromisso', () => {
  it('término padrão 1 h depois, virando o dia', () => {
    expect(endAfterStart('2026-10-07', '09:15')).toEqual({ endDate: '2026-10-07', endTime: '10:15' });
    expect(endAfterStart('2026-10-07', '23:30')).toEqual({ endDate: '2026-10-08', endTime: '00:30' });
  });

  it('descreve quando acontece', () => {
    const form = newEventForm('2026-10-07');
    expect(describeEventWhen(form)).toBe('07/10/2026 · 09:00 – 10:00');
    expect(describeEventWhen({ ...newEventForm('2026-10-05', { isAllDay: true }), endDate: '2026-10-07' })).toBe(
      '05/10/2026 a 07/10/2026 · Dia inteiro',
    );
  });
});
