from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.provider import Provider
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.appointment_slot import AppointmentSlot
from app.models.enums import AppointmentStatus
from app.schemas.appointment_booking import (
    AvailableSlotsRequest,
    AvailableSlotsResponse,
    AppointmentSlotResponse,
    BookAppointmentRequest,
    BookAppointmentResponse,
    RescheduleAppointmentRequest,
    CancelAppointmentRequest,
)

router = APIRouter()


@router.post("/available-slots", response_model=AvailableSlotsResponse)
def get_available_slots(
    request: AvailableSlotsRequest,
    db: Session = Depends(get_db),
):
    """
    Get available appointment slots for a provider

    Public endpoint - patients can view availability before booking
    """
    # Verify provider exists
    provider = db.query(Provider).filter(Provider.id == request.provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    user = db.query(User).filter(User.id == provider.user_id).first()

    # Parse dates
    try:
        start_date = datetime.strptime(request.start_date, "%Y-%m-%d")
        end_date = datetime.strptime(request.end_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    # Query available slots
    slots_query = (
        db.query(AppointmentSlot)
        .filter(AppointmentSlot.provider_id == request.provider_id)
        .filter(AppointmentSlot.start_time >= start_date)
        .filter(AppointmentSlot.start_time < end_date + timedelta(days=1))
        .filter(AppointmentSlot.is_booked == False)
        .order_by(AppointmentSlot.start_time)
    )

    if request.appointment_type:
        slots_query = slots_query.filter(AppointmentSlot.slot_type == request.appointment_type)

    slots = slots_query.all()

    slot_responses = [
        AppointmentSlotResponse(
            id=slot.id,
            provider_id=slot.provider_id,
            start_time=slot.start_time,
            end_time=slot.end_time,
            timezone=slot.timezone,
            slot_type=slot.slot_type,
            is_telehealth=slot.is_telehealth,
        )
        for slot in slots
    ]

    return AvailableSlotsResponse(
        provider_id=provider.id,
        provider_name=user.name,
        slots=slot_responses,
        total_slots=len(slot_responses),
    )


@router.post("/book", response_model=BookAppointmentResponse)
def book_appointment(
    request: BookAppointmentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Book an appointment slot

    Requires authentication. Patient must have payment method on file.
    """
    # Verify user is a patient
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=403, detail="Only patients can book appointments")

    # GUARANTEE: Payment method required
    if not patient.default_payment_method_id:
        raise HTTPException(
            status_code=400,
            detail="Payment method required. Please add a payment method before booking."
        )

    # Get the slot
    slot = db.query(AppointmentSlot).filter(AppointmentSlot.id == request.slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Appointment slot not found")

    if slot.is_booked:
        raise HTTPException(status_code=409, detail="This slot is already booked")

    # Get provider details
    provider = db.query(Provider).filter(Provider.id == slot.provider_id).first()
    provider_user = db.query(User).filter(User.id == provider.user_id).first()

    # Calculate amount
    duration_hours = (slot.end_time - slot.start_time).seconds / 3600
    amount_cents = int(provider.hourly_rate_cents * duration_hours)

    # Create appointment
    appointment = Appointment(
        patient_id=patient.id,
        provider_id=provider.id,
        appointment_type=request.appointment_type,
        status=AppointmentStatus.SCHEDULED,
        payment_type=request.payment_type,
        starts_at=slot.start_time,
        ends_at=slot.end_time,
        amount_cents=amount_cents,
        no_show_fee_charged_cents=0,
        admin_fee_cents=0,
    )

    db.add(appointment)
    db.flush()  # Get the appointment ID

    # Mark slot as booked
    slot.is_booked = True
    slot.appointment_id = appointment.id

    db.commit()
    db.refresh(appointment)

    # TODO: Generate Google Meet link (Phase 4)
    google_meet_link = None

    return BookAppointmentResponse(
        appointment_id=appointment.id,
        slot_id=slot.id,
        provider_id=provider.id,
        provider_name=provider_user.name,
        patient_id=patient.id,
        start_time=appointment.starts_at,
        end_time=appointment.ends_at,
        appointment_type=appointment.appointment_type,
        payment_type=appointment.payment_type,
        amount_cents=appointment.amount_cents,
        status=appointment.status.value,
        google_meet_link=google_meet_link,
    )


@router.post("/appointments/{appointment_id}/reschedule", response_model=BookAppointmentResponse)
def reschedule_appointment(
    appointment_id: int,
    request: RescheduleAppointmentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Reschedule an existing appointment to a new slot

    Both patients and providers can reschedule
    """
    # Get appointment
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Verify ownership
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    provider = db.query(Provider).filter(Provider.user_id == current_user.id).first()

    is_patient_owner = patient and appointment.patient_id == patient.id
    is_provider_owner = provider and appointment.provider_id == provider.id

    if not (is_patient_owner or is_provider_owner):
        raise HTTPException(status_code=403, detail="Not authorized to reschedule this appointment")

    # Check if appointment can be rescheduled
    if appointment.status not in [AppointmentStatus.SCHEDULED]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reschedule appointment with status {appointment.status.value}"
        )

    # Get new slot
    new_slot = db.query(AppointmentSlot).filter(AppointmentSlot.id == request.new_slot_id).first()
    if not new_slot:
        raise HTTPException(status_code=404, detail="New slot not found")

    if new_slot.is_booked:
        raise HTTPException(status_code=409, detail="New slot is already booked")

    # Verify same provider
    if new_slot.provider_id != appointment.provider_id:
        raise HTTPException(status_code=400, detail="New slot must be with the same provider")

    # Free up old slot
    old_slot = db.query(AppointmentSlot).filter(AppointmentSlot.appointment_id == appointment_id).first()
    if old_slot:
        old_slot.is_booked = False
        old_slot.appointment_id = None

    # Update appointment
    appointment.starts_at = new_slot.start_time
    appointment.ends_at = new_slot.end_time

    # Mark new slot as booked
    new_slot.is_booked = True
    new_slot.appointment_id = appointment.id

    db.commit()
    db.refresh(appointment)

    provider_details = db.query(Provider).filter(Provider.id == appointment.provider_id).first()
    provider_user = db.query(User).filter(User.id == provider_details.user_id).first()

    return BookAppointmentResponse(
        appointment_id=appointment.id,
        slot_id=new_slot.id,
        provider_id=appointment.provider_id,
        provider_name=provider_user.name,
        patient_id=appointment.patient_id,
        start_time=appointment.starts_at,
        end_time=appointment.ends_at,
        appointment_type=appointment.appointment_type,
        payment_type=appointment.payment_type,
        amount_cents=appointment.amount_cents,
        status=appointment.status.value,
        google_meet_link=None,
    )


@router.post("/appointments/{appointment_id}/cancel")
def cancel_appointment(
    appointment_id: int,
    request: CancelAppointmentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Cancel an appointment

    Both patients and providers can cancel.
    Late cancellations may incur fees per provider policy.
    """
    # Get appointment
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Verify ownership
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    provider = db.query(Provider).filter(Provider.user_id == current_user.id).first()

    is_patient_owner = patient and appointment.patient_id == patient.id
    is_provider_owner = provider and appointment.provider_id == provider.id

    if not (is_patient_owner or is_provider_owner):
        raise HTTPException(status_code=403, detail="Not authorized to cancel this appointment")

    # Check if already cancelled
    if appointment.status == AppointmentStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Appointment already cancelled")

    # Free up the slot
    slot = db.query(AppointmentSlot).filter(AppointmentSlot.appointment_id == appointment_id).first()
    if slot:
        slot.is_booked = False
        slot.appointment_id = None

    # Update appointment status
    appointment.status = AppointmentStatus.CANCELLED

    # TODO: Calculate late cancellation fees based on provider policy
    # This will be implemented with the billing system in Phase 6

    db.commit()

    return {
        "message": "Appointment cancelled successfully",
        "appointment_id": appointment_id,
        "status": "CANCELLED",
    }
