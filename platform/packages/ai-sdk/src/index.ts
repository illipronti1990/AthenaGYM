export type WorkoutSuggestionInput = {
  studentId: string;
  objective?: string | null;
  bodyFat?: number | null;
  bmi?: number | null;
  weight?: number | null;
  injuries?: string[];
  weeklyFrequency?: number;
  availableExerciseIds: string[];
};

export type SuggestedExercise = {
  exerciseId: string;
  sets: number;
  repetitions: string;
  restSeconds: number;
  notes?: string;
};

export type WorkoutSuggestionResult = {
  name: string;
  objective: string;
  difficulty: string;
  rationale: string;
  exercises: SuggestedExercise[];
  provider: string;
};

export interface WorkoutRecommendationService {
  readonly name: string;
  suggest(input: WorkoutSuggestionInput): Promise<WorkoutSuggestionResult>;
}

/** Deterministic stub — never replaces the trainer; reviewable recommendation only. */
export class StubWorkoutRecommendationService implements WorkoutRecommendationService {
  readonly name = 'stub';

  async suggest(input: WorkoutSuggestionInput): Promise<WorkoutSuggestionResult> {
    const objective = (input.objective || 'hipertrofia').toLowerCase();
    const ids = input.availableExerciseIds.slice(0, 6);
    if (ids.length === 0) {
      return {
        name: 'Sugestão pendente — sem exercícios',
        objective,
        difficulty: 'beginner',
        rationale: 'Biblioteca vazia; cadastre exercícios antes de gerar sugestão.',
        exercises: [],
        provider: this.name,
      };
    }

    const hypertrophy = objective.includes('hipertrof') || objective.includes('massa');
    const fatLoss = objective.includes('emagrec') || objective.includes('cutting');
    const sets = hypertrophy ? 4 : fatLoss ? 3 : 3;
    const reps = hypertrophy ? '8-12' : fatLoss ? '12-15' : '10';
    const rest = hypertrophy ? 90 : fatLoss ? 45 : 60;

    let difficulty = 'beginner';
    if (input.bmi != null && input.bmi >= 30) difficulty = 'beginner';
    else if (input.weeklyFrequency && input.weeklyFrequency >= 4) difficulty = 'intermediate';

    return {
      name: `Sugestão IA — ${objective}`,
      objective,
      difficulty,
      rationale:
        'Gerado por regras locais (stub). Professor deve revisar carga, volume e contraindicações antes de publicar.',
      exercises: ids.map((exerciseId, i) => ({
        exerciseId,
        sets: i === 0 ? sets + 1 : sets,
        repetitions: reps,
        restSeconds: rest,
        notes: input.injuries?.length ? `Atenção: ${input.injuries.join(', ')}` : undefined,
      })),
      provider: this.name,
    };
  }
}

export function getWorkoutRecommendationService(
  provider = process.env.AI_WORKOUT_PROVIDER || 'stub',
): WorkoutRecommendationService {
  switch ((provider || 'stub').toLowerCase()) {
    case 'stub':
    default:
      return new StubWorkoutRecommendationService();
  }
}

// ---------------------------------------------------------------------------
// Ollama Cloud / local chat
// ---------------------------------------------------------------------------

export type OllamaChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type OllamaConfig = {
  apiKey?: string;
  host?: string;
  model?: string;
  fallbackModel?: string;
  timeoutMs?: number;
};

export type OllamaChatResult = {
  content: string;
  model: string;
  provider: 'ollama';
};

export function getOllamaConfig(env: NodeJS.ProcessEnv = process.env): OllamaConfig {
  return {
    apiKey: env.OLLAMA_API_KEY || undefined,
    host: (env.OLLAMA_API_HOST || 'https://ollama.com').replace(/\/$/, ''),
    model: env.OLLAMA_API_MODEL || 'gemma4:cloud',
    fallbackModel: env.OLLAMA_API_FALLBACK_MODEL || 'gpt-oss:20b',
    timeoutMs: Number(env.OLLAMA_TIMEOUT_MS || 60000),
  };
}

export function isOllamaConfigured(cfg: OllamaConfig = getOllamaConfig()): boolean {
  return Boolean(cfg.apiKey && cfg.host && cfg.model);
}

