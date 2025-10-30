from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from app.db.session import get_db
from app.api.deps import get_current_user, get_current_patient, get_current_provider
from app.models.user import User
from app.models.patient import Patient
from app.models.provider import Provider
from app.models.appointment import Appointment
from app.models.enums import AppointmentStatus
from app.schemas.appointment import (
    AppointmentBookRequest,
    AppointmentResponse,
    AppointmentListResponse,
)
from app.services.payment import PaymentService
from app.services.billing.insurance_handler import InsuranceHandler
from app.services.billing.admin_fee_calculator import AdminFeeCalculator
from app.services.hipaa_logger import HIPAALogger

router = APIRouter()


@router.post("/book", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def book_appointment(
    request: AppointmentBookRequest,
    db: Session = Depends(get_db),
    patient: Patient = Depends(get_current_patient),
    http_request: Request = None,
):
    """
    Book new appointment
    GUARANTEE: Payment method required before booking
    FIX #7 APPLIED: Date/time validation in schema
    """
    # GUARANTEE ENFORCEMENT: Check payment method on file
    if not patient.default_payment_method_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment method required. Please add a credit card before booking an appointment.",
        )

    # Verify provider exists
    provider = db.query(Provider).filter(Provider.user_id == request.provider_id).first()
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider not found",
        )

    # Calculate appointment cost
    session_duration_hours = (request.ends_at - request.starts_at).total_seconds() / 3600
    amount_cents = int(provider.hourly_rate_cents * session_duration_hours)

    # Create appointment
    appointment = Appointment(
        patient_id=patient.user_id,
        provider_id=request.provider_id,
        appointment_type=request.appointment_type,
        status=AppointmentStatus.SCHEDULED,
        payment_type=request.payment_type,
        starts_at=request.starts_at,
        ends_at=request.ends_at,
        amount_cents=amount_cents,
    )
    db.add(appointment)
    db.flush()

    # Charge payment
    payment_service = PaymentService(db)
    try:
        payment_intent = payment_service.create_payment_intent(
            patient_id=patient.user_id,
            amount_cents=amount_cents,
            description=f"Appointment with {provider.user.name} on {request.starts_at.strftime('%Y-%m-%d %H:%M')}",
            appointment_id=appointment.id,
        )

        if payment_intent.status != "succeeded":
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment failed. Please check your payment method.",
            )
    except ValueError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    db.commit()
    db.refresh(appointment)

    # HIPAA audit log
    client_ip = http_request.client.host if http_request and http_request.client else None
    HIPAALogger.log_phi_access(
        db=db,
        user_id=patient.user_id,
        action="BOOK_APPOINTMENT",
        resource_type="Appointment",
        resource_id=appointment.id,
        ip_address=client_ip,
    )

    return appointment


@router.get("/my-appointments", response_model=AppointmentListResponse)
def get_my_appointments(
    status_filter: str | None = Query(None, regex="^(SCHEDULED|COMPLETED|CANCELLED|NO_SHOW)$"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get appointments for current user (patient or provider)
    FIX #11 APPLIED: SQL injection prevention with Query validation
    """
    query = db.query(Appointment)

    # Filter by role
    if current_user.role == "PATIENT":
        query = query.filter(Appointment.patient_id == current_user.id)
    elif current_user.role == "PROVIDER":
        query = query.filter(Appointment.provider_id == current_user.id)
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid role")

    # Apply status filter if provided
    if status_filter:
        query = query.filter(Appointment.status == status_filter)

    # Get total count
    total = query.count()

    # Get paginated results
    appointments = query.order_by(Appointment.starts_at.desc()).offset(skip).limit(limit).all()

    return AppointmentListResponse(
        appointments=appointments,
        total=total,
        page=skip // limit + 1,
        page_size=limit,
    )


@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    http_request: Request = None,
):
    """Get appointment details (must be patient or provider for this appointment)"""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    # Authorization check
    if current_user.id not in [appointment.patient_id, appointment.provider_id]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    # HIPAA audit log
    client_ip = http_request.client.host if http_request and http_request.client else None
    HIPAALogger.log_appointment_access(
        db=db,
        user_id=current_user.id,
        appointment_id=appointment_id,
        action="VIEW_APPOINTMENT",
        ip_address=client_ip,
    )

    return appointment


@router.post("/{appointment_id}/cancel", response_model=AppointmentResponse)
def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    patient: Patient = Depends(get_current_patient),
):
    """
    Cancel appointment
    May incur late cancellation fee if within window
    """
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    # Authorization check
    if appointment.patient_id != patient.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    # Check if already cancelled/completed
    if appointment.status != AppointmentStatus.SCHEDULED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel appointment with status: {appointment.status}",
        )

    # Process late cancellation fee if applicable
    from app.services.billing.no_show_handler import NoShowHandler

    no_show_handler = NoShowHandler(db)
    no_show_handler.process_late_cancellation(appointment)

    db.commit()
    db.refresh(appointment)

    return appointment
