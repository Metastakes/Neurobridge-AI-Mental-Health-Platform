import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, Min, Max } from 'class-validator';

// DTO for submitting a review
export class SubmitReviewDto {
  @ApiProperty({ description: 'Provider ID being reviewed' })
  @IsString()
  providerId: string;

  @ApiPropertyOptional({ description: 'Session/Encounter ID (optional)' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiProperty({ description: 'Rating (1-5 stars)', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Written feedback' })
  @IsOptional()
  @IsString()
  feedback?: string;

  @ApiPropertyOptional({ description: 'Quick feedback tags', type: [String] })
  @IsOptional()
  @IsArray()
  quickTags?: string[];

  @ApiPropertyOptional({ description: 'Share review publicly on platform' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Submit to Google Reviews' })
  @IsOptional()
  @IsBoolean()
  shareOnGoogle?: boolean;
}

// DTO for Google review submission
export class SubmitGoogleReviewDto {
  @ApiProperty({ description: 'Review ID to submit to Google' })
  @IsString()
  reviewId: string;

  @ApiProperty({ description: 'Google review text (can be edited by user)' })
  @IsString()
  reviewText: string;
}

// DTO for review moderation
export class ModerateReviewDto {
  @ApiProperty({ description: 'Approve or reject the review' })
  @IsBoolean()
  approved: boolean;

  @ApiPropertyOptional({ description: 'Reason if flagged' })
  @IsOptional()
  @IsString()
  flagReason?: string;
}

// DTO for checking if review prompt should be shown
export class ReviewPromptCheckDto {
  @ApiProperty()
  shouldPrompt: boolean;

  @ApiProperty()
  session: {
    id: string;
    completedAt: Date;
  };

  @ApiProperty()
  provider: {
    id: string;
    name: string;
    rating: number;
  };
}

// DTO for provider review stats
export class ProviderReviewStatsDto {
  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  totalReviews: number;

  @ApiProperty()
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };

  @ApiProperty()
  publicReviews: ReviewDto[];

  @ApiProperty()
  recentReviews: ReviewDto[];
}

// DTO for a single review
export class ReviewDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  patientName: string; // Anonymized (e.g., "Sarah K.")

  @ApiProperty()
  rating: number;

  @ApiPropertyOptional()
  feedback?: string;

  @ApiProperty({ type: [String] })
  quickTags: string[];

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty()
  isGoogleReview: boolean;

  @ApiProperty()
  createdAt: Date;
}
