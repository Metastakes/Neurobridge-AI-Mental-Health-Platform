from app.models.enums import (
    UserRole,
    ProviderType,
    AppointmentStatus,
    PaymentType,
    TaskStatus,
    QuizStatus,
    ReferralStatus,
    EarningsEntryType,
)
from app.models.user import User
from app.models.provider import Provider
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.pre_session_task import PreSessionTask, PreSessionTaskResponse
from app.models.medication_education import MedicationEducation, MedicationQuizAttempt
from app.models.referral import Referral
from app.models.earnings_ledger import EarningsLedger
from app.models.payment_intent import PaymentIntent
from app.models.policy_rule import PolicyRule
from app.models.audit_log import AuditLog

# Phase 2: Provider Onboarding
from app.models.provider_application import ProviderApplication, ApplicationStatus
from app.models.provider_license import ProviderLicense
from app.models.provider_document import ProviderDocument, DocumentType, DocumentStatus
from app.models.provider_availability import ProviderAvailability, ProviderTimeOff
from app.models.specialty import Specialty, InsurancePlan

# Phase 3: Patient Intake & Scheduling
from app.models.patient_intake_form import PatientIntakeForm, IntakeFormStatus
from app.models.provider_profile import ProviderProfile
from app.models.appointment_slot import AppointmentSlot

# Phase 4: Telehealth Video Integration
from app.models.video_session import (
    VideoSession,
    SessionNote,
    WaitingRoom,
    VideoSessionStatus,
    VideoSessionPlatform,
)

# Phase 5: Progress Tracking & Outcomes Measurement
from app.models.assessment import (
    AssessmentScale,
    AssessmentAttempt,
    TreatmentGoal,
    GoalProgress,
    AssessmentType,
    SeverityLevel,
    GoalStatus,
    GoalCategory,
)

# Phase 5 Enhancement: Gamification
from app.models.gamification import (
    Achievement,
    PatientAchievement,
    PatientStreak,
    Milestone,
    PatientMilestone,
    MotivationalMessage,
    AchievementCategory,
    AchievementTier,
)

# Phase 5 Enhancement: Medication Education & Rewards
from app.models.medication_rewards import (
    PrescribedMedication,
    MedicationQuizQuestion,
    MedicationQuizAttempt,
    RewardItem,
    RewardRedemption,
    PatientPoints,
    PointsTransaction,
    RewardCategory,
    RedemptionStatus,
)

__all__ = [
    # Enums
    "UserRole",
    "ProviderType",
    "AppointmentStatus",
    "PaymentType",
    "TaskStatus",
    "QuizStatus",
    "ReferralStatus",
    "EarningsEntryType",
    "ApplicationStatus",
    "DocumentType",
    "DocumentStatus",
    # Phase 1 Models
    "User",
    "Provider",
    "Patient",
    "Appointment",
    "PreSessionTask",
    "PreSessionTaskResponse",
    "MedicationEducation",
    "MedicationQuizAttempt",
    "Referral",
    "EarningsLedger",
    "PaymentIntent",
    "PolicyRule",
    "AuditLog",
    # Phase 2 Models
    "ProviderApplication",
    "ProviderLicense",
    "ProviderDocument",
    "ProviderAvailability",
    "ProviderTimeOff",
    "Specialty",
    "InsurancePlan",
    # Phase 3 Models
    "PatientIntakeForm",
    "IntakeFormStatus",
    "ProviderProfile",
    "AppointmentSlot",
    # Phase 4 Models
    "VideoSession",
    "SessionNote",
    "WaitingRoom",
    "VideoSessionStatus",
    "VideoSessionPlatform",
    # Phase 5 Models
    "AssessmentScale",
    "AssessmentAttempt",
    "TreatmentGoal",
    "GoalProgress",
    "AssessmentType",
    "SeverityLevel",
    "GoalStatus",
    "GoalCategory",
    # Phase 5 Gamification Models
    "Achievement",
    "PatientAchievement",
    "PatientStreak",
    "Milestone",
    "PatientMilestone",
    "MotivationalMessage",
    "AchievementCategory",
    "AchievementTier",
    # Phase 5 Medication & Rewards Models
    "PrescribedMedication",
    "MedicationQuizQuestion",
    "MedicationQuizAttempt",
    "RewardItem",
    "RewardRedemption",
    "PatientPoints",
    "PointsTransaction",
    "RewardCategory",
    "RedemptionStatus",
]
