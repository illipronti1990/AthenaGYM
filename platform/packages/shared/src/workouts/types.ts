export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type WorkoutStatus = 'draft' | 'published' | 'completed' | 'expired' | 'archived';

export type WorkoutSplitType =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'ABC'
  | 'ABCD'
  | 'ABCDE'
  | 'full_body'
  | 'upper_lower'
  | 'custom';

export type AssessmentGoal =
  | 'emagrecimento'
  | 'hipertrofia'
  | 'condicionamento'
  | 'reabilitacao'
  | 'saude';

export interface Exercise {
  id: string;
  companyId: string | null;
  name: string;
  slug: string;
  muscleGroup: string;
  subgroup: string | null;
  secondaryMuscles: string[];
  equipment: string | null;
  difficulty: string;
  exerciseType: string;
  instructions: string | null;
  observations: string | null;
  objective: string | null;
  categories: string[];
  durationSeconds: number | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  gifUrl: string | null;
  imageUrls: string[];
  createdBy: string | null;
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
  cadence: string | null;
  rpe: number | null;
  dayLabel: string | null;
  supersetGroup: string | null;
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
  splitType: WorkoutSplitType | string;
  daysJson: Record<string, unknown>;
  startsAt: string | null;
  expiresAt: string | null;
  status: WorkoutStatus | string;
  version: number;
  source: string;
  publishedAt: string | null;
  signedTrainerAt: string | null;
  signedTrainerBy: string | null;
  signedStudentAt: string | null;
  signedStudentBy: string | null;
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
  exercises?: WorkoutExercise[];
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
  neck: number | null;
  shoulder: number | null;
  forearmLeft: number | null;
  forearmRight: number | null;
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
  fatMass: number | null;
  bmi: number | null;
  bmr: number | null;
  visceralFat: number | null;
  metabolicAge: number | null;
  hrRest: number | null;
  bpSystolic: number | null;
  bpDiastolic: number | null;
  skinfoldsJson: Record<string, number>;
  goal: AssessmentGoal | string | null;
  objective: string | null;
  observations: string | null;
  nextDueAt: string | null;
  signedTrainerAt: string | null;
  signedTrainerBy: string | null;
  signedStudentAt: string | null;
  signedStudentBy: string | null;
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

export interface ProgressPoint {
  date: string;
  weight: number | null;
  bmi: number | null;
  leanMass: number | null;
  bodyFat: number | null;
  fatMass: number | null;
  measurements: BodyMeasurements | null;
}

export interface ProgressSummary {
  studentId: string;
  assessments: Assessment[];
  photos: ProgressPhoto[];
  series: ProgressPoint[];
  weightDelta: number | null;
  bodyFatDelta: number | null;
  evolutionPct: number | null;
  comparisons: Record<string, { weightDelta: number | null; bodyFatDelta: number | null }>;
  nextAssessmentDue: string | null;
  lastCheckinAt: string | null;
  activeWorkout: Workout | null;
}

export interface WorkoutsDashboard {
  activeWorkouts: number;
  completedToday: number;
  pendingAssessments: number;
  expiredWorkouts: number;
  studentsWithoutCurrentWorkout: number;
  averageEvolutionPct: number;
}

export interface CoachDashboard {
  activeStudents: number;
  pendingAssessments: number;
  expiredWorkouts: number;
  averageEvolutionPct: number;
  agendaToday: CoachAgendaItem[];
  topTrainers: Array<{ trainerId: string; fullName: string; workoutsPublished: number }>;
}

export interface CoachAgendaItem {
  id: string;
  startAt: string;
  endAt: string | null;
  title: string;
  type: string;
  studentId: string | null;
  studentName: string | null;
}

export interface TrainingTimelineItem {
  id: string;
  at: string;
  kind: 'workout' | 'assessment' | 'change' | 'sign' | 'checkin';
  title: string;
  detail: string | null;
  entityId: string | null;
}

export interface WorkoutChangeLog {
  id: string;
  companyId: string;
  workoutId: string | null;
  studentId: string | null;
  assessmentId: string | null;
  actorId: string | null;
  action: string;
  diff: Record<string, unknown>;
  createdAt: string;
}

export const MUSCLE_CATEGORIES = [
  'peito',
  'costas',
  'ombros',
  'biceps',
  'triceps',
  'quadriceps',
  'posterior',
  'gluteo',
  'panturrilha',
  'abdomen',
  'cardio',
  'mobilidade',
  'alongamento',
] as const;

export const SPLIT_TYPES: WorkoutSplitType[] = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'ABC',
  'ABCD',
  'ABCDE',
  'full_body',
  'upper_lower',
  'custom',
];
