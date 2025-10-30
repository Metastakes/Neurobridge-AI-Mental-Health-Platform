from enum import Enum as PyEnum


class UserRole(str, PyEnum):
    PATIENT = "PATIENT"
    PROVIDER = "PROVIDER"
    ADMIN = "ADMIN"


class ProviderType(str, PyEnum):
    THERAPIST = "THERAPIST"
    PMHNP = "PMHNP"
    PSYCHIATRIST = "PSYCHIATRIST"
    FNP = "FNP"


class AppointmentStatus(str, PyEnum):
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"


class PaymentType(str, PyEnum):
    CASH = "CASH"
    INSURANCE = "INSURANCE"


class TaskStatus(str, PyEnum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    OVERDUE = "OVERDUE"


class QuizStatus(str, PyEnum):
    PASSED = "PASSED"
    FAILED = "FAILED"


class ReferralStatus(str, PyEnum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    COMPLETED = "COMPLETED"


class EarningsEntryType(str, PyEnum):
    SESSION_REVENUE = "SESSION_REVENUE"
    NO_SHOW_FEE = "NO_SHOW_FEE"
    INSURANCE_TOPUP = "INSURANCE_TOPUP"
    ADMIN_FEE = "ADMIN_FEE"
    LATE_CANCEL_FEE = "LATE_CANCEL_FEE"
