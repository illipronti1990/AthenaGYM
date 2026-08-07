import {
  extractClassTitle,
  extractDeleteTitleHint,
  formatOpenClassesList,
  isAgendaQuestion,
  isCancelAgendaIntent,
  isCreateScheduleIntent,
  isDeleteScheduleIntent,
  isReserveIntent,
  matchOpenClass,
  parseScheduleDeleteFilter,
  parseScheduleDraft,
  scheduleTitleMatchesHint,
} from './agenda-ai.helpers';

describe('agenda-ai helpers', () => {
  it('detects agenda and reserve intents', () => {
    expect(isAgendaQuestion('minha agenda')).toBe(true);
    expect(isReserveIntent('quero reservar a aula 1')).toBe(true);
    expect(isReserveIntent('como melhorar frequência')).toBe(false);
    expect(isCancelAgendaIntent('cancela a aula Hallucination Check')).toBe(true);
    expect(isCancelAgendaIntent('cancelar a aula 1')).toBe(true);
    expect(isCancelAgendaIntent('desmarcar minha reserva')).toBe(true);
  });

  it('detects create schedule intent for professor phrases', () => {
    expect(isCreateScheduleIntent('agende uma aula para mim de G10 SMOKE')).toBe(true);
    expect(isCreateScheduleIntent('criar aula Yoga amanhã às 10h')).toBe(true);
    expect(
      isCreateScheduleIntent(
        'crie uma agenda chamada AULA SPIN G10 AS 10hs do dia 07/08/2026 na sala 2',
      ),
    ).toBe(true);
    expect(isReserveIntent('agende uma aula de G10 SMOKE')).toBe(false);
    expect(extractClassTitle('agende uma aula para mim de G10 SMOKE')).toBe('G10 SMOKE');
    expect(
      extractClassTitle(
        'crie uma agenda chamada AULA SPIN G10 AS 10hs do dia 07/08/2026 na sala 2',
      ),
    ).toMatch(/AULA SPIN G10/i);
  });

  it('parses schedule draft with defaults', () => {
    const now = new Date('2026-08-06T12:00:00');
    const draft = parseScheduleDraft('agende uma aula de G10 SMOKE', now);
    expect(draft.title).toBe('G10 SMOKE');
    expect(draft.assumedDateTime).toBe(true);
    expect(draft.maxCapacity).toBe(20);
    const withTime = parseScheduleDraft('criar aula Yoga amanhã às 18h', now);
    expect(withTime.title).toBe('Yoga');
    expect(withTime.assumedDateTime).toBe(false);
    const spin = parseScheduleDraft(
      'crie uma agenda chamada AULA SPIN G10 AS 10hs do dia 07/08/2026 na sala 2',
      now,
    );
    expect(spin.title).toMatch(/AULA SPIN G10/i);
    expect(spin.roomHint).toBe('2');
    expect(spin.assumedDateTime).toBe(false);
    const start = new Date(spin.startAt);
    expect(start.getDate()).toBe(7);
    expect(start.getMonth()).toBe(7);
    expect(start.getFullYear()).toBe(2026);
    expect(start.getHours()).toBe(10);
  });

  it('matches by ordinal and title', () => {
    const open = [
      { id: 'a', title: 'Yoga Manhã', startAt: '2026-08-10T10:00:00.000Z' },
      { id: 'b', title: 'G8 Smoke Unique', startAt: '2026-08-12T18:00:00.000Z' },
      { id: 'c', title: 'HIIT Noite', startAt: '2026-08-15T21:00:00.000Z' },
    ];
    expect(matchOpenClass('reservar a aula 1', open)?.id).toBe('a');
    expect(matchOpenClass('reservar yoga', open)?.id).toBe('a');
    expect(matchOpenClass('marcar g8 smoke', open)?.id).toBe('b');
  });

  it('formats open list', () => {
    const open = [{ id: 'a', title: 'Yoga Manhã', startAt: '2026-08-10T10:00:00.000Z' }];
    expect(formatOpenClassesList(open)).toContain('1. Yoga Manhã');
  });

  it('detects delete schedule intent and parses filter', () => {
    const q = 'Exclua todas as aulas SPIN G10 do dia 07/08';
    expect(isDeleteScheduleIntent(q)).toBe(true);
    expect(extractDeleteTitleHint(q)).toMatch(/SPIN G10/i);
    expect(scheduleTitleMatchesHint('AULA SPIN G10', 'SPIN G10')).toBe(true);
    const filter = parseScheduleDeleteFilter(q, new Date('2026-08-06T12:00:00'));
    expect(filter.deleteAll).toBe(true);
    expect(filter.missingDate).toBe(false);
    expect(filter.titleHint).toMatch(/SPIN G10/i);
    expect(isDeleteScheduleIntent('cancela minha reserva de yoga')).toBe(false);
  });
});
