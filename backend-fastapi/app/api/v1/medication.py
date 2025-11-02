from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.session import get_db
from app.api.deps import get_current_patient
from app.models.patient import Patient
from app.models.medication_education import MedicationEducation, MedicationQuizAttempt
from app.models.enums import QuizStatus
from app.schemas.medication import (
    MedicationEducationResponse,
    MedicationQuizSubmitRequest,
    MedicationQuizAttemptResponse,
)

router = APIRouter()


@router.get("/education/{medication_id}", response_model=MedicationEducationResponse)
def get_medication_education(
    medication_id: int,
    db: Session = Depends(get_db),
    patient: Patient = Depends(get_current_patient),
):
    """
    Get medication education module
    GUARANTEE: Medication micro-education with quiz
    """
    education = (
        db.query(MedicationEducation).filter(MedicationEducation.id == medication_id).first()
    )
    if not education:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Education module not found")

    return education


@router.post("/quiz/submit", response_model=MedicationQuizAttemptResponse, status_code=status.HTTP_201_CREATED)
def submit_medication_quiz(
    request: MedicationQuizSubmitRequest,
    db: Session = Depends(get_db),
    patient: Patient = Depends(get_current_patient),
):
    """
    Submit medication quiz
    GUARANTEE: Quiz + acknowledgment required before prescribing
    """
    # Get education module
    education = (
        db.query(MedicationEducation).filter(MedicationEducation.id == request.education_id).first()
    )
    if not education:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Education module not found")

    # Validate answers length
    if len(request.answers) != len(education.quiz_questions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Expected {len(education.quiz_questions)} answers, got {len(request.answers)}",
        )

    # Calculate score
    correct_count = 0
    for i, question in enumerate(education.quiz_questions):
        if request.answers[i] == question.get("correct_answer"):
            correct_count += 1

    score = int((correct_count / len(education.quiz_questions)) * 100)

    # Determine pass/fail
    status_enum = QuizStatus.PASSED if score >= education.passing_score else QuizStatus.FAILED

    # Create quiz attempt
    attempt = MedicationQuizAttempt(
        education_id=education.id,
        patient_id=patient.user_id,
        answers=request.answers,
        score=score,
        status=status_enum,
        acknowledged=1 if request.acknowledged else 0,
        acknowledged_at=datetime.utcnow() if request.acknowledged else None,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return attempt


@router.get("/quiz/attempts", response_model=list[MedicationQuizAttemptResponse])
def get_my_quiz_attempts(
    db: Session = Depends(get_db),
    patient: Patient = Depends(get_current_patient),
):
    """Get patient's medication quiz attempts"""
    attempts = (
        db.query(MedicationQuizAttempt)
        .filter(MedicationQuizAttempt.patient_id == patient.user_id)
        .order_by(MedicationQuizAttempt.attempted_at.desc())
        .all()
    )

    return attempts
