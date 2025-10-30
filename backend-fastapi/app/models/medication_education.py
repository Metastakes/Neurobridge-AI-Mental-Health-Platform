from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
from app.models.enums import QuizStatus


class MedicationEducation(Base):
    """
    GUARANTEE: Medication micro-education + quiz + acknowledgment
    Required before provider can prescribe medication
    """
    __tablename__ = "medication_education"

    id = Column(Integer, primary_key=True, index=True)
    medication_name = Column(String(255), nullable=False, index=True)
    medication_class = Column(String(100), nullable=False)  # e.g., SSRI, SNRI, Benzodiazepine

    # Educational content
    description = Column(Text, nullable=False)
    usage_instructions = Column(Text, nullable=False)
    side_effects = Column(Text, nullable=False)
    warnings = Column(Text, nullable=False)

    # Quiz questions (JSON array)
    quiz_questions = Column(JSON, nullable=False)
    """
    Example structure:
    [
        {
            "question": "What are common side effects?",
            "options": ["A", "B", "C", "D"],
            "correct_answer": "B"
        }
    ]
    """

    passing_score = Column(Integer, nullable=False, default=80)  # Percentage

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    def __repr__(self):
        return f"<MedicationEducation(id={self.id}, medication={self.medication_name})>"


class MedicationQuizAttempt(Base):
    """Patient quiz attempts for medication education"""
    __tablename__ = "medication_quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    education_id = Column(Integer, ForeignKey("medication_education.id"), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Quiz results
    answers = Column(JSON, nullable=False)  # Patient's selected answers
    score = Column(Integer, nullable=False)  # Percentage score
    status = Column(Enum(QuizStatus), nullable=False)

    # Acknowledgment
    acknowledged = Column(Integer, nullable=False, default=0)  # 1 = patient acknowledged understanding
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)

    attempted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    education = relationship("MedicationEducation", backref="quiz_attempts")
    patient = relationship("User", backref="medication_quiz_attempts", foreign_keys=[patient_id])

    def __repr__(self):
        return f"<MedicationQuizAttempt(id={self.id}, patient_id={self.patient_id}, score={self.score}, status={self.status})>"
