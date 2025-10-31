from pydantic import BaseModel, Field
from typing import Optional, List
from decimal import Decimal


class ProviderSearchFilters(BaseModel):
    """Filters for provider search"""
    # Specialty & Conditions
    specialty_ids: Optional[List[int]] = None
    conditions: Optional[List[str]] = None
    treatment_modalities: Optional[List[str]] = None

    # Demographics & Availability
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    languages: Optional[List[str]] = None
    accepts_new_patients: Optional[bool] = True

    # Insurance
    insurance_plan_id: Optional[int] = None
    accepts_medicare: Optional[bool] = None
    accepts_medicaid: Optional[bool] = None
    accepts_self_pay: Optional[bool] = None

    # Location
    state: Optional[str] = None

    # Availability
    earliest_availability_days: Optional[int] = None  # Within next X days

    # Sorting
    sort_by: Optional[str] = "rating"  # rating, experience, availability

    # Pagination
    skip: int = Field(0, ge=0)
    limit: int = Field(20, ge=1, le=100)


class ProviderSearchResult(BaseModel):
    """Single provider search result"""
    provider_id: int
    user_id: int
    name: str
    provider_type: str
    specialty: Optional[str] = None

    # Profile details
    years_experience: Optional[int] = None
    languages_spoken: Optional[List[str]] = None
    bio: Optional[str] = None
    profile_photo_url: Optional[str] = None

    # Availability
    accepts_new_patients: bool
    earliest_availability_date: Optional[str] = None
    session_duration_minutes: int

    # Insurance
    accepts_medicare: bool
    accepts_medicaid: bool
    accepts_self_pay: bool
    insurance_plans_count: int

    # Rating
    rating_average: Optional[Decimal] = None
    rating_count: int

    # Matching metadata
    match_score: Optional[float] = None  # Computed relevance score

    class Config:
        from_attributes = True


class ProviderSearchResponse(BaseModel):
    """Paginated search results"""
    results: List[ProviderSearchResult]
    total_count: int
    page_size: int
    page_number: int
    total_pages: int


class ProviderDetailResponse(BaseModel):
    """Detailed provider profile"""
    provider_id: int
    user_id: int
    name: str
    email: str
    phone: Optional[str] = None
    provider_type: str

    # Professional details
    specialty: Optional[str] = None
    specialties: Optional[List[str]] = None
    years_experience: Optional[int] = None
    languages_spoken: Optional[List[str]] = None
    education: Optional[List[dict]] = None
    certifications: Optional[List[str]] = None

    # Bio & Media
    bio: Optional[str] = None
    bio_long: Optional[str] = None
    profile_photo_url: Optional[str] = None
    video_intro_url: Optional[str] = None

    # Practice details
    license_number: Optional[str] = None
    state: Optional[str] = None
    conditions_treated: Optional[List[str]] = None
    treatment_modalities: Optional[List[str]] = None

    # Age range
    min_age: Optional[int] = None
    max_age: Optional[int] = None

    # Availability
    accepts_new_patients: bool
    earliest_availability_date: Optional[str] = None
    session_duration_minutes: int
    average_response_time_hours: Optional[int] = None

    # Insurance
    accepts_medicare: bool
    accepts_medicaid: bool
    accepts_self_pay: bool
    insurance_plan_names: Optional[List[str]] = None

    # Ratings
    rating_average: Optional[Decimal] = None
    rating_count: int

    # Billing
    hourly_rate_cents: int

    # Verification
    is_verified: bool

    class Config:
        from_attributes = True
