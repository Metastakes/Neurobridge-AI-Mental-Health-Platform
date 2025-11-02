"""
Phase 5 Enhancement: Medication Education & Rewards System
Micro-learning quizzes for prescribed medications + health rewards marketplace
"""

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, JSON, Enum as SQLEnum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum
from app.db.base import Base


class MedicationCategory(str, PyEnum):
    """Medication categories for mental health"""
    ANTIDEPRESSANT = "ANTIDEPRESSANT"
    ANTIANXIETY = "ANTIANXIETY"
    MOOD_STABILIZER = "MOOD_STABILIZER"
    ANTIPSYCHOTIC = "ANTIPSYCHOTIC"
    ADHD = "ADHD"
    SLEEP_AID = "SLEEP_AID"
    OTHER = "OTHER"


class PrescribedMedication(Base):
    """
    Medications prescribed to patients by providers
    Triggers medication education quizzes
    """
    __tablename__ = "prescribed_medications"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    provider_id = Column(Integer, ForeignKey("providers.id"), nullable=False, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)

    # Medication details
    medication_name = Column(String(255), nullable=False, index=True)
    generic_name = Column(String(255), nullable=True)
    category = Column(SQLEnum(MedicationCategory), nullable=False, index=True)

    # Dosage
    dosage = Column(String(100), nullable=False)  # e.g., "50mg"
    frequency = Column(String(100), nullable=False)  # e.g., "Once daily"
    instructions = Column(Text, nullable=True)  # e.g., "Take with food"

    # Education tracking
    requires_quiz = Column(Boolean, nullable=False, default=True)
    quiz_completed = Column(Boolean, nullable=False, default=False)
    quiz_completed_at = Column(DateTime(timezone=True), nullable=True)

    # Prescription status
    is_active = Column(Boolean, nullable=False, default=True)
    started_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    discontinued_date = Column(DateTime(timezone=True), nullable=True)
    discontinuation_reason = Column(Text, nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationships
    patient = relationship("Patient", backref="prescribed_medications")
    provider = relationship("Provider", backref="prescribed_medications")
    appointment = relationship("Appointment", backref="prescribed_medications")
    quiz_attempts = relationship("MedicationQuizAttempt", back_populates="medication")

    def __repr__(self):
        return f"<PrescribedMedication(id={self.id}, medication={self.medication_name}, patient_id={self.patient_id})>"


class MedicationQuizQuestion(Base):
    """
    Questions for medication education quizzes
    Focus: Black box warnings, adverse reactions, general function
    Micro-learning: 3-5 questions per medication
    """
    __tablename__ = "medication_quiz_questions"

    id = Column(Integer, primary_key=True, index=True)

    # Medication
    medication_name = Column(String(255), nullable=False, index=True)
    generic_name = Column(String(255), nullable=True)

    # Question
    question = Column(Text, nullable=False)
    question_type = Column(String(50), nullable=False, index=True)
    # Types: "black_box_warning", "adverse_reaction", "general_function", "when_to_take", "what_to_avoid"

    # Multiple choice options (JSON array)
    options = Column(JSON, nullable=False)
    # Format: [{"value": "A", "text": "..."}, {"value": "B", "text": "..."}, ...]

    # Correct answer
    correct_answer = Column(String(10), nullable=False)  # "A", "B", "C", or "D"

    # Explanation (shown after answering)
    explanation = Column(Text, nullable=False)

    # Critical flag (for black box warnings)
    is_critical = Column(Boolean, nullable=False, default=False)

    # Active status
    is_active = Column(Boolean, nullable=False, default=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<MedicationQuizQuestion(id={self.id}, medication={self.medication_name}, type={self.question_type})>"


class MedicationQuizAttempt(Base):
    """
    Patient's attempts at medication quizzes
    Required before starting medication
    """
    __tablename__ = "medication_quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    prescribed_medication_id = Column(Integer, ForeignKey("prescribed_medications.id"), nullable=False, index=True)

    # Responses (JSON array)
    # Format: [{"question_id": 1, "selected": "A", "correct": "A", "is_correct": true}, ...]
    responses = Column(JSON, nullable=False)

    # Scoring
    total_questions = Column(Integer, nullable=False)
    correct_answers = Column(Integer, nullable=False)
    score_percentage = Column(Integer, nullable=False)  # 0-100

    # Pass/fail (must get 80% to pass)
    passed = Column(Boolean, nullable=False)
    passing_threshold = Column(Integer, nullable=False, default=80)

    # Points earned
    points_earned = Column(Integer, nullable=False, default=0)

    # Timing
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    time_spent_seconds = Column(Integer, nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    patient = relationship("Patient", backref="medication_quiz_attempts")
    medication = relationship("PrescribedMedication", back_populates="quiz_attempts")

    def __repr__(self):
        return f"<MedicationQuizAttempt(id={self.id}, patient_id={self.patient_id}, score={self.score_percentage}%)>"


# ============================================================================
# Rewards System
# ============================================================================

class RewardCategory(str, PyEnum):
    """Categories of health rewards"""
    VITAMINS_SUPPLEMENTS = "VITAMINS_SUPPLEMENTS"
    FITNESS_GEAR = "FITNESS_GEAR"
    HEALTHY_SNACKS = "HEALTHY_SNACKS"
    WELLNESS_APPS = "WELLNESS_APPS"
    SELF_CARE = "SELF_CARE"
    MEDITATION = "MEDITATION"
    BOOKS = "BOOKS"
    OTHER = "OTHER"


class RewardItem(Base):
    """
    Health rewards catalog - non-monetary prizes
    Users redeem points for healthy products
    Partnership opportunities with health brands
    """
    __tablename__ = "reward_items"

    id = Column(Integer, primary_key=True, index=True)

    # Reward details
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(SQLEnum(RewardCategory), nullable=False, index=True)

    # Brand partnership
    brand_name = Column(String(255), nullable=True)
    brand_logo_url = Column(String(500), nullable=True)
    is_partner = Column(Boolean, nullable=False, default=False)  # Official brand partnership

    # Points cost
    points_cost = Column(Integer, nullable=False, index=True)

    # Product details
    product_value_cents = Column(Integer, nullable=True)  # Estimated retail value
    quantity_description = Column(String(255), nullable=True)  # e.g., "30-day supply", "Trial size"
    image_url = Column(String(500), nullable=True)

    # Availability
    is_available = Column(Boolean, nullable=False, default=True)
    stock_quantity = Column(Integer, nullable=True)  # Null = unlimited
    max_per_user = Column(Integer, nullable=True, default=1)  # Limit redemptions per user

    # Visibility
    is_featured = Column(Boolean, nullable=False, default=False)
    display_order = Column(Integer, nullable=False, default=0)

    # Active status
    is_active = Column(Boolean, nullable=False, default=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationships
    redemptions = relationship("RewardRedemption", back_populates="reward_item")

    def __repr__(self):
        return f"<RewardItem(id={self.id}, name={self.name}, points={self.points_cost})>"


class RedemptionStatus(str, PyEnum):
    """Status of reward redemption"""
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class RewardRedemption(Base):
    """
    Patient reward redemptions
    Tracks when users spend points on health rewards
    """
    __tablename__ = "reward_redemptions"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    reward_item_id = Column(Integer, ForeignKey("reward_items.id"), nullable=False, index=True)

    # Redemption details
    points_spent = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)

    # Status
    status = Column(SQLEnum(RedemptionStatus), nullable=False, default=RedemptionStatus.PENDING, index=True)

    # Shipping (if physical product)
    requires_shipping = Column(Boolean, nullable=False, default=True)
    shipping_address = Column(JSON, nullable=True)
    tracking_number = Column(String(255), nullable=True)

    # Fulfillment
    processed_at = Column(DateTime(timezone=True), nullable=True)
    shipped_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)

    # Notes
    notes = Column(Text, nullable=True)

    # Metadata
    redeemed_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    patient = relationship("Patient", backref="reward_redemptions")
    reward_item = relationship("RewardItem", back_populates="redemptions")

    def __repr__(self):
        return f"<RewardRedemption(id={self.id}, patient_id={self.patient_id}, item={self.reward_item.name})>"


class PatientPoints(Base):
    """
    Patient points ledger
    Tracks all point earnings and spending
    """
    __tablename__ = "patient_points"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign key
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, unique=True, index=True)

    # Points balance
    total_points_earned = Column(Integer, nullable=False, default=0)
    total_points_spent = Column(Integer, nullable=False, default=0)
    current_balance = Column(Integer, nullable=False, default=0)

    # Lifetime stats
    total_redemptions = Column(Integer, nullable=False, default=0)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationships
    patient = relationship("Patient", backref="points_account")
    transactions = relationship("PointsTransaction", back_populates="patient_points")

    def __repr__(self):
        return f"<PatientPoints(patient_id={self.patient_id}, balance={self.current_balance})>"


class PointsTransaction(Base):
    """
    Individual points transactions
    Audit trail of all point earnings and spending
    """
    __tablename__ = "points_transactions"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    patient_points_id = Column(Integer, ForeignKey("patient_points.id"), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)

    # Transaction details
    transaction_type = Column(String(50), nullable=False, index=True)
    # Types: "earned_assessment", "earned_quiz", "earned_streak", "earned_goal",
    #        "spent_reward", "adjustment"

    points = Column(Integer, nullable=False)  # Positive for earning, negative for spending
    balance_after = Column(Integer, nullable=False)

    # Context
    description = Column(String(255), nullable=False)
    reference_id = Column(Integer, nullable=True)  # ID of related record (assessment, quiz, reward, etc.)
    reference_type = Column(String(50), nullable=True)  # "assessment", "medication_quiz", "reward", etc.)

    # Metadata
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)

    # Relationships
    patient_points = relationship("PatientPoints", back_populates="transactions")
    patient = relationship("Patient", backref="points_transactions")

    def __repr__(self):
        return f"<PointsTransaction(id={self.id}, patient_id={self.patient_id}, points={self.points})>"
