from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.provider import Provider
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.video_session import VideoSession, SessionNote, WaitingRoom, VideoSessionStatus
from app.schemas.video_session import (
    VideoSessionResponse,
    SessionJoinResponse,
    SessionStatusUpdate,
    SessionNoteCreate,
    SessionNoteResponse,
    WaitingRoomEntry,
)
from typing import List

router = APIRouter()


@router.get("/appointment/{appointment_id}", response_model=VideoSessionResponse)
def get_video_session_for_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get video session details for an appointment

    Accessible by both provider and patient
    """
    # Verify appointment exists and user has access
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Check if user is provider or patient for this appointment
    provider = db.query(Provider).filter(Provider.user_id == current_user.id).first()
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()

    is_provider_owner = provider and appointment.provider_id == provider.id
    is_patient_owner = patient and appointment.patient_id == patient.id

    if not (is_provider_owner or is_patient_owner):
        raise HTTPException(status_code=403, detail="Not authorized to access this video session")

    # Get video session
    video_session = db.query(VideoSession).filter(
        VideoSession.appointment_id == appointment_id
    ).first()

    if not video_session:
        raise HTTPException(status_code=404, detail="Video session not found for this appointment")

    return video_session


@router.post("/join/{video_session_id}", response_model=SessionJoinResponse)
def join_video_session(
    video_session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Join a video session

    - Providers can join anytime
    - Patients join waiting room first
    """
    video_session = db.query(VideoSession).filter(VideoSession.id == video_session_id).first()
    if not video_session:
        raise HTTPException(status_code=404, detail="Video session not found")

    # Get appointment
    appointment = db.query(Appointment).filter(
        Appointment.id == video_session.appointment_id
    ).first()

    # Check if user is provider or patient
    provider = db.query(Provider).filter(Provider.user_id == current_user.id).first()
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()

    is_provider = provider and appointment.provider_id == provider.id
    is_patient = patient and appointment.patient_id == patient.id

    if not (is_provider or is_patient):
        raise HTTPException(status_code=403, detail="Not authorized to join this session")

    # Check if session is accessible
    now = datetime.utcnow()

    # Providers can join 15 minutes early, patients 5 minutes early
    if is_provider:
        can_join_from = video_session.scheduled_start_time.replace(tzinfo=None) - timedelta(minutes=15)
    else:
        can_join_from = video_session.scheduled_start_time.replace(tzinfo=None) - timedelta(minutes=5)

    if now < can_join_from:
        minutes_until = int((can_join_from - now).total_seconds() / 60)
        return SessionJoinResponse(
            video_session_id=video_session.id,
            meeting_url=video_session.meeting_url,
            status=video_session.status.value,
            can_join=False,
            message=f"Session opens in {minutes_until} minutes",
            waiting_room_required=False,
        )

    # Update join timestamps
    if is_provider and not video_session.provider_joined_at:
        video_session.provider_joined_at = now
        video_session.status = VideoSessionStatus.IN_PROGRESS
    elif is_patient and not video_session.patient_joined_at:
        video_session.patient_joined_at = now

        # Add to waiting room if provider hasn't joined yet
        if not video_session.provider_joined_at:
            waiting_entry = WaitingRoom(
                video_session_id=video_session.id,
                patient_id=patient.id,
                is_waiting=True,
            )
            db.add(waiting_entry)

    db.commit()

    return SessionJoinResponse(
        video_session_id=video_session.id,
        meeting_url=video_session.meeting_url,
        meeting_id=video_session.meeting_id,
        meeting_password=video_session.meeting_password,
        status=video_session.status.value,
        can_join=True,
        message="Ready to join",
        waiting_room_required=is_patient and not video_session.provider_joined_at,
    )


