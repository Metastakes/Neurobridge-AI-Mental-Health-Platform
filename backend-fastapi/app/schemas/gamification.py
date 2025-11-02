"""
Phase 5 Enhancement: Gamification Schemas
Pydantic schemas for achievements, streaks, and milestones
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional, Dict, Any


# ============================================================================
# Achievements
# ============================================================================

class AchievementBase(BaseModel):
    """Base achievement schema"""
    name: str
    description: str
    icon: str
    category: str
    tier: str
    unlock_criteria: Dict[str, Any]
    points: int = 100
    color: Optional[str] = None
    is_hidden: bool = False


class AchievementResponse(AchievementBase):
    """Achievement response schema"""
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PatientAchievementResponse(BaseModel):
    """Patient's unlocked achievement"""
    id: int
    patient_id: int
    achievement_id: int
    unlocked_at: datetime
    is_viewed: bool
    trigger_context: Optional[Dict[str, Any]] = None

    # Embedded achievement info
    achievement: AchievementResponse

    class Config:
        from_attributes = True


class UnlockedAchievementNotification(BaseModel):
    """New achievement unlocked notification"""
    achievement: AchievementResponse
    unlocked_at: datetime
    points_earned: int
    total_points: int
    message: str


# ============================================================================
# Streaks
# ============================================================================

class PatientStreakResponse(BaseModel):
    """Patient streak data"""
    id: int
    patient_id: int
    current_streak_days: int
    longest_streak_days: int
    last_assessment_date: Optional[datetime] = None
    current_streak_weeks: int
    longest_streak_weeks: int
    total_assessment_count: int
    total_session_count: int
    engagement_score: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StreakUpdate(BaseModel):
    """Response after streak update"""
    streak: PatientStreakResponse
    streak_broken: bool = False
    streak_maintained: bool = False
    new_record: bool = False
    achievements_unlocked: List[AchievementResponse] = []
    motivational_message: Optional[str] = None


# ============================================================================
# Milestones
# ============================================================================

class MilestoneBase(BaseModel):
    """Base milestone schema"""
    name: str
    description: str
    icon: str
    criteria: Dict[str, Any]
    sequence_order: int = 0


class MilestoneResponse(MilestoneBase):
    """Milestone response schema"""
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PatientMilestoneResponse(BaseModel):
    """Patient's achieved milestone"""
    id: int
    patient_id: int
    milestone_id: int
    achieved_at: datetime
    is_celebrated: bool
    achievement_context: Optional[Dict[str, Any]] = None

    # Embedded milestone info
    milestone: MilestoneResponse

    class Config:
        from_attributes = True


class MilestoneProgress(BaseModel):
    """Progress towards a milestone"""
    milestone: MilestoneResponse
    is_achieved: bool
    achieved_at: Optional[datetime] = None
    progress_percentage: int = Field(..., ge=0, le=100)
    progress_description: str


# ============================================================================
# Motivational Messages
# ============================================================================

class MotivationalMessageResponse(BaseModel):
    """Motivational message"""
    id: int
    message: str
    icon: Optional[str] = None
    context_type: str

    class Config:
        from_attributes = True


# ============================================================================
# Dashboard & Progress
# ============================================================================

class GamificationDashboard(BaseModel):
    """Complete gamification dashboard for patient"""
    patient_id: int

    # Streaks
    streak: PatientStreakResponse
    streak_status: str  # "active", "at_risk", "broken"
    next_streak_milestone: Optional[int] = None  # Next day count for milestone

    # Achievements
    total_achievements: int
    unlocked_achievements: int
    recent_achievements: List[PatientAchievementResponse]
    next_achievement: Optional[AchievementResponse] = None

    # Milestones
    total_milestones: int
    achieved_milestones: int
    milestone_progress: List[MilestoneProgress]

    # Points & Level
    total_points: int
    current_level: int
    points_to_next_level: int

    # Motivation
    motivational_message: Optional[str] = None
    motivational_icon: Optional[str] = None


class EngagementMetrics(BaseModel):
    """Patient engagement metrics"""
    patient_id: int
    engagement_score: int  # 0-100
    assessment_frequency: str  # "daily", "weekly", "monthly", "irregular"
    last_assessment_days_ago: Optional[int] = None
    completion_rate: float  # Percentage of scheduled assessments completed
    trend: str  # "improving", "stable", "declining"
    recommendations: List[str]  # Engagement improvement suggestions


class LeaderboardEntry(BaseModel):
    """Leaderboard entry (anonymized)"""
    rank: int
    display_name: str  # Anonymized
    points: int
    achievements_count: int
    current_streak: int
    is_current_user: bool = False


class LeaderboardResponse(BaseModel):
    """Leaderboard data"""
    period: str  # "week", "month", "all_time"
    entries: List[LeaderboardEntry]
    current_user_rank: int
    total_participants: int
