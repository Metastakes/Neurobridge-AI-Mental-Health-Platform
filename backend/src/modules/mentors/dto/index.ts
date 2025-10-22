import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMentorDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  npiNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  licenseNumber?: string;
}

export class UpdateMentorDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  npiNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  licenseNumber?: string;
}

export class AssignProviderDto {
  @ApiProperty({ description: 'Provider ID to assign to this mentor' })
  @IsString()
  providerId: string;
}
