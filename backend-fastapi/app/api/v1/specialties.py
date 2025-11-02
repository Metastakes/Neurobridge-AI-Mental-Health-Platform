from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.specialty import Specialty, InsurancePlan
from app.schemas.specialty import SpecialtyResponse, InsurancePlanResponse

router = APIRouter()


@router.get("/specialties", response_model=List[SpecialtyResponse])
def get_all_specialties(
    category: str = None,
    active_only: bool = True,
    db: Session = Depends(get_db),
):
    """
    Get list of all provider specialties
    Used in provider registration and patient search
    """
    query = db.query(Specialty)

    if active_only:
        query = query.filter(Specialty.is_active == True)

    if category:
        query = query.filter(Specialty.category == category)

    specialties = query.order_by(Specialty.display_order, Specialty.name).all()

    return specialties


@router.get("/insurance-plans", response_model=List[InsurancePlanResponse])
def get_all_insurance_plans(
    state: str = None,
    active_only: bool = True,
    db: Session = Depends(get_db),
):
    """
    Get list of all insurance plans
    Used in provider registration and patient insurance selection
    """
    query = db.query(InsurancePlan)

    if active_only:
        query = query.filter(InsurancePlan.is_active == True)

    if state:
        # Filter plans that cover this state
        query = query.filter(InsurancePlan.state_coverage.like(f"%{state}%"))

    plans = query.order_by(InsurancePlan.display_order, InsurancePlan.name).all()

    return plans


@router.get("/insurance-plans/{plan_id}", response_model=InsurancePlanResponse)
def get_insurance_plan(
    plan_id: int,
    db: Session = Depends(get_db),
):
    """Get specific insurance plan details"""
    plan = db.query(InsurancePlan).filter(InsurancePlan.id == plan_id).first()

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insurance plan not found"
        )

    return plan
