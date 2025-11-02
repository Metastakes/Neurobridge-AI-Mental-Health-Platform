from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import Optional, List
from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.provider import Provider
from app.models.provider_profile import ProviderProfile
from app.models.specialty import Specialty, InsurancePlan
from app.schemas.provider_search import (
    ProviderSearchFilters,
    ProviderSearchResult,
    ProviderSearchResponse,
    ProviderDetailResponse,
)
import math

router = APIRouter()


@router.post("/search", response_model=ProviderSearchResponse)
def search_providers(
    filters: ProviderSearchFilters,
    db: Session = Depends(get_db),
):
    """
    Search for providers with advanced filtering

    Public endpoint - no authentication required for provider search
    """
    query = (
        db.query(
            Provider,
            ProviderProfile,
            User,
        )
        .join(ProviderProfile, Provider.id == ProviderProfile.provider_id)
        .join(User, Provider.user_id == User.id)
        .filter(User.is_active == True)
    )

    # Apply filters
    if filters.specialty_ids:
        # Match any of the selected specialties using overlap operator
        # Provider must have at least one of the requested specialties
        from sqlalchemy.dialects.postgresql import ARRAY
        query = query.filter(
            ProviderProfile.specialty_ids.op('&&')(filters.specialty_ids)
        )

    if filters.accepts_new_patients is not None:
        query = query.filter(ProviderProfile.accepts_new_patients == filters.accepts_new_patients)

    if filters.insurance_plan_id:
        # Check if insurance plan is in the provider's accepted plans
        query = query.filter(
            ProviderProfile.insurance_plan_ids.contains([filters.insurance_plan_id])
        )

    if filters.accepts_medicare is not None:
        query = query.filter(ProviderProfile.accepts_medicare == filters.accepts_medicare)

    if filters.accepts_medicaid is not None:
        query = query.filter(ProviderProfile.accepts_medicaid == filters.accepts_medicaid)

    if filters.accepts_self_pay is not None:
        query = query.filter(ProviderProfile.accepts_self_pay == filters.accepts_self_pay)

    if filters.state:
        query = query.filter(Provider.state == filters.state)

    if filters.languages:
        # Match any of the requested languages
        query = query.filter(
            ProviderProfile.languages_spoken.op('&&')(filters.languages)
        )

    # Age range filtering
    if filters.min_age is not None:
        query = query.filter(
            or_(
                ProviderProfile.min_age.is_(None),
                ProviderProfile.min_age <= filters.min_age
            )
        )

    if filters.max_age is not None:
        query = query.filter(
            or_(
                ProviderProfile.max_age.is_(None),
                ProviderProfile.max_age >= filters.max_age
            )
        )

    # Get total count before pagination
    total_count = query.count()

    # Sorting
    if filters.sort_by == "rating":
        query = query.order_by(ProviderProfile.rating_average.desc().nullslast())
    elif filters.sort_by == "experience":
        query = query.order_by(ProviderProfile.years_experience.desc().nullslast())
    elif filters.sort_by == "availability":
        query = query.order_by(ProviderProfile.earliest_availability_date.asc().nullslast())
    else:
        # Default: featured first, then by rating
        query = query.order_by(
            ProviderProfile.is_featured.desc(),
            ProviderProfile.rating_average.desc().nullslast()
        )

    # Pagination
    query = query.offset(filters.skip).limit(filters.limit)

    results = query.all()

    # Build response
    search_results = []
    for provider, profile, user in results:
        # Count insurance plans
        insurance_count = len(profile.insurance_plan_ids) if profile.insurance_plan_ids else 0
        if profile.accepts_medicare:
            insurance_count += 1
        if profile.accepts_medicaid:
            insurance_count += 1

        search_results.append(
            ProviderSearchResult(
                provider_id=provider.id,
                user_id=user.id,
                name=user.name,
                provider_type=provider.provider_type.value,
                specialty=provider.specialty,
                years_experience=profile.years_experience,
                languages_spoken=profile.languages_spoken,
                bio=provider.bio,
                profile_photo_url=profile.profile_photo_url,
                accepts_new_patients=profile.accepts_new_patients,
                earliest_availability_date=profile.earliest_availability_date,
                session_duration_minutes=profile.session_duration_minutes,
                accepts_medicare=profile.accepts_medicare,
                accepts_medicaid=profile.accepts_medicaid,
                accepts_self_pay=profile.accepts_self_pay,
                insurance_plans_count=insurance_count,
                rating_average=profile.rating_average,
                rating_count=profile.rating_count,
            )
        )

    total_pages = math.ceil(total_count / filters.limit) if filters.limit > 0 else 0
    page_number = (filters.skip // filters.limit) + 1 if filters.limit > 0 else 1

    return ProviderSearchResponse(
        results=search_results,
        total_count=total_count,
        page_size=filters.limit,
        page_number=page_number,
        total_pages=total_pages,
    )


@router.get("/providers/{provider_id}", response_model=ProviderDetailResponse)
def get_provider_detail(
    provider_id: int,
    db: Session = Depends(get_db),
):
    """
    Get detailed provider profile

    Public endpoint - no authentication required
    """
    result = (
        db.query(Provider, ProviderProfile, User)
        .join(ProviderProfile, Provider.id == ProviderProfile.provider_id)
        .join(User, Provider.user_id == User.id)
        .filter(Provider.id == provider_id)
        .filter(User.is_active == True)
        .first()
    )

    if not result:
        raise HTTPException(status_code=404, detail="Provider not found")

    provider, profile, user = result

    # Get specialty names
    specialty_names = []
    if profile.specialty_ids:
        specialties = db.query(Specialty).filter(Specialty.id.in_(profile.specialty_ids)).all()
        specialty_names = [s.name for s in specialties]

    # Get insurance plan names
    insurance_names = []
    if profile.insurance_plan_ids:
        plans = db.query(InsurancePlan).filter(InsurancePlan.id.in_(profile.insurance_plan_ids)).all()
        insurance_names = [p.name for p in plans]
    if profile.accepts_medicare:
        insurance_names.append("Medicare")
    if profile.accepts_medicaid:
        insurance_names.append("Medicaid")

    return ProviderDetailResponse(
        provider_id=provider.id,
        user_id=user.id,
        name=user.name,
        email=user.email,
        phone=user.phone,
        provider_type=provider.provider_type.value,
        specialty=provider.specialty,
        specialties=specialty_names,
        years_experience=profile.years_experience,
        languages_spoken=profile.languages_spoken,
        education=profile.education,
        certifications=profile.certifications,
        bio=provider.bio,
        bio_long=profile.bio_long,
        profile_photo_url=profile.profile_photo_url,
        video_intro_url=profile.video_intro_url,
        license_number=provider.license_number,
        state=provider.state,
        conditions_treated=profile.conditions_treated,
        treatment_modalities=profile.treatment_modalities,
        min_age=profile.min_age,
        max_age=profile.max_age,
        accepts_new_patients=profile.accepts_new_patients,
        earliest_availability_date=profile.earliest_availability_date,
        session_duration_minutes=profile.session_duration_minutes,
        average_response_time_hours=profile.average_response_time_hours,
        accepts_medicare=profile.accepts_medicare,
        accepts_medicaid=profile.accepts_medicaid,
        accepts_self_pay=profile.accepts_self_pay,
        insurance_plan_names=insurance_names,
        rating_average=profile.rating_average,
        rating_count=profile.rating_count,
        hourly_rate_cents=provider.hourly_rate_cents,
        is_verified=profile.is_verified,
    )


@router.get("/specialties-list", response_model=List[dict])
def list_specialties_for_search(db: Session = Depends(get_db)):
    """
    Get all active specialties for search filters

    Public endpoint
    """
    specialties = db.query(Specialty).filter(Specialty.is_active == True).order_by(Specialty.display_order).all()

    return [
        {
            "id": s.id,
            "name": s.name,
            "category": s.category,
            "description": s.description,
        }
        for s in specialties
    ]


@router.get("/insurance-plans-list", response_model=List[dict])
def list_insurance_plans_for_search(
    state: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Get all active insurance plans for search filters

    Public endpoint
    """
    query = db.query(InsurancePlan).filter(InsurancePlan.is_active == True)

    if state:
        # Filter to plans that cover the specified state
        query = query.filter(
            or_(
                InsurancePlan.state_coverage.contains("All States"),
                InsurancePlan.state_coverage.contains(state)
            )
        )

    plans = query.order_by(InsurancePlan.display_order).all()

    return [
        {
            "id": p.id,
            "name": p.name,
            "plan_type": p.plan_type,
            "payer_id": p.payer_id,
        }
        for p in plans
    ]
