/**
 * NeuroBridge Extension - Content Script
 * Injected into telehealth pages (Zoom, Google Meet, etc.)
 *
 * Week 2 TODO:
 * - Detect when user joins a call
 * - Notify background script
 * - Show unobtrusive indicator when capturing
 */

console.log('NeuroBridge content script loaded');

// TODO: Week 2 - Implement call detection
// Different telehealth platforms have different DOM structures
// Need to detect when user is in an active call

// For Google Meet:
function detectGoogleMeetCall() {
  // Check for specific elements that indicate an active call
  const callElements = document.querySelectorAll('[data-meeting-title]');
  return callElements.length > 0;
}

// For Zoom:
function detectZoomCall() {
  // Zoom detection logic
  const zoomElements = document.querySelectorAll('.meeting-client');
  return zoomElements.length > 0;
}

// Check periodically (every 2 seconds)
setInterval(() => {
  const isInCall = detectGoogleMeetCall() || detectZoomCall();

  if (isInCall) {
    // Notify background script
    chrome.runtime.sendMessage({ action: 'callDetected' });
  }
}, 2000);
