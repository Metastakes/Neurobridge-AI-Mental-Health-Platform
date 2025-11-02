from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.db.session import get_db
from app.api.deps import get_current_user, get_current_provider
from app.models.user import User
from app.models.provider import Provider
from app.models.provider_application import ProviderApplication, ApplicationStatus
from app.schemas.provider_application import (
    ProviderApplicationCreate,
    ProviderApplicationUpdate,
    ProviderApplicationResponse,
)

router = APIRouter()


@router.post("/application", response_model=ProviderApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_provider_application(
    application_data: ProviderApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Start a new provider application (Step 1 of onboarding)
    """
    # Check if user already has an application
    existing = db.query(ProviderApplication).filter(
        ProviderApplication.user_id == current_user.id
    ).first()

    if existing:
        # Allow updating draft applications
        if existing.status == ApplicationStatus.DRAFT:
            return existing
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have an active application"
            )

    # Create new application
    application = ProviderApplication(
        user_id=current_user.id,
        status=ApplicationStatus.DRAFT,
        current_step=1,
        **application_data.dict(exclude_unset=True)
    )

    db.add(application)
    db.commit()
    db.refresh(application)

    return application


@router.get("/application", response_model=ProviderApplicationResponse)
def get_my_application(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's provider application"""
    application = db.query(ProviderApplication).filter(
        ProviderApplication.user_id == current_user.id
    ).first()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No application found. Please start a new application."
        )

    return application


@router.put("/application/{application_id}", response_model=ProviderApplicationResponse)
def update_provider_application(
    application_id: int,
    update_data: ProviderApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update provider application (any step)"""
    application = db.query(ProviderApplication).filter(
        ProviderApplication.id == application_id,
        ProviderApplication.user_id == current_user.id
    ).first()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    # Don't allow updates to approved/rejected applications
    if application.status in [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot update application with status: {application.status}"
        )

    # Update fields
    update_dict = update_data.dict(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(application, field, value)

    db.commit()
    db.refresh(application)

    return application


@router.post("/application/{application_id}/submit", response_model=ProviderApplicationResponse)
def submit_provider_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit completed application for review
    Validates all required fields are completed
    """
    application = db.query(ProviderApplication).filter(
        ProviderApplication.id == application_id,
        ProviderApplication.user_id == current_user.id
    ).first()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    if application.status != ApplicationStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application has already been submitted"
        )

    # Validate required fields
    required_fields = [
        'first_name', 'last_name', 'email', 'phone', 'date_of_birth',
        'npi_number', 'provider_type', 'practice_address_line1',
        'practice_city', 'practice_state', 'practice_zip'
    ]

    missing_fields = []
    for field in required_fields:
        if not getattr(application, field):
            missing_fields.append(field)

    if missing_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required fields: {', '.join(missing_fields)}"
        )

    # Check documents are uploaded
    if not application.documents_complete:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload all required documents before submitting"
        )

    # Check background check consent
    if not application.background_check_consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Background check consent is required"
        )

    # Update status
    application.status = ApplicationStatus.SUBMITTED
    application.submitted_at = datetime.utcnow()

    db.commit()
    db.refresh(application)

    # TODO: Trigger background check via Checkr/Sterling API
    # TODO: Send notification to admin for review

    return application


@router.get("/application/{application_id}/status")
def get_application_status(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get detailed application status"""
    application = db.query(ProviderApplication).filter(
        ProviderApplication.id == application_id,
        ProviderApplication.user_id == current_user.id
    ).first()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    # Get completion percentage
    total_fields = 15  # Number of required fields
    completed_fields = sum([
        1 for field in ['first_name', 'last_name', 'email', 'phone', 'date_of_birth',
                        'npi_number', 'provider_type', 'practice_address_line1',
                        'practice_city', 'practice_state', 'practice_zip',
                        'documents_complete', 'background_check_consent']
        if getattr(application, field)
    ])

    completion_percentage = int((completed_fields / total_fields) * 100)

    return {
        "application_id": application.id,
        "status": application.status,
        "current_step": application.current_step,
        "completion_percentage": completion_percentage,
        "submitted_at": application.submitted_at,
        "approved_at": application.approved_at,
        "caqh_verified": application.caqh_verified,
        "documents_complete": application.documents_complete,
        "background_check_status": application.background_check_status,
    }
