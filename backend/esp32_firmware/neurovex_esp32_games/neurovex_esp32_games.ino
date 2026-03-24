// neurovex_esp32_games.ino
// Custom Firmware for Neurovex Games Array

#include <ArduinoJson.h>

// --- System Configuration ---
const int EEG_PIN = 34;            
const int BAUD_RATE = 115200;      
const unsigned long SAMPLE_RATE_MS = 4; // 250Hz Fast Sampling
unsigned long lastSampleTime = 0;

// --- Physical Arena Actuators (Optional Extensions) ---
// If the user wants to connect real LEDs or motors to trigger alongside the Web UI games
const int LED_FOCUS_BLUE = 21;    // Beta focus indicator (Telekinesis)
const int LED_RELAX_GREEN = 22;   // Alpha match indicator (Zen)
const int LED_CUE_RED = 23;       // Reaction cue indicator (Beta Reflex)
const int ARENA_MOTOR_PWM = 25;   // Physical Telekinesis Motor

void setup() {
    Serial.begin(BAUD_RATE);
    
    pinMode(EEG_PIN, INPUT);
    
    // Actuator setup
    pinMode(LED_FOCUS_BLUE, OUTPUT);
    pinMode(LED_RELAX_GREEN, OUTPUT);
    pinMode(LED_CUE_RED, OUTPUT);
    pinMode(ARENA_MOTOR_PWM, OUTPUT);

    // Initial Test Sequence
    digitalWrite(LED_FOCUS_BLUE, HIGH); delay(200); digitalWrite(LED_FOCUS_BLUE, LOW);
    digitalWrite(LED_RELAX_GREEN, HIGH); delay(200); digitalWrite(LED_RELAX_GREEN, LOW);
    digitalWrite(LED_CUE_RED, HIGH); delay(200); digitalWrite(LED_CUE_RED, LOW);
    
    // Safety
    analogWrite(ARENA_MOTOR_PWM, 0);

    while (!Serial) { delay(10); } // Wait for Web Serial Connect
}

void loop() {
    unsigned long currentMillis = millis();
    
    // 1. Core EEG Streaming (Sends raw voltage over JSON to the dashboard processor)
    if (currentMillis - lastSampleTime >= SAMPLE_RATE_MS) {
        lastSampleTime = currentMillis;
        int raw_adc_value = analogRead(EEG_PIN);
        
        StaticJsonDocument<64> doc;
        doc["value"] = raw_adc_value;
        serializeJson(doc, Serial);
        Serial.println();
    }

    // 2. Listen for Incoming Commands from Web browser Javascript (via SerialEngine.js)
    if (Serial.available() > 0) {
        String command = Serial.readStringUntil('\n');
        command.trim();
        handleGameCommands(command);
    }
}

// --- Physical Interactive Game Logic ---
// We let the Dashboard's `brainGameEngine.js` do the hard math, and it simply beams commands here!

void handleGameCommands(String cmd) {
    
    // ====== TELEKINESIS GAME (Physical Motor Thrust) ======
    if (cmd == "MC_THRUST_LOW") {
        analogWrite(ARENA_MOTOR_PWM, 100);    // Weak float
        digitalWrite(LED_FOCUS_BLUE, HIGH);
    } 
    else if (cmd == "MC_THRUST_HIGH") {
        analogWrite(ARENA_MOTOR_PWM, 255);    // Full speed boost!
        digitalWrite(LED_FOCUS_BLUE, HIGH);
    } 
    else if (cmd == "MC_COAST") {
        analogWrite(ARENA_MOTOR_PWM, 50);     // Losing focus, slowing down
        digitalWrite(LED_FOCUS_BLUE, LOW);
    } 
    else if (cmd == "MC_STOP") {
        analogWrite(ARENA_MOTOR_PWM, 0);      // Stopped
        digitalWrite(LED_FOCUS_BLUE, LOW);
    }
    
    // ====== ZEN MATCH GAME (LED Grid Feedback) ======
    else if (cmd == "ZEN_SUSTAINING") {
        digitalWrite(LED_RELAX_GREEN, HIGH);  // Player is building Alpha
    }
    else if (cmd == "ZEN_DROP") {
        digitalWrite(LED_RELAX_GREEN, LOW);   // Player lost Alpha focus
    }
    else if (cmd == "ZEN_UNLOCK") {
        // Flash green three times for success!
        for(int i=0; i<3; i++){ digitalWrite(LED_RELAX_GREEN, HIGH); delay(100); digitalWrite(LED_RELAX_GREEN, LOW); delay(100); }
    }
    
    // ====== REACTION TIME GAME (Strobe Cue) ======
    else if (cmd == "REFLEX_CUE_ON") {
        digitalWrite(LED_CUE_RED, HIGH);      // Flash the physical red light in the room!
    }
    else if (cmd == "REFLEX_SPIKE_DETECTED") {
        digitalWrite(LED_CUE_RED, LOW);       // Brain spike caught, turn off cue.
    }

    // ====== GENERAL / SAFETY ======
    else if (cmd == "ESTOP" || cmd == "PAUSE_ALL") {
        analogWrite(ARENA_MOTOR_PWM, 0);
        digitalWrite(LED_FOCUS_BLUE, LOW);
        digitalWrite(LED_RELAX_GREEN, LOW);
        digitalWrite(LED_CUE_RED, LOW);
    }
}
