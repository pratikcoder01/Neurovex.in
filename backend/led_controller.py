import asyncio
import websockets
import json
import time
import random
import serial
import threading
from typing import Set

# Configuration
THRESHOLD = 90
DEBOUNCE_TIME = 2.0  # seconds
LED_PORT = "COM3"  # Adjust dynamically or specify depending on OS
LED_BAUD = 115200
WS_HOST = "0.0.0.0"
WS_PORT = 8765

class LEDController:
    def __init__(self):
        self.is_led_on = False
        self.last_toggle_time = 0.0
        self.serial_conn = None
        self.clients: Set[websockets.WebSocketServerProtocol] = set()
        
        # Try to initialize serial connection to ESP32
        try:
            self.serial_conn = serial.Serial(LED_PORT, LED_BAUD, timeout=1)
            print(f"Connected to ESP32 on {LED_PORT}")
        except Exception as e:
            print(f"Warning: Could not connect to ESP32 on {LED_PORT}: {e}")
            print("Operating in Simulation/WebSocket-only mode.")

    def set_led_state(self, state: bool):
        """Update the internal LED state and send command to ESP32."""
        self.is_led_on = state
        command = "LED_ON\n" if state else "LED_OFF\n"
        
        # Send physical command
        if self.serial_conn and self.serial_conn.is_open:
            try:
                self.serial_conn.write(command.encode('utf-8'))
            except Exception as e:
                print(f"Failed to write to Serial: {e}")
                
        print(f"Hardware Command Dispatched: {command.strip()}")

    async def broadcast_state(self, focus_score: int, focus_triggered: bool = False):
        """Send the current state to all connected connected WebSocket clients."""
        if not self.clients:
            return
            
        # Standard telemetry packet
        telemetry = {
            "type": "telemetry",
            "focus_score": focus_score,
            "led_state": "ON" if self.is_led_on else "OFF",
            "timestamp": time.time()
        }
        
        # Immediate notification packet if a toggle occurred
        trigger = None
        if focus_triggered:
            trigger = {
                "type": "trigger",
                "focus_score": focus_score,
                "action": "TOGGLE_LED"
            }
            
        # Send to all clients
        disconnected = set()
        for client in self.clients:
            try:
                await client.send(json.dumps(telemetry))
                if trigger:
                    await client.send(json.dumps(trigger))
            except websockets.exceptions.ConnectionClosed:
                disconnected.add(client)
                
        # Cleanup
        self.clients -= disconnected

    async def handle_client(self, websocket: websockets.WebSocketServerProtocol, path: str):
        """Register newly connected WebSocket clients."""
        self.clients.add(websocket)
        try:
            # Send initial state
            await websocket.send(json.dumps({
                "type": "status",
                "message": "Connected to Neurovex LED Controller Engine."
            }))
            # Keep connection alive
            await websocket.wait_closed()
        finally:
            self.clients.remove(websocket)

    async def logic_loop(self):
        """Continuously process focus score, apply thresholds, and debounce."""
        print("Starting Control Loop...")
        
        # For demonstration context without a real BCI streaming script,
        # we generate simulated focus scores. In a real system, this reads from 
        # the neurosky/muse LSL stream.
        base_focus = 50.0
        
        while True:
            # Generate simulated focus score with occasional spikes
            if random.random() < 0.05:
                # 5% chance of a massive spike (representing deep focus task)
                base_focus += random.uniform(20, 50)
            else:
                # Normal drift
                base_focus += random.uniform(-5, 5)
            
            # Constrain 0-100
            base_focus = max(0, min(100, base_focus))
            focus_score = int(base_focus)
            
            current_time = time.time()
            triggered = False
            
            # Application Logic:
            # - If Focus >= THRESHOLD
            # - And DEBOUNCE time has elapsed since last toggle
            if focus_score >= THRESHOLD:
                if (current_time - self.last_toggle_time) >= DEBOUNCE_TIME:
                    # Toggle State
                    new_state = not self.is_led_on
                    self.set_led_state(new_state)
                    self.last_toggle_time = current_time
                    triggered = True
                    print(f"Focus {focus_score}% >= {THRESHOLD}%! Toggling LED -> {'ON' if new_state else 'OFF'}")
                else:
                    # Waiting for debounce
                    pass
                    
            await self.broadcast_state(focus_score, triggered)
            
            # Update at ~ 10Hz
            await asyncio.sleep(0.1)

async def main():
    controller = LEDController()
    
    # Start WebSocket Server
    server = await websockets.serve(controller.handle_client, WS_HOST, WS_PORT)
    print(f"WebSocket Server running on ws://{WS_HOST}:{WS_PORT}")
    
    # Run logic loop concurrently
    await controller.logic_loop()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nShutting down controller...")
