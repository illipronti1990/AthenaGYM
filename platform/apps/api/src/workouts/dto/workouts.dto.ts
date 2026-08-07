import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsUuidString } from '../../common/validators/is-uuid-string';

export class WorkoutExerciseInputDto {
  @ApiProperty()
  @IsUuidString()
  exerciseId!: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  sortOrder?: number;

  @ApiPropertyOptional({ default: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  sets?: number;

  @ApiPropertyOptional({ default: '10' })
  @IsOptional()
  @IsString()
  repetitions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  load?: string;

  @ApiPropertyOptional({ default: 60 })
  @IsOptional()
  @IsInt()
  @Min(0)
  restSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tempo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cadence?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rpe?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dayLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supersetGroup?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateWorkoutExerciseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  exerciseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  sets?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  repetitions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  load?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  restSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tempo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cadence?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rpe?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dayLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supersetGroup?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateExerciseDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty()
  @IsString()
  muscleGroup!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subgroup?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  secondaryMuscles?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  categories?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  equipment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exerciseType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observations?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  objective?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  durationSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gifUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  imageUrls?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isGlobal?: boolean;
}

export class UpdateExerciseDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() muscleGroup?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subgroup?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() secondaryMuscles?: string[];
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() categories?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() equipment?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() difficulty?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() exerciseType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() instructions?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() observations?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() objective?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() durationSeconds?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() videoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() gifUrl?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() imageUrls?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
}

export class CreateWorkoutDto {
  @ApiProperty()
  @IsUuidString()
  studentId!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  templateId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  unitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  objective?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ type: [WorkoutExerciseInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkoutExerciseInputDto)
  exercises?: WorkoutExerciseInputDto[];

  @ApiPropertyOptional({ description: 'Publish immediately' })
  @IsOptional()
  @IsBoolean()
  publish?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  splitType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  daysJson?: Record<string, unknown>;
}

export class UpdateWorkoutDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  objective?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ type: [WorkoutExerciseInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkoutExerciseInputDto)
  exercises?: WorkoutExerciseInputDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  splitType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  daysJson?: Record<string, unknown>;
}

export class ReorderWorkoutExercisesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  exerciseIds!: string[];
}

export class FromTemplateDto {
  @ApiProperty()
  @IsUuidString()
  studentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  publish?: boolean;
}

export class BodyMeasurementsDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() chest?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() waist?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() abdomen?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() hip?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() armLeft?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() armRight?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() thighLeft?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() thighRight?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() calfLeft?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() calfRight?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() neck?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() shoulder?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() forearmLeft?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() forearmRight?: number;
}

export class UpdateAssessmentDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() weight?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() height?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() bodyFat?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() visceralFat?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() metabolicAge?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() ageYears?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() sex?: 'male' | 'female';
  @ApiPropertyOptional() @IsOptional() @IsNumber() hrRest?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() bpSystolic?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() bpDiastolic?: number;
  @ApiPropertyOptional() @IsOptional() skinfoldsJson?: Record<string, number>;
  @ApiPropertyOptional() @IsOptional() @IsString() goal?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() objective?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() observations?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() nextDueAt?: string;
  @ApiPropertyOptional({ type: BodyMeasurementsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BodyMeasurementsDto)
  measurements?: BodyMeasurementsDto;
}

export class DuplicateWorkoutDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
}

export class CreateAssessmentDto {
  @ApiProperty()
  @IsUuidString()
  studentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  unitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bodyFat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  visceralFat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  metabolicAge?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  ageYears?: number;

  @ApiPropertyOptional({ enum: ['male', 'female'] })
  @IsOptional()
  @IsString()
  sex?: 'male' | 'female';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  objective?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observations?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  hrRest?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  bpSystolic?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  bpDiastolic?: number;

  @ApiPropertyOptional()
  @IsOptional()
  skinfoldsJson?: Record<string, number>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  goal?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextDueAt?: string;

  @ApiPropertyOptional({ type: BodyMeasurementsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BodyMeasurementsDto)
  measurements?: BodyMeasurementsDto;
}

export class CreateProgressPhotoDto {
  @ApiProperty()
  @IsUuidString()
  studentId!: string;

  @ApiPropertyOptional({ default: 'front' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ description: 'Path relative under companies/.../progress/' })
  @IsString()
  storagePath!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  publicUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  takenAt?: string;
}

export class AiWorkoutSuggestionDto {
  @ApiProperty()
  @IsUuidString()
  studentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  assessmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  objective?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  injuries?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  weeklyFrequency?: number;

  @ApiPropertyOptional({ description: 'Create draft workout from suggestion' })
  @IsOptional()
  @IsBoolean()
  createDraft?: boolean;
}

export class CompleteSessionDto {
  @ApiProperty()
  @IsUuidString()
  workoutId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateTemplateDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  objective?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  estimatedDuration?: number;

  @ApiPropertyOptional({ type: [WorkoutExerciseInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkoutExerciseInputDto)
  exercises?: WorkoutExerciseInputDto[];
}
