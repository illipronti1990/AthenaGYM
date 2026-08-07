import type { ClassEnrollment, Schedule } from '@movvo/shared';
import { canCancelClassReservation, classCancelBlockMessage } from '@movvo/shared';

export type AgendaClassSummary = {
  id: string;
  title: string;
  startAt: string;
  endAt?: string;
  status?: string;
  reservedCount?: number;
  maxCapacity?: number;
  canCancel?: boolean;
  cancelBlockedReason?: string | null;
};

export function isAgendaQuestion(question: string): boolean {
  return /agenda|aula|reserv|agendar|marcar|hor[aá]rio|turma|vaga|cancel[ao]|desmarcar|exclu[aeií]|apag[au]|minha agenda|cri(ar|e)\s+(uma\s+)?(aula|turma|agenda|classe)/i.test(
    question,
  );
}

export function isCreateScheduleIntent(question: string): boolean {
  const q = question.toLowerCase();
  if (
    /(?:criar|crie|abrir|abra|adicionar|adicione)\s+(uma\s+)?(aula|turma|classe|agenda)/i.test(q)
  ) {
    return true;
  }
  if (/agend(e|ar)\s+(uma\s+)?(aula|turma|classe|agenda)?/i.test(q)) return true;
  if (/nova\s+(aula|turma|agenda)/i.test(q)) return true;
  if (/marc(ar|a|que)\s+(uma\s+)?(aula|turma)\s+(de|nova|chamada)/i.test(q)) return true;
  if (/(?:aula|turma|agenda)\s+chamada\b/i.test(q)) return true;
  return false;
}

export function isReserveIntent(question: string): boolean {
  // Student booking existing class — not staff creating a new schedule
  if (isCreateScheduleIntent(question)) return false;
  return /reserv|agendar|marcar(\s+uma)?\s*(aula|turma|vaga)?|quero\s+(a\s+)?(aula|vaga)|me\s+coloca|inscrev/i.test(
    question,
  );
}

/** Staff cancel/delete whole class schedules (not student reservation). */
export function isDeleteScheduleIntent(question: string): boolean {
  if (isCreateScheduleIntent(question)) return false;
  if (/minha\s+reserva|reserva\s+minha/i.test(question)) return false;
  const hasClass = /aula|turma|agenda|classe/i.test(question);
  if (/exclu[aeií]|apagu?e|delet[ae]/i.test(question) && hasClass) return true;
  if (/remov(a|er)\s+(todas?\s+)?(as\s+)?(aulas?|turmas?|agendas?)/i.test(question)) return true;
  if (/cancel(e|ar)\s+(todas?\s+(as\s+)?)?(aulas?|turmas?|agendas?)\b/i.test(question)) {
    return /todas|do\s+dia|dia\s+\d|chamada|\bsp\w*\b|yoga|hiit|spin|g\d+/i.test(question);
  }
  return false;
}

export function isCancelAgendaIntent(question: string): boolean {
  return /cancel[ao]r?|desmarcar|desmarca|remover\s+(a\s+)?(minha\s+)?reserva|tirar\s+(da\s+)?(aula|reserva)|n[aã]o\s+(vou|quero)\s+(mais\s+)?(nessa\s+)?aula|exclu[aeií]|apagu?e/i.test(
    question,
  );
}

export type ScheduleDeleteFilter = {
  titleHint: string | null;
  dayFrom: string | null;
  dayTo: string | null;
  hour: number | null;
  deleteAll: boolean;
  missingTitle: boolean;
  missingDate: boolean;
};

function normalizeTitleText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function scheduleTitleMatchesHint(scheduleTitle: string, hint: string): boolean {
  const title = normalizeTitleText(scheduleTitle);
  const raw = normalizeTitleText(hint).replace(/^(aula|turma|agenda|classe)\s+/, '');
  if (!raw) return false;
  if (title.includes(raw)) return true;
  const tokens = raw
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2 && !['de', 'da', 'do', 'das', 'dos', 'uma', 'as', 'os'].includes(t));
  return tokens.length > 0 && tokens.every((t) => title.includes(t));
}

