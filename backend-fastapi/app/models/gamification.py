"""
Phase 5 Enhancement: Gamification & Engagement System
Adds streaks, achievements, milestones, and motivational features
"""

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum
from app.db.base import Base


class AchievementCategory(str, PyEnum):
    """Categories of achievements"""
    ASSESSMENT = "ASSESSMENT"  # Assessment completion milestones
    STREAK = "STREAK"  # Streak milestones
    PROGRESS = "PROGRESS"  # Score improvement milestones
    GOAL = "GOAL"  # Goal achievement milestones
    ENGAGEMENT = "ENGAGEMENT"  # General engagement milestones


class AchievementTier(str, PyEnum):
    """Achievement difficulty tiers"""
    BRONZE = "BRONZE"
    SILVER = "SILVER"
    GOLD = "GOLD"
    PLATINUM = "PLATINUM"
    DIAMOND = "DIAMOND"


class Achievement(Base):
    """
    Defines achievements/badges that patients can unlock
    Gamification element to encourage engagement
    """
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)

    # Achievement definition
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    icon = Column(String(100), nullable=False)  # Icon name/emoji
    category = Column(SQLEnum(AchievementCategory), nullable=False, index=True)
    tier = Column(SQLEnum(AchievementTier), nullable=False, default=AchievementTier.BRONZE)

    # Unlock criteria (JSON)
    # Examples:
    # {"type": "assessment_count", "threshold": 5}
    # {"type": "streak_days", "threshold": 7}
    # {"type": "score_improvement", "scale": "PHQ9", "threshold": 5}
    unlock_criteria = Column(JSON, nullable=False)

    # Reward
    points = Column(Integer, nullable=False, default=100)

    # Display
    color = Column(String(50), nullable=True)  # Hex color for badge
    is_hidden = Column(Boolean, nullable=False, default=False)  # Hidden until unlocked

    # Active status
    is_active = Column(Boolean, nullable=False, default=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    patient_achievements = relationship("PatientAchievement", back_populates="achievement")

    def __repr__(self):
        return f"<Achievement(id={self.id}, name={self.name}, tier={self.tier})>"


class PatientAchievement(Base):
    """
    Tracks which achievements a patient has unlocked
    """
    __tablename__ = "patient_achievements"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    achievement_id = Column(Integer, ForeignKey("achievements.id"), nullable=False, index=True)

    # Unlock details
    unlocked_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    is_viewed = Column(Boolean, nullable=False, default=False)  # Has patient seen the achievement popup?

    # Context (what triggered the unlock)
    trigger_context = Column(JSON, nullable=True)  # e.g., {"assessment_id": 123, "streak_count": 7}

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    patient = relationship("Patient", backref="achievements_unlocked")
    achievement = relationship("Achievement", back_populates="patient_achievements")

    def __repr__(self):
        return f"<PatientAchievement(patient_id={self.patient_id}, achievement={self.achievement.name})>"


class PatientStreak(Base):
    """
    Tracks patient engagement streaks
    Encourages consistent assessment completion
    """
    __tablename__ = "patient_streaks"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign key
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, unique=True, index=True)

    # Streak tracking
    current_streak_days = Column(Integer, nullable=False, default=0)
    longest_streak_days = Column(Integer, nullable=False, default=0)

    # Last activity
    last_assessment_date = Column(DateTime(timezone=True), nullable=True, index=True)

    # Weekly streaks (for therapy sessions)
    current_streak_weeks = Column(Integer, nullable=False, default=0)
    longest_streak_weeks = Column(Integer, nullable=False, default=0)
    last_session_week = Column(Integer, nullable=True)  # ISO week number

    # Milestone tracking
    total_assessment_count = Column(Integer, nullable=False, default=0)
    total_session_count = Column(Integer, nullable=False, default=0)

    # Engagement score (0-100)
    engagement_score = Column(Integer, nullable=False, default=0)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationships
    patient = relationship("Patient", backref="streak_data")

    def __repr__(self):
        return f"<PatientStreak(patient_id={self.patient_id}, current_days={self.current_streak_days})>"


class Milestone(Base):
    """
    Defines treatment milestones for progress tracking
    Provides visual progress markers
    """
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)

    # Milestone definition
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    icon = Column(String(100), nullable=False)

    # Criteria (JSON)
    # Examples:
    # {"type": "assessment_score", "scale": "PHQ9", "operator": "<", "value": 10}
    # {"type": "goal_achievement_count", "value": 3}
    # {"type": "weeks_in_treatment", "value": 4}
    criteria = Column(JSON, nullable=False)

    # Display order
    sequence_order = Column(Integer, nullable=False, default=0, index=True)

    # Active status
    is_active = Column(Boolean, nullable=False, default=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<Milestone(id={self.id}, name={self.name})>"


class PatientMilestone(Base):
    """
    Tracks which milestones a patient has reached
    """
    __tablename__ = "patient_milestones"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    milestone_id = Column(Integer, ForeignKey("milestones.id"), nullable=False, index=True)

    # Achievement details
    achieved_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    is_celebrated = Column(Boolean, nullable=False, default=False)  # Has celebration been shown?

    # Context
    achievement_context = Column(JSON, nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    patient = relationship("Patient", backref="milestones_achieved")
    milestone = relationship("Milestone", backref="patient_milestones")

    def __repr__(self):
        return f"<PatientMilestone(patient_id={self.patient_id}, milestone={self.milestone.name})>"


class MotivationalMessage(Base):
    """
    Motivational messages shown to patients based on context
    Encourages continued engagement
    """
    __tablename__ = "motivational_messages"

    id = Column(Integer, primary_key=True, index=True)

    # Message
    message = Column(Text, nullable=False)
    icon = Column(String(100), nullable=True)

    # Context (when to show this message)
    context_type = Column(String(50), nullable=False, index=True)
    # Types: "streak_milestone", "score_improvement", "first_assessment", "comeback", "goal_progress", etc.

    # Criteria (JSON) - optional additional filtering
    display_criteria = Column(JSON, nullable=True)

    # Active status
    is_active = Column(Boolean, nullable=False, default=True)
    weight = Column(Integer, nullable=False, default=1)  # For random selection weighting

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<MotivationalMessage(id={self.id}, context={self.context_type})>"
