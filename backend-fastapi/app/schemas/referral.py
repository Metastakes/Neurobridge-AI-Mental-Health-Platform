from pydantic import BaseModel, field_validator
from datetime import datetime
from app.models.enums import ReferralStatus, ProviderType


class ReferralCreateRequest(BaseModel):
    """Create referral request"""

    patient_id: int
    to_provider_type: ProviderType
    reason: str
    clinical_notes: str | None = None

    @field_validator("reason")
    def validate_reason(cls, v):
        if len(v) < 10:
            raise ValueError("Reason must be at least 10 characters")
        return v


class ReferralResponse(BaseModel):
    """Referral details"""

    id: int
    patient_id: int
    referring_provider_id: int
    referred_to_provider_id: int | None
    reason: str
    status: ReferralStatus
    from_provider_type: str
    to_provider_type: str
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True
