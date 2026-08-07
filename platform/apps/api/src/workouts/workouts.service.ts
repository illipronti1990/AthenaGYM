import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getWorkoutRecommendationService } from '@movvo/ai-sdk';
import {
  calcBmi,
  calcBmr,
  isWorkoutExpired,
  leanMassKg,
  slugify,
  storageProgressPath,
} from '@movvo/exercise-engine';
import type { AuthContext, ProgressPoint, ProgressSummary } from '@movvo/shared';
import { AuthUser } from '../auth/auth.types';
import { SupabaseService } from '../supabase/supabase.service';
import {
  AiWorkoutSuggestionDto,
  CompleteSessionDto,
  CreateAssessmentDto,
  CreateExerciseDto,
  CreateProgressPhotoDto,
  CreateTemplateDto,
  CreateWorkoutDto,
  DuplicateWorkoutDto,
  FromTemplateDto,
  ReorderWorkoutExercisesDto,
  UpdateAssessmentDto,
  UpdateExerciseDto,
  UpdateWorkoutDto,
  WorkoutExerciseInputDto,
} from './dto/workouts.dto';
import {
  ASSESSMENT_CREATED,
  PROGRESS_UPDATED,
  WORKOUT_COMPLETED,
  WORKOUT_PUBLISHED,
  WORKOUT_SUGGESTED,
} from './events/workouts.events';
import { WorkoutsRepository } from './workouts.repository';

const MAX_PROGRESS_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = new Set(['front', 'back', 'left', 'right']);

@Injectable()
export class WorkoutsService {
  constructor(
    private readonly repo: WorkoutsRepository,
    private readonly events: EventEmitter2,
    private readonly supabase: SupabaseService,
  ) {}

  private companyId(auth: AuthContext) {
    if (!auth.companyId) throw new BadRequestException('companyId required');
    return auth.companyId;
  }

  private exerciseRows(workoutId: string, items: WorkoutExerciseInputDto[]) {
    return items.map((e, i) => ({
      workout_id: workoutId,
      exercise_id: e.exerciseId,
      sort_order: e.sortOrder ?? i + 1,
      sets: e.sets ?? 3,
      repetitions: e.repetitions ?? '10',
      load: e.load || null,
      rest_seconds: e.restSeconds ?? 60,
      tempo: e.tempo || e.cadence || null,
      cadence: e.cadence || e.tempo || null,
      rpe: e.rpe ?? null,
      day_label: e.dayLabel || null,
      superset_group: e.supersetGroup || null,
      notes: e.notes || null,
    }));
  }

  private templateExerciseRows(templateId: string, items: WorkoutExerciseInputDto[]) {
    return items.map((e, i) => ({
      template_id: templateId,
      exercise_id: e.exerciseId,
      sort_order: e.sortOrder ?? i + 1,
      sets: e.sets ?? 3,
      repetitions: e.repetitions ?? '10',
      load: e.load || null,
      rest_seconds: e.restSeconds ?? 60,
      tempo: e.tempo || e.cadence || null,
      cadence: e.cadence || e.tempo || null,
      rpe: e.rpe ?? null,
      day_label: e.dayLabel || null,
      superset_group: e.supersetGroup || null,
      notes: e.notes || null,
    }));
  }

  private mapExerciseInput(e: {
    exerciseId: string;
    sortOrder: number;
    sets: number;
    repetitions: string;
    load?: string | null;
    restSeconds: number;
    tempo?: string | null;
    cadence?: string | null;
    rpe?: number | null;
    dayLabel?: string | null;
    supersetGroup?: string | null;
    notes?: string | null;
  }): WorkoutExerciseInputDto {
    return {
      exerciseId: e.exerciseId,
      sortOrder: e.sortOrder,
      sets: e.sets,
      repetitions: e.repetitions,
      load: e.load || undefined,
      restSeconds: e.restSeconds,
      tempo: e.tempo || undefined,
      cadence: e.cadence || e.tempo || undefined,
      rpe: e.rpe ?? undefined,
      dayLabel: e.dayLabel || undefined,
      supersetGroup: e.supersetGroup || undefined,
      notes: e.notes || undefined,
    };
  }

  private async logChange(
    companyId: string,
    actorId: string | null,
    action: string,
    opts: {
      workoutId?: string | null;
      studentId?: string | null;
      assessmentId?: string | null;
      diff?: Record<string, unknown>;
    },
  ) {
    try {
      await this.repo.insertChangeLog({
        company_id: companyId,
        workout_id: opts.workoutId || null,
        student_id: opts.studentId || null,
        assessment_id: opts.assessmentId || null,
        actor_id: actorId,
        action,
        diff: opts.diff || {},
      });
    } catch {
      /* audit best-effort */
    }
  }

