// googleApi.ts
/// <reference types="gapi" />
/// <reference types="gapi.client.calendar-v3" />

// Type declarations for Google Identity Services (GIS)
// Note: GIS is separate from gapi and doesn't have official TypeScript types yet
declare namespace google {
    namespace accounts {
        namespace oauth2 {
            interface TokenClient {
                requestAccessToken: (options?: { prompt: string; }) => void;
            }
            interface TokenResponse {
                access_token: string;
                error?: any;
            }
            function initTokenClient(config: {
                client_id: string;
                scope: string;
                callback: (tokenResponse: TokenResponse) => void;
            }): TokenClient;
            function revoke(token: string, callback: () => void): void;
        }
    }
}


import { GOOGLE_API_KEY, GOOGLE_CLIENT_ID } from './config.ts';
import { CalendarEvent } from './types.ts';
import { v4 as uuidv4 } from 'uuid';

const SCOPES = 'https://www.googleapis.com/auth/calendar';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

let tokenClient: google.accounts.oauth2.TokenClient | null = null;

/**
 * Callback after the gapi script is loaded.
 */
export const initGapiClient = async () => {
    await gapi.client.init({
        apiKey: GOOGLE_API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
    });
};

/**
 * Callback after the GIS script is loaded.
 */
export const initGisClient = (callback: (tokenResponse: google.accounts.oauth2.TokenResponse) => void) => {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: callback,
    });
};

export const handleSignIn = () => {
    if (tokenClient) {
        // Prompt the user to select a Google Account and ask for consent to share their data
        // when establishing a new session.
        tokenClient.requestAccessToken({ prompt: 'consent' });
    }
};

export const handleSignOut = () => {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token, () => {
            gapi.client.setToken(null);
        });
    }
};

export const listUpcomingEvents = async (): Promise<CalendarEvent[]> => {
    try {
        const response = await gapi.client.calendar.events.list({
            'calendarId': 'primary',
            'timeMin': (new Date()).toISOString(),
            'showDeleted': false,
            'singleEvents': true,
            'maxResults': 20,
            'orderBy': 'startTime'
        });
        return response.result.items as CalendarEvent[];
    } catch (err) {
        console.error("Error fetching events:", err);
        return [];
    }
};

export const addCalendarEvent = async (summary: string, startDateTime: string, endDateTime: string, attendeeEmail: string) => {
     try {
        const event = {
            'summary': summary,
            'description': 'A therapy session scheduled via NeuroBridge AI. Join your secure session using the link below.',
            'start': {
                'dateTime': startDateTime,
                'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            'end': {
                'dateTime': endDateTime,
                'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            'attendees': [
                { 'email': attendeeEmail }
            ],
             'reminders': {
                'useDefault': false,
                'overrides': [
                    { 'method': 'email', 'minutes': 24 * 60 },
                    { 'method': 'popup', 'minutes': 30 },
                ],
            },
            'conferenceData': {
                'createRequest': {
                    'requestId': `neurobridge-${uuidv4()}`,
                    'conferenceSolutionKey': {
                        'type': 'hangoutsMeet'
                    }
                }
            }
        };

        const request = gapi.client.calendar.events.insert({
            'calendarId': 'primary',
            'resource': event,
            'sendNotifications': true, // This will send an invitation to the attendee
            'conferenceDataVersion': 1, // This is required to generate the Google Meet link
        });

        const response = await request;
        console.log('Event created: ', response.result);
        return response.result;
    } catch (error) {
        console.error('Error creating event:', error);
        throw error;
    }
};