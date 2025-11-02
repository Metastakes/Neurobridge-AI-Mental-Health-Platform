from pydantic import BaseModel, field_validator
from datetime import datetime, timedelta
from typing import List
from app.models.enums import AppointmentStatus, PaymentType


class AppointmentBookRequest(BaseModel):
    """Appointment booking request with validation"""

    provider_id: int
    starts_at: datetime
    ends_at: datetime
    appointment_type: str = "therapy_session"
    payment_type: PaymentType

    # FIX #7 APPLIED: Date/time validation
    @field_validator("starts_at")
    def validate_starts_at(cls, v):
        now = datetime.utcnow()
        if v < now:
            raise ValueError("Cannot book appointments in the past")
        if v > now + timedelta(days=90):
            raise ValueError("Cannot book more than 90 days in advance")
        return v

    @field_validator("ends_at")
    def validate_ends_at(cls, v, info):
        starts_at = info.data.get("starts_at")
        if starts_at:
            if v <= starts_at:
                raise ValueError("End time must be after start time")
            duration = v - starts_at
            if duration > timedelta(hours=4):
                raise ValueError("Appointment cannot exceed 4 hours")
            if duration < timedelta(minutes=15):
                raise ValueError("Appointment must be at least 15 minutes")
        return v


class AppointmentResponse(BaseModel):
    """Appointment response schema"""

    id: int
    patient_id: int
    provider_id: int
    appointment_type: str
    status: AppointmentStatus
    payment_type: PaymentType
    starts_at: datetime
    ends_at: datetime
    amount_cents: int
    no_show_fee_charged_cents: int
    admin_fee_cents: int
    created_at: datetime

    class Config:
        from_attributes = True


class AppointmentListResponse(BaseModel):
    """List of appointments with pagination"""

    appointments: List[AppointmentResponse]
    total: int
    page: int
    page_size: int
