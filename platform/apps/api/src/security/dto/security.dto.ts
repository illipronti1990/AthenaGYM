import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class MfaCodeDto {
  @IsString()
  code!: string;
}

export class ConsentDto {
  @IsString()
  purpose!: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsString()
  legalBasis?: string;

  @IsBoolean()
  granted!: boolean;

  @IsOptional()
  @IsUUID()
  subjectUserId?: string;

  @IsOptional()
  @IsString()
  subjectEmail?: string;
}

export class LgpdSubjectDto {
  @IsOptional()
  @IsUUID()
  subjectUserId?: string;
}

export class RetentionDto {
  @IsIn(['logs', 'audit', 'files', 'backup', 'security_events'])
  resource!: string;

  @IsInt()
  @Min(30)
  retainDays!: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class SecretPutDto {
  @IsString()
  provider!: string;

  @IsString()
  keyName!: string;

  @IsString()
  value!: string;

  @IsOptional()
  @IsIn(['development', 'homologation', 'production'])
  environment?: 'development' | 'homologation' | 'production';
}

export class BackupStartDto {
  @IsOptional()
  @IsString()
  backupType?: string;

  @IsOptional()
  @IsString()
  storagePath?: string;
}