export function extractDeleteTitleHint(question: string): string | null {
  const patterns = [
    /(?:aulas?|turmas?|agendas?|classes?)\s+(?:de\s+|chamadas?\s+)?["“]?(.+?)["”]?(?:\s+do\s+dia|\s+dia\s+\d|\s+em\s+\d|\s+(?:as|às)\s*\d|\s+hoje|\s+amanh[aã]|[.!?]|$)/i,
    /(?:exclu[aeií]|apagu?e|delet[ae]|remov[ae]|cancel[ae])\s+(?:todas?\s+(?:as\s+)?)?(?:aulas?\s+)?["“]?(.+?)["”]?(?:\s+do\s+dia|\s+dia\s+\d|\s+hoje|\s+amanh[aã]|[.!?]|$)/i,
  ];
  for (const re of patterns) {
    const m = question.match(re);
    let raw = (m?.[1] || '').toString().trim();
    if (!raw) continue;
    raw = raw
      .replace(/^(todas?\s+(as\s+)?)/i, '')
      .replace(/^(aulas?|turmas?|agendas?)\s+/i, '')
      .replace(/\s+do\s+dia\s+\d.*$/i, '')
      .replace(/\s+(?:as|às)\s*\d{1,2}.*$/i, '')
      .replace(/[?.!,;]+$/g, '')
      .trim();
    if (raw.length >= 2 && !/^(todas?|as|os|uma|de)$/i.test(raw)) return raw.slice(0, 200);
  }
  return null;
}

export function parseScheduleDeleteFilter(
  question: string,
  now = new Date(),
): ScheduleDeleteFilter {
  const titleHint = extractDeleteTitleHint(question);
  const deleteAll = /\btodas?\b/i.test(question);
  let dayFrom: string | null = null;
  let dayTo: string | null = null;
  let missingDate = true;
  const base = new Date(now);
  base.setHours(0, 0, 0, 0);

  if (/\bhoje\b/i.test(question)) {
    missingDate = false;
  } else if (/amanh[aã]/i.test(question)) {
    base.setDate(base.getDate() + 1);
    missingDate = false;
  } else {
    const dm =
      question.match(/\b(?:dia\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/i) ||
      question.match(/\bdo\s+dia\s+(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/i);
    if (dm) {
      const day = Number(dm[1]);
      const month = Number(dm[2]) - 1;
      let year = dm[3] ? Number(dm[3]) : base.getFullYear();
      if (year < 100) year += 2000;
      base.setFullYear(year, month, day);
      missingDate = false;
    }
  }

  if (!missingDate) {
    const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0, 0, 0, 0);
    const end = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1, 0, 0, 0, 0);
    dayFrom = start.toISOString();
    dayTo = end.toISOString();
  }

  let hour: number | null = null;
  const hm =
    question.match(/(?:às|as|@)\s*(\d{1,2})(?::(\d{2}))?\s*h?s?\b/i) ||
    question.match(/\b(\d{1,2})\s*h(?:s|oras)?\b/i);
  if (hm) hour = Math.min(23, Math.max(0, Number(hm[1])));

  return {
    titleHint,
    dayFrom,
    dayTo,
    hour,
    deleteAll,
    missingTitle: !titleHint,
    missingDate,
  };
}

export type ScheduleDraft = {
  title: string | null;
  startAt: string;
  endAt: string;
  maxCapacity: number;
  assumedDateTime: boolean;
  missingTitle: boolean;
  roomHint: string | null;
};

