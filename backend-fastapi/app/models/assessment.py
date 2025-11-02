"""
Phase 5: Progress Tracking & Outcomes Measurement
Assessment scales and patient progress tracking
"""

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Float, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum
from app.db.base import Base


class AssessmentType(str, PyEnum):
    """Types of clinical assessments"""
    PHQ9 = "PHQ9"  # Patient Health Questionnaire-9 (Depression)
    GAD7 = "GAD7"  # Generalized Anxiety Disorder-7
    CUSTOM = "CUSTOM"  # Provider-defined custom scale
    SESSION_RATING = "SESSION_RATING"  # Post-session feedback (0-10)
    WELLBEING = "WELLBEING"  # General wellbeing scale


class SeverityLevel(str, PyEnum):
    """Severity classification for assessment scores"""
    NONE_MINIMAL = "NONE_MINIMAL"
    MILD = "MILD"
    MODERATE = "MODERATE"
    MODERATELY_SEVERE = "MODERATELY_SEVERE"
    SEVERE = "SEVERE"


class AssessmentScale(Base):
    """
    Defines clinical assessment scales (standardized or custom)
    Example: PHQ-9 depression scale, GAD-7 anxiety scale
    """
    __tablename__ = "assessment_scales"

    id = Column(Integer, primary_key=True, index=True)

    # Scale identification
    scale_type = Column(SQLEnum(AssessmentType), nullable=False, index=True)
    scale_name = Column(String(255), nullable=False)
    scale_code = Column(String(50), nullable=False, unique=True, index=True)  # e.g., "PHQ9", "GAD7"

    # Scale definition
    description = Column(Text, nullable=True)
    instructions = Column(Text, nullable=True)

    # Scoring
    min_score = Column(Integer, nullable=False, default=0)
    max_score = Column(Integer, nullable=False)

    # Questions (JSON array)
    # Format: [{"question": "...", "options": [...], "reverse_scored": false}, ...]
    questions = Column(JSON, nullable=False)

    # Severity thresholds (JSON)
    # Format: {"MILD": 5, "MODERATE": 10, "MODERATELY_SEVERE": 15, "SEVERE": 20}
    severity_thresholds = Column(JSON, nullable=True)

    # Custom scale metadata
    created_by_provider_id = Column(Integer, ForeignKey("providers.id"), nullable=True)

    # Active status
    is_active = Column(Boolean, nullable=False, default=True)
    is_standard = Column(Boolean, nullable=False, default=True)  # True for PHQ-9, GAD-7, etc.

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationships
    attempts = relationship("AssessmentAttempt", back_populates="scale")
    created_by_provider = relationship("Provider", foreign_keys=[created_by_provider_id])

    def __repr__(self):
        return f"<AssessmentScale(id={self.id}, code={self.scale_code}, type={self.scale_type})>"


class AssessmentAttempt(Base):
    """
    Patient's attempt at completing an assessment scale
    Tracks scores over time for progress monitoring
    """
    __tablename__ = "assessment_attempts"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    scale_id = Column(Integer, ForeignKey("assessment_scales.id"), nullable=False, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True, index=True)  # Optional: linked to session

    # Responses (JSON array matching questions)
    # Format: [0, 1, 2, 1, 0, ...] (indices of selected options)
    responses = Column(JSON, nullable=False)

    # Scoring
    total_score = Column(Integer, nullable=False, index=True)
    severity_level = Column(SQLEnum(SeverityLevel), nullable=True, index=True)

    # Context
    notes = Column(Text, nullable=True)  # Patient or provider notes about this assessment
    administered_by_provider_id = Column(Integer, ForeignKey("providers.id"), nullable=True)  # If provider administered

    # Timing
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=False, index=True, server_default=func.now())

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    patient = relationship("Patient", backref="assessment_attempts")
    scale = relationship("AssessmentScale", back_populates="attempts")
    appointment = relationship("Appointment", backref="assessments")
    administered_by = relationship("Provider", foreign_keys=[administered_by_provider_id])

    def __repr__(self):
        return f"<AssessmentAttempt(id={self.id}, patient_id={self.patient_id}, score={self.total_score})>"


