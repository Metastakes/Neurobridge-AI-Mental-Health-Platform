from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from typing import Optional, List
from app.models.provider_application import ApplicationStatus


class ProviderApplicationCreate(BaseModel):
    """Initial provider application data (Step 1)"""
    first_name: str
    last_name: str
    email: EmailStr
    phone: str


class ProviderApplicationUpdate(BaseModel):
    """Update any step of the application"""
    # Step 1: Basic info
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    ssn_last_four: Optional[str] = None

    # Step 2: Professional info
    npi_number: Optional[str] = None
    dea_number: Optional[str] = None
    provider_type: Optional[str] = None
    specialties: Optional[List[int]] = None
    years_experience: Optional[int] = None

    # Step 3: Practice address
    practice_name: Optional[str] = None
    practice_address_line1: Optional[str] = None
    practice_address_line2: Optional[str] = None
    practice_city: Optional[str] = None
    practice_state: Optional[str] = None
    practice_zip: Optional[str] = None
    practice_phone: Optional[str] = None

    # Step 4: Licensure (handled separately)

    # Step 5: Insurance & credentialing
    caqh_provider_id: Optional[str] = None
    accepts_insurance: Optional[bool] = None
    insurance_panels: Optional[List[int]] = None

    # Step 6: Consent
    background_check_consent: Optional[bool] = None

    # Progress tracking
    current_step: Optional[int] = None
    documents_complete: Optional[bool] = None


class ProviderApplicationResponse(BaseModel):
    """Provider application response"""
    id: int
    user_id: int
    status: ApplicationStatus
    current_step: int

    # All application fields
    first_name: Optional[str]
    last_name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    date_of_birth: Optional[datetime]

    npi_number: Optional[str]
    dea_number: Optional[str]
    provider_type: Optional[str]
    specialties: Optional[List[int]]
    years_experience: Optional[int]

    practice_name: Optional[str]
    practice_address_line1: Optional[str]
    practice_city: Optional[str]
    practice_state: Optional[str]
    practice_zip: Optional[str]

    caqh_provider_id: Optional[str]
    caqh_verified: bool
    accepts_insurance: Optional[bool]
    insurance_panels: Optional[List[int]]

    documents_complete: bool
    background_check_consent: bool
    background_check_status: Optional[str]

    created_at: datetime
    submitted_at: Optional[datetime]
    approved_at: Optional[datetime]

    class Config:
        from_attributes = True
