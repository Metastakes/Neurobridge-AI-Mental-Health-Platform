/**
 * NeuroBridge Extension - Background Worker
 * Handles audio capture from telehealth tabs
 *
 * Week 2 TODO:
 * - Implement audio capture using chrome.tabCapture
 * - Convert audio to PCM format
 * - Stream to backend via WebSocket
 */

let audioStream = null;
let websocket = null;
let isCapturing = false;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  if (message.action === 'startCapture') {
    startAudioCapture(message.sessionId);
    sendResponse({ status: 'started' });
  } else if (message.action === 'stopCapture') {
    stopAudioCapture();
    sendResponse({ status: 'stopped' });
  } else if (message.action === 'getStatus') {
    sendResponse({ isCapturing });
  }

  return true; // Keep message channel open
});

async function startAudioCapture(sessionId) {
  try {
    console.log('Starting audio capture for session:', sessionId);

    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      throw new Error('No active tab found');
    }

    // TODO: Week 2 - Implement actual audio capture
    // chrome.tabCapture.capture({
    //   audio: true,
    //   video: false
    // }, (stream) => {
    //   handleAudioStream(stream, sessionId);
    // });

    // Connect to backend WebSocket
    const wsUrl = 'ws://localhost:8000/socket.io';
    websocket = new WebSocket(`${wsUrl}?sessionId=${sessionId}`);

    websocket.onopen = () => {
      console.log('WebSocket connected');
      isCapturing = true;
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket closed');
      isCapturing = false;
    };

  } catch (error) {
    console.error('Error starting capture:', error);
    isCapturing = false;
  }
}

function stopAudioCapture() {
  console.log('Stopping audio capture');

  if (audioStream) {
    audioStream.getTracks().forEach(track => track.stop());
    audioStream = null;
  }

  if (websocket) {
    websocket.close();
    websocket = null;
  }

  isCapturing = false;
}

function handleAudioStream(stream, sessionId) {
  audioStream = stream;

  // TODO: Week 2 - Process audio stream
  // 1. Create AudioContext
  // 2. Create MediaStreamSource
  // 3. Connect to ScriptProcessor or AudioWorklet
  // 4. Convert to PCM
  // 5. Send chunks to backend via WebSocket

  console.log('Audio stream captured, processing...');
}

// Clean up on extension unload
chrome.runtime.onSuspend.addListener(() => {
  stopAudioCapture();
});
