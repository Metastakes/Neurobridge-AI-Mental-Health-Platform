from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.patient import Patient
from app.models.patient_intake_form import PatientIntakeForm
from app.schemas.patient_intake import (
    PatientIntakeFormCreate,
    PatientIntakeFormUpdate,
    PatientIntakeFormResponse,
)

router = APIRouter()


@router.post("/intake-form", response_model=PatientIntakeFormResponse)
def create_intake_form(
    form_data: PatientIntakeFormCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new patient intake form

    Patients complete this during registration or before first appointment
    """
    # Verify user is a patient
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=403, detail="Only patients can create intake forms")

    # Check if patient already has an intake form
    existing_form = (
        db.query(PatientIntakeForm)
        .filter(PatientIntakeForm.patient_id == patient.id)
        .filter(PatientIntakeForm.status != "COMPLETED")
        .first()
    )

    if existing_form:
        raise HTTPException(
            status_code=400,
            detail=f"You already have an intake form in progress (ID: {existing_form.id}). Please update it instead."
        )

    # Create new intake form
    intake_form = PatientIntakeForm(
        patient_id=patient.id,
        status="DRAFT",
        **form_data.model_dump()
    )

    db.add(intake_form)
    db.commit()
    db.refresh(intake_form)

    return intake_form


@router.get("/intake-form", response_model=PatientIntakeFormResponse)
def get_my_intake_form(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get patient's current intake form
    """
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=403, detail="Only patients can access intake forms")

    # Get most recent intake form
    intake_form = (
        db.query(PatientIntakeForm)
        .filter(PatientIntakeForm.patient_id == patient.id)
        .order_by(PatientIntakeForm.created_at.desc())
        .first()
    )

    if not intake_form:
        raise HTTPException(status_code=404, detail="No intake form found. Please create one.")

    return intake_form


@router.put("/intake-form/{form_id}", response_model=PatientIntakeFormResponse)
def update_intake_form(
    form_id: int,
    form_data: PatientIntakeFormUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update an existing intake form

    Allows partial updates - only provided fields will be updated
    """
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=403, detail="Only patients can update intake forms")

    intake_form = db.query(PatientIntakeForm).filter(PatientIntakeForm.id == form_id).first()
    if not intake_form:
        raise HTTPException(status_code=404, detail="Intake form not found")

    # Verify ownership
    if intake_form.patient_id != patient.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this form")

    # Can't update if already reviewed
    if intake_form.status == "REVIEWED":
        raise HTTPException(status_code=400, detail="Cannot update a reviewed intake form")

    # Update fields
    update_data = form_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(intake_form, field, value)

    db.commit()
    db.refresh(intake_form)

    return intake_form


@router.post("/intake-form/{form_id}/submit", response_model=PatientIntakeFormResponse)
def submit_intake_form(
    form_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submit intake form for review

    Validates that all required fields are completed
    """
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=403, detail="Only patients can submit intake forms")

    intake_form = db.query(PatientIntakeForm).filter(PatientIntakeForm.id == form_id).first()
    if not intake_form:
        raise HTTPException(status_code=404, detail="Intake form not found")

    # Verify ownership
    if intake_form.patient_id != patient.id:
        raise HTTPException(status_code=403, detail="Not authorized to submit this form")

    # Validate required fields
    missing_fields = []

    if not intake_form.emergency_contact_name:
        missing_fields.append("emergency_contact_name")
    if not intake_form.emergency_contact_phone:
        missing_fields.append("emergency_contact_phone")

    if not intake_form.primary_concerns:
        missing_fields.append("primary_concerns")

    if not intake_form.consent_to_treatment:
        missing_fields.append("consent_to_treatment")
    if not intake_form.consent_to_telehealth:
        missing_fields.append("consent_to_telehealth")
    if not intake_form.hipaa_acknowledgment:
        missing_fields.append("hipaa_acknowledgment")

    if missing_fields:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required fields: {', '.join(missing_fields)}"
        )

    # CRITICAL: Check safety flags
    if intake_form.current_suicidal_ideation or intake_form.suicide_plan:
        # TODO: Trigger immediate crisis intervention workflow
        # For now, just flag for urgent review
        pass

    # Mark as completed
    intake_form.status = "COMPLETED"
    intake_form.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(intake_form)

    return intake_form


@router.get("/intake-form/{form_id}/completion-status")
def get_intake_form_status(
    form_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get completion status of intake form

    Returns percentage complete and missing required fields
    """
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=403, detail="Only patients can access intake forms")

    intake_form = db.query(PatientIntakeForm).filter(PatientIntakeForm.id == form_id).first()
    if not intake_form:
        raise HTTPException(status_code=404, detail="Intake form not found")

    if intake_form.patient_id != patient.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this form")

    # Calculate completion percentage
    required_fields = [
        'emergency_contact_name',
        'emergency_contact_phone',
        'primary_concerns',
        'consent_to_treatment',
        'consent_to_telehealth',
        'hipaa_acknowledgment',
    ]

    completed_required = sum(1 for field in required_fields if getattr(intake_form, field))
    required_percentage = (completed_required / len(required_fields)) * 100

    optional_fields = [
        'insurance_provider',
        'primary_care_physician',
        'current_medications',
        'previous_mental_health_treatment',
        'phq9_score',
        'gad7_score',
        'treatment_goals',
    ]

    completed_optional = sum(1 for field in optional_fields if getattr(intake_form, field))
    optional_percentage = (completed_optional / len(optional_fields)) * 100

    overall_percentage = (required_percentage * 0.7) + (optional_percentage * 0.3)

    missing_required = [field for field in required_fields if not getattr(intake_form, field)]

    return {
        "form_id": form_id,
        "status": intake_form.status,
        "completion_percentage": round(overall_percentage, 1),
        "required_fields_complete": completed_required == len(required_fields),
        "missing_required_fields": missing_required,
        "can_submit": len(missing_required) == 0,
    }