  private measurementRow(m: NonNullable<CreateAssessmentDto['measurements']>) {
    return {
      chest: m.chest ?? null,
      waist: m.waist ?? null,
      abdomen: m.abdomen ?? null,
      hip: m.hip ?? null,
      arm_left: m.armLeft ?? null,
      arm_right: m.armRight ?? null,
      thigh_left: m.thighLeft ?? null,
      thigh_right: m.thighRight ?? null,
      calf_left: m.calfLeft ?? null,
      calf_right: m.calfRight ?? null,
      neck: m.neck ?? null,
      shoulder: m.shoulder ?? null,
      forearm_left: m.forearmLeft ?? null,
      forearm_right: m.forearmRight ?? null,
    };
  }

  listExercises(
    auth: AuthContext,
    filters?: {
      muscleGroup?: string;
      equipment?: string;
      difficulty?: string;
      objective?: string;
      trainerId?: string;
      q?: string;
    },
  ) {
    return this.repo.listExercises(this.companyId(auth), filters);
  }

  async createExercise(user: AuthUser, auth: AuthContext, dto: CreateExerciseDto) {
    const companyId = this.companyId(auth);
    return this.repo.createExercise({
      company_id: dto.isGlobal ? null : companyId,
      name: dto.name,
      slug: slugify(dto.name),
      muscle_group: dto.muscleGroup,
      subgroup: dto.subgroup || null,
      secondary_muscles: dto.secondaryMuscles || [],
      categories: dto.categories || [],
      equipment: dto.equipment || null,
      difficulty: dto.difficulty || 'beginner',
      exercise_type: dto.exerciseType || 'strength',
      instructions: dto.instructions || null,
      observations: dto.observations || null,
      objective: dto.objective || null,
      duration_seconds: dto.durationSeconds ?? null,
      video_url: dto.videoUrl || null,
      gif_url: dto.gifUrl || null,
      image_urls: dto.imageUrls || [],
      created_by: user.id,
      is_global: Boolean(dto.isGlobal),
      status: 'active',
    });
  }

  async updateExercise(auth: AuthContext, id: string, dto: UpdateExerciseDto) {
    const companyId = this.companyId(auth);
    const patch: Record<string, unknown> = {};
    if (dto.name !== undefined) {
      patch.name = dto.name;
      patch.slug = slugify(dto.name);
    }
    if (dto.muscleGroup !== undefined) patch.muscle_group = dto.muscleGroup;
    if (dto.subgroup !== undefined) patch.subgroup = dto.subgroup;
    if (dto.secondaryMuscles !== undefined) patch.secondary_muscles = dto.secondaryMuscles;
    if (dto.categories !== undefined) patch.categories = dto.categories;
    if (dto.equipment !== undefined) patch.equipment = dto.equipment;
    if (dto.difficulty !== undefined) patch.difficulty = dto.difficulty;
    if (dto.exerciseType !== undefined) patch.exercise_type = dto.exerciseType;
    if (dto.instructions !== undefined) patch.instructions = dto.instructions;
    if (dto.observations !== undefined) patch.observations = dto.observations;
    if (dto.objective !== undefined) patch.objective = dto.objective;
    if (dto.durationSeconds !== undefined) patch.duration_seconds = dto.durationSeconds;
    if (dto.videoUrl !== undefined) patch.video_url = dto.videoUrl;
    if (dto.gifUrl !== undefined) patch.gif_url = dto.gifUrl;
    if (dto.imageUrls !== undefined) patch.image_urls = dto.imageUrls;
    if (dto.status !== undefined) patch.status = dto.status;
    const updated = await this.repo.updateExercise(companyId, id, patch);
    if (!updated) throw new NotFoundException('Exercise not found');
    return updated;
  }

  async deleteExercise(auth: AuthContext, id: string) {
    const deleted = await this.repo.softDeleteExercise(this.companyId(auth), id);
    if (!deleted) throw new NotFoundException('Exercise not found');
    return { ok: true, id };
  }

  listTemplates(auth: AuthContext) {
    return this.repo.listTemplates(this.companyId(auth));
  }

  async getTemplate(auth: AuthContext, id: string) {
    const tpl = await this.repo.getTemplate(this.companyId(auth), id);
    if (!tpl) throw new NotFoundException('Template not found');
    return tpl;
  }

  async createTemplate(user: AuthUser, auth: AuthContext, dto: CreateTemplateDto) {
    const companyId = this.companyId(auth);
    const template = await this.repo.createTemplate({
      company_id: companyId,
      name: dto.name,
      category: dto.category || null,
      objective: dto.objective || null,
      difficulty: dto.difficulty || 'beginner',
      estimated_duration: dto.estimatedDuration ?? null,
      created_by: user.id,
      status: 'active',
    });
    if (dto.exercises?.length) {
      await this.repo.insertTemplateExercises(
        this.templateExerciseRows(template.id, dto.exercises),
      );
    }
    return this.repo.getTemplate(companyId, template.id);
  }

