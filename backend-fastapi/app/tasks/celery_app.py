from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

# Initialize Celery
celery_app = Celery(
    "neurobridge",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.no_show_tasks", "app.tasks.reminder_tasks"],
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes max per task
)

# Scheduled tasks
celery_app.conf.beat_schedule = {
    # Process no-shows every 15 minutes
    "process-no-shows": {
        "task": "app.tasks.no_show_tasks.process_no_shows_task",
        "schedule": crontab(minute="*/15"),  # Every 15 minutes
    },
    # Send appointment reminders daily at 9 AM
    "send-appointment-reminders": {
        "task": "app.tasks.reminder_tasks.send_appointment_reminders_task",
        "schedule": crontab(hour=9, minute=0),  # 9 AM daily
    },
    # Send pre-session reminders daily at 10 AM
    "send-pre-session-reminders": {
        "task": "app.tasks.reminder_tasks.send_pre_session_reminders_task",
        "schedule": crontab(hour=10, minute=0),  # 10 AM daily
    },
}
