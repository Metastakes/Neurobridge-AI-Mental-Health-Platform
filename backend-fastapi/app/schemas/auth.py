import re
from pydantic import BaseModel, EmailStr, field_validator
from app.models.enums import ProviderType


class RegisterPatientRequest(BaseModel):
    """Patient registration schema with validation"""

    email: EmailStr
    password: str
    name: str
    phone: str | None = None

    # FIX #5 APPLIED: Strong password validation
    @field_validator("password")
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError("Password must contain at least one special character")
        return v

    # FIX #6 APPLIED: Phone number normalization to E.164 format
    @field_validator("phone")
    def validate_phone(cls, v):
        if v is None:
            return v
        # Remove all non-digit characters
        digits = re.sub(r"\D", "", v)
        if len(digits) != 10:
            raise ValueError("Phone number must be 10 digits")
        # Normalize to E.164 format (+1XXXXXXXXXX)
        return f"+1{digits}"


class RegisterProviderRequest(BaseModel):
    """Provider registration schema"""

    email: EmailStr
    password: str
    name: str
    phone: str | None = None
    provider_type: ProviderType
    specialty: str | None = None
    license_number: str | None = None
    state: str | None = None
    hourly_rate_cents: int = 15000  # Default $150/hour

    # FIX #5 APPLIED: Password validation
    @field_validator("password")
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError("Password must contain at least one special character")
        return v

    # FIX #6 APPLIED: Phone validation
    @field_validator("phone")
    def validate_phone(cls, v):
        if v is None:
            return v
        digits = re.sub(r"\D", "", v)
        if len(digits) != 10:
            raise ValueError("Phone number must be 10 digits")
        return f"+1{digits}"


class LoginRequest(BaseModel):
    """Login request schema"""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT token response"""

    access_token: str
    token_type: str = "bearer"
    user_id: int
    role: str