  async updateTemplate(auth: AuthContext, id: string, dto: CreateTemplateDto) {
    const companyId = this.companyId(auth);
    const existing = await this.repo.getTemplate(companyId, id);
    if (!existing) throw new NotFoundException('Template not found');
    await this.repo.updateTemplate(companyId, id, {
      name: dto.name ?? existing.name,
      category: dto.category !== undefined ? dto.category : existing.category,
      objective: dto.objective !== undefined ? dto.objective : existing.objective,
      difficulty: dto.difficulty || existing.difficulty,
      estimated_duration:
        dto.estimatedDuration !== undefined
          ? dto.estimatedDuration
          : existing.estimatedDuration,
    });
    if (dto.exercises) {
      await this.repo.replaceTemplateExercises(
        id,
        this.templateExerciseRows(id, dto.exercises),
      );
    }
    return this.repo.getTemplate(companyId, id);
  }

  async duplicateTemplate(user: AuthUser, auth: AuthContext, id: string) {
    const source = await this.getTemplate(auth, id);
    return this.createTemplate(user, auth, {
      name: `${source.name} (cópia)`,
      category: source.category || undefined,
      objective: source.objective || undefined,
      difficulty: source.difficulty,
      estimatedDuration: source.estimatedDuration ?? undefined,
      exercises: (source.exercises || []).map((e) => this.mapExerciseInput(e)),
    });
  }

  private async assertStudentScope(auth: AuthContext, studentId: string) {
    if (!auth.roles.includes('student')) return;
    const staff = auth.roles.some((r) =>
      ['super_admin', 'admin', 'manager', 'reception', 'finance', 'trainer', 'personal'].includes(r),
    );
    if (staff) return;
    const email = (auth.email || '').trim().toLowerCase();
    if (!email) throw new BadRequestException('email required');
    const { data } = await this.supabase
      .getAdmin()
      .from('students')
      .select('id')
      .eq('company_id', this.companyId(auth))
      .ilike('email', email)
      .is('deleted_at', null)
      .maybeSingle();
    if (!data || String(data.id) !== studentId) {
      throw new ForbiddenException('student_scope_denied');
    }
  }

  async listWorkouts(auth: AuthContext, studentId?: string) {
    if (studentId) await this.assertStudentScope(auth, studentId);
    return this.repo.listWorkouts(this.companyId(auth), studentId);
  }

  async getWorkout(auth: AuthContext, id: string) {
    const workout = await this.repo.getWorkout(this.companyId(auth), id);
    if (!workout) throw new NotFoundException('Workout not found');
    if (workout.status === 'published' && isWorkoutExpired(workout.expiresAt)) {
      return this.repo.updateWorkout(this.companyId(auth), id, { status: 'expired' });
    }
    return workout;
  }

  async createWorkout(user: AuthUser, auth: AuthContext, dto: CreateWorkoutDto) {
    const companyId = this.companyId(auth);
    if (dto.exercises?.length) {
      for (const e of dto.exercises) {
        const ex = await this.repo.getExercise(e.exerciseId);
        if (!ex) throw new BadRequestException(`exercise_not_found:${e.exerciseId}`);
      }
    }

    const status = dto.publish ? 'published' : 'draft';
    const workout = await this.repo.createWorkout({
      company_id: companyId,
      unit_id: dto.unitId || auth.defaultUnitId || null,
      student_id: dto.studentId,
      template_id: dto.templateId || null,
      trainer_id: user.id,
      name: dto.name,
      objective: dto.objective || null,
      split_type: dto.splitType || 'custom',
      days_json: dto.daysJson || {},
      starts_at: dto.startsAt || null,
      expires_at: dto.expiresAt || null,
      status,
      version: 1,
      source: 'manual',
      published_at: dto.publish ? new Date().toISOString() : null,
    });

    if (dto.exercises?.length) {
      await this.repo.replaceWorkoutExercises(
        workout.id,
        this.exerciseRows(workout.id, dto.exercises),
      );
    }

    const full = await this.repo.getWorkout(companyId, workout.id);
    await this.logChange(companyId, user.id, dto.publish ? 'published' : 'created', {
      workoutId: workout.id,
      studentId: dto.studentId,
      diff: { name: dto.name, splitType: dto.splitType },
    });
    if (dto.publish && full) {
      this.events.emit(WORKOUT_PUBLISHED, {
        companyId,
        workoutId: full.id,
        studentId: full.studentId,
      });
    }
    return full;
  }

  async updateWorkout(
    user: AuthUser,
    auth: AuthContext,
    id: string,
    dto: UpdateWorkoutDto,
  ) {
    const companyId = this.companyId(auth);
    const existing = await this.repo.getWorkout(companyId, id);
    if (!existing) throw new NotFoundException('Workout not found');

    if (dto.exercises) {
      for (const e of dto.exercises) {
        const ex = await this.repo.getExercise(e.exerciseId);
        if (!ex) throw new BadRequestException(`exercise_not_found:${e.exerciseId}`);
      }
      await this.repo.replaceWorkoutExercises(id, this.exerciseRows(id, dto.exercises));
    }

    const patch: Record<string, unknown> = { version: existing.version + 1 };
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.objective !== undefined) patch.objective = dto.objective;
    if (dto.startsAt !== undefined) patch.starts_at = dto.startsAt;
    if (dto.expiresAt !== undefined) patch.expires_at = dto.expiresAt;
    if (dto.splitType !== undefined) patch.split_type = dto.splitType;
    if (dto.daysJson !== undefined) patch.days_json = dto.daysJson;
    if (dto.status !== undefined) {
      patch.status = dto.status;
      if (dto.status === 'published') {
        patch.published_at = new Date().toISOString();
      }
    }

