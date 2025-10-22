import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { ShareType, Platform } from '@prisma/client';

// DTO for generating a shareable card
export class GenerateShareCardDto {
  @ApiProperty({ description: 'Type of share', enum: ShareType })
  @IsEnum(ShareType)
  shareType: ShareType;

  @ApiProperty({ description: 'Platform to share on', enum: Platform })
  @IsEnum(Platform)
  platform: Platform;

  @ApiPropertyOptional({ description: 'Achievement ID (if shareType is ACHIEVEMENT)' })
  @IsOptional()
  @IsString()
  achievementId?: string;

  @ApiPropertyOptional({ description: 'Milestone name (if shareType is MILESTONE)' })
  @IsOptional()
  @IsString()
  milestoneName?: string;

  @ApiPropertyOptional({ description: 'Custom title override' })
  @IsOptional()
  @IsString()
  customTitle?: string;

  @ApiPropertyOptional({ description: 'Custom description override' })
  @IsOptional()
  @IsString()
  customDescription?: string;
}

// DTO for tracking a share
export class TrackShareDto {
  @ApiProperty({ description: 'Share ID being tracked' })
  @IsString()
  shareId: string;

  @ApiPropertyOptional({ description: 'Action type (click, signup, etc.)' })
  @IsOptional()
  @IsString()
  action?: string;
}

// Response DTO for generated share card
export class ShareCardDto {
  @ApiProperty()
  shareId: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  imageUrl: string;

  @ApiProperty()
  shareUrl: string;

  @ApiProperty()
  platform: Platform;

  @ApiProperty()
  shareText: string; // Pre-formatted text for social media

  @ApiProperty()
  pointsEarned: number;
}

// DTO for share analytics
export class ShareAnalyticsDto {
  @ApiProperty()
  shareId: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: ShareType })
  shareType: ShareType;

  @ApiProperty({ enum: Platform })
  platform: Platform;

  @ApiProperty()
  clicks: number;

  @ApiProperty()
  signups: number;

  @ApiProperty()
  pointsEarned: number;

  @ApiProperty()
  createdAt: Date;
}

// DTO for user share stats
export class UserShareStatsDto {
  @ApiProperty()
  totalShares: number;

  @ApiProperty()
  totalClicks: number;

  @ApiProperty()
  totalSignups: number;

  @ApiProperty()
  totalPointsEarned: number;

  @ApiProperty()
  platformDistribution: {
    INSTAGRAM: number;
    FACEBOOK: number;
    LINKEDIN: number;
    TWITTER: number;
  };

  @ApiProperty({ type: [ShareAnalyticsDto] })
  recentShares: ShareAnalyticsDto[];
}
