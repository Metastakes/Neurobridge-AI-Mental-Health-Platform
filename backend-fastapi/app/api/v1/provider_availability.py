from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, time

from app.db.session import get_db
from app.api.deps import get_current_user, get_current_provider
from app.models.user import User
from app.models.provider import Provider
from app.models.provider_availability import ProviderAvailability, ProviderTimeOff
from app.schemas.provider_availability import (
    ProviderAvailabilityCreate,
    ProviderAvailabilityResponse,
    ProviderTimeOffCreate,
    ProviderTimeOffResponse,
    AvailabilityBulkUpdate,
)

router = APIRouter()


@router.post("/availability", response_model=ProviderAvailabilityResponse, status_code=status.HTTP_201_CREATED)
def create_availability_slot(
    availability_data: ProviderAvailabilityCreate,
    db: Session = Depends(get_db),
    provider: Provider = Depends(get_current_provider),
):
    """
    Add availability slot to provider's schedule
    """
    # Validate times
    if availability_data.start_time >= availability_data.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start time must be before end time"
        )

    # Create availability slot
    availability = ProviderAvailability(
        provider_id=provider.id,
        **availability_data.dict()
    )

    db.add(availability)
    db.commit()
    db.refresh(availability)

    return availability


@router.get("/availability", response_model=List[ProviderAvailabilityResponse])
def get_my_availability(
    db: Session = Depends(get_db),
    provider: Provider = Depends(get_current_provider),
):
    """Get provider's current availability schedule"""
    availability = db.query(ProviderAvailability).filter(
        ProviderAvailability.provider_id == provider.id,
        ProviderAvailability.is_available == True
    ).order_by(ProviderAvailability.day_of_week, ProviderAvailability.start_time).all()

    return availability


@router.post("/availability/bulk", status_code=status.HTTP_200_OK)
def set_weekly_availability(
    bulk_data: AvailabilityBulkUpdate,
    db: Session = Depends(get_db),
    provider: Provider = Depends(get_current_provider),
):
    """
    Set entire weekly availability schedule
    Replaces existing schedule
    """
    # Delete existing availability
    db.query(ProviderAvailability).filter(
        ProviderAvailability.provider_id == provider.id
    ).delete()

    # Create new availability slots
    new_slots = []
    for slot_data in bulk_data.availability_slots:
        slot = ProviderAvailability(
            provider_id=provider.id,
            **slot_data.dict()
        )
        new_slots.append(slot)
        db.add(slot)

    db.commit()

    return {
        "message": f"Successfully updated {len(new_slots)} availability slots",
        "slots_created": len(new_slots)
    }


@router.delete("/availability/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_availability_slot(
    slot_id: int,
    db: Session = Depends(get_db),
    provider: Provider = Depends(get_current_provider),
):
    """Delete specific availability slot"""
    slot = db.query(ProviderAvailability).filter(
        ProviderAvailability.id == slot_id,
        ProviderAvailability.provider_id == provider.id
    ).first()

    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Availability slot not found"
        )

    db.delete(slot)
    db.commit()

    return None


# Time Off Management

@router.post("/time-off", response_model=ProviderTimeOffResponse, status_code=status.HTTP_201_CREATED)
def create_time_off(
    time_off_data: ProviderTimeOffCreate,
    db: Session = Depends(get_db),
    provider: Provider = Depends(get_current_provider),
):
    """Block dates for time off"""
    if time_off_data.start_date >= time_off_data.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date must be before end date"
        )

    time_off = ProviderTimeOff(
        provider_id=provider.id,
        **time_off_data.dict()
    )

    db.add(time_off)
    db.commit()
    db.refresh(time_off)

    return time_off


@router.get("/time-off", response_model=List[ProviderTimeOffResponse])
def get_my_time_off(
    upcoming_only: bool = True,
    db: Session = Depends(get_db),
    provider: Provider = Depends(get_current_provider),
):
    """Get provider's time off dates"""
    query = db.query(ProviderTimeOff).filter(
        ProviderTimeOff.provider_id == provider.id
    )

    if upcoming_only:
        query = query.filter(ProviderTimeOff.end_date >= datetime.utcnow())

    time_off = query.order_by(ProviderTimeOff.start_date).all()

    return time_off


@router.delete("/time-off/{time_off_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_time_off(
    time_off_id: int,
    db: Session = Depends(get_db),
    provider: Provider = Depends(get_current_provider),
):
    """Cancel time off"""
    time_off = db.query(ProviderTimeOff).filter(
        ProviderTimeOff.id == time_off_id,
        ProviderTimeOff.provider_id == provider.id
    ).first()

    if not time_off:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time off not found"
        )

    db.delete(time_off)
    db.commit()

    return None
