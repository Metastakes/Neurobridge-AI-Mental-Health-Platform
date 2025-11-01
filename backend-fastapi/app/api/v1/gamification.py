"""
Phase 5 Enhancement: Gamification API Endpoints
API for streaks, achievements, milestones, and engagement
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, func
from typing import List, Optional
from datetime import datetime, timedelta
import random

from app.db.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.patient import Patient
from app.models.gamification import (
    Achievement,
    PatientAchievement,
    PatientStreak,
    Milestone,
    PatientMilestone,
    MotivationalMessage,
    AchievementCategory,
)
from app.models.assessment import AssessmentAttempt
from app.schemas.gamification import (
    AchievementResponse,
    PatientAchievementResponse,
    PatientStreakResponse,
    StreakUpdate,
    MilestoneResponse,
    PatientMilestoneResponse,
    MilestoneProgress,
    GamificationDashboard,
    EngagementMetrics,
    MotivationalMessageResponse,
)

router = APIRouter()


# ============================================================================
# Helper Functions
# ============================================================================

def calculate_engagement_score(streak: PatientStreak) -> int:
    """Calculate engagement score (0-100) based on activity"""
    score = 0

    # Current streak contributes up to 40 points
    streak_score = min(streak.current_streak_days * 4, 40)
    score += streak_score

    # Assessment count contributes up to 30 points
    assessment_score = min(streak.total_assessment_count * 2, 30)
    score += assessment_score

    # Session count contributes up to 20 points
    session_score = min(streak.total_session_count * 2, 20)
    score += session_score

    # Consistency bonus (10 points if active in last 7 days)
    if streak.last_assessment_date:
        days_ago = (datetime.utcnow() - streak.last_assessment_date).days
        if days_ago <= 7:
            score += 10

    return min(score, 100)


def calculate_level(total_points: int) -> tuple:
    """Calculate level and points to next level"""
    # Level formula: 100 points per level
    level = (total_points // 100) + 1
    points_to_next = 100 - (total_points % 100)
    return level, points_to_next


def check_new_achievements(patient_id: int, db: Session) -> List[Achievement]:
    """Check if patient unlocked any new achievements"""
    unlocked = []

    # Get patient data
    streak = db.query(PatientStreak).filter(PatientStreak.patient_id == patient_id).first()
    if not streak:
        return unlocked

    # Get all achievements
    achievements = db.query(Achievement).filter(Achievement.is_active == True).all()

    # Check each achievement
    for achievement in achievements:
        # Skip if already unlocked
        existing = db.query(PatientAchievement).filter(
            and_(
                PatientAchievement.patient_id == patient_id,
                PatientAchievement.achievement_id == achievement.id
            )
        ).first()
        if existing:
            continue

        # Check unlock criteria
        criteria = achievement.unlock_criteria
        should_unlock = False

        if criteria.get("type") == "assessment_count":
            if streak.total_assessment_count >= criteria.get("threshold", 0):
                should_unlock = True

        elif criteria.get("type") == "streak_days":
            if streak.current_streak_days >= criteria.get("threshold", 0):
                should_unlock = True

        elif criteria.get("type") == "streak_weeks":
            if streak.current_streak_weeks >= criteria.get("threshold", 0):
                should_unlock = True

        if should_unlock:
            # Unlock achievement
            patient_achievement = PatientAchievement(
                patient_id=patient_id,
                achievement_id=achievement.id,
                unlocked_at=datetime.utcnow(),
                is_viewed=False,
            )
            db.add(patient_achievement)
            unlocked.append(achievement)

    if unlocked:
        db.commit()

    return unlocked


def get_motivational_message(context_type: str, db: Session) -> Optional[MotivationalMessage]:
    """Get a random motivational message for context"""
    messages = db.query(MotivationalMessage).filter(
        and_(
            MotivationalMessage.context_type == context_type,
            MotivationalMessage.is_active == True
        )
    ).all()

    if not messages:
        return None

    # Weighted random selection
    weights = [m.weight for m in messages]
    return random.choices(messages, weights=weights, k=1)[0]


# ============================================================================
# Streak Endpoints
# ============================================================================

@router.get("/streak", response_model=PatientStreakResponse)
def get_patient_streak(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get patient's streak information"""
    if current_user.role != "PATIENT":
        raise HTTPException(status_code=403, detail="Only patients can access streaks")

    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    # Get or create streak
    streak = db.query(PatientStreak).filter(PatientStreak.patient_id == patient.id).first()
    if not streak:
        streak = PatientStreak(patient_id=patient.id)
        db.add(streak)
        db.commit()
        db.refresh(streak)

    return streak