export function extractClassTitle(question: string): string | null {
  const patterns = [
    /(?:aula|turma|agenda|classe)\s+chamada\s+(.+?)(?:\s+(?:as|às|@|\d{1,2}\s*h|do\s+dia|dia\s+\d|amanh[aã]|hoje|na\s+sala|em\s+)|[.!?]|$)/i,
    /aula(?:\s+para\s+mim)?\s+de\s+(.+?)(?:\s+(?:amanh[aã]|hoje|dia\s+\d|às|as\s+\d|em\s+\d)|[.!?]|$)/i,
    /(?:criar|crie|abrir|abra|agende|agendar|nova)\s+(?:uma\s+)?(?:aula|turma|agenda)\s+(.+?)(?:\s+(?:amanh[aã]|hoje|dia\s+\d|às|as\s+\d|em\s+\d|chamada|na\s+sala)|[.!?]|$)/i,
    /(?:turma|classe)\s+(?:de\s+|chamada\s+|nome\s+)?["“]?([^"”\n]+?)["”]?(?:\s+(?:amanh[aã]|hoje|dia|às|as\s+\d)|[.!?]|$)/i,
    /(?:chamada|nome|t[ií]tulo)\s+["“]?([^"”\n,]+)["”]?/i,
    /["“]([^"”]{2,80})["”]/,
  ];
  for (const re of patterns) {
    const m = question.match(re);
    const raw = (m?.[1] || '').toString();
    if (raw) {
      let title = raw
        .replace(/\s+(?:para\s+mim|por\s+favor|pfv).*$/i, '')
        .replace(/\s+(?:as|às)\s*\d{1,2}.*$/i, '')
        .replace(/\s+do\s+dia\s+\d.*$/i, '')
        .replace(/\s+na\s+sala\s*.*$/i, '')
        .replace(/[?.!,;]+$/g, '')
        .trim()
        .replace(/\s+/g, ' ');
      // "chamada AULA SPIN G10 AS 10hs..." already trimmed by regex, clean leftover time tokens
      title = title.replace(/\s+(?:as|às)\s*\d{1,2}\s*h?s?.*$/i, '').trim();
      if (title.length >= 2 && !/^(de|uma|para|chamada)$/i.test(title)) return title.slice(0, 200);
    }
  }
  return null;
}

export function extractRoomHint(question: string): string | null {
  const m =
    question.match(/\b(?:na|em)?\s*sala\s*(?:n[ºo°.]?\s*)?([A-Za-z0-9][\w-]{0,20})/i) ||
    question.match(/\broom\s*([A-Za-z0-9][\w-]{0,20})/i);
  return m?.[1]?.trim() || null;
}

