# hardware_api.py
from fastapi import APIRouter

router = APIRouter()

@router.post("/command/{device}/{action}")
def send_device_command(device: str, action: str):
    """
    Bridge command used if running WebSockets / Local Server instead of Web Serial.
    """
    valid_actions = ["FORWARD", "LEFT", "RIGHT", "STOP", "ESTOP"]
    
    if action.upper() not in valid_actions:
        return {"error": "Invalid action"}
        
    return {"status": "dispatched", "device": device, "action": action.upper()}
