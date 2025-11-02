from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.session import get_db
from app.api.deps import get_current_provider, get_current_patient
from app.models.provider import Provider
from app.models.patient import Patient
from app.models.referral import Referral
from app.models.enums import ReferralStatus
from app.schemas.referral import ReferralCreateRequest, ReferralResponse

router = APIRouter()


@router.post("/create", response_model=ReferralResponse, status_code=status.HTTP_201_CREATED)
def create_referral(
    request: ReferralCreateRequest,
    db: Session = Depends(get_db),
    provider: Provider = Depends(get_current_provider),
):
    """
    Create referral to another provider type
    GUARANTEE: Referrals across scope tiers (Therapist → PMHNP/Psychiatrist → FNP)
    """
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.user_id == request.patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    # Validate scope transition
    valid_transitions = {
        "THERAPIST": ["PMHNP", "PSYCHIATRIST"],
        "PMHNP": ["FNP", "PSYCHIATRIST"],
        "PSYCHIATRIST": ["FNP"],
        "FNP": [],  # FNP cannot refer (top of scope)
    }

    from_type = provider.provider_type.value
    to_type = request.to_provider_type.value

    if to_type not in valid_transitions.get(from_type, []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid referral: {from_type} cannot refer to {to_type}",
        )

    # Create referral
    referral = Referral(
        patient_id=patient.user_id,
        referring_provider_id=provider.user_id,
        referred_to_provider_id=None,  # Will be assigned later
        reason=request.reason,
        clinical_notes=request.clinical_notes,
        status=ReferralStatus.PENDING,
        from_provider_type=from_type,
        to_provider_type=to_type,
    )
    db.add(referral)
    db.commit()
    db.refresh(referral)

    return referral


@router.get("/my-referrals", response_model=list[ReferralResponse])
def get_my_referrals(
    db: Session = Depends(get_db),
    provider: Provider = Depends(get_current_provider),
):
    """Get referrals made by current provider"""
    referrals = (
        db.query(Referral)
        .filter(Referral.referring_provider_id == provider.user_id)
        .order_by(Referral.created_at.desc())
        .all()
    )

    return referrals


@router.get("/pending", response_model=list[ReferralResponse])
def get_pending_referrals(
    db: Session = Depends(get_db),
    provider: Provider = Depends(get_current_provider),
):
    """Get pending referrals matching current provider's type"""
    referrals = (
        db.query(Referral)
        .filter(
            Referral.to_provider_type == provider.provider_type.value,
            Referral.status == ReferralStatus.PENDING,
        )
        .order_by(Referral.created_at.desc())
        .all()
    )

    return referrals


@router.post("/{referral_id}/accept", response_model=ReferralResponse)
def accept_referral(
    referral_id: int,
    db: Session = Depends(get_db),
    provider: Provider = Depends(get_current_provider),
):
    """Accept a referral"""
    referral = db.query(Referral).filter(Referral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Referral not found")

    # Validate provider type matches
    if referral.to_provider_type != provider.provider_type.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Referral is for {referral.to_provider_type}, not {provider.provider_type.value}",
        )

    # Update referral
    referral.referred_to_provider_id = provider.user_id
    referral.status = ReferralStatus.ACCEPTED
    referral.accepted_at = datetime.utcnow()

    db.commit()
    db.refresh(referral)

    return referral


@router.get("/patient/my-referrals", response_model=list[ReferralResponse])
def get_patient_referrals(
    db: Session = Depends(get_db),
    patient: Patient = Depends(get_current_patient),
):
    """Get referrals for current patient"""
    referrals = (
        db.query(Referral)
        .filter(Referral.patient_id == patient.user_id)
        .order_by(Referral.created_at.desc())
        .all()
    )

    return referrals