export function parseScheduleDraft(question: string, now = new Date()): ScheduleDraft {
  const title = extractClassTitle(question);
  const roomHint = extractRoomHint(question);
  let assumedDateTime = true;
  const base = new Date(now);
  base.setSeconds(0, 0);
  base.setMilliseconds(0);

  if (/\bhoje\b/i.test(question)) {
    assumedDateTime = false;
  } else if (/amanh[aã]/i.test(question)) {
    base.setDate(base.getDate() + 1);
    assumedDateTime = false;
  } else {
    const dm =
      question.match(/\b(?:dia\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/i) ||
      question.match(/\bdo\s+dia\s+(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/i);
    if (dm) {
      const day = Number(dm[1]);
      const month = Number(dm[2]) - 1;
      let year = dm[3] ? Number(dm[3]) : base.getFullYear();
      if (year < 100) year += 2000;
      base.setFullYear(year, month, day);
      assumedDateTime = false;
    } else {
      base.setDate(base.getDate() + 1);
    }
  }

  let hour = 10;
  let minute = 0;
  const hm =
    question.match(/(?:às|as|@)\s*(\d{1,2})(?::(\d{2}))?\s*h?s?\b/i) ||
    question.match(/\b(\d{1,2}):(\d{2})\b/) ||
    question.match(/\b(\d{1,2})\s*h(?:s|oras)?(?:\s*(\d{2}))?\b/i);
  if (hm) {
    hour = Math.min(23, Math.max(0, Number(hm[1])));
    minute = Math.min(59, Math.max(0, Number(hm[2] || 0)));
    assumedDateTime = false;
  }

  const start = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    hour,
    minute,
    0,
    0,
  );
  let durationMin = 60;
  const dur = question.match(/(?:dura[cç][aã]o|por)\s*(\d{1,3})\s*(?:min|minutos)?/i);
  if (dur) durationMin = Math.min(240, Math.max(15, Number(dur[1])));
  const end = new Date(start.getTime() + durationMin * 60_000);

  let maxCapacity = 20;
  const cap = question.match(/(?:capacidade|vagas)\s*(?:de\s*)?(\d{1,3})/i);
  if (cap) maxCapacity = Math.min(200, Math.max(1, Number(cap[1])));

  return {
    title,
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    maxCapacity,
    assumedDateTime,
    missingTitle: !title,
    roomHint,
  };
}

export function summarizeSchedule(s: Schedule): AgendaClassSummary {
  return {
    id: s.id,
    title: s.title,
    startAt: s.startAt,
    endAt: s.endAt,
    reservedCount: s.reservedCount,
    maxCapacity: s.maxCapacity,
  };
}

export function summarizeUpcoming(
  items: Array<{ schedule: Schedule; enrollment: ClassEnrollment }>,
): Array<AgendaClassSummary & { enrollmentStatus: string }> {
  return items.map(({ schedule, enrollment }) => ({
    ...summarizeSchedule(schedule),
    enrollmentStatus: enrollment.status,
    status: enrollment.status,
    canCancel: canCancelClassReservation(schedule.startAt),
    cancelBlockedReason: classCancelBlockMessage(schedule.startAt),
  }));
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function formatOpenClassesList(open: AgendaClassSummary[]): string {
  if (!open.length) return 'Nenhuma aula disponível para reserva no momento.';
  return open
    .slice(0, 12)
    .map((s, i) => `${i + 1}. ${s.title} — ${formatWhen(s.startAt)}`)
    .join('\n');
}

export function matchOpenClass(
  question: string,
  open: AgendaClassSummary[],
): AgendaClassSummary | null {
  if (!open.length) return null;
  const q = question.toLowerCase();

  if (/(primeira|(?:aula|op[cç][aã]o|n[uú]mero|#)\s*1|1[ªa])\b/i.test(q) && open[0]) {
    return open[0];
  }
  if (/(segunda|(?:aula|op[cç][aã]o|n[uú]mero|#)\s*2|2[ªa])\b/i.test(q) && open[1]) {
    return open[1];
  }
  if (/(terceira|(?:aula|op[cç][aã]o|n[uú]mero|#)\s*3|3[ªa])\b/i.test(q) && open[2]) {
    return open[2];
  }

  const scored = open
    .map((s) => {
      const title = s.title.toLowerCase();
      let score = 0;
      for (const word of title.split(/[^a-z0-9à-ü]+/i).filter((w) => w.length > 2)) {
        if (q.includes(word.toLowerCase())) score += Math.min(word.length, 8);
      }
      const d = new Date(s.startAt);
      if (!Number.isNaN(d.getTime())) {
        const br = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (q.includes(br)) score += 12;
        const hour = `${String(d.getHours()).padStart(2, '0')}:`;
        if (q.includes(hour) || q.includes(`${d.getHours()}h`)) score += 4;
      }
      return { s, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 1) return scored[0].s;
  if (scored.length > 1 && scored[0].score >= (scored[1]?.score || 0) + 4) return scored[0].s;

  if (open.length === 1 && (isReserveIntent(question) || isCancelAgendaIntent(question))) {
    return open[0];
  }
  return null;
}

export function matchUpcomingClass(
  question: string,
  upcoming: Array<AgendaClassSummary & { enrollmentStatus?: string }>,
): AgendaClassSummary | null {
  return matchOpenClass(question, upcoming);
}

export function formatWhenLabel(iso: string): string {
  return formatWhen(iso);
}
