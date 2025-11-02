"""
Phase 5: Progress Tracking & Outcomes Measurement
Pydantic schemas for assessments and treatment goals
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional, Dict, Any


# ============================================================================
# Assessment Scales
# ============================================================================

class AssessmentQuestionOption(BaseModel):
    """Single option for a question"""
    value: int
    text: str


class AssessmentQuestion(BaseModel):
    """Single question in an assessment scale"""
    question: str
    options: List[AssessmentQuestionOption]
    reverse_scored: bool = False


class AssessmentScaleBase(BaseModel):
    """Base schema for assessment scale"""
    scale_type: str
    scale_name: str
    scale_code: str
    description: Optional[str] = None
    instructions: Optional[str] = None
    min_score: int = 0
    max_score: int
    questions: List[AssessmentQuestion]
    severity_thresholds: Optional[Dict[str, int]] = None
    is_active: bool = True


class AssessmentScaleCreate(AssessmentScaleBase):
    """Schema for creating custom assessment scale"""
    pass


class AssessmentScaleResponse(AssessmentScaleBase):
    """Schema for assessment scale response"""
    id: int
    is_standard: bool
    created_by_provider_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AssessmentScaleListItem(BaseModel):
    """Simplified schema for listing assessment scales"""
    id: int
    scale_type: str
    scale_name: str
    scale_code: str
    description: Optional[str] = None
    min_score: int
    max_score: int
    is_standard: bool
    is_active: bool

    class Config:
        from_attributes = True


# ============================================================================
# Assessment Attempts
# ============================================================================

class AssessmentAttemptCreate(BaseModel):
    """Schema for creating assessment attempt"""
    scale_id: int
    responses: List[int] = Field(..., description="Array of selected option indices")
    appointment_id: Optional[int] = None
    notes: Optional[str] = None
    started_at: Optional[datetime] = None


class AssessmentAttemptResponse(BaseModel):
    """Schema for assessment attempt response"""
    id: int
    patient_id: int
    scale_id: int
    appointment_id: Optional[int] = None
    responses: List[int]
    total_score: int
    severity_level: Optional[str] = None
    notes: Optional[str] = None
    administered_by_provider_id: Optional[int] = None
    started_at: Optional[datetime] = None
    completed_at: datetime
    created_at: datetime

    # Embedded scale info
    scale_name: Optional[str] = None
    scale_code: Optional[str] = None

    class Config:
        from_attributes = True


class AssessmentAttemptWithScale(AssessmentAttemptResponse):
    """Assessment attempt with full scale details"""
    scale: AssessmentScaleResponse

    class Config:
        from_attributes = True


class AssessmentScoreHistory(BaseModel):
    """Historical scores for a specific assessment scale"""
    scale_id: int
    scale_name: str
    scale_code: str
    min_score: int
    max_score: int
    attempts: List[AssessmentAttemptResponse]
    current_score: Optional[int] = None
    previous_score: Optional[int] = None
    score_change: Optional[int] = None
    trend: Optional[str] = None  # "improving", "stable", "worsening"


class ProgressSummary(BaseModel):
    """Overall progress summary for patient"""
    patient_id: int
    first_assessment_date: Optional[datetime] = None
    last_assessment_date: Optional[datetime] = None
    total_assessments: int
    assessment_history: List[AssessmentScoreHistory]
    active_goals_count: int
    achieved_goals_count: int


# ============================================================================
# Treatment Goals
# ============================================================================

class TreatmentGoalCreate(BaseModel):
    """Schema for creating treatment goal"""
    patient_id: int
    category: str
    goal_text: str
    is_specific: bool = True
    is_measurable: bool = True
    target_metric: Optional[str] = None
    target_value: Optional[float] = None
    target_date: Optional[datetime] = None
    interventions: Optional[str] = None


class TreatmentGoalUpdate(BaseModel):
    """Schema for updating treatment goal"""
    goal_text: Optional[str] = None
    category: Optional[str] = None
    target_metric: Optional[str] = None
    target_value: Optional[float] = None
    target_date: Optional[datetime] = None
    status: Optional[str] = None
    progress_percentage: Optional[int] = Field(None, ge=0, le=100)
    barriers: Optional[str] = None
    interventions: Optional[str] = None
    discontinued_reason: Optional[str] = None


class TreatmentGoalResponse(BaseModel):
    """Schema for treatment goal response"""
    id: int
    patient_id: int
    provider_id: int
    category: str
    goal_text: str
    is_specific: bool
    is_measurable: bool
    target_metric: Optional[str] = None
    target_value: Optional[float] = None
    target_date: Optional[datetime] = None
    status: str
    progress_percentage: int
    barriers: Optional[str] = None
    interventions: Optional[str] = None
    achieved_at: Optional[datetime] = None
    discontinued_at: Optional[datetime] = None
    discontinued_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TreatmentGoalWithProgress(TreatmentGoalResponse):
    """Treatment goal with progress history"""
    recent_progress: List["GoalProgressResponse"]

    class Config:
        from_attributes = True


# ============================================================================
# Goal Progress
# ============================================================================

class GoalProgressCreate(BaseModel):
    """Schema for creating goal progress update"""
    goal_id: int
    progress_percentage: int = Field(..., ge=0, le=100)
    metric_value: Optional[float] = None
    progress_notes: Optional[str] = None
    patient_feedback: Optional[str] = None
    appointment_id: Optional[int] = None


class GoalProgressResponse(BaseModel):
    """Schema for goal progress response"""
    id: int
    goal_id: int
    recorded_by_provider_id: int
    appointment_id: Optional[int] = None
    progress_percentage: int
    metric_value: Optional[float] = None
    progress_notes: Optional[str] = None
    patient_feedback: Optional[str] = None
    recorded_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Analytics & Reporting
# ============================================================================

class AssessmentTrend(BaseModel):
    """Trend analysis for assessment scores"""
    scale_code: str
    scale_name: str
    time_period_days: int
    data_points: List[Dict[str, Any]]  # [{"date": "...", "score": 10, "severity": "..."}]
    trend_direction: str  # "improving", "stable", "worsening"
    percent_change: Optional[float] = None
    statistical_significance: Optional[str] = None


class OutcomeMeasure(BaseModel):
    """Treatment outcome measurement"""
    patient_id: int
    assessment_scale: str
    baseline_score: Optional[int] = None
    current_score: Optional[int] = None
    score_reduction: Optional[int] = None
    percent_improvement: Optional[float] = None
    clinically_significant_change: bool = False
    reliable_change: bool = False
    weeks_in_treatment: Optional[int] = None
