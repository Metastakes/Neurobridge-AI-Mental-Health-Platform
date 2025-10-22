import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsDateString } from 'class-validator';
import { ReferrerType, ReferralStatus } from '@prisma/client';

// DTO for tracking a referral signup
export class TrackReferralDto {
  @ApiProperty({ description: 'Referral code used during signup' })
  @IsString()
  referralCode: string;

  @ApiProperty({ description: 'Email of the person signing up' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Type of user signing up', enum: ReferrerType })
  @IsEnum(ReferrerType)
  userType: ReferrerType;

  @ApiPropertyOptional({ description: 'Additional metadata (UTM params, etc.)' })
  @IsOptional()
  metadata?: Record<string, any>;
}

// DTO for claiming a referral reward
export class ClaimReferralRewardDto {
  @ApiProperty({ description: 'Referral ID to claim reward for' })
  @IsString()
  referralId: string;
}

// DTO for generating a referral code
export class GenerateReferralCodeDto {
  @ApiPropertyOptional({ description: 'Custom referral code (optional)' })
  @IsOptional()
  @IsString()
  customCode?: string;
}

// Response DTO for referral stats
export class ReferralStatsDto {
  @ApiProperty()
  referralCode: string;

  @ApiProperty()
  totalReferrals: number;

  @ApiProperty()
  pendingReferrals: number;

  @ApiProperty()
  completedReferrals: number;

  @ApiProperty()
  totalPointsEarned: number;

  @ApiProperty()
  totalBonusEarned: number;

  @ApiPropertyOptional()
  nextReward?: {
    name: string;
    progress: number;
    target: number;
    reward: string;
  };

  @ApiProperty({ type: 'array' })
  referrals: ReferralDto[];
}

// DTO for a single referral
export class ReferralDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  refereeName: string;

  @ApiProperty({ enum: ReferralStatus })
  status: ReferralStatus;

  @ApiPropertyOptional()
  signupDate?: Date;

  @ApiPropertyOptional()
  firstSessionDate?: Date;

  @ApiProperty()
  pointsEarned: number;

  @ApiProperty()
  bonusEarned: number;

  @ApiProperty()
  rewardClaimed: boolean;

  @ApiProperty()
  createdAt: Date;
}

// DTO for updating referral status
export class UpdateReferralStatusDto {
  @ApiProperty({ description: 'New status', enum: ReferralStatus })
  @IsEnum(ReferralStatus)
  status: ReferralStatus;

  @ApiPropertyOptional({ description: 'Date of status change' })
  @IsOptional()
  @IsDateString()
  statusDate?: string;
}

// DTO for provider profile info
export class UpdateProviderProfileDto {
  @ApiPropertyOptional({ description: 'Provider bio' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'Specialties', type: [String] })
  @IsOptional()
  specialties?: string[];

  @ApiPropertyOptional({ description: 'Credentials', type: [String] })
  @IsOptional()
  credentials?: string[];

  @ApiPropertyOptional({ description: 'Custom profile URL slug' })
  @IsOptional()
  @IsString()
  profileUrl?: string;
}
