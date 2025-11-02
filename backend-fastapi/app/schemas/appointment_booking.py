from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class AppointmentSlotResponse(BaseModel):
    """Single available slot"""
    id: int
    provider_id: int
    start_time: datetime
    end_time: datetime
    timezone: str
    slot_type: Optional[str] = None
    is_telehealth: bool

    class Config:
        from_attributes = True


class AvailableSlotsRequest(BaseModel):
    """Request available slots for a provider"""
    provider_id: int
    start_date: str  # YYYY-MM-DD
    end_date: str  # YYYY-MM-DD
    appointment_type: Optional[str] = None


class AvailableSlotsResponse(BaseModel):
    """Response with available slots"""
    provider_id: int
    provider_name: str
    slots: List[AppointmentSlotResponse]
    total_slots: int


class BookAppointmentRequest(BaseModel):
    """Book an appointment"""
    slot_id: int
    appointment_type: str = "therapy"
    payment_type: str  # CASH or INSURANCE
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    notes: Optional[str] = None


class BookAppointmentResponse(BaseModel):
    """Booking confirmation"""
    appointment_id: int
    slot_id: int
    provider_id: int
    provider_name: str
    patient_id: int
    start_time: datetime
    end_time: datetime
    appointment_type: str
    payment_type: str
    amount_cents: int
    status: str
    google_meet_link: Optional[str] = None

    class Config:
        from_attributes = True


class RescheduleAppointmentRequest(BaseModel):
    """Reschedule existing appointment"""
    new_slot_id: int
    reason: Optional[str] = None


class CancelAppointmentRequest(BaseModel):
    """Cancel appointment"""
    reason: Optional[str] = None
    cancellation_type: str = "patient_initiated"  # patient_initiated, provider_initiated, system
