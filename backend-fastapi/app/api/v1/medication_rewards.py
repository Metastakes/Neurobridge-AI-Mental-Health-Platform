"""
Phase 5 Enhancement: Medication Education & Rewards API
API endpoints for medication quizzes and rewards marketplace
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
from app.models.medication_rewards import (
    PrescribedMedication,
    MedicationQuizQuestion,
    MedicationQuizAttempt,
    RewardItem,
    RewardRedemption,
    PatientPoints,
    PointsTransaction,
    RedemptionStatus,
)
from app.schemas.medication_rewards import (
    PrescribedMedicationCreate,
    PrescribedMedicationResponse,
    MedicationQuizQuestionResponse,
    MedicationQuizSubmit,
    MedicationQuizResult,
    QuizResponseDetail,
    RewardItemResponse,
    RewardRedeemRequest,
    RewardRedemptionResponse,
    PatientPointsResponse,
    PointsTransactionResponse,
    RewardsMarketplace,
    PointsEarningSummary,
)

router = APIRouter()

# Points values for different activities
POINTS_VALUES = {
    "medication_quiz": 100,  # High value - important for safety
    "assessment": 50,
    "streak_day": 10,
    "session_attended": 75,
    "goal_achieved": 200,
}


# ============================================================================
# Helper Functions
# ============================================================================

def get_or_create_points_account(patient_id: int, db: Session) -> PatientPoints:
    """Get or create patient points account"""
    points = db.query(PatientPoints).filter(PatientPoints.patient_id == patient_id).first()
    if not points:
        points = PatientPoints(patient_id=patient_id)
        db.add(points)
        db.commit()
        db.refresh(points)
    return points


def add_points(patient_id: int, points_to_add: int, transaction_type: str, description: str, db: Session, reference_id: Optional[int] = None, reference_type: Optional[str] = None):
    """Add points to patient account"""
    points_account = get_or_create_points_account(patient_id, db)

    points_account.total_points_earned += points_to_add
    points_account.current_balance += points_to_add

    # Create transaction record
    transaction = PointsTransaction(
        patient_points_id=points_account.id,
        patient_id=patient_id,
        transaction_type=transaction_type,
        points=points_to_add,
        balance_after=points_account.current_balance,
        description=description,
        reference_id=reference_id,
        reference_type=reference_type,
    )

    db.add(transaction)
    db.commit()
    db.refresh(points_account)

    return points_account


# ============================================================================
# Medication Quiz Endpoints
# ============================================================================

@router.get("/medications/{medication_id}/quiz", response_model=List[MedicationQuizQuestionResponse])
def get_medication_quiz(
    medication_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get medication quiz questions (micro-learning: 3-5 questions)"""
    # Get prescribed medication
    medication = db.query(PrescribedMedication).filter(PrescribedMedication.id == medication_id).first()
    if not medication:
        raise HTTPException(status_code=404, detail="Prescribed medication not found")

    # Check authorization
    if current_user.role == "PATIENT":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or medication.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Not authorized")

    # Get quiz questions for this medication
    questions = db.query(MedicationQuizQuestion).filter(
        and_(
            MedicationQuizQuestion.medication_name == medication.medication_name,
            MedicationQuizQuestion.is_active == True
        )
    ).order_by(
        MedicationQuizQuestion.is_critical.desc(),  # Critical questions first
        MedicationQuizQuestion.id
    ).limit(5).all()  # Micro-learning: max 5 questions

    if not questions:
        raise HTTPException(status_code=404, detail="No quiz questions available for this medication")

    return questions


