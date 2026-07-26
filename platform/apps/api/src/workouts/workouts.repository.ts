import { Injectable } from '@nestjs/common';
import type {
  Assessment,
  BodyMeasurements,
  Exercise,
  ProgressPhoto,
  Workout,
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
      secondaryMuscles: (row.secondary_muscles as string[]) || [],
      equipment: row.equipment ? String(row.equipment) : null,
      difficulty: String(row.difficulty),
      exerciseType: String(row.exercise_type),
      instructions: row.instructions ? String(row.instructions) : null,
      videoUrl: row.video_url ? String(row.video_url) : null,
      thumbnailUrl: row.thumbnail_url ? String(row.thumbnail_url) : null,
      gifUrl: row.gif_url ? String(row.gif_url) : null,
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
      startsAt: row.starts_at ? String(row.starts_at) : null,
      expiresAt: row.expires_at ? String(row.expires_at) : null,
      status: String(row.status),
      version: Number(row.version || 1),
      source: String(row.source || 'manual'),
      publishedAt: row.published_at ? String(row.published_at) : null,
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
      bmi: row.bmi != null ? Number(row.bmi) : null,
      bmr: row.bmr != null ? Number(row.bmr) : null,
      visceralFat: row.visceral_fat != null ? Number(row.visceral_fat) : null,
      metabolicAge: row.metabolic_age != null ? Number(row.metabolic_age) : null,
      objective: row.objective ? String(row.objective) : null,
      observations: row.observations ? String(row.observations) : null,
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

  async listExercises(companyId: string) {
    const { data, error } = await this.admin()
      .from('exercises')
      .select('*')
      .is('deleted_at', null)
      .eq('status', 'active')
      .or(`is_global.eq.true,company_id.eq.${companyId}`)
      .order('name');
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
    };
  }

  async createAssessment(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('assessments').insert(row).select('*').single();
    if (error) throw error;
    return this.mapAssessment(data as Record<string, unknown>);
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

    return {
      activeWorkouts: (active || []).length,
      completedToday: (completed || []).length,
      pendingAssessments: 0,
      studentsWithoutCurrentWorkout: Math.max(0, totalStudents - uniqueWith.size),
      averageEvolutionPct: evolN ? Math.round((evolSum / evolN) * 10) / 10 : 0,
    };
  }
}
