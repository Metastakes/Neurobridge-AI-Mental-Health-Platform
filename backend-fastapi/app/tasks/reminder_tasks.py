from datetime import datetime, timedelta
from app.tasks.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.appointment import Appointment
from app.models.pre_session_task import PreSessionTask
from app.models.patient import Patient
from app.models.user import User
from app.models.enums import AppointmentStatus, TaskStatus
from app.services.sms import SecureSMSService
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.reminder_tasks.send_appointment_reminders_task")
def send_appointment_reminders_task():
    """
    Send appointment reminders via HIPAA-safe SMS
    Runs daily at 9 AM, sends reminders for appointments in next 24 hours
    GUARANTEE: NO PHI in SMS body, only secure deep links
    """
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        tomorrow = now + timedelta(hours=24)

        # Find appointments in next 24 hours
        upcoming_appointments = (
            db.query(Appointment)
            .filter(
                Appointment.status == AppointmentStatus.SCHEDULED,
                Appointment.starts_at >= now,
                Appointment.starts_at <= tomorrow,
            )
            .all()
        )

        logger.info(f"Found {len(upcoming_appointments)} appointments for reminders")

        sms_service = SecureSMSService()
        sent_count = 0
        failed_count = 0

        for appointment in upcoming_appointments:
            try:
                # Get patient's phone number
                patient = db.query(Patient).filter(Patient.user_id == appointment.patient_id).first()
                if not patient:
                    logger.warning(f"Patient not found for appointment {appointment.id}")
                    failed_count += 1
                    continue

                user = db.query(User).filter(User.id == patient.user_id).first()
                if not user or not user.phone:
                    logger.warning(f"No phone number for patient {patient.user_id}")
                    failed_count += 1
                    continue

                # Generate secure deep link (would be real URL in production)
                secure_link = f"{settings.FRONTEND_URL}/patient/appointments/{appointment.id}"

                # GUARANTEE: Send HIPAA-safe SMS (no PHI in message body)
                success = sms_service.send_secure_sms(
                    to_phone=user.phone,
                    message_type="APPOINTMENT_REMINDER",
                    secure_link=secure_link,
                )

                if success:
                    sent_count += 1
                    logger.info(f"Sent reminder for appointment {appointment.id}")
                else:
                    failed_count += 1
                    logger.warning(f"Failed to send reminder for appointment {appointment.id}")

            except Exception as e:
                failed_count += 1
                logger.error(f"Error sending reminder for appointment {appointment.id}: {str(e)}")

        logger.info(f"Appointment reminders complete: {sent_count} sent, {failed_count} failed")

        return {
            "total_found": len(upcoming_appointments),
            "sent": sent_count,
            "failed": failed_count,
        }

    except Exception as e:
        logger.error(f"Error in appointment reminder task: {str(e)}")
        raise
    finally:
        db.close()


@celery_app.task(name="app.tasks.reminder_tasks.send_pre_session_reminders_task")
def send_pre_session_reminders_task():
    """
    Send pre-session task reminders
    GUARANTEE: 3-question micro-check-ins due 7 days before appointment
    Reminds patients who haven't completed their pre-session tasks
    """
    db = SessionLocal()
    try:
        now = datetime.utcnow()

        # Find overdue or soon-due pre-session tasks
        pending_tasks = (
            db.query(PreSessionTask)
            .filter(
                PreSessionTask.status == TaskStatus.PENDING,
                PreSessionTask.due_at <= now + timedelta(days=1),  # Due within 24 hours
            )
            .all()
        )

        logger.info(f"Found {len(pending_tasks)} pre-session tasks needing reminders")

        sms_service = SecureSMSService()
        sent_count = 0
        failed_count = 0

        for task in pending_tasks:
            try:
                # Get patient's phone number
                patient = db.query(Patient).filter(Patient.user_id == task.patient_id).first()
                if not patient:
                    logger.warning(f"Patient not found for task {task.id}")
                    failed_count += 1
                    continue

                user = db.query(User).filter(User.id == patient.user_id).first()
                if not user or not user.phone:
                    logger.warning(f"No phone number for patient {patient.user_id}")
                    failed_count += 1
                    continue

                # Generate secure deep link
                secure_link = f"{settings.FRONTEND_URL}/patient/pre-session/{task.id}"

                # GUARANTEE: Send HIPAA-safe SMS
                success = sms_service.send_secure_sms(
                    to_phone=user.phone,
                    message_type="PRE_SESSION_REMINDER",
                    secure_link=secure_link,
                )

                if success:
                    sent_count += 1
                    logger.info(f"Sent pre-session reminder for task {task.id}")
                else:
                    failed_count += 1
                    logger.warning(f"Failed to send pre-session reminder for task {task.id}")

                # Mark overdue tasks
                if task.due_at < now and task.status == TaskStatus.PENDING:
                    task.status = TaskStatus.OVERDUE
                    db.commit()

            except Exception as e:
                failed_count += 1
                logger.error(f"Error sending pre-session reminder for task {task.id}: {str(e)}")

        logger.info(f"Pre-session reminders complete: {sent_count} sent, {failed_count} failed")

        return {
            "total_found": len(pending_tasks),
            "sent": sent_count,
            "failed": failed_count,
        }

    except Exception as e:
        logger.error(f"Error in pre-session reminder task: {str(e)}")
        raise
    finally:
        db.close()