@router.post("/medications/quiz/submit", response_model=MedicationQuizResult)
def submit_medication_quiz(
    quiz_data: MedicationQuizSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit medication quiz and get results with points"""
    if current_user.role != "PATIENT":
        raise HTTPException(status_code=403, detail="Only patients can submit quizzes")

    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    # Get prescribed medication
    medication = db.query(PrescribedMedication).filter(PrescribedMedication.id == quiz_data.prescribed_medication_id).first()
    if not medication:
        raise HTTPException(status_code=404, detail="Prescribed medication not found")

    if medication.patient_id != patient.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Grade quiz
    responses_detail = []
    correct_count = 0

    for response in quiz_data.responses:
        question = db.query(MedicationQuizQuestion).filter(MedicationQuizQuestion.id == response.question_id).first()
        if not question:
            continue

        is_correct = response.selected_answer == question.correct_answer
        if is_correct:
            correct_count += 1

        responses_detail.append({
            "question_id": question.id,
            "question": question.question,
            "selected": response.selected_answer,
            "correct": question.correct_answer,
            "is_correct": is_correct,
            "explanation": question.explanation,
            "is_critical": question.is_critical,
        })

    total_questions = len(quiz_data.responses)
    score_percentage = int((correct_count / total_questions) * 100) if total_questions > 0 else 0
    passed = score_percentage >= 80  # Must get 80% to pass

    # Award points if passed
    points_earned = POINTS_VALUES["medication_quiz"] if passed else 0

    # Create quiz attempt
    attempt = MedicationQuizAttempt(
        patient_id=patient.id,
        prescribed_medication_id=medication.id,
        responses=responses_detail,
        total_questions=total_questions,
        correct_answers=correct_count,
        score_percentage=score_percentage,
        passed=passed,
        points_earned=points_earned,
        started_at=quiz_data.started_at,
        completed_at=datetime.utcnow(),
    )

    db.add(attempt)

    # Mark medication quiz as completed if passed
    if passed and not medication.quiz_completed:
        medication.quiz_completed = True
        medication.quiz_completed_at = datetime.utcnow()

        # Award points
        add_points(
            patient_id=patient.id,
            points_to_add=points_earned,
            transaction_type="earned_quiz",
            description=f"Completed medication quiz: {medication.medication_name}",
            db=db,
            reference_id=attempt.id,
            reference_type="medication_quiz"
        )

    db.commit()
    db.refresh(attempt)

    # Build response
    response_details = [QuizResponseDetail(**detail) for detail in responses_detail]

    return MedicationQuizResult(
        attempt_id=attempt.id,
        prescribed_medication_id=medication.id,
        medication_name=medication.medication_name,
        total_questions=total_questions,
        correct_answers=correct_count,
        score_percentage=score_percentage,
        passed=passed,
        points_earned=points_earned,
        responses=response_details,
        completed_at=attempt.completed_at,
    )


# ============================================================================
# Rewards Marketplace Endpoints
# ============================================================================

@router.get("/rewards", response_model=List[RewardItemResponse])
def list_rewards(
    category: Optional[str] = None,
    featured_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List available rewards in catalog"""
    query = db.query(RewardItem).filter(
        and_(
            RewardItem.is_active == True,
            RewardItem.is_available == True
        )
    )

    if category:
        query = query.filter(RewardItem.category == category)

    if featured_only:
        query = query.filter(RewardItem.is_featured == True)

    rewards = query.order_by(RewardItem.display_order, RewardItem.points_cost).all()
    return rewards


@router.get("/rewards/marketplace", response_model=RewardsMarketplace)
def get_rewards_marketplace(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get complete rewards marketplace view"""
    if current_user.role != "PATIENT":
        raise HTTPException(status_code=403, detail="Only patients can access rewards marketplace")

    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    # Get points balance
    points_account = get_or_create_points_account(patient.id, db)

    # Get featured rewards
    featured = db.query(RewardItem).filter(
        and_(
            RewardItem.is_active == True,
            RewardItem.is_available == True,
            RewardItem.is_featured == True
        )
    ).order_by(RewardItem.display_order).limit(6).all()

    # Get all rewards
    all_rewards = db.query(RewardItem).filter(
        and_(
            RewardItem.is_active == True,
            RewardItem.is_available == True
        )
    ).order_by(RewardItem.category, RewardItem.points_cost).all()

    # Get recent redemptions
    recent = db.query(RewardRedemption).filter(
        RewardRedemption.patient_id == patient.id
    ).order_by(desc(RewardRedemption.redeemed_at)).limit(5).all()

    recent_redemptions = []
    for redemption in recent:
        recent_redemptions.append(RewardRedemptionResponse(
            id=redemption.id,
            patient_id=redemption.patient_id,
            reward_item_id=redemption.reward_item_id,
            reward_name=redemption.reward_item.name,
            points_spent=redemption.points_spent,
            quantity=redemption.quantity,
            status=redemption.status,
            requires_shipping=redemption.requires_shipping,
            tracking_number=redemption.tracking_number,
            redeemed_at=redemption.redeemed_at,
        ))

    # Points earning guide
    earning_guide = PointsEarningSummary(
        available_tasks=[
            {"task": "Complete Medication Quiz", "points": POINTS_VALUES["medication_quiz"], "icon": "💊"},
            {"task": "Complete Assessment", "points": POINTS_VALUES["assessment"], "icon": "📊"},
            {"task": "Attend Session", "points": POINTS_VALUES["session_attended"], "icon": "🎥"},
            {"task": "Achieve Goal", "points": POINTS_VALUES["goal_achieved"], "icon": "🎯"},
            {"task": "Daily Streak", "points": POINTS_VALUES["streak_day"], "icon": "🔥"},
        ],
        total_available_points=sum(POINTS_VALUES.values())
    )

    return RewardsMarketplace(
        patient_points=points_account,
        featured_rewards=featured,
        all_rewards=all_rewards,
        recent_redemptions=recent_redemptions,
        points_earning_guide=earning_guide,
    )


@router.post("/rewards/redeem", response_model=RewardRedemptionResponse)
def redeem_reward(
    redemption_data: RewardRedeemRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Redeem points for reward"""
    if current_user.role != "PATIENT":
        raise HTTPException(status_code=403, detail="Only patients can redeem rewards")

    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    # Get reward item
    reward = db.query(RewardItem).filter(RewardItem.id == redemption_data.reward_item_id).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")

    if not reward.is_available or not reward.is_active:
        raise HTTPException(status_code=400, detail="Reward not available")

    # Check points balance
    points_account = get_or_create_points_account(patient.id, db)
    total_cost = reward.points_cost * redemption_data.quantity

    if points_account.current_balance < total_cost:
        raise HTTPException(status_code=400, detail=f"Insufficient points. Need {total_cost}, have {points_account.current_balance}")

    # Check max per user
    if reward.max_per_user:
        existing_count = db.query(RewardRedemption).filter(
            and_(
                RewardRedemption.patient_id == patient.id,
                RewardRedemption.reward_item_id == reward.id
            )
        ).count()

        if existing_count >= reward.max_per_user:
            raise HTTPException(status_code=400, detail=f"Maximum {reward.max_per_user} redemptions allowed")

    # Deduct points
    points_account.total_points_spent += total_cost
    points_account.current_balance -= total_cost
    points_account.total_redemptions += 1

    # Create redemption
    redemption = RewardRedemption(
        patient_id=patient.id,
        reward_item_id=reward.id,
        points_spent=total_cost,
        quantity=redemption_data.quantity,
        status=RedemptionStatus.PENDING,
        requires_shipping=bool(redemption_data.shipping_address),
        shipping_address=redemption_data.shipping_address,
    )

    db.add(redemption)

    # Create transaction record
    transaction = PointsTransaction(
        patient_points_id=points_account.id,
        patient_id=patient.id,
        transaction_type="spent_reward",
        points=-total_cost,
        balance_after=points_account.current_balance,
        description=f"Redeemed: {reward.name}",
        reference_id=redemption.id,
        reference_type="reward_redemption"
    )

    db.add(transaction)
    db.commit()
    db.refresh(redemption)

    return RewardRedemptionResponse(
        id=redemption.id,
        patient_id=redemption.patient_id,
        reward_item_id=redemption.reward_item_id,
        reward_name=reward.name,
        points_spent=redemption.points_spent,
        quantity=redemption.quantity,
        status=redemption.status,
        requires_shipping=redemption.requires_shipping,
        tracking_number=redemption.tracking_number,
        redeemed_at=redemption.redeemed_at,
    )


# ============================================================================
# Points Endpoints
# ============================================================================

@router.get("/points", response_model=PatientPointsResponse)
def get_patient_points(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get patient points balance"""
    if current_user.role != "PATIENT":
        raise HTTPException(status_code=403, detail="Only patients can view points")

    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    points_account = get_or_create_points_account(patient.id, db)
    return points_account


@router.get("/points/transactions", response_model=List[PointsTransactionResponse])
def get_points_transactions(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get patient points transaction history"""
    if current_user.role != "PATIENT":
        raise HTTPException(status_code=403, detail="Only patients can view transactions")

    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    transactions = db.query(PointsTransaction).filter(
        PointsTransaction.patient_id == patient.id
    ).order_by(desc(PointsTransaction.created_at)).limit(limit).all()

    return transactions
