from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
from app.models.enums import TaskStatus


class PreSessionTask(Base):
    """
    GUARANTEE: Pre-session 3-question micro-check-ins
    Due 7 days before appointment
    """
    __tablename__ = "pre_session_tasks"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Task configuration
    question_1 = Column(Text, nullable=False, default="How are you feeling today on a scale of 1-10?")
    question_2 = Column(Text, nullable=False, default="Have you experienced any significant changes since your last session?")
    question_3 = Column(Text, nullable=False, default="Are there specific topics you'd like to discuss today?")

    status = Column(Enum(TaskStatus), nullable=False, default=TaskStatus.PENDING, index=True)
    due_at = Column(DateTime(timezone=True), nullable=False, index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    appointment = relationship("Appointment", backref="pre_session_tasks")
    patient = relationship("User", backref="pre_session_tasks", foreign_keys=[patient_id])

    def __repr__(self):
        return f"<PreSessionTask(id={self.id}, appointment_id={self.appointment_id}, status={self.status})>"


class PreSessionTaskResponse(Base):
    """Patient's responses to pre-session questions"""
    __tablename__ = "pre_session_task_responses"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("pre_session_tasks.id"), nullable=False, index=True)

    answer_1 = Column(Text, nullable=False)
    answer_2 = Column(Text, nullable=False)
    answer_3 = Column(Text, nullable=False)

    submitted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationship
    task = relationship("PreSessionTask", backref="responses")

    def __repr__(self):
        return f"<PreSessionTaskResponse(id={self.id}, task_id={self.task_id})>"
