from pydantic import BaseModel, field_validator
from datetime import datetime, time
from typing import Optional, List


class ProviderAvailabilityCreate(BaseModel):
    """Create availability slot"""
    day_of_week: int  # 0=Monday, 6=Sunday
    start_time: time
    end_time: time
    timezone: str = "America/New_York"
    is_recurring: bool = True
    allowed_appointment_types: Optional[List[str]] = None

    @field_validator('day_of_week')
    def validate_day(cls, v):
        if v < 0 or v > 6:
            raise ValueError('Day of week must be 0-6 (Monday-Sunday)')
        return v


class ProviderAvailabilityResponse(BaseModel):
    """Availability slot response"""
    id: int
    provider_id: int
    day_of_week: int
    start_time: time
    end_time: time
    timezone: str
    is_available: bool
    is_recurring: bool
    override_date: Optional[datetime]
    allowed_appointment_types: Optional[List[str]]

    class Config:
        from_attributes = True


class AvailabilityBulkUpdate(BaseModel):
    """Bulk update weekly availability"""
    availability_slots: List[ProviderAvailabilityCreate]


class ProviderTimeOffCreate(BaseModel):
    """Create time off period"""
    start_date: datetime
    end_date: datetime
    reason: Optional[str] = None
    is_all_day: bool = True


class ProviderTimeOffResponse(BaseModel):
    """Time off response"""
    id: int
    provider_id: int
    start_date: datetime
    end_date: datetime
    reason: Optional[str]
    is_all_day: bool
    created_at: datetime

    class Config:
        from_attributes = True