@router.post("/{video_session_id}/status")
def update_session_status(
    video_session_id: int,
    status_update: SessionStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update video session status

    Only providers can update status
    """
    video_session = db.query(VideoSession).filter(VideoSession.id == video_session_id).first()
    if not video_session:
        raise HTTPException(status_code=404, detail="Video session not found")

    # Verify user is the provider
    provider = db.query(Provider).filter(Provider.user_id == current_user.id).first()
    appointment = db.query(Appointment).filter(
        Appointment.id == video_session.appointment_id
    ).first()

    if not provider or appointment.provider_id != provider.id:
        raise HTTPException(status_code=403, detail="Only the provider can update session status")

    # Update status
    if status_update.status:
        video_session.status = VideoSessionStatus(status_update.status)

    if status_update.connection_quality:
        video_session.connection_quality = status_update.connection_quality

    if status_update.technical_issues:
        video_session.technical_issues = status_update.technical_issues

    # If completing session, set end time
    if status_update.status == "COMPLETED" and not video_session.actual_end_time:
        video_session.actual_end_time = datetime.utcnow()

    db.commit()

    return {"message": "Session status updated", "status": video_session.status.value}


@router.post("/{video_session_id}/notes", response_model=SessionNoteResponse)
def create_session_note(
    video_session_id: int,
    note_data: SessionNoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a session note during video call

    Only providers can create notes
    """
    video_session = db.query(VideoSession).filter(VideoSession.id == video_session_id).first()
    if not video_session:
        raise HTTPException(status_code=404, detail="Video session not found")

    # Verify user is the provider
    provider = db.query(Provider).filter(Provider.user_id == current_user.id).first()
    if not provider:
        raise HTTPException(status_code=403, detail="Only providers can create session notes")

    appointment = db.query(Appointment).filter(
        Appointment.id == video_session.appointment_id
    ).first()

    if appointment.provider_id != provider.id:
        raise HTTPException(status_code=403, detail="Not authorized to add notes to this session")

    # Create note
    note = SessionNote(
        video_session_id=video_session.id,
        provider_id=provider.id,
        note_content=note_data.note_content,
        note_type=note_data.note_type,
        is_private=note_data.is_private,
    )

    db.add(note)
    db.commit()
    db.refresh(note)

    return note


@router.get("/{video_session_id}/notes", response_model=List[SessionNoteResponse])
def get_session_notes(
    video_session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get all notes for a session

    Providers see all notes, patients see only non-private notes
    """
    video_session = db.query(VideoSession).filter(VideoSession.id == video_session_id).first()
    if not video_session:
        raise HTTPException(status_code=404, detail="Video session not found")

    # Check authorization
    provider = db.query(Provider).filter(Provider.user_id == current_user.id).first()
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()

    appointment = db.query(Appointment).filter(
        Appointment.id == video_session.appointment_id
    ).first()

    is_provider = provider and appointment.provider_id == provider.id
    is_patient = patient and appointment.patient_id == patient.id

    if not (is_provider or is_patient):
        raise HTTPException(status_code=403, detail="Not authorized to view session notes")

    # Get notes
    query = db.query(SessionNote).filter(SessionNote.video_session_id == video_session_id)

    # Patients only see non-private notes
    if is_patient:
        query = query.filter(SessionNote.is_private == False)

    notes = query.order_by(SessionNote.note_timestamp).all()

    return notes


@router.get("/waiting-room/{video_session_id}", response_model=List[WaitingRoomEntry])
def get_waiting_room(
    video_session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get patients in waiting room

    Only providers can access waiting room
    """
    video_session = db.query(VideoSession).filter(VideoSession.id == video_session_id).first()
    if not video_session:
        raise HTTPException(status_code=404, detail="Video session not found")

    # Verify user is the provider
    provider = db.query(Provider).filter(Provider.user_id == current_user.id).first()
    if not provider:
        raise HTTPException(status_code=403, detail="Only providers can view waiting room")

    appointment = db.query(Appointment).filter(
        Appointment.id == video_session.appointment_id
    ).first()

    if appointment.provider_id != provider.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this waiting room")

    # Get waiting patients
    waiting = db.query(WaitingRoom).filter(
        WaitingRoom.video_session_id == video_session_id,
        WaitingRoom.is_waiting == True
    ).all()

    return waiting


@router.post("/waiting-room/{waiting_room_id}/admit")
def admit_from_waiting_room(
    waiting_room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Admit patient from waiting room to session

    Only providers can admit patients
    """
    waiting_entry = db.query(WaitingRoom).filter(WaitingRoom.id == waiting_room_id).first()
    if not waiting_entry:
        raise HTTPException(status_code=404, detail="Waiting room entry not found")

    # Verify user is the provider
    provider = db.query(Provider).filter(Provider.user_id == current_user.id).first()
    if not provider:
        raise HTTPException(status_code=403, detail="Only providers can admit patients")

    video_session = db.query(VideoSession).filter(
        VideoSession.id == waiting_entry.video_session_id
    ).first()
    appointment = db.query(Appointment).filter(
        Appointment.id == video_session.appointment_id
    ).first()

    if appointment.provider_id != provider.id:
        raise HTTPException(status_code=403, detail="Not authorized to admit this patient")

    # Admit patient
    waiting_entry.is_waiting = False
    waiting_entry.admitted_at = datetime.utcnow()

    db.commit()

    return {"message": "Patient admitted to session", "admitted_at": waiting_entry.admitted_at}


from datetime import timedelta
