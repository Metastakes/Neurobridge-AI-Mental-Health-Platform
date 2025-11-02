"""
Phase 5: Progress Tracking & Outcomes Measurement
API endpoints for treatment goals and progress tracking
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from typing import List, Optional
from datetime import datetime

from app.db.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.patient import Patient
from app.models.provider import Provider
from app.models.assessment import TreatmentGoal, GoalProgress, GoalStatus
from app.schemas.assessment import (
    TreatmentGoalCreate,
    TreatmentGoalUpdate,
    TreatmentGoalResponse,
    TreatmentGoalWithProgress,
    GoalProgressCreate,
    GoalProgressResponse,
)

router = APIRouter()


# ============================================================================
# Treatment Goal Endpoints
# ============================================================================

@router.post("/", response_model=TreatmentGoalResponse)
def create_treatment_goal(
    goal_data: TreatmentGoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create new treatment goal (provider only)"""
    if current_user.role != "PROVIDER":
        raise HTTPException(status_code=403, detail="Only providers can create treatment goals")

    # Get provider
    provider = db.query(Provider).filter(Provider.user_id == current_user.id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == goal_data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Create goal
    goal = TreatmentGoal(
        **goal_data.model_dump(),
        provider_id=provider.id,
        status=GoalStatus.ACTIVE,
        progress_percentage=0,
    )

    db.add(goal)
    db.commit()
    db.refresh(goal)

    return goal


@router.get("/{goal_id}", response_model=TreatmentGoalWithProgress)
def get_treatment_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get treatment goal with progress history"""
    goal = db.query(TreatmentGoal).filter(TreatmentGoal.id == goal_id).first()

    if not goal:
        raise HTTPException(status_code=404, detail="Treatment goal not found")

    # Check authorization
    if current_user.role == "PATIENT":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or goal.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this goal")
    elif current_user.role == "PROVIDER":
        provider = db.query(Provider).filter(Provider.user_id == current_user.id).first()
        if not provider or goal.provider_id != provider.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this goal")
    else:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get recent progress updates
    recent_progress = db.query(GoalProgress).filter(
        GoalProgress.goal_id == goal_id
    ).order_by(desc(GoalProgress.recorded_at)).limit(10).all()

    response = TreatmentGoalWithProgress.model_validate(goal)
    response.recent_progress = [GoalProgressResponse.model_validate(p) for p in recent_progress]

    return response


@router.put("/{goal_id}", response_model=TreatmentGoalResponse)
def update_treatment_goal(
    goal_id: int,
    goal_data: TreatmentGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update treatment goal (provider only)"""
    if current_user.role != "PROVIDER":
        raise HTTPException(status_code=403, detail="Only providers can update treatment goals")

    # Get provider
    provider = db.query(Provider).filter(Provider.user_id == current_user.id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    # Get goal
    goal = db.query(TreatmentGoal).filter(TreatmentGoal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Treatment goal not found")

    # Check authorization
    if goal.provider_id != provider.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this goal")

    # Update fields
    update_data = goal_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(goal, field, value)

    # Update status timestamps
    if "status" in update_data:
        if update_data["status"] == GoalStatus.ACHIEVED.value and not goal.achieved_at:
            goal.achieved_at = datetime.utcnow()
            goal.progress_percentage = 100
        elif update_data["status"] == GoalStatus.DISCONTINUED.value and not goal.discontinued_at:
            goal.discontinued_at = datetime.utcnow()

    goal.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(goal)

    return goal


@router.delete("/{goal_id}")
def delete_treatment_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete treatment goal (provider only)"""
    if current_user.role != "PROVIDER":
        raise HTTPException(status_code=403, detail="Only providers can delete treatment goals")

    # Get provider
    provider = db.query(Provider).filter(Provider.user_id == current_user.id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    # Get goal
    goal = db.query(TreatmentGoal).filter(TreatmentGoal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Treatment goal not found")

    # Check authorization
    if goal.provider_id != provider.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this goal")

    db.delete(goal)
    db.commit()

    return {"message": "Treatment goal deleted successfully"}


@router.get("/patient/{patient_id}/goals", response_model=List[TreatmentGoalResponse])
def list_patient_goals(
    patient_id: int,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List treatment goals for patient"""

    # Check authorization
    if current_user.role == "PATIENT":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or patient.id != patient_id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role != "PROVIDER":
        raise HTTPException(status_code=403, detail="Not authorized")

    query = db.query(TreatmentGoal).filter(TreatmentGoal.patient_id == patient_id)

    if status:
        query = query.filter(TreatmentGoal.status == status)

    goals = query.order_by(
        TreatmentGoal.status,
        desc(TreatmentGoal.created_at)
    ).all()

    return goals


# ============================================================================
# Goal Progress Endpoints
# ============================================================================

@router.post("/progress", response_model=GoalProgressResponse)
def create_goal_progress(
    progress_data: GoalProgressCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Record progress update for goal (provider only)"""
    if current_user.role != "PROVIDER":
        raise HTTPException(status_code=403, detail="Only providers can record goal progress")

    # Get provider
    provider = db.query(Provider).filter(Provider.user_id == current_user.id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    # Get goal
    goal = db.query(TreatmentGoal).filter(TreatmentGoal.id == progress_data.goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Treatment goal not found")

    # Check authorization
    if goal.provider_id != provider.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this goal")

    # Create progress record
    progress = GoalProgress(
        **progress_data.model_dump(),
        recorded_by_provider_id=provider.id,
        recorded_at=datetime.utcnow(),
    )

    db.add(progress)

    # Update goal progress percentage
    goal.progress_percentage = progress_data.progress_percentage
    goal.updated_at = datetime.utcnow()

    # Auto-achieve goal if 100% progress
    if progress_data.progress_percentage >= 100 and goal.status == GoalStatus.ACTIVE:
        goal.status = GoalStatus.ACHIEVED
        goal.achieved_at = datetime.utcnow()

    db.commit()
    db.refresh(progress)

    return progress


@router.get("/progress/{goal_id}", response_model=List[GoalProgressResponse])
def get_goal_progress_history(
    goal_id: int,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get progress history for a goal"""

    # Get goal
    goal = db.query(TreatmentGoal).filter(TreatmentGoal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Treatment goal not found")

    # Check authorization
    if current_user.role == "PATIENT":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or goal.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role == "PROVIDER":
        provider = db.query(Provider).filter(Provider.user_id == current_user.id).first()
        if not provider or goal.provider_id != provider.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    else:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get progress records
    progress_records = db.query(GoalProgress).filter(
        GoalProgress.goal_id == goal_id
    ).order_by(desc(GoalProgress.recorded_at)).limit(limit).all()

    return progress_records
