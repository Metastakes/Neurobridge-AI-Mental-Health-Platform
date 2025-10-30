from datetime import datetime
from app.tasks.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.appointment import Appointment
from app.models.enums import AppointmentStatus
from app.services.billing.no_show_handler import NoShowHandler
import logging

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.no_show_tasks.process_no_shows_task")
def process_no_shows_task():
    """
    Scheduled task to process no-show appointments
    Runs every 15 minutes to check for appointments that were missed
    GUARANTEE: Charges no-show fee ≥ $50
    """
    db = SessionLocal()
    try:
        now = datetime.utcnow()

        # Find appointments that should have started but patient didn't show
        # (15 minutes past start time, still marked as SCHEDULED)
        no_show_appointments = (
            db.query(Appointment)
            .filter(
                Appointment.status == AppointmentStatus.SCHEDULED,
                Appointment.starts_at < now,
            )
            .all()
        )

        logger.info(f"Found {len(no_show_appointments)} potential no-show appointments")

        no_show_handler = NoShowHandler(db)
        processed_count = 0
        failed_count = 0

        for appointment in no_show_appointments:
            try:
                # Process no-show and charge fee
                success = no_show_handler.process_no_show(appointment)
                if success:
                    processed_count += 1
                    logger.info(f"Processed no-show for appointment {appointment.id}")
                else:
                    failed_count += 1
                    logger.warning(f"Failed to process no-show for appointment {appointment.id}")
            except Exception as e:
                failed_count += 1
                logger.error(f"Error processing no-show for appointment {appointment.id}: {str(e)}")

        logger.info(
            f"No-show processing complete: {processed_count} processed, {failed_count} failed"
        )

        return {
            "total_found": len(no_show_appointments),
            "processed": processed_count,
            "failed": failed_count,
        }

    except Exception as e:
        logger.error(f"Error in no-show processing task: {str(e)}")
        raise
    finally:
        db.close()
