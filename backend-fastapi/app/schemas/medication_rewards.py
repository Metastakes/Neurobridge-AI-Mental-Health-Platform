"""
Phase 5 Enhancement: Medication Education & Rewards Schemas
Pydantic schemas for medication quizzes and rewards marketplace
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional, Dict, Any


# ============================================================================
# Prescribed Medications
# ============================================================================

class PrescribedMedicationCreate(BaseModel):
    """Create prescribed medication"""
    patient_id: int
    medication_name: str
    generic_name: Optional[str] = None
    category: str
    dosage: str
    frequency: str
    instructions: Optional[str] = None
    appointment_id: Optional[int] = None


class PrescribedMedicationResponse(BaseModel):
    """Prescribed medication response"""
    id: int
    patient_id: int
    provider_id: int
    medication_name: str
    generic_name: Optional[str] = None
    category: str
    dosage: str
    frequency: str
    instructions: Optional[str] = None
    requires_quiz: bool
    quiz_completed: bool
    quiz_completed_at: Optional[datetime] = None
    is_active: bool
    started_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Medication Quizzes
# ============================================================================

class QuizOption(BaseModel):
    """Quiz question option"""
    value: str  # "A", "B", "C", "D"
    text: str


class MedicationQuizQuestionResponse(BaseModel):
    """Medication quiz question"""
    id: int
    medication_name: str
    question: str
    question_type: str
    options: List[QuizOption]
    is_critical: bool

    class Config:
        from_attributes = True


class QuizAnswerSubmit(BaseModel):
    """Submit answer to quiz question"""
    question_id: int
    selected_answer: str  # "A", "B", "C", or "D"


class MedicationQuizSubmit(BaseModel):
    """Submit complete medication quiz"""
    prescribed_medication_id: int
    responses: List[QuizAnswerSubmit]
    started_at: Optional[datetime] = None


class QuizResponseDetail(BaseModel):
    """Detail of single quiz response"""
    question_id: int
    question: str
    selected_answer: str
    correct_answer: str
    is_correct: bool
    explanation: str
    is_critical: bool


class MedicationQuizResult(BaseModel):
    """Result of medication quiz"""
    attempt_id: int
    prescribed_medication_id: int
    medication_name: str
    total_questions: int
    correct_answers: int
    score_percentage: int
    passed: bool
    points_earned: int
    responses: List[QuizResponseDetail]
    completed_at: datetime


# ============================================================================
# Rewards Catalog
# ============================================================================

class RewardItemResponse(BaseModel):
    """Reward item in catalog"""
    id: int
    name: str
    description: str
    category: str
    brand_name: Optional[str] = None
    brand_logo_url: Optional[str] = None
    is_partner: bool
    points_cost: int
    product_value_cents: Optional[int] = None
    quantity_description: Optional[str] = None
    image_url: Optional[str] = None
    is_available: bool
    is_featured: bool
    max_per_user: Optional[int] = None

    class Config:
        from_attributes = True


class RewardRedeemRequest(BaseModel):
    """Request to redeem reward"""
    reward_item_id: int
    quantity: int = 1
    shipping_address: Optional[Dict[str, str]] = None


class RewardRedemptionResponse(BaseModel):
    """Reward redemption response"""
    id: int
    patient_id: int
    reward_item_id: int
    reward_name: str
    points_spent: int
    quantity: int
    status: str
    requires_shipping: bool
    tracking_number: Optional[str] = None
    redeemed_at: datetime
    estimated_delivery: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================================
# Points System
# ============================================================================

class PatientPointsResponse(BaseModel):
    """Patient points balance"""
    patient_id: int
    current_balance: int
    total_points_earned: int
    total_points_spent: int
    total_redemptions: int
    created_at: datetime

    class Config:
        from_attributes = True


class PointsTransactionResponse(BaseModel):
    """Points transaction"""
    id: int
    transaction_type: str
    points: int
    balance_after: int
    description: str
    created_at: datetime

    class Config:
        from_attributes = True


class PointsEarningSummary(BaseModel):
    """Summary of how to earn points"""
    available_tasks: List[Dict[str, Any]]
    # Format: [{"task": "Complete Assessment", "points": 50, "icon": "📊"}, ...]
    total_available_points: int


class RewardsMarketplace(BaseModel):
    """Complete rewards marketplace view"""
    patient_points: PatientPointsResponse
    featured_rewards: List[RewardItemResponse]
    all_rewards: List[RewardItemResponse]
    recent_redemptions: List[RewardRedemptionResponse]
    points_earning_guide: PointsEarningSummary
