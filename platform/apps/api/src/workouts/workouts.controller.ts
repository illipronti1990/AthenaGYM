import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthContext } from '@movvo/shared';
import { CurrentAuth, CurrentUser } from '../common/decorators/current.decorators';
import { Permissions } from '../common/decorators/rbac.decorators';
import {
  CompanyGuard,
  PermissionsGuard,
  UnitGuard,
} from '../common/guards/rbac.guards';
import { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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
  UpdateWorkoutExerciseDto,
  WorkoutExerciseInputDto,
} from './dto/workouts.dto';
import { WorkoutsService } from './workouts.service';

@ApiTags('workouts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
@Controller()
export class WorkoutsController {
  constructor(private readonly workouts: WorkoutsService) {}

  @Get('portal/me')
  @Permissions('progress.read')
  @ApiOperation({ summary: 'Student portal: own student card + progress + workouts' })
  portalMe(@CurrentAuth() auth: AuthContext) {
    return this.workouts.portalMe(auth);
  }

  @Get('workouts/dashboard')
  @Permissions('workouts.read')
  @ApiOperation({ summary: 'Workouts / assessments KPIs' })
  dashboard(@CurrentAuth() auth: AuthContext) {
    return this.workouts.dashboard(auth);
  }

  @Get('coach/dashboard')
  @Permissions('workouts.read')
  @ApiOperation({ summary: 'Coach dashboard KPIs + agenda' })
  coachDashboard(@CurrentAuth() auth: AuthContext) {
    return this.workouts.coachDashboard(auth);
  }

  @Get('coach/agenda')
  @Permissions('workouts.read')
  coachAgenda(
    @CurrentAuth() auth: AuthContext,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.workouts.coachAgenda(auth, from, to);
  }

  @Get('workouts')
  @Permissions('workouts.read')
  listWorkouts(@CurrentAuth() auth: AuthContext, @Query('studentId') studentId?: string) {
    return this.workouts.listWorkouts(auth, studentId);
  }

  @Get('workouts/:id')
  @Permissions('workouts.read')
  getWorkout(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.workouts.getWorkout(auth, id);
  }

  @Get('workouts/:id/history')
  @Permissions('workouts.read')
  workoutHistory(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.workouts.workoutHistory(auth, id);
  }

  @Post('workouts')
  @Permissions('workouts.create')
  createWorkout(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateWorkoutDto,
  ) {
    return this.workouts.createWorkout(user, auth, dto);
  }

  @Post('workouts/sessions/complete')
  @Permissions('workouts.update')
  @ApiOperation({ summary: 'Register workout execution completion' })
  complete(@CurrentAuth() auth: AuthContext, @Body() dto: CompleteSessionDto) {
    return this.workouts.completeSession(auth, dto);
  }

  @Patch('workouts/:id')
  @Permissions('workouts.update')
  updateWorkout(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateWorkoutDto,
  ) {
    return this.workouts.updateWorkout(user, auth, id, dto);
  }

  @Post('workouts/:id/duplicate')
  @Permissions('workouts.create')
  duplicate(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: DuplicateWorkoutDto,
  ) {
    return this.workouts.duplicateWorkout(user, auth, id, dto);
  }

  @Post('workouts/:id/reorder')
  @Permissions('workouts.update')
  reorder(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: ReorderWorkoutExercisesDto,
  ) {
    return this.workouts.reorderWorkoutExercises(user, auth, id, dto);
  }

  @Post('workouts/:id/exercises')
  @Permissions('workouts.update')
  addExercise(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: WorkoutExerciseInputDto,
  ) {
    return this.workouts.addWorkoutExercise(user, auth, id, dto);
  }

  @Patch('workouts/:id/exercises/:exId')
  @Permissions('workouts.update')
  patchExercise(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Param('exId') exId: string,
    @Body() dto: UpdateWorkoutExerciseDto,
  ) {
    return this.workouts.updateWorkoutExercise(user, auth, id, exId, dto);
  }

  @Delete('workouts/:id/exercises/:exId')
  @Permissions('workouts.update')
  removeExercise(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Param('exId') exId: string,
  ) {
    return this.workouts.deleteWorkoutExercise(user, auth, id, exId);
  }

  @Post('templates/:id/apply')
  @Permissions('workouts.create')
  @ApiOperation({ summary: 'Create workout from template (from-template)' })
  applyTemplate(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') templateId: string,
    @Body() dto: FromTemplateDto,
  ) {
    return this.workouts.fromTemplate(user, auth, templateId, dto);
  }

  @Post('workouts/:id/sign')
  @Permissions('workouts.update')
  signTrainer(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
  ) {
    return this.workouts.signWorkout(user, auth, id);
  }

  @Post('workouts/:id/sign-student')
  @Permissions('workouts.read')
  signStudent(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
  ) {
    return this.workouts.signWorkoutStudent(user, auth, id);
  }

  @Get('exercises')
  @Permissions('exercises.read')
  listExercises(
    @CurrentAuth() auth: AuthContext,
    @Query('muscleGroup') muscleGroup?: string,
    @Query('equipment') equipment?: string,
    @Query('difficulty') difficulty?: string,
    @Query('objective') objective?: string,
    @Query('trainerId') trainerId?: string,
    @Query('q') q?: string,
  ) {
    return this.workouts.listExercises(auth, {
      muscleGroup,
      equipment,
      difficulty,
      objective,
      trainerId,
      q,
    });
  }

  @Post('exercises')
  @Permissions('exercises.manage')
  createExercise(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateExerciseDto,
  ) {
    return this.workouts.createExercise(user, auth, dto);
  }

  @Patch('exercises/:id')
  @Permissions('exercises.manage')
  updateExercise(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateExerciseDto,
  ) {
    return this.workouts.updateExercise(auth, id, dto);
  }

  @Delete('exercises/:id')
  @Permissions('exercises.manage')
  deleteExercise(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.workouts.deleteExercise(auth, id);
  }

  @Get('templates')
  @Permissions('workouts.read')
  listTemplates(@CurrentAuth() auth: AuthContext) {
    return this.workouts.listTemplates(auth);
  }

  @Get('templates/:id')
  @Permissions('workouts.read')
  getTemplate(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.workouts.getTemplate(auth, id);
  }

  @Post('templates')
  @Permissions('workouts.create')
  createTemplate(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateTemplateDto,
  ) {
    return this.workouts.createTemplate(user, auth, dto);
  }

  @Patch('templates/:id')
  @Permissions('workouts.update')
  updateTemplate(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: CreateTemplateDto,
  ) {
    return this.workouts.updateTemplate(auth, id, dto);
  }

  @Post('templates/:id/duplicate')
  @Permissions('workouts.create')
  duplicateTemplate(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
  ) {
    return this.workouts.duplicateTemplate(user, auth, id);
  }

  @Get('assessments')
  @Permissions('assessments.read')
  listAssessments(@CurrentAuth() auth: AuthContext, @Query('studentId') studentId?: string) {
    return this.workouts.listAssessments(auth, studentId);
  }

  @Post('assessments')
  @Permissions('assessments.create')
  createAssessment(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateAssessmentDto,
  ) {
    return this.workouts.createAssessment(user, auth, dto);
  }

  @Patch('assessments/:id')
  @Permissions('assessments.update')
  updateAssessment(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateAssessmentDto,
  ) {
    return this.workouts.updateAssessment(user, auth, id, dto);
  }

  @Delete('assessments/:id')
  @Permissions('assessments.update')
  @ApiOperation({ summary: 'Soft-delete physical assessment' })
  deleteAssessment(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.workouts.deleteAssessment(auth, id);
  }

  @Get('progress')
  @Permissions('progress.read')
  progress(
    @CurrentAuth() auth: AuthContext,
    @Query('studentId') studentId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.workouts.progress(auth, studentId, from, to);
  }

  @Get('students/:id/training-timeline')
  @Permissions('workouts.read')
  trainingTimeline(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.workouts.trainingTimeline(auth, id);
  }

  @Post('progress/photos')
  @Permissions('progress.create')
  createPhoto(@CurrentAuth() auth: AuthContext, @Body() dto: CreateProgressPhotoDto) {
    return this.workouts.createProgressPhoto(auth, dto);
  }

  @Post('progress/photos/upload')
  @Permissions('progress.create')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload progress photo (image file)' })
  @UseInterceptors(FileInterceptor('file'))
  uploadPhoto(
    @CurrentAuth() auth: AuthContext,
    @UploadedFile() file: Express.Multer.File,
    @Body('studentId') studentId: string,
    @Body('type') type?: string,
  ) {
    return this.workouts.uploadProgressPhoto(auth, studentId, file, type || 'front');
  }

  @Delete('progress/photos/:id')
  @Permissions('progress.create')
  @ApiOperation({ summary: 'Delete progress photo' })
  deletePhoto(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.workouts.deleteProgressPhoto(auth, id);
  }

  @Post('ai/workout-suggestions')
  @Permissions('ai.suggest')
  @ApiOperation({ summary: 'AI-assisted workout suggestion (trainer review required)' })
  suggest(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: AiWorkoutSuggestionDto,
  ) {
    return this.workouts.suggestWorkout(user, auth, dto);
  }
}
