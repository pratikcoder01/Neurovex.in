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
app.include_router(hardware_api.router)

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

# Endpoint to securely dump batch records to DB to limit overhead
@app.post("/api/eeg/batch")
def upload_eeg_batch(payload: EEGBatchPayload):
    """ Accepts batches of EEG data and pushes to Supabase database """
    # Make batch processing payload formatting
    # supabase.rpc('insert_eeg_batch', {'payload_data': payload.data_points}).execute()
    return {"status": "success", "count_inserted": len(payload.data_points)}

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
