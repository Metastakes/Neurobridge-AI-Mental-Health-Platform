"""
Google Meet Integration Service

Handles:
- Google Calendar event creation
- Google Meet link generation
- Video session management

Prerequisites:
- Google Cloud project with Calendar API enabled
- Service account credentials or OAuth2 credentials
- GOOGLE_CREDENTIALS_JSON environment variable set
"""

from google.oauth2 import service_account
from googleapiclient.discovery import build
from datetime import datetime, timedelta
from typing import Optional, Dict
import os
import json
import logging

logger = logging.getLogger(__name__)


class GoogleMeetService:
    """Service for managing Google Meet video sessions"""

    def __init__(self):
        """Initialize Google Calendar API client"""
        self.credentials = None
        self.calendar_service = None
        self._initialize_credentials()

    def _initialize_credentials(self):
        """
        Initialize Google API credentials

        Supports two methods:
        1. Service Account (recommended for production)
        2. OAuth2 (for user-specific calendars)
        """
        try:
            credentials_json = os.getenv("GOOGLE_CREDENTIALS_JSON")

            if not credentials_json:
                logger.warning("GOOGLE_CREDENTIALS_JSON not set. Google Meet integration disabled.")
                return

            # Parse credentials
            credentials_data = json.loads(credentials_json)

            # Use service account credentials
            SCOPES = ['https://www.googleapis.com/auth/calendar']
            self.credentials = service_account.Credentials.from_service_account_info(
                credentials_data,
                scopes=SCOPES
            )

            # Build Calendar API service
            self.calendar_service = build('calendar', 'v3', credentials=self.credentials)

            logger.info("Google Calendar API initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize Google credentials: {e}")
            self.credentials = None
            self.calendar_service = None

    def create_meet_link(
        self,
        provider_email: str,
        patient_email: str,
        start_time: datetime,
        end_time: datetime,
        appointment_id: int,
        session_type: str = "Therapy Session"
    ) -> Optional[Dict]:
        """
        Create a Google Calendar event with Google Meet link

        Args:
            provider_email: Provider's email address
            patient_email: Patient's email address
            start_time: Session start time
            end_time: Session end time
            appointment_id: Appointment ID for reference
            session_type: Type of session (e.g., "Initial Consultation", "Follow-up")

        Returns:
            Dict with event details including meet_link, event_id, meet_code
            None if creation fails
        """
        if not self.calendar_service:
            logger.error("Google Calendar service not initialized")
            return self._create_fallback_meet_link(appointment_id)

        try:
            # Create calendar event
            event = {
                'summary': f'NeuroBridge {session_type} - Appointment #{appointment_id}',
                'description': (
                    f'Telehealth session for Appointment #{appointment_id}\n\n'
                    f'This is a confidential mental health session.\n'
                    f'Please join on time and ensure you are in a private location.\n\n'
                    f'Powered by NeuroBridge'
                ),
                'start': {
                    'dateTime': start_time.isoformat(),
                    'timeZone': 'America/New_York',  # TODO: Make configurable
                },
                'end': {
                    'dateTime': end_time.isoformat(),
                    'timeZone': 'America/New_York',
                },
                'attendees': [
                    {'email': provider_email, 'displayName': 'Provider', 'responseStatus': 'accepted'},
                    {'email': patient_email, 'displayName': 'Patient'},
                ],
                'conferenceData': {
                    'createRequest': {
                        'requestId': f'neurobridge-{appointment_id}-{int(datetime.utcnow().timestamp())}',
                        'conferenceSolutionKey': {
                            'type': 'hangoutsMeet'
                        },
                    }
                },
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'email', 'minutes': 24 * 60},  # 24 hours before
                        {'method': 'popup', 'minutes': 60},  # 1 hour before
                        {'method': 'popup', 'minutes': 10},  # 10 minutes before
                    ],
                },
                'guestsCanModify': False,
                'guestsCanInviteOthers': False,
                'guestsCanSeeOtherGuests': False,
            }

            # Insert event with conferenceData
            created_event = self.calendar_service.events().insert(
                calendarId='primary',
                body=event,
                conferenceDataVersion=1,
                sendUpdates='all'  # Send email invitations
            ).execute()

            # Extract Google Meet details
            meet_link = created_event.get('hangoutLink')
            event_id = created_event.get('id')

            # Extract meet code from link (e.g., meet.google.com/abc-defg-hij)
            meet_code = None
            if meet_link:
                meet_code = meet_link.split('/')[-1]

            logger.info(f"Created Google Meet for appointment {appointment_id}: {meet_link}")

            return {
                'meet_link': meet_link,
                'event_id': event_id,
                'meet_code': meet_code,
                'calendar_link': created_event.get('htmlLink'),
                'provider_email': provider_email,
                'patient_email': patient_email,
            }

        except Exception as e:
            logger.error(f"Failed to create Google Meet link: {e}")
            # Return fallback link
            return self._create_fallback_meet_link(appointment_id)

    def _create_fallback_meet_link(self, appointment_id: int) -> Dict:
        """
        Create a fallback meet link when Google API is unavailable

        In production, this would use a custom video solution or Zoom API
        For development, returns a placeholder
        """
        logger.warning(f"Using fallback meet link for appointment {appointment_id}")

        return {
            'meet_link': f'https://meet.neurobridge.app/session/{appointment_id}',
            'event_id': None,
            'meet_code': f'nb-{appointment_id}',
            'calendar_link': None,
            'provider_email': None,
            'patient_email': None,
            'is_fallback': True,
        }

    def update_meet_time(
        self,
        event_id: str,
        new_start_time: datetime,
        new_end_time: datetime
    ) -> bool:
        """
        Update the time of an existing Google Meet event

        Args:
            event_id: Google Calendar event ID
            new_start_time: New start time
            new_end_time: New end time

        Returns:
            True if successful, False otherwise
        """
        if not self.calendar_service or not event_id:
            return False

        try:
            # Get existing event
            event = self.calendar_service.events().get(
                calendarId='primary',
                eventId=event_id
            ).execute()

            # Update times
            event['start']['dateTime'] = new_start_time.isoformat()
            event['end']['dateTime'] = new_end_time.isoformat()

            # Update event
            self.calendar_service.events().update(
                calendarId='primary',
                eventId=event_id,
                body=event,
                sendUpdates='all'
            ).execute()

            logger.info(f"Updated Google Meet event {event_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to update Google Meet event: {e}")
            return False

    def cancel_meet(self, event_id: str) -> bool:
        """
        Cancel a Google Meet event

        Args:
            event_id: Google Calendar event ID

        Returns:
            True if successful, False otherwise
        """
        if not self.calendar_service or not event_id:
            return False

        try:
            self.calendar_service.events().delete(
                calendarId='primary',
                eventId=event_id,
                sendUpdates='all'
            ).execute()

            logger.info(f"Cancelled Google Meet event {event_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to cancel Google Meet event: {e}")
            return False

    def get_meet_details(self, event_id: str) -> Optional[Dict]:
        """
        Get details of an existing Google Meet event

        Args:
            event_id: Google Calendar event ID

        Returns:
            Dict with event details or None if not found
        """
        if not self.calendar_service or not event_id:
            return None

        try:
            event = self.calendar_service.events().get(
                calendarId='primary',
                eventId=event_id
            ).execute()

            return {
                'meet_link': event.get('hangoutLink'),
                'event_id': event.get('id'),
                'start_time': event['start'].get('dateTime'),
                'end_time': event['end'].get('dateTime'),
                'status': event.get('status'),
            }

        except Exception as e:
            logger.error(f"Failed to get Google Meet details: {e}")
            return None


# Singleton instance
_google_meet_service = None


def get_google_meet_service() -> GoogleMeetService:
    """Get singleton instance of Google Meet service"""
    global _google_meet_service
    if _google_meet_service is None:
        _google_meet_service = GoogleMeetService()
    return _google_meet_service
