from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
from enum import Enum as PyEnum


class VideoSessionStatus(str, PyEnum):
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"


class VideoSessionPlatform(str, PyEnum):
    GOOGLE_MEET = "GOOGLE_MEET"
    ZOOM = "ZOOM"  # Future support
    CUSTOM = "CUSTOM"  # Future custom solution


class VideoSession(Base):
    """
    Telehealth video session management
    Links to appointments and manages Google Meet integration
    """
    __tablename__ = "video_sessions"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=False, unique=True, index=True)

    # Video platform details
    platform = Column(Enum(VideoSessionPlatform), nullable=False, default=VideoSessionPlatform.GOOGLE_MEET)
    meeting_url = Column(String(500), nullable=False)
    meeting_id = Column(String(255), nullable=True)  # Google Meet ID or Zoom ID
    meeting_password = Column(String(100), nullable=True)

    # Google Meet specific
    google_event_id = Column(String(255), nullable=True, index=True)  # Calendar event ID
    google_meet_code = Column(String(50), nullable=True)  # meet.google.com/{code}

    # Session status
    status = Column(Enum(VideoSessionStatus), nullable=False, default=VideoSessionStatus.SCHEDULED, index=True)

    # Session timing
    scheduled_start_time = Column(DateTime, nullable=False, index=True)
    scheduled_end_time = Column(DateTime, nullable=False)
    actual_start_time = Column(DateTime, nullable=True)
    actual_end_time = Column(DateTime, nullable=True)

    # Participant tracking
    provider_joined_at = Column(DateTime, nullable=True)
    patient_joined_at = Column(DateTime, nullable=True)
    provider_left_at = Column(DateTime, nullable=True)
    patient_left_at = Column(DateTime, nullable=True)

    # Session recording (if enabled)
    recording_enabled = Column(Boolean, nullable=False, default=False)
    recording_url = Column(String(500), nullable=True)
    recording_consent = Column(Boolean, nullable=False, default=False)

    # Technical details
    connection_quality = Column(String(50), nullable=True)  # EXCELLENT, GOOD, FAIR, POOR
    technical_issues = Column(Text, nullable=True)  # Log any technical problems

    # Reminders sent
    reminder_24h_sent = Column(Boolean, nullable=False, default=False)
    reminder_1h_sent = Column(Boolean, nullable=False, default=False)

    # Metadata
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    appointment = relationship("Appointment", back_populates="video_session")

    def __repr__(self):
        return f"<VideoSession(id={self.id}, appointment_id={self.appointment_id}, status={self.status})>"


class SessionNote(Base):
    """
    Real-time session notes taken during video call
    Provider can take notes during the session
    """
    __tablename__ = "session_notes"

    id = Column(Integer, primary_key=True, index=True)
    video_session_id = Column(Integer, ForeignKey("video_sessions.id"), nullable=False, index=True)
    provider_id = Column(Integer, ForeignKey("providers.id"), nullable=False, index=True)

    # Note content
    note_content = Column(Text, nullable=False)
    note_timestamp = Column(DateTime, nullable=False, server_default=func.now())

    # Note metadata
    is_private = Column(Boolean, nullable=False, default=True)  # Private to provider or shared with patient
    note_type = Column(String(50), nullable=True)  # OBSERVATION, INTERVENTION, PLAN, etc.

    created_at = Column(DateTime, nullable=False, server_default=func.now())

    # Relationships
    video_session = relationship("VideoSession", backref="notes")
    provider = relationship("Provider")

    def __repr__(self):
        return f"<SessionNote(id={self.id}, session_id={self.video_session_id})>"


class WaitingRoom(Base):
    """
    Virtual waiting room for patients before session starts
    Tracks who's waiting and when they arrived
    """
    __tablename__ = "waiting_room"

    id = Column(Integer, primary_key=True, index=True)
    video_session_id = Column(Integer, ForeignKey("video_sessions.id"), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)

    # Waiting room status
    arrived_at = Column(DateTime, nullable=False, server_default=func.now())
    admitted_at = Column(DateTime, nullable=True)
    left_at = Column(DateTime, nullable=True)

    # Patient status
    is_waiting = Column(Boolean, nullable=False, default=True, index=True)
    has_technical_issue = Column(Boolean, nullable=False, default=False)
    issue_description = Column(Text, nullable=True)

    # Notifications
    provider_notified = Column(Boolean, nullable=False, default=False)
    provider_notified_at = Column(DateTime, nullable=True)

    # Relationships
    video_session = relationship("VideoSession", backref="waiting_room_entries")
    patient = relationship("Patient")

    def __repr__(self):
        return f"<WaitingRoom(id={self.id}, session_id={self.video_session_id}, waiting={self.is_waiting})>"
