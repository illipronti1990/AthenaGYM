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
