// neurovex_car_esp32.ino
// Custom Firmware for Neurovex Car using L298N and USB Serial

#include <ArduinoJson.h>

// --- Pin Definitions ---
// Motor A (Right Motor)
#define ENA 25
#define IN1 26
#define IN2 27

// Motor B (Left Motor)
#define ENB 32
#define IN3 33
#define IN4 14

// EEG Analog Input
#define EEG_PIN 34

// --- Configuration ---
const int BAUD_RATE = 115200;      
const unsigned long SAMPLE_RATE_MS = 4; // Approx 250Hz sampling
unsigned long lastSampleTime = 0;

void setup() {
    Serial.begin(BAUD_RATE);
    
    // Motor pin setups
    pinMode(ENA, OUTPUT);
    pinMode(IN1, OUTPUT);
    pinMode(IN2, OUTPUT);
    
    pinMode(ENB, OUTPUT);
    pinMode(IN3, OUTPUT);
    pinMode(IN4, OUTPUT);
    
    // EEG Input
    pinMode(EEG_PIN, INPUT);
    
    stopAllMotors(); // Failsafe startup

    // Loop until serial connected (for certain esp32 variants)
    while (!Serial) { delay(10); } 
}

void loop() {
    unsigned long currentMillis = millis();
    
    // 1. Maintain Continuous 250Hz EEG Sampling
    if (currentMillis - lastSampleTime >= SAMPLE_RATE_MS) {
        lastSampleTime = currentMillis;
        int raw_adc_value = analogRead(EEG_PIN);
        
        StaticJsonDocument<64> doc;
        doc["value"] = raw_adc_value;
        serializeJson(doc, Serial);
        Serial.println();     // Must send newline for Web Serial Parser
    }

    // 2. Read Incoming Commands from Browser (via USB)
    if (Serial.available() > 0) {
        String command = Serial.readStringUntil('\n');
        command.trim();
        handleMovement(command);
    }
}

// --- L298N Motor Control Logic ---
void handleMovement(String cmd) {
    if (cmd == "FORWARD") {
        moveForward();
    } else if (cmd == "BACKWARD") {
        moveBackward();
    } else if (cmd == "LEFT") {
        moveLeft();
    } else if (cmd == "RIGHT") {
        moveRight();
    } else if (cmd == "STOP" || cmd == "ESTOP") {
        stopAllMotors();
    }
}

void moveForward() {
    // Motor A
    digitalWrite(IN1, HIGH);
    digitalWrite(IN2, LOW);
    analogWrite(ENA, 255); // Full Speed
    
    // Motor B
    digitalWrite(IN3, HIGH);
    digitalWrite(IN4, LOW);
    analogWrite(ENB, 255); // Full Speed
}

void moveBackward() {
    // Motor A
    digitalWrite(IN1, LOW);
    digitalWrite(IN2, HIGH);
    analogWrite(ENA, 255);
    
    // Motor B
    digitalWrite(IN3, LOW);
    digitalWrite(IN4, HIGH);
    analogWrite(ENB, 255);
}

void moveLeft() {
    // Pivot Left (Motor A Forward, Motor B Stopped/Slow)
    digitalWrite(IN1, HIGH);
    digitalWrite(IN2, LOW);
    analogWrite(ENA, 200);
    
    digitalWrite(IN3, LOW);
    digitalWrite(IN4, LOW);
    analogWrite(ENB, 0);
}

void moveRight() {
    // Pivot Right (Motor B Forward, Motor A Stopped/Slow)
    digitalWrite(IN1, LOW);
    digitalWrite(IN2, LOW);
    analogWrite(ENA, 0);
    
    digitalWrite(IN3, HIGH);
    digitalWrite(IN4, LOW);
    analogWrite(ENB, 200);
}

void stopAllMotors() {
    // Emergency / Idle
    digitalWrite(IN1, LOW);
    digitalWrite(IN2, LOW);
    analogWrite(ENA, 0);
    
    digitalWrite(IN3, LOW);
    digitalWrite(IN4, LOW);
    analogWrite(ENB, 0);
}