@router.post("/streak/update", response_model=StreakUpdate)
def update_streak_after_assessment(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update streak after assessment completion"""
    if current_user.role != "PATIENT":
        raise HTTPException(status_code=403, detail="Only patients can update streaks")

    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    # Get or create streak
    streak = db.query(PatientStreak).filter(PatientStreak.patient_id == patient.id).first()
    if not streak:
        streak = PatientStreak(patient_id=patient.id)
        db.add(streak)

    today = datetime.utcnow().date()
    streak_broken = False
    streak_maintained = False
    new_record = False

    # Check if streak continues
    if streak.last_assessment_date:
        last_date = streak.last_assessment_date.date()
        days_diff = (today - last_date).days

        if days_diff == 0:
            # Same day, no streak change
            streak_maintained = True
        elif days_diff == 1:
            # Consecutive day, increment streak
            streak.current_streak_days += 1
            streak_maintained = True
            if streak.current_streak_days > streak.longest_streak_days:
                streak.longest_streak_days = streak.current_streak_days
                new_record = True
        else:
            # Streak broken
            streak_broken = True
            streak.current_streak_days = 1
    else:
        # First assessment
        streak.current_streak_days = 1

    # Update assessment count and date
    streak.total_assessment_count += 1
    streak.last_assessment_date = datetime.utcnow()

    # Update engagement score
    streak.engagement_score = calculate_engagement_score(streak)

    db.commit()
    db.refresh(streak)

    # Check for new achievements
    new_achievements = check_new_achievements(patient.id, db)

    # Get motivational message
    message_context = "streak_milestone" if streak_maintained else "comeback" if streak_broken else "first_assessment"
    motivational_msg = get_motivational_message(message_context, db)

    return StreakUpdate(
        streak=streak,
        streak_broken=streak_broken,
        streak_maintained=streak_maintained,
        new_record=new_record,
        achievements_unlocked=new_achievements,
        motivational_message=motivational_msg.message if motivational_msg else None,
    )


# ============================================================================
# Achievement Endpoints
# ============================================================================

@router.get("/achievements", response_model=List[AchievementResponse])
def list_achievements(
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all achievements"""
    query = db.query(Achievement).filter(Achievement.is_active == True)

    if category:
        query = query.filter(Achievement.category == category)

    achievements = query.order_by(Achievement.tier, Achievement.points).all()
    return achievements


@router.get("/achievements/unlocked", response_model=List[PatientAchievementResponse])
def list_unlocked_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List patient's unlocked achievements"""
    if current_user.role != "PATIENT":
        raise HTTPException(status_code=403, detail="Only patients can view achievements")

    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    unlocked = db.query(PatientAchievement).filter(
        PatientAchievement.patient_id == patient.id
    ).order_by(desc(PatientAchievement.unlocked_at)).all()

    return unlocked


@router.post("/achievements/{achievement_id}/view")
def mark_achievement_viewed(
    achievement_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark achievement as viewed (dismiss notification)"""
    if current_user.role != "PATIENT":
        raise HTTPException(status_code=403, detail="Only patients can mark achievements")

    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    patient_achievement = db.query(PatientAchievement).filter(
        and_(
            PatientAchievement.patient_id == patient.id,
            PatientAchievement.achievement_id == achievement_id
        )
    ).first()

    if not patient_achievement:
        raise HTTPException(status_code=404, detail="Achievement not found")

    patient_achievement.is_viewed = True
    db.commit()

    return {"message": "Achievement marked as viewed"}


# ============================================================================
# Dashboard Endpoint
# ============================================================================

@router.get("/dashboard", response_model=GamificationDashboard)
def get_gamification_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get complete gamification dashboard"""
    if current_user.role != "PATIENT":
        raise HTTPException(status_code=403, detail="Only patients can access dashboard")

    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    # Get or create streak
    streak = db.query(PatientStreak).filter(PatientStreak.patient_id == patient.id).first()
    if not streak:
        streak = PatientStreak(patient_id=patient.id)
        db.add(streak)
        db.commit()
        db.refresh(streak)

    # Determine streak status
    streak_status = "active"
    if streak.last_assessment_date:
        days_ago = (datetime.utcnow() - streak.last_assessment_date).days
        if days_ago >= 2:
            streak_status = "broken"
        elif days_ago == 1:
            streak_status = "at_risk"

    # Next streak milestone
    next_milestones = [7, 14, 30, 60, 90, 180, 365]
    next_milestone = None
    for milestone in next_milestones:
        if streak.current_streak_days < milestone:
            next_milestone = milestone
            break

    # Achievements
    total_achievements = db.query(Achievement).filter(Achievement.is_active == True).count()
    unlocked = db.query(PatientAchievement).filter(PatientAchievement.patient_id == patient.id).all()
    unlocked_count = len(unlocked)

    recent_achievements = sorted(unlocked, key=lambda x: x.unlocked_at, reverse=True)[:5]

    # Calculate total points
    total_points = sum([a.achievement.points for a in unlocked])
    current_level, points_to_next = calculate_level(total_points)

    # Get motivational message
    motivational_msg = get_motivational_message("dashboard", db)

    return GamificationDashboard(
        patient_id=patient.id,
        streak=streak,
        streak_status=streak_status,
        next_streak_milestone=next_milestone,
        total_achievements=total_achievements,
        unlocked_achievements=unlocked_count,
        recent_achievements=recent_achievements,
        next_achievement=None,  # TODO: Calculate next closest achievement
        total_milestones=0,  # TODO: Implement milestones
        achieved_milestones=0,
        milestone_progress=[],
        total_points=total_points,
        current_level=current_level,
        points_to_next_level=points_to_next,
        motivational_message=motivational_msg.message if motivational_msg else None,
        motivational_icon=motivational_msg.icon if motivational_msg else None,
    )
