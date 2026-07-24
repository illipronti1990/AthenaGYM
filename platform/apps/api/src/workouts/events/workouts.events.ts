export const ASSESSMENT_CREATED = 'workouts.assessment_created';
export const WORKOUT_SUGGESTED = 'workouts.workout_suggested';
export const WORKOUT_PUBLISHED = 'workouts.workout_published';
export const WORKOUT_COMPLETED = 'workouts.workout_completed';
export const PROGRESS_UPDATED = 'workouts.progress_updated';

export type AssessmentCreatedEvent = {
  companyId: string;
  assessmentId: string;
  studentId: string;
};

export type WorkoutSuggestedEvent = {
  companyId: string;
  suggestionId: string;
  studentId: string;
};

export type WorkoutPublishedEvent = {
  companyId: string;
  workoutId: string;
  studentId: string;
};

export type WorkoutCompletedEvent = {
  companyId: string;
  workoutId: string;
  sessionId: string;
  studentId: string;
};

export type ProgressUpdatedEvent = {
  companyId: string;
  studentId: string;
  photoId?: string;
};
