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
]
