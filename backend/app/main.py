"""
NeuroBridge Backend API
FastAPI + Socket.io server for real-time session assistance
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
from app.routes import subscription_router

load_dotenv()

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=os.getenv('ALLOWED_ORIGINS', '').split(','),
    logger=True,
    engineio_logger=True
)

# Create FastAPI app
app = FastAPI(
    title="NeuroBridge API",
    description="Real-time AI clinical assistant for PMHNP students",
    version="0.1.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv('ALLOWED_ORIGINS', '').split(','),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(subscription_router)

# In-memory session storage (will be deleted after session ends)
active_sessions = {}


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "NeuroBridge API is running",
        "version": "0.1.0"
    }


@app.get("/api/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "active_sessions": len(active_sessions),
        "services": {
            "api": "operational",
            "websocket": "operational",
            "gemini": "operational",  # TODO: Add actual checks
            "speech": "operational",  # TODO: Add actual checks
        }
    }


# Socket.IO event handlers
@sio.event
async def connect(sid, environ, auth):
    """Handle client connection"""
    print(f"Client connected: {sid}")

    # Get session_id from query params
    query_params = dict(environ.get('QUERY_STRING', ''))
    session_id = query_params.get('sessionId')

    if session_id:
        # Initialize session storage
        active_sessions[sid] = {
            'session_id': session_id,
            'transcripts': [],
            'suggestions': [],
            'start_time': None
        }
        await sio.emit('connected', {'session_id': session_id}, room=sid)
    else:
        await sio.emit('error', {'message': 'No session ID provided'}, room=sid)
        await sio.disconnect(sid)


@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    print(f"Client disconnected: {sid}")

    # Clean up session data
    if sid in active_sessions:
        del active_sessions[sid]


@sio.event
async def audio_chunk(sid, data):
    """
    Handle incoming audio chunk from Chrome extension

    Args:
        data: {
            'audio': base64 encoded PCM audio,
            'sample_rate': int,
            'session_id': str
        }
    """
    print(f"Received audio chunk from {sid}, size: {len(data.get('audio', ''))} bytes")

    # TODO: Week 3 - Implement speech-to-text transcription
    # TODO: Week 4 - Send transcript to Gemini for suggestions

    # Placeholder response
    await sio.emit('transcript', {
        'text': '[Transcription will appear here]',
        'speaker': 'patient',
        'timestamp': 0
    }, room=sid)


@sio.event
async def start_session(sid, data):
    """
    Start a new clinical session

    Args:
        data: {
            'session_id': str,
            'patient_age_range': str,
            'patient_sex': str,
            'chief_complaint': str
        }
    """
    print(f"Starting session for {sid}")

    if sid in active_sessions:
        import time
        active_sessions[sid]['start_time'] = time.time()
        active_sessions[sid]['metadata'] = data

        await sio.emit('session_started', {
            'session_id': data['session_id'],
            'status': 'active'
        }, room=sid)


@sio.event
async def end_session(sid):
    """End the session and generate documentation"""
    print(f"Ending session for {sid}")

    if sid in active_sessions:
        session_data = active_sessions[sid]

        # TODO: Week 6 - Generate SOAP note and CORE ELMS

        # Placeholder response
        await sio.emit('session_ended', {
            'soap_note': '[SOAP note will be generated here]',
            'core_elms': '[CORE ELMS output will be generated here]',
            'duration_seconds': 0
        }, room=sid)

        # Delete all session data (HIPAA compliance)
        del active_sessions[sid]


# Combine FastAPI and Socket.IO
socket_app = socketio.ASGIApp(
    sio,
    app,
    socketio_path='/socket.io'
)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv('PORT', 8000))
    uvicorn.run(
        "main:socket_app",
        host="0.0.0.0",
        port=port,
        reload=True
    )