async function ollamaChatOnce(
  messages: OllamaChatMessage[],
  cfg: OllamaConfig,
  model: string,
): Promise<OllamaChatResult> {
  if (!cfg.apiKey) {
    throw new Error('OLLAMA_API_KEY not configured');
  }
  const host = (cfg.host || 'https://ollama.com').replace(/\/$/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs || 60000);

  try {
    const res = await fetch(`${host}/api/chat`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
      }),
      signal: controller.signal,
    });

    const text = await res.text();
    if (!res.ok) {
      const err = new Error(`Ollama chat failed (${res.status}): ${text.slice(0, 400)}`);
      (err as Error & { status?: number; body?: string }).status = res.status;
      (err as Error & { status?: number; body?: string }).body = text;
      throw err;
    }

    const json = JSON.parse(text) as {
      message?: { content?: string };
      response?: string;
    };
    const content = String(json.message?.content || json.response || '').trim();
    if (!content) {
      throw new Error('Ollama returned empty content');
    }
    return { content, model, provider: 'ollama' };
  } finally {
    clearTimeout(timer);
  }
}

export async function ollamaChat(
  messages: OllamaChatMessage[],
  cfg: OllamaConfig = getOllamaConfig(),
): Promise<OllamaChatResult> {
  const primary = cfg.model || 'gemma4:cloud';
  const fallback = cfg.fallbackModel || 'gpt-oss:20b';
  try {
    return await ollamaChatOnce(messages, cfg, primary);
  } catch (e) {
    const err = e as Error & { status?: number; body?: string };
    const needsFallback =
      err.status === 403 &&
      /subscription|upgrade/i.test(String(err.body || err.message)) &&
      fallback &&
      fallback !== primary;
    if (!needsFallback) throw e;
    return ollamaChatOnce(messages, cfg, fallback);
  }
}

export type MovvoAiPersona = 'admin' | 'professor' | 'aluno';

export async function movvoOllamaAnswer(input: {
  question: string;
  context: Record<string, unknown>;
  systemExtra?: string;
  persona?: MovvoAiPersona;
  history?: OllamaChatMessage[];
}): Promise<OllamaChatResult> {
  const persona = input.persona || 'admin';
  const personaPrompt =
    persona === 'aluno'
      ? 'Você fala com um ALUNO. Foque em treinos, agenda, frequência e motivação. NÃO revele dados financeiros da academia, inadimplência de outros, receita, lucro ou dados de outros alunos. Se houver myAgenda/openClasses no contexto, use esses dados. NUNCA diga que reservou ou cancelou uma aula — isso só o sistema confirma depois de executar a ação. Se o usuário pedir reserva/cancelamento, peça o número/nome da aula.'
      : persona === 'professor'
        ? 'Você fala com um PROFESSOR/PERSONAL. Foque em agenda, turmas, ocupação, alunos sob responsabilidade, treinos e avaliações. Evite detalhes financeiros sensíveis (caixa, DRE, inadimplência geral) salvo o que for útil operacionalmente. Você PODE orientar criação/exclusão de aulas; NÃO diga que "não tem permissão" para criar agenda — o backend executa quando o pedido for claro. NUNCA invente que criou/excluiu/alterou sem actionResult.'
        : 'Você fala com um ADMIN/GESTOR da academia. Pode usar indicadores financeiros, comerciais e operacionais para apoiar decisões. NUNCA invente que excluiu aulas sem actionResult.';

  const system = [
    'Você é o Movvo AI, assistente conversacional do Movvo ERP para academias (Brasil).',
    'Responda em português do Brasil, tom de chat natural, claro e acionável.',
    personaPrompt,
    'Use APENAS os dados do contexto JSON. Não invente números nem nomes.',
    'Nunca afirme ter alterado dados (reserva, cancelamento, exclusão de aula, pagamento) sem actionResult no contexto.',
    'Se faltar dado, diga isso e sugira o próximo passo no app.',
    'Mantenha respostas curtas (até ~8 linhas), como em um chat.',
    input.systemExtra || '',
  ]
    .filter(Boolean)
    .join(' ');

  const history = (input.history || [])
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-12);

  return ollamaChat([
    { role: 'system', content: system },
    ...history,
    {
      role: 'user',
      content: `${input.question}\n\n[contexto_interno_json]\n${JSON.stringify(input.context)}`,
    },
  ]);
}
