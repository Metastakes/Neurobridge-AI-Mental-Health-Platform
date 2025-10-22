import { IsString, IsOptional, IsDateString, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePatientDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsDateString()
  dateOfBirth: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sex?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  emergencyPhone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  providerId?: string;
}

export class UpdatePatientDto {
  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sex?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  emergencyPhone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pharmacyName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pharmacyPhone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pharmacyAddress?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  height?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional()
  @IsEnum(['STABLE', 'NEW_MESSAGE', 'EMERGENCY'])
  @IsOptional()
  alertStatus?: 'STABLE' | 'NEW_MESSAGE' | 'EMERGENCY';

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  onboardingComplete?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  providerId?: string;
}

export class SessionReviewDto {
  @ApiProperty({ description: 'Session rating (1-5)' })
  @IsNumber()
  rating: number;

  @ApiPropertyOptional({ description: 'Review text feedback' })
  @IsString()
  @IsOptional()
  feedback?: string;

  @ApiPropertyOptional({ description: 'Session ID being reviewed' })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Would recommend (yes/no)' })
  @IsBoolean()
  @IsOptional()
  wouldRecommend?: boolean;
}
