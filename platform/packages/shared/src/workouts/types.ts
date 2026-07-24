export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type WorkoutStatus = 'draft' | 'published' | 'completed' | 'expired' | 'archived';

export interface Exercise {
  id: string;
  companyId: string | null;
  name: string;
  slug: string;
  muscleGroup: string;
  secondaryMuscles: string[];
  equipment: string | null;
  difficulty: string;
  exerciseType: string;
  instructions: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  gifUrl: string | null;
  isGlobal: boolean;
  status: string;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  sortOrder: number;
  sets: number;
  repetitions: string;
  load: string | null;
  restSeconds: number;
  tempo: string | null;
  notes: string | null;
  exercise?: Exercise;
}

export interface Workout {
  id: string;
  companyId: string;
  unitId: string | null;
  studentId: string;
  templateId: string | null;
  trainerId: string | null;
  name: string;
  objective: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  status: WorkoutStatus | string;
  version: number;
  source: string;
  publishedAt: string | null;
  exercises?: WorkoutExercise[];
}

export interface WorkoutTemplate {
  id: string;
  companyId: string;
  name: string;
  category: string | null;
  objective: string | null;
  difficulty: string;
  estimatedDuration: number | null;
  createdBy: string | null;
}

export interface BodyMeasurements {
  chest: number | null;
  waist: number | null;
  abdomen: number | null;
  hip: number | null;
  armLeft: number | null;
  armRight: number | null;
  thighLeft: number | null;
  thighRight: number | null;
  calfLeft: number | null;
  calfRight: number | null;
}

export interface Assessment {
  id: string;
  companyId: string;
  unitId: string | null;
  studentId: string;
  trainerId: string | null;
  weight: number | null;
  height: number | null;
  bodyFat: number | null;
  leanMass: number | null;
  bmi: number | null;
  bmr: number | null;
  visceralFat: number | null;
  metabolicAge: number | null;
  objective: string | null;
  observations: string | null;
  createdAt: string;
  measurements?: BodyMeasurements | null;
}

export interface ProgressPhoto {
  id: string;
  companyId: string;
  studentId: string;
  type: string;
  storagePath: string;
  publicUrl: string | null;
  takenAt: string;
}

export interface ProgressSummary {
  studentId: string;
  assessments: Assessment[];
  photos: ProgressPhoto[];
  weightDelta: number | null;
  bodyFatDelta: number | null;
  evolutionPct: number | null;
}

export interface WorkoutsDashboard {
  activeWorkouts: number;
  completedToday: number;
  pendingAssessments: number;
  studentsWithoutCurrentWorkout: number;
  averageEvolutionPct: number;
}