class GoalStatus(str, PyEnum):
    """Status of treatment goal"""
    ACTIVE = "ACTIVE"
    ACHIEVED = "ACHIEVED"
    DISCONTINUED = "DISCONTINUED"
    ON_HOLD = "ON_HOLD"


class GoalCategory(str, PyEnum):
    """Categories of treatment goals"""
    SYMPTOM_REDUCTION = "SYMPTOM_REDUCTION"
    FUNCTIONAL_IMPROVEMENT = "FUNCTIONAL_IMPROVEMENT"
    BEHAVIORAL_CHANGE = "BEHAVIORAL_CHANGE"
    RELATIONSHIP_IMPROVEMENT = "RELATIONSHIP_IMPROVEMENT"
    COPING_SKILLS = "COPING_SKILLS"
    MEDICATION_MANAGEMENT = "MEDICATION_MANAGEMENT"
    LIFESTYLE_CHANGE = "LIFESTYLE_CHANGE"
    OTHER = "OTHER"


class TreatmentGoal(Base):
    """
    SMART treatment goals for patient care
    Tracks progress toward therapeutic objectives
    """
    __tablename__ = "treatment_goals"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    provider_id = Column(Integer, ForeignKey("providers.id"), nullable=False, index=True)

    # Goal definition
    category = Column(SQLEnum(GoalCategory), nullable=False, index=True)
    goal_text = Column(Text, nullable=False)  # Specific, measurable goal statement

    # SMART criteria
    is_specific = Column(Boolean, nullable=False, default=True)
    is_measurable = Column(Boolean, nullable=False, default=True)
    target_metric = Column(String(255), nullable=True)  # e.g., "PHQ-9 score below 10"
    target_value = Column(Float, nullable=True)  # e.g., 10.0

    # Timeline
    target_date = Column(DateTime(timezone=True), nullable=True, index=True)

    # Status and progress
    status = Column(SQLEnum(GoalStatus), nullable=False, default=GoalStatus.ACTIVE, index=True)
    progress_percentage = Column(Integer, nullable=False, default=0)  # 0-100

    # Notes
    barriers = Column(Text, nullable=True)  # Obstacles to achieving goal
    interventions = Column(Text, nullable=True)  # Interventions being used

    # Completion
    achieved_at = Column(DateTime(timezone=True), nullable=True)
    discontinued_at = Column(DateTime(timezone=True), nullable=True)
    discontinued_reason = Column(Text, nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationships
    patient = relationship("Patient", backref="treatment_goals")
    provider = relationship("Provider", backref="treatment_goals")
    progress_updates = relationship("GoalProgress", back_populates="goal", order_by="GoalProgress.recorded_at.desc()")

    def __repr__(self):
        return f"<TreatmentGoal(id={self.id}, patient_id={self.patient_id}, status={self.status})>"


class GoalProgress(Base):
    """
    Progress updates for treatment goals
    Tracks incremental progress toward goal achievement
    """
    __tablename__ = "goal_progress"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    goal_id = Column(Integer, ForeignKey("treatment_goals.id"), nullable=False, index=True)
    recorded_by_provider_id = Column(Integer, ForeignKey("providers.id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)  # Optional: linked to session

    # Progress measurement
    progress_percentage = Column(Integer, nullable=False)  # 0-100
    metric_value = Column(Float, nullable=True)  # Actual measured value (if applicable)

    # Notes
    progress_notes = Column(Text, nullable=True)
    patient_feedback = Column(Text, nullable=True)

    # Timing
    recorded_at = Column(DateTime(timezone=True), nullable=False, index=True, server_default=func.now())

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    goal = relationship("TreatmentGoal", back_populates="progress_updates")
    recorded_by = relationship("Provider", foreign_keys=[recorded_by_provider_id])
    appointment = relationship("Appointment", backref="goal_progress")

    def __repr__(self):
        return f"<GoalProgress(id={self.id}, goal_id={self.goal_id}, progress={self.progress_percentage}%)>"
