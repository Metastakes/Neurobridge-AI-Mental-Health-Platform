from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.session import get_db
from app.api.deps import get_current_patient
from app.models.patient import Patient
from app.models.pre_session_task import PreSessionTask, PreSessionTaskResponse
from app.models.enums import TaskStatus
from app.schemas.pre_session import (
    PreSessionTaskResponse as PreSessionTaskResponseSchema,
    PreSessionTaskSubmitRequest,
)

router = APIRouter()


@router.get("/tasks", response_model=list[PreSessionTaskResponseSchema])
def get_my_pre_session_tasks(
    db: Session = Depends(get_db),
    patient: Patient = Depends(get_current_patient),
):
    """
    Get patient's pre-session tasks
    GUARANTEE: 3-question micro-check-ins due 7 days before appointment
    """
    tasks = (
        db.query(PreSessionTask)
        .filter(PreSessionTask.patient_id == patient.user_id)
        .order_by(PreSessionTask.due_at.desc())
        .all()
    )

    return tasks


@router.post("/tasks/{task_id}/submit", status_code=status.HTTP_200_OK)
def submit_pre_session_task(
    task_id: int,
    request: PreSessionTaskSubmitRequest,
    db: Session = Depends(get_db),
    patient: Patient = Depends(get_current_patient),
):
    """
    Submit pre-session task responses
    GUARANTEE: 3 questions must be answered
    """
    # Get task
    task = db.query(PreSessionTask).filter(PreSessionTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    # Authorization check
    if task.patient_id != patient.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    # Check if already completed
    if task.status == TaskStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task already completed",
        )

    # Validate answers
    if not request.answer_1 or not request.answer_2 or not request.answer_3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="All 3 questions must be answered",
        )

    # Create response
    response = PreSessionTaskResponse(
        task_id=task_id,
        answer_1=request.answer_1,
        answer_2=request.answer_2,
        answer_3=request.answer_3,
    )
    db.add(response)

    # Update task status
    task.status = TaskStatus.COMPLETED
    task.completed_at = datetime.utcnow()

    db.commit()

    return {"message": "Pre-session task completed successfully"}
