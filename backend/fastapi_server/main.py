# main.py
from fastapi import FastAPI, WebSocket, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import datetime

app = FastAPI(
    title="Neurovex Core API",
    description="Backend API for EEG Session Handling and Control",
    version="1.0.0"
)

# Allow Cross-Origin Requests from the frontend dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Replace with Vercel frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import hardware_api
from session_manager import SessionManager

app.include_router(hardware_api.router)

# Initialize Session Manager
session_mgr = SessionManager()

# Models
class SessionStartStatus(BaseModel):
    user_id: str
    target_threshold: int

class EEGBatchPayload(BaseModel):
    session_id: str
    data_points: list[int]

# Static checking endpoint
@app.get("/")
def read_root():
    return {"status": "Neurovex API is fully operational", "timestamp": str(datetime.datetime.now())}

# Endpoint to start a hardware session record (Stubbed for Supabase DB insertion)
@app.post("/api/sessions/start")
def start_session(session: SessionStartStatus):
    """ Record a session starting in Postgres via Supabase """
    # supabase.table('sessions').insert({"user_id": session.user_id}).execute()
    return {"message": "Session initialized", "session_id": "dummy-uuid"}

# Endpoint to safely record live EEG tick into RAM
@app.post("/api/eeg/record")
def record_eeg_data(data: dict):
    """ Receives live EEG data point (alpha, beta, theta, delta, focus_score) """
    if session_mgr.is_recording:
        session_mgr.record_data(data)
    return {"status": "ok"}

# Endpoints for Session Management
@app.post("/api/session/start")
def start_active_session(duration_sec: int = 120):
    """ Starts a recording session. Supports Demo Mode (15s) or standard times. """
    return session_mgr.start_session(duration_sec)

@app.post("/api/session/stop")
def stop_active_session():
    """ Stops recording and generates calculations & CSV. """
    return session_mgr.stop_session()

@app.get("/api/session/report")
def get_current_report():
    """ Returns the most recent generated brain report """
    if not session_mgr.current_report:
        return {"status": "error", "message": "No reports generated yet."}
    return session_mgr.current_report

@app.get("/api/session/history")
def get_session_history():
    """ Returns the list of previous sessions """
    return {"history": session_mgr.history}

# Optional Real-time relay
@app.websocket("/ws/telemetry")
async def telemetry_socket(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            # Echo processing metrics or broadcast to other listeners
            await websocket.send_json({"server_ack": True, "payload": data})
            
    except Exception as e:
        print(f"WS Disconnect: {e}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
