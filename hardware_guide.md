# Mind LED Control: Hardware Guide

This guide explains how to connect an LED to your ESP32 so it can be controlled by your brainwaves.

## Overview of System Flow
1. **Brain Signals** (EEG) are captured via an external sensor.
2. The sensors calculate a **Focus Score** (0-100%).
3. **Python Logic** (`led_controller.py`) reads this score and triggers when it hits `90%` or higher.
4. Python sends a **Command** (`LED_ON` / `LED_OFF`) via USB Serial to the ESP32.
5. The **ESP32** receives the command and toggles power to its GPIO pin, turning the **LED ON/OFF**.
6. Simulataneously, the **Backend** publishes the state via WebSockets to the **Web UI**, which visually updates the Virtual LED!

---

## What You Need
- 1 x ESP32 Development Board
- 1 x Breadboard
- 1 x LED (Red, Green, or Blue)
- 1 x Resistor (220Ω or 330Ω)
- 2 x Jumper Wires

## Hardware Set Up & Wiring

LEDs have two legs, an **Anode** (Longer leg, Positive `+`) and a **Cathode** (Shorter leg, Negative `-`).

1. **Connect the Ground (GND):**
   - Connect the Cathode (short leg) of the LED to a `GND` pin on the ESP32.

2. **Connect the Signal (GPIO Pin):**
   - Connect the Anode (long leg) of the LED to one end of the Resistor (220Ω or 330Ω). The resistor prevents the LED from burning out.
   - Connect the other end of the Resistor to `GPIO 2` (or the pin specified in `LED_PIN` in your Arduino code).

### Visual Layout:
```text
[ESP32 GND] --------> [LED Shorter Leg (-)]
[ESP32 GPIO 2] -----> [220Ω Resistor] -----> [LED Longer Leg (+)]
```

## Running the Code
1. Flash **ESP32** using Arduino IDE with `esp32_led.ino`. Ensure the baud rate is set to `115200`.
2. Find the COM port for your ESP32. Update `LED_PORT = "COMMAND"` in `backend/led_controller.py`.
3. Run `pip install websockets pyserial` if you haven't already.
4. Run `python backend/led_controller.py`.
5. Open `frontend/mind_led.html` in your web browser. 

Happy brain-toggling!
