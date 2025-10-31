from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class VideoSessionCreate(BaseModel):
    """Create a new video session"""
    appointment_id: int
    platform: str = "GOOGLE_MEET"
    recording_enabled: bool = False
    recording_consent: bool = False


class VideoSessionUpdate(BaseModel):
    """Update video session"""
    status: Optional[str] = None
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    provider_joined_at: Optional[datetime] = None
    patient_joined_at: Optional[datetime] = None
    provider_left_at: Optional[datetime] = None
    patient_left_at: Optional[datetime] = None
    connection_quality: Optional[str] = None
    technical_issues: Optional[str] = None


class VideoSessionResponse(BaseModel):
    """Video session details"""
    id: int
    appointment_id: int
    platform: str
    meeting_url: str
    meeting_id: Optional[str] = None
    meeting_password: Optional[str] = None
    google_meet_code: Optional[str] = None
    status: str
    scheduled_start_time: datetime
    scheduled_end_time: datetime
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    provider_joined_at: Optional[datetime] = None
    patient_joined_at: Optional[datetime] = None
    recording_enabled: bool
    recording_consent: bool
    recording_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SessionNoteCreate(BaseModel):
    """Create session note"""
    note_content: str
    note_type: Optional[str] = None
    is_private: bool = True


class SessionNoteResponse(BaseModel):
    """Session note response"""
    id: int
    video_session_id: int
    provider_id: int
    note_content: str
    note_timestamp: datetime
    note_type: Optional[str] = None
    is_private: bool

    class Config:
        from_attributes = True


class WaitingRoomEntry(BaseModel):
    """Patient in waiting room"""
    id: int
    video_session_id: int
    patient_id: int
    arrived_at: datetime
    admitted_at: Optional[datetime] = None
    is_waiting: bool
    has_technical_issue: bool
    issue_description: Optional[str] = None

    class Config:
        from_attributes = True


class WaitingRoomUpdate(BaseModel):
    """Update waiting room entry"""
    is_waiting: Optional[bool] = None
    admitted_at: Optional[datetime] = None
    has_technical_issue: Optional[bool] = None
    issue_description: Optional[str] = None


class SessionJoinRequest(BaseModel):
    """Request to join video session"""
    video_session_id: int


class SessionJoinResponse(BaseModel):
    """Response with join details"""
    video_session_id: int
    meeting_url: str
    meeting_id: Optional[str] = None
    meeting_password: Optional[str] = None
    status: str
    can_join: bool
    message: str
    waiting_room_required: bool = False


class SessionStatusUpdate(BaseModel):
    """Update session status"""
    status: str  # IN_PROGRESS, COMPLETED, CANCELLED
    connection_quality: Optional[str] = None
    technical_issues: Optional[str] = None
