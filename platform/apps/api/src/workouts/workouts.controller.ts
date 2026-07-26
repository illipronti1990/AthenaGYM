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
import type { AuthContext } from '@athena/shared';
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
  UpdateWorkoutDto,
} from './dto/workouts.dto';
import { WorkoutsService } from './workouts.service';

@ApiTags('workouts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
@Controller()
export class WorkoutsController {
  constructor(private readonly workouts: WorkoutsService) {}

  @Get('workouts/dashboard')
  @Permissions('workouts.read')
  @ApiOperation({ summary: 'Workouts / assessments KPIs' })
  dashboard(@CurrentAuth() auth: AuthContext) {
    return this.workouts.dashboard(auth);
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
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateWorkoutDto,
  ) {
    return this.workouts.updateWorkout(auth, id, dto);
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

  @Get('exercises')
  @Permissions('exercises.read')
  listExercises(@CurrentAuth() auth: AuthContext) {
    return this.workouts.listExercises(auth);
  }

  @Post('exercises')
  @Permissions('exercises.manage')
  createExercise(@CurrentAuth() auth: AuthContext, @Body() dto: CreateExerciseDto) {
    return this.workouts.createExercise(auth, dto);
  }

  @Get('templates')
  @Permissions('workouts.read')
  listTemplates(@CurrentAuth() auth: AuthContext) {
    return this.workouts.listTemplates(auth);
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

  @Get('progress')
  @Permissions('progress.read')
  progress(@CurrentAuth() auth: AuthContext, @Query('studentId') studentId: string) {
    return this.workouts.progress(auth, studentId);
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
