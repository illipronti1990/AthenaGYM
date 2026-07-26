import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getWorkoutRecommendationService } from '@athena/ai-sdk';
import {
  calcBmi,
  calcBmr,
  isWorkoutExpired,
  leanMassKg,
  slugify,
  storageProgressPath,
} from '@athena/exercise-engine';
import type { AuthContext } from '@athena/shared';
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
      tempo: e.tempo || null,
      notes: e.notes || null,
    }));
  }

  listExercises(auth: AuthContext) {
    return this.repo.listExercises(this.companyId(auth));
  }

  async createExercise(auth: AuthContext, dto: CreateExerciseDto) {
    const companyId = this.companyId(auth);
    return this.repo.createExercise({
      company_id: dto.isGlobal ? null : companyId,
      name: dto.name,
      slug: slugify(dto.name),
      muscle_group: dto.muscleGroup,
      secondary_muscles: dto.secondaryMuscles || [],
      equipment: dto.equipment || null,
      difficulty: dto.difficulty || 'beginner',
      exercise_type: dto.exerciseType || 'strength',
      instructions: dto.instructions || null,
      video_url: dto.videoUrl || null,
      is_global: Boolean(dto.isGlobal),
      status: 'active',
    });
  }

  listTemplates(auth: AuthContext) {
    return this.repo.listTemplates(this.companyId(auth));
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
        dto.exercises.map((e, i) => ({
          template_id: template.id,
          exercise_id: e.exerciseId,
          sort_order: e.sortOrder ?? i + 1,
          sets: e.sets ?? 3,
          repetitions: e.repetitions ?? '10',
          load: e.load || null,
          rest_seconds: e.restSeconds ?? 60,
          tempo: e.tempo || null,
          notes: e.notes || null,
        })),
      );
    }
    return template;
  }

  listWorkouts(auth: AuthContext, studentId?: string) {
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
    if (dto.publish && full) {
      this.events.emit(WORKOUT_PUBLISHED, {
        companyId,
        workoutId: full.id,
        studentId: full.studentId,
      });
    }
    return full;
  }

  async updateWorkout(auth: AuthContext, id: string, dto: UpdateWorkoutDto) {
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
    if (dto.status !== undefined) {
      patch.status = dto.status;
      if (dto.status === 'published') {
        patch.published_at = new Date().toISOString();
      }
    }

    const updated = await this.repo.updateWorkout(companyId, id, patch);
    if (dto.status === 'published') {
      this.events.emit(WORKOUT_PUBLISHED, {
        companyId,
        workoutId: updated.id,
        studentId: updated.studentId,
      });
    }
    return updated;
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
      exercises: (source.exercises || []).map((e) => ({
        exerciseId: e.exerciseId,
        sortOrder: e.sortOrder,
        sets: e.sets,
        repetitions: e.repetitions,
        load: e.load || undefined,
        restSeconds: e.restSeconds,
        tempo: e.tempo || undefined,
        notes: e.notes || undefined,
      })),
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

  async createAssessment(user: AuthUser, auth: AuthContext, dto: CreateAssessmentDto) {
    const companyId = this.companyId(auth);
    const weight = dto.weight ?? null;
    const height = dto.height ?? null;
    const bodyFat = dto.bodyFat ?? null;
    const bmi = weight && height ? calcBmi(weight, height) : null;
    const bmr =
      weight && height && dto.ageYears
        ? calcBmr(weight, height, dto.ageYears, dto.sex || 'male')
        : null;
    const lean = weight ? leanMassKg(weight, bodyFat) : null;

    const assessment = await this.repo.createAssessment({
      company_id: companyId,
      unit_id: dto.unitId || auth.defaultUnitId || null,
      student_id: dto.studentId,
      trainer_id: user.id,
      weight,
      height,
      body_fat: bodyFat,
      lean_mass: lean,
      bmi,
      bmr,
      visceral_fat: dto.visceralFat ?? null,
      metabolic_age: dto.metabolicAge ?? null,
      objective: dto.objective || null,
      observations: dto.observations || null,
    });

    if (dto.measurements) {
      await this.repo.upsertMeasurements(assessment.id, {
        chest: dto.measurements.chest ?? null,
        waist: dto.measurements.waist ?? null,
        abdomen: dto.measurements.abdomen ?? null,
        hip: dto.measurements.hip ?? null,
        arm_left: dto.measurements.armLeft ?? null,
        arm_right: dto.measurements.armRight ?? null,
        thigh_left: dto.measurements.thighLeft ?? null,
        thigh_right: dto.measurements.thighRight ?? null,
        calf_left: dto.measurements.calfLeft ?? null,
        calf_right: dto.measurements.calfRight ?? null,
      });
    }

    const full = await this.repo.getAssessment(companyId, assessment.id);
    this.events.emit(ASSESSMENT_CREATED, {
      companyId,
      assessmentId: assessment.id,
      studentId: dto.studentId,
    });
    return full;
  }

  async progress(auth: AuthContext, studentId: string) {
    const companyId = this.companyId(auth);
    const assessments = await this.repo.listAssessments(companyId, studentId);
    const photos = await this.repo.listPhotos(companyId, studentId);
    let weightDelta: number | null = null;
    let bodyFatDelta: number | null = null;
    let evolutionPct: number | null = null;
    if (assessments.length >= 2) {
      const first = assessments[assessments.length - 1];
      const last = assessments[0];
      if (first.weight != null && last.weight != null) weightDelta = last.weight - first.weight;
      if (first.bodyFat != null && last.bodyFat != null) {
        bodyFatDelta = last.bodyFat - first.bodyFat;
        if (first.bodyFat !== 0) {
          evolutionPct = Math.round(((first.bodyFat - last.bodyFat) / Math.abs(first.bodyFat)) * 1000) / 10;
        }
      }
    }
    return { studentId, assessments, photos, weightDelta, bodyFatDelta, evolutionPct };
  }

  async createProgressPhoto(auth: AuthContext, dto: CreateProgressPhotoDto) {
    const companyId = this.companyId(auth);
    const path = dto.storagePath.includes('/')
      ? dto.storagePath
      : storageProgressPath(companyId, dto.studentId, dto.storagePath);

    if (!/\.(jpg|jpeg|png|webp)$/i.test(path)) {
      throw new BadRequestException('invalid_media_type');
    }

    const photo = await this.repo.createPhoto({
      company_id: companyId,
      student_id: dto.studentId,
      type: dto.type || 'front',
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
      objective: dto.objective || assessment?.objective,
      bodyFat: assessment?.bodyFat,
      bmi: assessment?.bmi,
      weight: assessment?.weight,
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
}
