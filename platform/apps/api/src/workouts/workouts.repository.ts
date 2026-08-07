import { Injectable } from '@nestjs/common';
import type {
  Assessment,
  BodyMeasurements,
  CoachAgendaItem,
  CoachDashboard,
  Exercise,
  ProgressPhoto,
  ProgressPoint,
  ProgressSummary,
  TrainingTimelineItem,
  Workout,
  WorkoutChangeLog,
  WorkoutExercise,
  WorkoutTemplate,
  WorkoutsDashboard,
} from '@athena/shared';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class WorkoutsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  private admin() {
    return this.supabase.getAdmin();
  }

  mapExercise(row: Record<string, unknown>): Exercise {
    return {
      id: String(row.id),
      companyId: row.company_id ? String(row.company_id) : null,
      name: String(row.name),
      slug: String(row.slug),
      muscleGroup: String(row.muscle_group),
      subgroup: row.subgroup ? String(row.subgroup) : null,
      secondaryMuscles: (row.secondary_muscles as string[]) || [],
      equipment: row.equipment ? String(row.equipment) : null,
      difficulty: String(row.difficulty),
      exerciseType: String(row.exercise_type),
      instructions: row.instructions ? String(row.instructions) : null,
      observations: row.observations ? String(row.observations) : null,
      objective: row.objective ? String(row.objective) : null,
      categories: (row.categories as string[]) || [],
      durationSeconds: row.duration_seconds != null ? Number(row.duration_seconds) : null,
      videoUrl: row.video_url ? String(row.video_url) : null,
      thumbnailUrl: row.thumbnail_url ? String(row.thumbnail_url) : null,
      gifUrl: row.gif_url ? String(row.gif_url) : null,
      imageUrls: (row.image_urls as string[]) || [],
      createdBy: row.created_by ? String(row.created_by) : null,
      isGlobal: Boolean(row.is_global),
      status: String(row.status),
    };
  }

  mapWorkoutExercise(row: Record<string, unknown>): WorkoutExercise {
    return {
      id: String(row.id),
      workoutId: String(row.workout_id),
      exerciseId: String(row.exercise_id),
      sortOrder: Number(row.sort_order),
      sets: Number(row.sets),
      repetitions: String(row.repetitions),
      load: row.load ? String(row.load) : null,
      restSeconds: Number(row.rest_seconds),
      tempo: row.tempo ? String(row.tempo) : null,
      cadence: row.cadence ? String(row.cadence) : row.tempo ? String(row.tempo) : null,
      rpe: row.rpe != null ? Number(row.rpe) : null,
      dayLabel: row.day_label ? String(row.day_label) : null,
      supersetGroup: row.superset_group ? String(row.superset_group) : null,
      notes: row.notes ? String(row.notes) : null,
    };
  }

  mapWorkout(row: Record<string, unknown>, exercises?: WorkoutExercise[]): Workout {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      unitId: row.unit_id ? String(row.unit_id) : null,
      studentId: String(row.student_id),
      templateId: row.template_id ? String(row.template_id) : null,
      trainerId: row.trainer_id ? String(row.trainer_id) : null,
      name: String(row.name),
      objective: row.objective ? String(row.objective) : null,
      splitType: String(row.split_type || 'custom'),
      daysJson: (row.days_json as Record<string, unknown>) || {},
      startsAt: row.starts_at ? String(row.starts_at) : null,
      expiresAt: row.expires_at ? String(row.expires_at) : null,
      status: String(row.status),
      version: Number(row.version || 1),
      source: String(row.source || 'manual'),
      publishedAt: row.published_at ? String(row.published_at) : null,
      signedTrainerAt: row.signed_trainer_at ? String(row.signed_trainer_at) : null,
      signedTrainerBy: row.signed_trainer_by ? String(row.signed_trainer_by) : null,
      signedStudentAt: row.signed_student_at ? String(row.signed_student_at) : null,
      signedStudentBy: row.signed_student_by ? String(row.signed_student_by) : null,
      exercises,
    };
  }

  mapTemplate(row: Record<string, unknown>): WorkoutTemplate {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      name: String(row.name),
      category: row.category ? String(row.category) : null,
      objective: row.objective ? String(row.objective) : null,
      difficulty: String(row.difficulty),
      estimatedDuration: row.estimated_duration != null ? Number(row.estimated_duration) : null,
      createdBy: row.created_by ? String(row.created_by) : null,
    };
  }

  mapAssessment(row: Record<string, unknown>, measurements?: BodyMeasurements | null): Assessment {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      unitId: row.unit_id ? String(row.unit_id) : null,
      studentId: String(row.student_id),
      trainerId: row.trainer_id ? String(row.trainer_id) : null,
      weight: row.weight != null ? Number(row.weight) : null,
      height: row.height != null ? Number(row.height) : null,
      bodyFat: row.body_fat != null ? Number(row.body_fat) : null,
      leanMass: row.lean_mass != null ? Number(row.lean_mass) : null,
      fatMass: row.fat_mass != null ? Number(row.fat_mass) : null,
      bmi: row.bmi != null ? Number(row.bmi) : null,
      bmr: row.bmr != null ? Number(row.bmr) : null,
      visceralFat: row.visceral_fat != null ? Number(row.visceral_fat) : null,
      metabolicAge: row.metabolic_age != null ? Number(row.metabolic_age) : null,
      hrRest: row.hr_rest != null ? Number(row.hr_rest) : null,
      bpSystolic: row.bp_systolic != null ? Number(row.bp_systolic) : null,
      bpDiastolic: row.bp_diastolic != null ? Number(row.bp_diastolic) : null,
      skinfoldsJson: (row.skinfolds_json as Record<string, number>) || {},
      goal: row.goal ? String(row.goal) : null,
      objective: row.objective ? String(row.objective) : null,
      observations: row.observations ? String(row.observations) : null,
      nextDueAt: row.next_due_at ? String(row.next_due_at) : null,
      signedTrainerAt: row.signed_trainer_at ? String(row.signed_trainer_at) : null,
      signedTrainerBy: row.signed_trainer_by ? String(row.signed_trainer_by) : null,
      signedStudentAt: row.signed_student_at ? String(row.signed_student_at) : null,
      signedStudentBy: row.signed_student_by ? String(row.signed_student_by) : null,
      createdAt: String(row.created_at),
      measurements: measurements ?? null,
    };
  }

  mapPhoto(row: Record<string, unknown>): ProgressPhoto {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      studentId: String(row.student_id),
      type: String(row.type),
      storagePath: String(row.storage_path),
      publicUrl: row.public_url ? String(row.public_url) : null,
      takenAt: String(row.taken_at),
    };
  }

  async listExercises(
    companyId: string,
    filters?: {
      muscleGroup?: string;
      equipment?: string;
      difficulty?: string;
      objective?: string;
      trainerId?: string;
      q?: string;
    },
  ) {
    let q = this.admin()
      .from('exercises')
      .select('*')
      .is('deleted_at', null)
      .eq('status', 'active')
      .or(`is_global.eq.true,company_id.eq.${companyId}`)
      .order('name');
    if (filters?.muscleGroup) q = q.eq('muscle_group', filters.muscleGroup);
    if (filters?.equipment) q = q.eq('equipment', filters.equipment);
    if (filters?.difficulty) q = q.eq('difficulty', filters.difficulty);
    if (filters?.objective) q = q.eq('objective', filters.objective);
    if (filters?.trainerId) q = q.eq('created_by', filters.trainerId);
    if (filters?.q) q = q.ilike('name', `%${filters.q}%`);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map((r) => this.mapExercise(r as Record<string, unknown>));
  }

  async getExercise(id: string) {
    const { data, error } = await this.admin()
      .from('exercises')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    return data ? this.mapExercise(data as Record<string, unknown>) : null;
  }

  async createExercise(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('exercises').insert(row).select('*').single();
    if (error) throw error;
    return this.mapExercise(data as Record<string, unknown>);
  }

  async listTemplates(companyId: string) {
    const { data, error } = await this.admin()
      .from('workout_templates')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('name');
    if (error) throw error;
    return (data || []).map((r) => this.mapTemplate(r as Record<string, unknown>));
  }

  async createTemplate(row: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('workout_templates')
      .insert(row)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapTemplate(data as Record<string, unknown>);
  }

  async insertTemplateExercises(rows: Record<string, unknown>[]) {
    if (!rows.length) return;
    const { error } = await this.admin().from('workout_template_exercises').insert(rows);
    if (error) throw error;
  }

  async listWorkouts(companyId: string, studentId?: string) {
    let q = this.admin()
      .from('workouts')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });
    if (studentId) q = q.eq('student_id', studentId);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map((r) => this.mapWorkout(r as Record<string, unknown>));
  }

  async getWorkout(companyId: string, id: string) {
    const { data, error } = await this.admin()
      .from('workouts')
      .select('*')
      .eq('company_id', companyId)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const exercises = await this.listWorkoutExercises(id);
    return this.mapWorkout(data as Record<string, unknown>, exercises);
  }

  async listWorkoutExercises(workoutId: string) {
    const { data, error } = await this.admin()
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .order('sort_order');
    if (error) throw error;
    return (data || []).map((r) => this.mapWorkoutExercise(r as Record<string, unknown>));
  }

  async createWorkout(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('workouts').insert(row).select('*').single();
    if (error) throw error;
    return this.mapWorkout(data as Record<string, unknown>, []);
  }

  async updateWorkout(companyId: string, id: string, patch: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('workouts')
      .update(patch)
      .eq('company_id', companyId)
      .eq('id', id)
      .is('deleted_at', null)
      .select('*')
      .single();
    if (error) throw error;
    const exercises = await this.listWorkoutExercises(id);
    return this.mapWorkout(data as Record<string, unknown>, exercises);
  }

  async replaceWorkoutExercises(workoutId: string, rows: Record<string, unknown>[]) {
    await this.admin().from('workout_exercises').delete().eq('workout_id', workoutId);
    if (rows.length) {
      const { error } = await this.admin().from('workout_exercises').insert(rows);
      if (error) throw error;
    }
  }

  async listAssessments(companyId: string, studentId?: string) {
    let q = this.admin()
      .from('assessments')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (studentId) q = q.eq('student_id', studentId);
    const { data, error } = await q;
    if (error) throw error;
    const result: Assessment[] = [];
    for (const row of data || []) {
      const m = await this.getMeasurements(String(row.id));
      result.push(this.mapAssessment(row as Record<string, unknown>, m));
    }
    return result;
  }

  async getAssessment(companyId: string, id: string) {
    const { data, error } = await this.admin()
      .from('assessments')
      .select('*')
      .eq('company_id', companyId)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const m = await this.getMeasurements(id);
    return this.mapAssessment(data as Record<string, unknown>, m);
  }

  async getMeasurements(assessmentId: string): Promise<BodyMeasurements | null> {
    const { data, error } = await this.admin()
      .from('body_measurements')
      .select('*')
      .eq('assessment_id', assessmentId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const r = data as Record<string, unknown>;
    return {
      chest: r.chest != null ? Number(r.chest) : null,
      waist: r.waist != null ? Number(r.waist) : null,
      abdomen: r.abdomen != null ? Number(r.abdomen) : null,
      hip: r.hip != null ? Number(r.hip) : null,
      armLeft: r.arm_left != null ? Number(r.arm_left) : null,
      armRight: r.arm_right != null ? Number(r.arm_right) : null,
      thighLeft: r.thigh_left != null ? Number(r.thigh_left) : null,
      thighRight: r.thigh_right != null ? Number(r.thigh_right) : null,
      calfLeft: r.calf_left != null ? Number(r.calf_left) : null,
      calfRight: r.calf_right != null ? Number(r.calf_right) : null,
      neck: r.neck != null ? Number(r.neck) : null,
      shoulder: r.shoulder != null ? Number(r.shoulder) : null,
      forearmLeft: r.forearm_left != null ? Number(r.forearm_left) : null,
      forearmRight: r.forearm_right != null ? Number(r.forearm_right) : null,
    };
  }

  async createAssessment(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('assessments').insert(row).select('*').single();
    if (error) throw error;
    return this.mapAssessment(data as Record<string, unknown>);
  }

  async softDeleteAssessment(companyId: string, id: string) {
    const { data, error } = await this.admin()
      .from('assessments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('company_id', companyId)
      .eq('id', id)
      .is('deleted_at', null)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? this.mapAssessment(data as Record<string, unknown>) : null;
  }

  async upsertMeasurements(assessmentId: string, row: Record<string, unknown>) {
    const { error } = await this.admin()
      .from('body_measurements')
      .upsert({ assessment_id: assessmentId, ...row }, { onConflict: 'assessment_id' });
    if (error) throw error;
  }

  async createPhoto(row: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('progress_photos')
      .insert(row)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapPhoto(data as Record<string, unknown>);
  }

  async listPhotos(companyId: string, studentId: string) {
    const { data, error } = await this.admin()
      .from('progress_photos')
      .select('*')
      .eq('company_id', companyId)
      .eq('student_id', studentId)
      .is('deleted_at', null)
      .order('taken_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r) => this.mapPhoto(r as Record<string, unknown>));
  }

  async getPhoto(companyId: string, photoId: string) {
    const { data, error } = await this.admin()
      .from('progress_photos')
      .select('*')
      .eq('company_id', companyId)
      .eq('id', photoId)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    return data ? this.mapPhoto(data as Record<string, unknown>) : null;
  }

  async softDeletePhoto(companyId: string, photoId: string) {
    const { data, error } = await this.admin()
      .from('progress_photos')
      .update({ deleted_at: new Date().toISOString() })
      .eq('company_id', companyId)
      .eq('id', photoId)
      .is('deleted_at', null)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? this.mapPhoto(data as Record<string, unknown>) : null;
  }

  async createSuggestion(row: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('ai_workout_suggestions')
      .insert(row)
      .select('*')
      .single();
    if (error) throw error;
    return data as Record<string, unknown>;
  }

  async createSession(row: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('workout_sessions')
      .insert(row)
      .select('*')
      .single();
    if (error) throw error;
    return data as Record<string, unknown>;
  }

  async dashboard(companyId: string): Promise<WorkoutsDashboard> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const iso = today.toISOString();

    const { data: active } = await this.admin()
      .from('workouts')
      .select('id')
      .eq('company_id', companyId)
      .eq('status', 'published')
      .is('deleted_at', null);

    const { data: completed } = await this.admin()
      .from('workout_sessions')
      .select('id')
      .eq('company_id', companyId)
      .eq('status', 'completed')
      .gte('completed_at', iso);

    const { count: studentsCount } = await this.admin()
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .is('deleted_at', null);

    const { data: withWorkout } = await this.admin()
      .from('workouts')
      .select('student_id')
      .eq('company_id', companyId)
      .eq('status', 'published')
      .is('deleted_at', null);

    const uniqueWith = new Set((withWorkout || []).map((w) => String(w.student_id)));
    const totalStudents = studentsCount || 0;

    const { data: assessments } = await this.admin()
      .from('assessments')
      .select('weight, body_fat, student_id, created_at')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    const byStudent = new Map<string, Array<{ weight: number | null; bodyFat: number | null }>>();
    for (const a of assessments || []) {
      const sid = String(a.student_id);
      const list = byStudent.get(sid) || [];
      list.push({
        weight: a.weight != null ? Number(a.weight) : null,
        bodyFat: a.body_fat != null ? Number(a.body_fat) : null,
      });
      byStudent.set(sid, list);
    }
    let evolSum = 0;
    let evolN = 0;
    for (const list of byStudent.values()) {
      if (list.length < 2) continue;
      const first = list[0].bodyFat ?? list[0].weight;
      const last = list[list.length - 1].bodyFat ?? list[list.length - 1].weight;
      if (first == null || last == null || first === 0) continue;
      evolSum += ((first - last) / Math.abs(first)) * 100;
      evolN += 1;
    }

    const { count: pendingAssessments } = await this.admin()
      .from('assessments')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .lte('next_due_at', new Date().toISOString().slice(0, 10))
      .is('deleted_at', null);

    const { data: expired } = await this.admin()
      .from('workouts')
      .select('id')
      .eq('company_id', companyId)
      .eq('status', 'published')
      .lt('expires_at', new Date().toISOString().slice(0, 10))
      .is('deleted_at', null);

    return {
      activeWorkouts: (active || []).length,
      completedToday: (completed || []).length,
      pendingAssessments: pendingAssessments || 0,
      expiredWorkouts: (expired || []).length,
      studentsWithoutCurrentWorkout: Math.max(0, totalStudents - uniqueWith.size),
      averageEvolutionPct: evolN ? Math.round((evolSum / evolN) * 10) / 10 : 0,
    };
  }

  async updateExercise(companyId: string, id: string, patch: Record<string, unknown>) {
    const existing = await this.getExercise(id);
    if (!existing) return null;
    if (existing.companyId && existing.companyId !== companyId) return null;
    const { data, error } = await this.admin()
      .from('exercises')
      .update(patch)
      .eq('id', id)
      .is('deleted_at', null)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? this.mapExercise(data as Record<string, unknown>) : null;
  }

  async softDeleteExercise(companyId: string, id: string) {
    const { data, error } = await this.admin()
      .from('exercises')
      .update({ deleted_at: new Date().toISOString(), status: 'inactive' })
      .eq('id', id)
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? this.mapExercise(data as Record<string, unknown>) : null;
  }

  async getTemplate(companyId: string, id: string) {
    const { data, error } = await this.admin()
      .from('workout_templates')
      .select('*')
      .eq('company_id', companyId)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const tpl = this.mapTemplate(data as Record<string, unknown>);
    const { data: exs } = await this.admin()
      .from('workout_template_exercises')
      .select('*')
      .eq('template_id', id)
      .order('sort_order');
    tpl.exercises = (exs || []).map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: String(row.id),
        workoutId: '',
        exerciseId: String(row.exercise_id),
        sortOrder: Number(row.sort_order),
        sets: Number(row.sets),
        repetitions: String(row.repetitions),
        load: row.load ? String(row.load) : null,
        restSeconds: Number(row.rest_seconds),
        tempo: row.tempo ? String(row.tempo) : null,
        cadence: row.cadence ? String(row.cadence) : null,
        rpe: row.rpe != null ? Number(row.rpe) : null,
        dayLabel: row.day_label ? String(row.day_label) : null,
        supersetGroup: row.superset_group ? String(row.superset_group) : null,
        notes: row.notes ? String(row.notes) : null,
      };
    });
    return tpl;
  }

  async updateTemplate(companyId: string, id: string, patch: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('workout_templates')
      .update(patch)
      .eq('company_id', companyId)
      .eq('id', id)
      .is('deleted_at', null)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? this.mapTemplate(data as Record<string, unknown>) : null;
  }

  async replaceTemplateExercises(templateId: string, rows: Record<string, unknown>[]) {
    await this.admin().from('workout_template_exercises').delete().eq('template_id', templateId);
    if (rows.length) {
      const { error } = await this.admin().from('workout_template_exercises').insert(rows);
      if (error) throw error;
    }
  }

  async insertWorkoutExercise(row: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('workout_exercises')
      .insert(row)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapWorkoutExercise(data as Record<string, unknown>);
  }

  async updateWorkoutExercise(workoutId: string, id: string, patch: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('workout_exercises')
      .update(patch)
      .eq('workout_id', workoutId)
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? this.mapWorkoutExercise(data as Record<string, unknown>) : null;
  }

  async deleteWorkoutExercise(workoutId: string, id: string) {
    const { error } = await this.admin()
      .from('workout_exercises')
      .delete()
      .eq('workout_id', workoutId)
      .eq('id', id);
    if (error) throw error;
  }

  async updateAssessment(companyId: string, id: string, patch: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('assessments')
      .update(patch)
      .eq('company_id', companyId)
      .eq('id', id)
      .is('deleted_at', null)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const m = await this.getMeasurements(id);
    return this.mapAssessment(data as Record<string, unknown>, m);
  }

  async insertChangeLog(row: Record<string, unknown>): Promise<WorkoutChangeLog> {
    const { data, error } = await this.admin()
      .from('workout_change_logs')
      .insert(row)
      .select('*')
      .single();
    if (error) throw error;
    const r = data as Record<string, unknown>;
    return {
      id: String(r.id),
      companyId: String(r.company_id),
      workoutId: r.workout_id ? String(r.workout_id) : null,
      studentId: r.student_id ? String(r.student_id) : null,
      assessmentId: r.assessment_id ? String(r.assessment_id) : null,
      actorId: r.actor_id ? String(r.actor_id) : null,
      action: String(r.action),
      diff: (r.diff as Record<string, unknown>) || {},
      createdAt: String(r.created_at),
    };
  }

  async listChangeLogs(companyId: string, workoutId: string) {
    const { data, error } = await this.admin()
      .from('workout_change_logs')
      .select('*')
      .eq('company_id', companyId)
      .eq('workout_id', workoutId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data || []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: String(r.id),
        companyId: String(r.company_id),
        workoutId: r.workout_id ? String(r.workout_id) : null,
        studentId: r.student_id ? String(r.student_id) : null,
        assessmentId: r.assessment_id ? String(r.assessment_id) : null,
        actorId: r.actor_id ? String(r.actor_id) : null,
        action: String(r.action),
        diff: (r.diff as Record<string, unknown>) || {},
        createdAt: String(r.created_at),
      } satisfies WorkoutChangeLog;
    });
  }

  async trainingTimeline(companyId: string, studentId: string): Promise<TrainingTimelineItem[]> {
    const items: TrainingTimelineItem[] = [];
    const { data: workouts } = await this.admin()
      .from('workouts')
      .select('id, name, status, published_at, created_at, updated_at')
      .eq('company_id', companyId)
      .eq('student_id', studentId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50);
    for (const w of workouts || []) {
      const row = w as Record<string, unknown>;
      items.push({
        id: `w-${row.id}`,
        at: String(row.published_at || row.created_at),
        kind: 'workout',
        title: row.status === 'published' ? 'Novo treino' : `Treino (${row.status})`,
        detail: String(row.name),
        entityId: String(row.id),
      });
    }
    const { data: assessments } = await this.admin()
      .from('assessments')
      .select('id, created_at, goal, objective')
      .eq('company_id', companyId)
      .eq('student_id', studentId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50);
    for (const a of assessments || []) {
      const row = a as Record<string, unknown>;
      items.push({
        id: `a-${row.id}`,
        at: String(row.created_at),
        kind: 'assessment',
        title: 'Avaliação Física',
        detail: row.goal ? String(row.goal) : row.objective ? String(row.objective) : null,
        entityId: String(row.id),
      });
    }
    const { data: logs } = await this.admin()
      .from('workout_change_logs')
      .select('*')
      .eq('company_id', companyId)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(50);
    for (const l of logs || []) {
      const row = l as Record<string, unknown>;
      items.push({
        id: `c-${row.id}`,
        at: String(row.created_at),
        kind: String(row.action).includes('sign') ? 'sign' : 'change',
        title: String(row.action),
        detail: null,
        entityId: row.workout_id ? String(row.workout_id) : null,
      });
    }
    items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return items.slice(0, 100);
  }

  async coachDashboard(companyId: string, trainerId?: string | null): Promise<CoachDashboard> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayStr = today.toISOString().slice(0, 10);

    const { count: activeStudents } = await this.admin()
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'active')
      .is('deleted_at', null);

    const { count: pendingAssessments } = await this.admin()
      .from('assessments')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .lte('next_due_at', todayStr)
      .is('deleted_at', null);

    const { count: expiredWorkouts } = await this.admin()
      .from('workouts')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'published')
      .lt('expires_at', todayStr)
      .is('deleted_at', null);

    const dash = await this.dashboard(companyId);
    const agenda = await this.coachAgenda(companyId, today.toISOString(), tomorrow.toISOString(), trainerId);

    const { data: published } = await this.admin()
      .from('workouts')
      .select('trainer_id')
      .eq('company_id', companyId)
      .eq('status', 'published')
      .is('deleted_at', null)
      .not('trainer_id', 'is', null);

    const counts = new Map<string, number>();
    for (const w of published || []) {
      const tid = String((w as { trainer_id: string }).trainer_id);
      counts.set(tid, (counts.get(tid) || 0) + 1);
    }
    const topIds = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topTrainers: CoachDashboard['topTrainers'] = [];
    if (topIds.length) {
      const { data: profiles } = await this.admin()
        .from('profiles')
        .select('id, full_name')
        .in(
          'id',
          topIds.map(([id]) => id),
        );
      const nameMap = new Map(
        (profiles || []).map((p) => [
          String((p as { id: string }).id),
          String((p as { full_name: string }).full_name),
        ]),
      );
      for (const [id, n] of topIds) {
        topTrainers.push({
          trainerId: id,
          fullName: nameMap.get(id) || 'Professor',
          workoutsPublished: n,
        });
      }
    }

    return {
      activeStudents: activeStudents || 0,
      pendingAssessments: pendingAssessments || 0,
      expiredWorkouts: expiredWorkouts || 0,
      averageEvolutionPct: dash.averageEvolutionPct,
      agendaToday: agenda,
      topTrainers,
    };
  }

  async coachAgenda(
    companyId: string,
    from: string,
    to: string,
    trainerId?: string | null,
  ): Promise<CoachAgendaItem[]> {
    let q = this.admin()
      .from('schedules')
      .select('id, title, type, start_at, end_at, teacher_id')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .gte('start_at', from)
      .lte('start_at', to)
      .order('start_at');
    if (trainerId) q = q.eq('teacher_id', trainerId);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: String(row.id),
        startAt: String(row.start_at),
        endAt: row.end_at ? String(row.end_at) : null,
        title: String(row.title),
        type: String(row.type),
        studentId: null,
        studentName: null,
      };
    });
  }

  async lastCheckinAt(companyId: string, studentId: string) {
    const { data } = await this.admin()
      .from('checkins')
      .select('created_at')
      .eq('company_id', companyId)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.created_at ? String(data.created_at) : null;
  }

  async activeWorkoutForStudent(companyId: string, studentId: string) {
    const { data } = await this.admin()
      .from('workouts')
      .select('*')
      .eq('company_id', companyId)
      .eq('student_id', studentId)
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return null;
    const exercises = await this.listWorkoutExercises(String((data as { id: string }).id));
    return this.mapWorkout(data as Record<string, unknown>, exercises);
  }
}
