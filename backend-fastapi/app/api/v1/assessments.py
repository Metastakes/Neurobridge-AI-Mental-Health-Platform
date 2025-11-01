"""
Phase 5: Progress Tracking & Outcomes Measurement
API endpoints for clinical assessments and progress tracking
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from typing import List, Optional
from datetime import datetime, timedelta

from app.db.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.patient import Patient
from app.models.provider import Provider
from app.models.assessment import (
    AssessmentScale,
    AssessmentAttempt,
    TreatmentGoal,
    GoalProgress,
    AssessmentType,
    SeverityLevel,
    GoalStatus,
)
from app.schemas.assessment import (
    AssessmentScaleResponse,
    AssessmentScaleListItem,
    AssessmentScaleCreate,
    AssessmentAttemptCreate,
    AssessmentAttemptResponse,
    AssessmentAttemptWithScale,
    AssessmentScoreHistory,
    ProgressSummary,
    TreatmentGoalCreate,
    TreatmentGoalUpdate,
    TreatmentGoalResponse,
    TreatmentGoalWithProgress,
    GoalProgressCreate,
    GoalProgressResponse,
    AssessmentTrend,
)

router = APIRouter()


# ============================================================================
# Helper Functions
# ============================================================================

def calculate_score(responses: List[int], questions: List[dict]) -> int:
    """Calculate total score from responses"""
    total = 0
    for i, response in enumerate(responses):
        if i < len(questions):
            question = questions[i]
            if question.get("reverse_scored", False):
                # Reverse score: max - response
                max_val = max([opt["value"] for opt in question["options"]])
                total += max_val - response
            else:
                total += response
    return total


def determine_severity(score: int, thresholds: Optional[dict]) -> Optional[SeverityLevel]:
    """Determine severity level based on score and thresholds"""
    if not thresholds:
        return None

    # Sort thresholds by value
    sorted_thresholds = sorted(thresholds.items(), key=lambda x: x[1])

    for severity, threshold in sorted_thresholds:
        if score < threshold:
            if severity == "MILD":
                return SeverityLevel.NONE_MINIMAL
            return SeverityLevel[severity]

    # If score exceeds all thresholds, return highest severity
    return SeverityLevel[sorted_thresholds[-1][0]]


# ============================================================================
# Assessment Scale Endpoints
# ============================================================================

@router.get("/scales", response_model=List[AssessmentScaleListItem])
def list_assessment_scales(
    scale_type: Optional[str] = None,
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all available assessment scales"""
    query = db.query(AssessmentScale)

    if active_only:
        query = query.filter(AssessmentScale.is_active == True)

    if scale_type:
        query = query.filter(AssessmentScale.scale_type == scale_type)

    scales = query.order_by(AssessmentScale.is_standard.desc(), AssessmentScale.scale_name).all()
    return scales


