// config.ts

// IMPORTANT: API keys should be configured in .env.local file
// See .env.example for template and instructions
//
// Google Cloud Configuration:
// You can get these from the Google Cloud Console: https://console.cloud.google.com/
// 1. Create a new project.
// 2. Enable the "Google Calendar API".
// 3. Go to "Credentials", create an "API key".
// 4. Go to "Credentials", create an "OAuth 2.0 Client ID" for a "Web application".
//    - Add `http://localhost:5173` (or your development URL) to "Authorized JavaScript origins".

export const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || 'YOUR_GOOGLE_API_KEY_HERE';
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com';

// Validate that environment variables are configured in development
if (import.meta.env.DEV) {
  if (GOOGLE_API_KEY === 'YOUR_GOOGLE_API_KEY_HERE') {
    console.warn('⚠️ GOOGLE_API_KEY not configured. Copy .env.example to .env.local and add your API keys.');
  }
  if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com') {
    console.warn('⚠️ GOOGLE_CLIENT_ID not configured. Copy .env.example to .env.local and add your API keys.');
  }
}