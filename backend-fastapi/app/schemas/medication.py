from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import List, Dict
from app.models.enums import QuizStatus


class MedicationEducationResponse(BaseModel):
    """Medication education module details"""

    id: int
    medication_name: str
    medication_class: str
    description: str
    usage_instructions: str
    side_effects: str
    warnings: str
    quiz_questions: List[Dict]
    passing_score: int

    class Config:
        from_attributes = True


class MedicationQuizSubmitRequest(BaseModel):
    """Submit medication quiz answers"""

    education_id: int
    answers: List[str]  # Selected answers for each question
    acknowledged: bool  # Patient acknowledges understanding

    @field_validator("acknowledged")
    def validate_acknowledged(cls, v):
        if not v:
            raise ValueError("You must acknowledge understanding before proceeding")
        return v


class MedicationQuizAttemptResponse(BaseModel):
    """Medication quiz attempt results"""

    id: int
    education_id: int
    score: int
    status: QuizStatus
    acknowledged: int
    attempted_at: datetime

    class Config:
        from_attributes = True
