/**
 * NeuroBridge Extension - Popup UI
 * Controls audio capture start/stop
 */

const statusDiv = document.getElementById('status');
const sessionIdInput = document.getElementById('sessionId');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const errorDiv = document.getElementById('error');

// Check initial status
chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
  if (response?.isCapturing) {
    showCapturing();
  }
});

// Start capture
startBtn.addEventListener('click', async () => {
  const sessionId = sessionIdInput.value.trim();

  if (!sessionId) {
    showError('Please enter a session ID');
    return;
  }

  // Clear error
  errorDiv.textContent = '';

  // Send message to background script
  chrome.runtime.sendMessage(
    { action: 'startCapture', sessionId },
    (response) => {
      if (response?.status === 'started') {
        showCapturing();
        // Store session ID
        chrome.storage.local.set({ currentSessionId: sessionId });
      } else {
        showError('Failed to start capture');
      }
    }
  );
});

// Stop capture
stopBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'stopCapture' }, (response) => {
    if (response?.status === 'stopped') {
      showInactive();
      // Clear stored session ID
      chrome.storage.local.remove('currentSessionId');
    }
  });
});

// UI state functions
function showCapturing() {
  statusDiv.textContent = 'Capturing audio...';
  statusDiv.className = 'status active';
  startBtn.style.display = 'none';
  stopBtn.style.display = 'block';
  sessionIdInput.disabled = true;
}

function showInactive() {
  statusDiv.textContent = 'Not capturing';
  statusDiv.className = 'status inactive';
  startBtn.style.display = 'block';
  stopBtn.style.display = 'none';
  sessionIdInput.disabled = false;
}

function showError(message) {
  errorDiv.textContent = message;
  setTimeout(() => {
    errorDiv.textContent = '';
  }, 3000);
}

// Load saved session ID on popup open
chrome.storage.local.get(['currentSessionId'], (result) => {
  if (result.currentSessionId) {
    sessionIdInput.value = result.currentSessionId;
  }
});
