import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMedicationDto {
  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  dosage: string;

  @ApiProperty()
  @IsString()
  frequency: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  prescriberId?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startedAt?: string;
}

export class UpdateMedicationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dosage?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  frequency?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsEnum(['ACTIVE', 'DISCONTINUED', 'PAUSED'])
  @IsOptional()
  status?: 'ACTIVE' | 'DISCONTINUED' | 'PAUSED';

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  stoppedAt?: string;
}