    const updated = await this.repo.updateWorkout(companyId, id, patch);
    await this.logChange(companyId, user.id, dto.status === 'published' ? 'published' : 'updated', {
      workoutId: id,
      studentId: existing.studentId,
      diff: patch,
    });
    if (dto.status === 'published') {
      this.events.emit(WORKOUT_PUBLISHED, {
        companyId,
        workoutId: updated.id,
        studentId: updated.studentId,
      });
    }
    return updated;
  }

  async reorderWorkoutExercises(
    user: AuthUser,
    auth: AuthContext,
    id: string,
    dto: ReorderWorkoutExercisesDto,
  ) {
    const companyId = this.companyId(auth);
    const workout = await this.repo.getWorkout(companyId, id);
    if (!workout) throw new NotFoundException('Workout not found');
    for (let i = 0; i < dto.exerciseIds.length; i += 1) {
      await this.repo.updateWorkoutExercise(id, dto.exerciseIds[i], { sort_order: i + 1 });
    }
    await this.logChange(companyId, user.id, 'reordered', {
      workoutId: id,
      studentId: workout.studentId,
      diff: { exerciseIds: dto.exerciseIds },
    });
    return this.repo.getWorkout(companyId, id);
  }

  async addWorkoutExercise(
    user: AuthUser,
    auth: AuthContext,
    workoutId: string,
    dto: WorkoutExerciseInputDto,
  ) {
    const companyId = this.companyId(auth);
    const workout = await this.repo.getWorkout(companyId, workoutId);
    if (!workout) throw new NotFoundException('Workout not found');
    const ex = await this.repo.getExercise(dto.exerciseId);
    if (!ex) throw new BadRequestException(`exercise_not_found:${dto.exerciseId}`);
    const sortOrder = dto.sortOrder ?? (workout.exercises?.length || 0) + 1;
    await this.repo.insertWorkoutExercise(
      this.exerciseRows(workoutId, [{ ...dto, sortOrder }])[0],
    );
    await this.logChange(companyId, user.id, 'exercise_added', {
      workoutId,
      studentId: workout.studentId,
      diff: { exerciseId: dto.exerciseId },
    });
    return this.repo.getWorkout(companyId, workoutId);
  }

  async updateWorkoutExercise(
    user: AuthUser,
    auth: AuthContext,
    workoutId: string,
    exerciseRowId: string,
    dto: Partial<WorkoutExerciseInputDto>,
  ) {
    const companyId = this.companyId(auth);
    const workout = await this.repo.getWorkout(companyId, workoutId);
    if (!workout) throw new NotFoundException('Workout not found');
    const patch: Record<string, unknown> = {};
    if (dto.exerciseId !== undefined) patch.exercise_id = dto.exerciseId;
    if (dto.sortOrder !== undefined) patch.sort_order = dto.sortOrder;
    if (dto.sets !== undefined) patch.sets = dto.sets;
    if (dto.repetitions !== undefined) patch.repetitions = dto.repetitions;
    if (dto.load !== undefined) patch.load = dto.load;
    if (dto.restSeconds !== undefined) patch.rest_seconds = dto.restSeconds;
    if (dto.tempo !== undefined) patch.tempo = dto.tempo;
    if (dto.cadence !== undefined) {
      patch.cadence = dto.cadence;
      patch.tempo = dto.cadence;
    }
    if (dto.rpe !== undefined) patch.rpe = dto.rpe;
    if (dto.dayLabel !== undefined) patch.day_label = dto.dayLabel;
    if (dto.supersetGroup !== undefined) patch.superset_group = dto.supersetGroup;
    if (dto.notes !== undefined) patch.notes = dto.notes;
    const updated = await this.repo.updateWorkoutExercise(workoutId, exerciseRowId, patch);
    if (!updated) throw new NotFoundException('Workout exercise not found');
    await this.logChange(companyId, user.id, 'exercise_updated', {
      workoutId,
      studentId: workout.studentId,
      diff: patch,
    });
    return this.repo.getWorkout(companyId, workoutId);
  }

  async deleteWorkoutExercise(
    user: AuthUser,
    auth: AuthContext,
    workoutId: string,
    exerciseRowId: string,
  ) {
    const companyId = this.companyId(auth);
    const workout = await this.repo.getWorkout(companyId, workoutId);
    if (!workout) throw new NotFoundException('Workout not found');
    await this.repo.deleteWorkoutExercise(workoutId, exerciseRowId);
    await this.logChange(companyId, user.id, 'exercise_removed', {
      workoutId,
      studentId: workout.studentId,
      diff: { exerciseRowId },
    });
    return this.repo.getWorkout(companyId, workoutId);
  }

  async fromTemplate(
    user: AuthUser,
    auth: AuthContext,
    templateId: string,
    dto: FromTemplateDto,
  ) {
    const tpl = await this.getTemplate(auth, templateId);
    return this.createWorkout(user, auth, {
      studentId: dto.studentId,
      name: dto.name || tpl.name,
      templateId: tpl.id,
      objective: tpl.objective || undefined,
      exercises: (tpl.exercises || []).map((e) => this.mapExerciseInput(e)),
      publish: dto.publish,
      splitType: 'custom',
    });
  }

  async signWorkout(user: AuthUser, auth: AuthContext, id: string) {
    const companyId = this.companyId(auth);
    const existing = await this.repo.getWorkout(companyId, id);
    if (!existing) throw new NotFoundException('Workout not found');
    const now = new Date().toISOString();
    const updated = await this.repo.updateWorkout(companyId, id, {
      signed_trainer_at: now,
      signed_trainer_by: user.id,
    });
    await this.logChange(companyId, user.id, 'signed_trainer', {
      workoutId: id,
      studentId: existing.studentId,
      diff: { signedTrainerAt: now },
    });
    return updated;
  }

  async signWorkoutStudent(user: AuthUser, auth: AuthContext, id: string) {
    const companyId = this.companyId(auth);
    const existing = await this.repo.getWorkout(companyId, id);
    if (!existing) throw new NotFoundException('Workout not found');
    const now = new Date().toISOString();
    const updated = await this.repo.updateWorkout(companyId, id, {
      signed_student_at: now,
      signed_student_by: user.id,
    });
    await this.logChange(companyId, user.id, 'signed_student', {
      workoutId: id,
      studentId: existing.studentId,
      diff: { signedStudentAt: now },
    });
    return updated;
  }

  async workoutHistory(auth: AuthContext, id: string) {
    await this.getWorkout(auth, id);
    return this.repo.listChangeLogs(this.companyId(auth), id);
  }

  trainingTimeline(auth: AuthContext, studentId: string) {
    return this.repo.trainingTimeline(this.companyId(auth), studentId);
  }

  coachDashboard(auth: AuthContext) {
    return this.repo.coachDashboard(this.companyId(auth), auth.userId);
  }

  coachAgenda(auth: AuthContext, from?: string, to?: string) {
    const start = from || new Date().toISOString().slice(0, 10);
    const end =
      to ||
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return this.repo.coachAgenda(
      this.companyId(auth),
      `${start}T00:00:00.000Z`,
      `${end}T23:59:59.999Z`,
      auth.userId,
    );
  }

  async duplicateWorkout(user: AuthUser, auth: AuthContext, id: string, dto: DuplicateWorkoutDto) {
    const source = await this.getWorkout(auth, id);
    return this.createWorkout(user, auth, {
      studentId: dto.studentId || source.studentId,
      name: dto.name || `${source.name} (cópia)`,
      templateId: source.templateId || undefined,
      unitId: source.unitId || undefined,
      objective: source.objective || undefined,
      startsAt: source.startsAt || undefined,
      expiresAt: source.expiresAt || undefined,
      splitType: source.splitType,
      daysJson: source.daysJson,
      exercises: (source.exercises || []).map((e) => this.mapExerciseInput(e)),
      publish: false,
    });
  }

  listAssessments(auth: AuthContext, studentId?: string) {
    return this.repo.listAssessments(this.companyId(auth), studentId);
  }

  async deleteAssessment(auth: AuthContext, id: string) {
    const companyId = this.companyId(auth);
    const existing = await this.repo.getAssessment(companyId, id);
    if (!existing) throw new NotFoundException('Avaliação não encontrada');
    const deleted = await this.repo.softDeleteAssessment(companyId, id);
    if (!deleted) throw new NotFoundException('Avaliação não encontrada');
    return { ok: true, id };
  }

  private assessmentComputed(dto: {
    weight?: number;
    height?: number;
    bodyFat?: number;
    ageYears?: number;
    sex?: 'male' | 'female';
  }) {
    const weight = dto.weight ?? null;
    const height = dto.height ?? null;
    const bodyFat = dto.bodyFat ?? null;
    const bmi = weight && height ? calcBmi(weight, height) : null;
    const bmr =
      weight && height && dto.ageYears
        ? calcBmr(weight, height, dto.ageYears, dto.sex || 'male')
        : null;
    const lean = weight ? leanMassKg(weight, bodyFat) : null;
    const fatMass =
      weight != null && bodyFat != null
        ? Math.round(((weight * bodyFat) / 100) * 10) / 10
        : null;
    return { weight, height, bodyFat, bmi, bmr, lean, fatMass };
  }

  async createAssessment(user: AuthUser, auth: AuthContext, dto: CreateAssessmentDto) {
    const companyId = this.companyId(auth);
    const c = this.assessmentComputed(dto);

    const assessment = await this.repo.createAssessment({
      company_id: companyId,
      unit_id: dto.unitId || auth.defaultUnitId || null,
      student_id: dto.studentId,
      trainer_id: user.id,
      weight: c.weight,
      height: c.height,
      body_fat: c.bodyFat,
      lean_mass: c.lean,
      fat_mass: c.fatMass,
      bmi: c.bmi,
      bmr: c.bmr,
      visceral_fat: dto.visceralFat ?? null,
      metabolic_age: dto.metabolicAge ?? null,
      hr_rest: dto.hrRest ?? null,
      bp_systolic: dto.bpSystolic ?? null,
      bp_diastolic: dto.bpDiastolic ?? null,
      skinfolds_json: dto.skinfoldsJson || {},
      goal: dto.goal || null,
      objective: dto.objective || null,
      observations: dto.observations || null,
      next_due_at: dto.nextDueAt || null,
    });

    if (dto.measurements) {
      await this.repo.upsertMeasurements(assessment.id, this.measurementRow(dto.measurements));
    }

    const full = await this.repo.getAssessment(companyId, assessment.id);
    await this.logChange(companyId, user.id, 'assessment_created', {
      assessmentId: assessment.id,
      studentId: dto.studentId,
    });
    this.events.emit(ASSESSMENT_CREATED, {
      companyId,
      assessmentId: assessment.id,
      studentId: dto.studentId,
    });
    return full;
  }

  async updateAssessment(user: AuthUser, auth: AuthContext, id: string, dto: UpdateAssessmentDto) {
    const companyId = this.companyId(auth);
    const existing = await this.repo.getAssessment(companyId, id);
    if (!existing) throw new NotFoundException('Avaliação não encontrada');

    const weight = dto.weight !== undefined ? dto.weight : existing.weight ?? undefined;
    const height = dto.height !== undefined ? dto.height : existing.height ?? undefined;
    const bodyFat = dto.bodyFat !== undefined ? dto.bodyFat : existing.bodyFat ?? undefined;
    const c = this.assessmentComputed({
      weight,
      height,
      bodyFat,
      ageYears: dto.ageYears,
      sex: dto.sex,
    });

    const patch: Record<string, unknown> = {};
    if (dto.weight !== undefined) patch.weight = c.weight;
    if (dto.height !== undefined) patch.height = c.height;
    if (dto.bodyFat !== undefined) patch.body_fat = c.bodyFat;
    if (dto.visceralFat !== undefined) patch.visceral_fat = dto.visceralFat;
    if (dto.metabolicAge !== undefined) patch.metabolic_age = dto.metabolicAge;
    if (dto.hrRest !== undefined) patch.hr_rest = dto.hrRest;
    if (dto.bpSystolic !== undefined) patch.bp_systolic = dto.bpSystolic;
    if (dto.bpDiastolic !== undefined) patch.bp_diastolic = dto.bpDiastolic;
    if (dto.skinfoldsJson !== undefined) patch.skinfolds_json = dto.skinfoldsJson;
    if (dto.goal !== undefined) patch.goal = dto.goal;
    if (dto.objective !== undefined) patch.objective = dto.objective;
    if (dto.observations !== undefined) patch.observations = dto.observations;
    if (dto.nextDueAt !== undefined) patch.next_due_at = dto.nextDueAt;
    if (
      dto.weight !== undefined ||
      dto.height !== undefined ||
      dto.bodyFat !== undefined ||
      dto.ageYears !== undefined
    ) {
      patch.bmi = c.bmi;
      patch.bmr = c.bmr;
      patch.lean_mass = c.lean;
      patch.fat_mass = c.fatMass;
    }

    if (dto.measurements) {
      await this.repo.upsertMeasurements(id, this.measurementRow(dto.measurements));
    }

    const updated = await this.repo.updateAssessment(companyId, id, patch);
    await this.logChange(companyId, user.id, 'assessment_updated', {
      assessmentId: id,
      studentId: existing.studentId,
      diff: patch,
    });
    this.events.emit(PROGRESS_UPDATED, {
      companyId,
      studentId: existing.studentId,
    });
    return updated;
  }

  private comparisonAt(
    series: ProgressPoint[],
    days: number,
  ): { weightDelta: number | null; bodyFatDelta: number | null } {
    if (series.length < 2) return { weightDelta: null, bodyFatDelta: null };
    const latest = series[series.length - 1];
    const cutoff = new Date(latest.date);
    cutoff.setDate(cutoff.getDate() - days);
    let baseline = series[0];
    for (const p of series) {
      if (new Date(p.date) <= cutoff) baseline = p;
    }
    return {
      weightDelta:
        latest.weight != null && baseline.weight != null
          ? latest.weight - baseline.weight
          : null,
      bodyFatDelta:
        latest.bodyFat != null && baseline.bodyFat != null
          ? latest.bodyFat - baseline.bodyFat
          : null,
    };
  }

  async progress(
    auth: AuthContext,
    studentId: string,
    from?: string,
    to?: string,
  ): Promise<ProgressSummary> {
    await this.assertStudentScope(auth, studentId);
    const companyId = this.companyId(auth);
    let assessments = await this.repo.listAssessments(companyId, studentId);
    const photos = await this.repo.listPhotos(companyId, studentId);

    if (from) {
      const fromTs = new Date(from).getTime();
      assessments = assessments.filter((a) => new Date(a.createdAt).getTime() >= fromTs);
    }
    if (to) {
      const toTs = new Date(to).getTime();
      assessments = assessments.filter((a) => new Date(a.createdAt).getTime() <= toTs);
    }

    const chronological = [...assessments].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    const series: ProgressPoint[] = chronological.map((a) => ({
      date: a.createdAt,
      weight: a.weight,
      bmi: a.bmi,
      leanMass: a.leanMass,
      bodyFat: a.bodyFat,
      fatMass: a.fatMass,
      measurements: a.measurements ?? null,
    }));

    let weightDelta: number | null = null;
    let bodyFatDelta: number | null = null;
    let evolutionPct: number | null = null;
    if (series.length >= 2) {
      const first = series[0];
      const last = series[series.length - 1];
      if (first.weight != null && last.weight != null) weightDelta = last.weight - first.weight;
      if (first.bodyFat != null && last.bodyFat != null) {
        bodyFatDelta = last.bodyFat - first.bodyFat;
        if (first.bodyFat !== 0) {
          evolutionPct =
            Math.round(((first.bodyFat - last.bodyFat) / Math.abs(first.bodyFat)) * 1000) / 10;
        }
      }
    }

    const allAssessments = await this.repo.listAssessments(companyId, studentId);
    const nextDue = allAssessments
      .map((a) => a.nextDueAt)
      .filter(Boolean)
      .sort()[0] || null;

    return {
      studentId,
      assessments,
      photos,
      series,
      weightDelta,
      bodyFatDelta,
      evolutionPct,
      comparisons: {
        '30d': this.comparisonAt(series, 30),
        '90d': this.comparisonAt(series, 90),
        '180d': this.comparisonAt(series, 180),
        '365d': this.comparisonAt(series, 365),
      },
      nextAssessmentDue: nextDue,
      lastCheckinAt: await this.repo.lastCheckinAt(companyId, studentId),
      activeWorkout: await this.repo.activeWorkoutForStudent(companyId, studentId),
    };
  }

  async createProgressPhoto(auth: AuthContext, dto: CreateProgressPhotoDto) {
    const companyId = this.companyId(auth);
    const type = dto.type || 'front';
    if (!PHOTO_TYPES.has(type)) {
      throw new BadRequestException('invalid_photo_type');
    }
    const path = dto.storagePath.includes('/')
      ? dto.storagePath
      : storageProgressPath(companyId, dto.studentId, dto.storagePath);

    if (!/\.(jpg|jpeg|png|webp)$/i.test(path)) {
      throw new BadRequestException('invalid_media_type');
    }

    const photo = await this.repo.createPhoto({
      company_id: companyId,
      student_id: dto.studentId,
      type,
      storage_path: path,
      public_url: dto.publicUrl || null,
      taken_at: dto.takenAt || new Date().toISOString(),
    });
    this.events.emit(PROGRESS_UPDATED, {
      companyId,
      studentId: dto.studentId,
      photoId: photo.id,
    });
    return photo;
  }

  async deleteProgressPhoto(auth: AuthContext, photoId: string) {
    const companyId = this.companyId(auth);
    const photo = await this.repo.getPhoto(companyId, photoId);
    if (!photo) throw new NotFoundException('Foto não encontrada');

    const deleted = await this.repo.softDeletePhoto(companyId, photoId);
    if (!deleted) throw new NotFoundException('Foto não encontrada');

    if (photo.storagePath) {
      const admin = this.supabase.getAdmin();
      await admin.storage.from('student-photos').remove([photo.storagePath]);
    }

    this.events.emit(PROGRESS_UPDATED, {
      companyId,
      studentId: photo.studentId,
      photoId: photo.id,
    });
    return { ok: true, id: photo.id };
  }

  async uploadProgressPhoto(
    auth: AuthContext,
    studentId: string,
    file: Express.Multer.File | undefined,
    type = 'front',
  ) {
    if (!file) throw new BadRequestException('Arquivo obrigatório');
    if (!studentId) throw new BadRequestException('studentId obrigatório');
    if (file.size > MAX_PROGRESS_PHOTO_BYTES) {
      throw new BadRequestException('Foto deve ter no máximo 5MB');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Arquivo deve ser imagem (jpg, png ou webp)');
    }
    if (!PHOTO_TYPES.has(type)) {
      throw new BadRequestException('invalid_photo_type');
    }

    const companyId = this.companyId(auth);
    const ext = file.mimetype.includes('png')
      ? 'png'
      : file.mimetype.includes('webp')
        ? 'webp'
        : 'jpg';
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${type || 'front'}-${stamp}.${ext}`;
    const path = storageProgressPath(companyId, studentId, fileName);

    const admin = this.supabase.getAdmin();
    const { error } = await admin.storage
      .from('student-photos')
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: true });
    if (error) throw new BadRequestException(error.message);

    const { data: pub } = admin.storage.from('student-photos').getPublicUrl(path);
    return this.createProgressPhoto(auth, {
      studentId,
      type: type || 'front',
      storagePath: path,
      publicUrl: pub.publicUrl,
    });
  }

  async suggestWorkout(user: AuthUser, auth: AuthContext, dto: AiWorkoutSuggestionDto) {
    const companyId = this.companyId(auth);
    const exercises = await this.repo.listExercises(companyId);
    let assessment = null;
    if (dto.assessmentId) {
      assessment = await this.repo.getAssessment(companyId, dto.assessmentId);
    } else {
      const list = await this.repo.listAssessments(companyId, dto.studentId);
      assessment = list[0] || null;
    }

    const service = getWorkoutRecommendationService();
    const suggestion = await service.suggest({
      studentId: dto.studentId,
      objective: dto.objective || assessment?.objective || undefined,
      bodyFat: assessment?.bodyFat ?? undefined,
      bmi: assessment?.bmi ?? undefined,
      weight: assessment?.weight ?? undefined,
      injuries: dto.injuries,
      weeklyFrequency: dto.weeklyFrequency,
      availableExerciseIds: exercises.map((e) => e.id),
    });

    const row = await this.repo.createSuggestion({
      company_id: companyId,
      student_id: dto.studentId,
      assessment_id: assessment?.id || null,
      objective: suggestion.objective,
      payload: suggestion,
      status: 'pending_review',
      created_by: user.id,
    });

    this.events.emit(WORKOUT_SUGGESTED, {
      companyId,
      suggestionId: String(row.id),
      studentId: dto.studentId,
    });

    let draft = null;
    if (dto.createDraft !== false && suggestion.exercises.length) {
      draft = await this.createWorkout(user, auth, {
        studentId: dto.studentId,
        name: suggestion.name,
        objective: suggestion.objective,
        exercises: suggestion.exercises.map((e, i) => ({
          exerciseId: e.exerciseId,
          sortOrder: i + 1,
          sets: e.sets,
          repetitions: e.repetitions,
          restSeconds: e.restSeconds,
          notes: e.notes,
        })),
        publish: false,
      });
      if (draft) {
        await this.repo.updateWorkout(companyId, draft.id, {
          source: 'ai',
          ai_suggestion_id: row.id,
        });
        draft = await this.repo.getWorkout(companyId, draft.id);
      }
    }

    return { suggestionId: row.id, suggestion, draft };
  }

  async completeSession(auth: AuthContext, dto: CompleteSessionDto) {
    const companyId = this.companyId(auth);
    const workout = await this.repo.getWorkout(companyId, dto.workoutId);
    if (!workout) throw new NotFoundException('Workout not found');
    if (workout.status === 'expired' || isWorkoutExpired(workout.expiresAt)) {
      throw new BadRequestException('workout_expired');
    }

    const session = await this.repo.createSession({
      company_id: companyId,
      workout_id: workout.id,
      student_id: workout.studentId,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      notes: dto.notes || null,
      status: 'completed',
    });

    this.events.emit(WORKOUT_COMPLETED, {
      companyId,
      workoutId: workout.id,
      sessionId: String(session.id),
      studentId: workout.studentId,
    });
    this.events.emit(PROGRESS_UPDATED, {
      companyId,
      studentId: workout.studentId,
    });

    return { sessionId: session.id, workoutId: workout.id, status: 'completed' };
  }

  dashboard(auth: AuthContext) {
    return this.repo.dashboard(this.companyId(auth));
  }

  async portalMe(auth: AuthContext) {
    const companyId = this.companyId(auth);
    const email = (auth.email || '').trim().toLowerCase();
    if (!email) throw new BadRequestException('email required');

    const { data: student, error } = await this.supabase
      .getAdmin()
      .from('students')
      .select('id, full_name, email, registration_number, status, plan_name, unit_id')
      .eq('company_id', companyId)
      .ilike('email', email)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!student) throw new NotFoundException('Ficha de aluno não encontrada para este usuário');

    const studentId = String(student.id);
    const [progress, workouts] = await Promise.all([
      this.progress(auth, studentId),
      this.repo.listWorkouts(companyId, studentId),
    ]);

    return {
      student: {
        id: studentId,
        fullName: String(student.full_name),
        email: student.email ? String(student.email) : null,
        registrationNumber: String(student.registration_number),
        status: String(student.status),
        planName: student.plan_name ? String(student.plan_name) : null,
        unitId: student.unit_id ? String(student.unit_id) : null,
      },
      progress,
      workouts,
    };
  }
}
