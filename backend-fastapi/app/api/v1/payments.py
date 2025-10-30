from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_patient
from app.models.patient import Patient
from app.schemas.payment import PaymentMethodRequest
from app.services.payment import PaymentService

router = APIRouter()


@router.post("/payment-method", status_code=status.HTTP_200_OK)
def update_payment_method(
    request: PaymentMethodRequest,
    db: Session = Depends(get_db),
    patient: Patient = Depends(get_current_patient),
):
    """
    Update patient's default payment method
    GUARANTEE: Payment method required to book appointments
    FIX #9 APPLIED: Stripe error handling in PaymentService
    """
    payment_service = PaymentService(db)

    try:
        success = payment_service.update_payment_method(
            patient_id=patient.user_id, payment_method_id=request.payment_method_id
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update payment method",
            )

        return {"message": "Payment method updated successfully"}

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/payment-method")
def get_payment_method(
    db: Session = Depends(get_db),
    patient: Patient = Depends(get_current_patient),
):
    """Get patient's current payment method status"""
    has_payment_method = patient.default_payment_method_id is not None

    return {
        "has_payment_method": has_payment_method,
        "payment_method_id": patient.default_payment_method_id if has_payment_method else None,
    }