@router.get("/scales/{scale_id}", response_model=AssessmentScaleResponse)
def get_assessment_scale(
    scale_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get assessment scale details"""
    scale = db.query(AssessmentScale).filter(AssessmentScale.id == scale_id).first()

    if not scale:
        raise HTTPException(status_code=404, detail="Assessment scale not found")

    return scale


@router.post("/scales", response_model=AssessmentScaleResponse)
def create_custom_scale(
    scale_data: AssessmentScaleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create custom assessment scale (providers only)"""
    if current_user.role != "PROVIDER":
        raise HTTPException(status_code=403, detail="Only providers can create custom scales")

    # Get provider
    provider = db.query(Provider).filter(Provider.user_id == current_user.id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    # Check if scale_code already exists
    existing = db.query(AssessmentScale).filter(AssessmentScale.scale_code == scale_data.scale_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Scale code already exists")

    # Create scale
    scale = AssessmentScale(
        **scale_data.model_dump(),
        created_by_provider_id=provider.id,
        is_standard=False,
    )

    db.add(scale)
    db.commit()
    db.refresh(scale)

    return scale


# ============================================================================
# Assessment Attempt Endpoints
# ============================================================================

@router.post("/attempts", response_model=AssessmentAttemptResponse)
def submit_assessment(
    attempt_data: AssessmentAttemptCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit assessment attempt (patient or provider)"""

    # Get patient
    if current_user.role == "PATIENT":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        administered_by = None
    elif current_user.role == "PROVIDER":
        # Provider administering assessment for patient
        # In real implementation, would need patient_id in request
        raise HTTPException(status_code=400, detail="Provider assessment administration not fully implemented")
    else:
        raise HTTPException(status_code=403, detail="Invalid role for assessment")

    # Get scale
    scale = db.query(AssessmentScale).filter(AssessmentScale.id == attempt_data.scale_id).first()
    if not scale:
        raise HTTPException(status_code=404, detail="Assessment scale not found")

    # Validate responses
    if len(attempt_data.responses) != len(scale.questions):
        raise HTTPException(
            status_code=400,
            detail=f"Expected {len(scale.questions)} responses, got {len(attempt_data.responses)}"
        )

    # Calculate score
    total_score = calculate_score(attempt_data.responses, scale.questions)

    # Determine severity
    severity = determine_severity(total_score, scale.severity_thresholds)

    # Create attempt
    attempt = AssessmentAttempt(
        patient_id=patient.id,
        scale_id=scale.id,
        appointment_id=attempt_data.appointment_id,
        responses=attempt_data.responses,
        total_score=total_score,
        severity_level=severity,
        notes=attempt_data.notes,
        started_at=attempt_data.started_at,
        completed_at=datetime.utcnow(),
        administered_by_provider_id=None,
    )

    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    # Add scale info
    response = AssessmentAttemptResponse.model_validate(attempt)
    response.scale_name = scale.scale_name
    response.scale_code = scale.scale_code

    return response


@router.get("/attempts/{attempt_id}", response_model=AssessmentAttemptWithScale)
def get_assessment_attempt(
    attempt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get assessment attempt details"""
    attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()

    if not attempt:
        raise HTTPException(status_code=404, detail="Assessment attempt not found")

    # Check authorization
    if current_user.role == "PATIENT":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or attempt.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this assessment")

    return attempt


@router.get("/patient/{patient_id}/attempts", response_model=List[AssessmentAttemptResponse])
def list_patient_assessments(
    patient_id: int,
    scale_code: Optional[str] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all assessment attempts for a patient"""

    # Check authorization
    if current_user.role == "PATIENT":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or patient.id != patient_id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role != "PROVIDER":
        raise HTTPException(status_code=403, detail="Not authorized")

    query = db.query(AssessmentAttempt).filter(AssessmentAttempt.patient_id == patient_id)

    if scale_code:
        scale = db.query(AssessmentScale).filter(AssessmentScale.scale_code == scale_code).first()
        if scale:
            query = query.filter(AssessmentAttempt.scale_id == scale.id)

    attempts = query.order_by(desc(AssessmentAttempt.completed_at)).limit(limit).all()

    # Add scale info
    results = []
    for attempt in attempts:
        response = AssessmentAttemptResponse.model_validate(attempt)
        response.scale_name = attempt.scale.scale_name
        response.scale_code = attempt.scale.scale_code
        results.append(response)

    return results


@router.get("/patient/{patient_id}/history/{scale_code}", response_model=AssessmentScoreHistory)
def get_assessment_history(
    patient_id: int,
    scale_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get assessment score history for specific scale"""

    # Check authorization
    if current_user.role == "PATIENT":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or patient.id != patient_id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role != "PROVIDER":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get scale
    scale = db.query(AssessmentScale).filter(AssessmentScale.scale_code == scale_code).first()
    if not scale:
        raise HTTPException(status_code=404, detail="Assessment scale not found")

    # Get attempts
    attempts = db.query(AssessmentAttempt).filter(
        and_(
            AssessmentAttempt.patient_id == patient_id,
            AssessmentAttempt.scale_id == scale.id
        )
    ).order_by(desc(AssessmentAttempt.completed_at)).all()

    # Build history
    attempt_responses = []
    for attempt in attempts:
        response = AssessmentAttemptResponse.model_validate(attempt)
        response.scale_name = scale.scale_name
        response.scale_code = scale.scale_code
        attempt_responses.append(response)

    # Calculate changes
    current_score = attempts[0].total_score if attempts else None
    previous_score = attempts[1].total_score if len(attempts) > 1 else None
    score_change = (current_score - previous_score) if (current_score is not None and previous_score is not None) else None

    # Determine trend
    trend = None
    if score_change is not None:
        if score_change < -2:
            trend = "improving"  # Lower scores = better for PHQ-9/GAD-7
        elif score_change > 2:
            trend = "worsening"
        else:
            trend = "stable"

    return AssessmentScoreHistory(
        scale_id=scale.id,
        scale_name=scale.scale_name,
        scale_code=scale.scale_code,
        min_score=scale.min_score,
        max_score=scale.max_score,
        attempts=attempt_responses,
        current_score=current_score,
        previous_score=previous_score,
        score_change=score_change,
        trend=trend,
    )


@router.get("/patient/{patient_id}/progress", response_model=ProgressSummary)
def get_patient_progress_summary(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get comprehensive progress summary for patient"""

    # Check authorization
    if current_user.role == "PATIENT":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or patient.id != patient_id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role != "PROVIDER":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get all attempts
    attempts = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.patient_id == patient_id
    ).order_by(AssessmentAttempt.completed_at).all()

    # Get goals
    active_goals = db.query(TreatmentGoal).filter(
        and_(
            TreatmentGoal.patient_id == patient_id,
            TreatmentGoal.status == GoalStatus.ACTIVE
        )
    ).count()

    achieved_goals = db.query(TreatmentGoal).filter(
        and_(
            TreatmentGoal.patient_id == patient_id,
            TreatmentGoal.status == GoalStatus.ACHIEVED
        )
    ).count()

    # Build assessment history by scale
    scale_histories = {}
    for attempt in attempts:
        scale_id = attempt.scale_id
        if scale_id not in scale_histories:
            scale_histories[scale_id] = []
        scale_histories[scale_id].append(attempt)

    # Build history objects
    history_list = []
    for scale_id, scale_attempts in scale_histories.items():
        scale = scale_attempts[0].scale
        sorted_attempts = sorted(scale_attempts, key=lambda x: x.completed_at, reverse=True)

        attempt_responses = []
        for att in sorted_attempts:
            response = AssessmentAttemptResponse.model_validate(att)
            response.scale_name = scale.scale_name
            response.scale_code = scale.scale_code
            attempt_responses.append(response)

        current_score = sorted_attempts[0].total_score if sorted_attempts else None
        previous_score = sorted_attempts[1].total_score if len(sorted_attempts) > 1 else None
        score_change = (current_score - previous_score) if (current_score is not None and previous_score is not None) else None

        trend = None
        if score_change is not None:
            if score_change < -2:
                trend = "improving"
            elif score_change > 2:
                trend = "worsening"
            else:
                trend = "stable"

        history_list.append(AssessmentScoreHistory(
            scale_id=scale.id,
            scale_name=scale.scale_name,
            scale_code=scale.scale_code,
            min_score=scale.min_score,
            max_score=scale.max_score,
            attempts=attempt_responses,
            current_score=current_score,
            previous_score=previous_score,
            score_change=score_change,
            trend=trend,
        ))

    return ProgressSummary(
        patient_id=patient_id,
        first_assessment_date=attempts[0].completed_at if attempts else None,
        last_assessment_date=attempts[-1].completed_at if attempts else None,
        total_assessments=len(attempts),
        assessment_history=history_list,
        active_goals_count=active_goals,
        achieved_goals_count=achieved_goals,
    )
