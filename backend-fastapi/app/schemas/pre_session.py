from pydantic import BaseModel
from datetime import datetime
from app.models.enums import TaskStatus


class PreSessionTaskResponse(BaseModel):
    """Pre-session task details"""

    id: int
    appointment_id: int
    question_1: str
    question_2: str
    question_3: str
    status: TaskStatus
    due_at: datetime
    completed_at: datetime | None

    class Config:
        from_attributes = True


class PreSessionTaskSubmitRequest(BaseModel):
    """Submit pre-session task responses"""

    answer_1: str
    answer_2: str
    answer_3: str
