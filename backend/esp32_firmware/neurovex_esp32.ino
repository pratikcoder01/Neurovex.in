// neurovex_esp32.ino
// MVP Firmware for Neurovex Final Year Project
// Streams raw EEG data over Serial (USB) as JSON and listens for motor commands

#include <ArduinoJson.h>

// --- Configuration ---
const int EEG_PIN = 34;            // Analog pin for EEG
const int BAUD_RATE = 115200;      // High speed serial for fast sampling
const unsigned long SAMPLE_RATE_MS = 4; // Approx 250Hz sampling rate

// --- Motor Pins (e.g. L298N Motor Driver) ---
const int MOTOR_A_DIR1 = 12;
const int MOTOR_A_DIR2 = 13;
const int MOTOR_A_PWM  = 14;

const int MOTOR_B_DIR1 = 27;
const int MOTOR_B_DIR2 = 26;
const int MOTOR_B_PWM  = 25;

unsigned long lastSampleTime = 0;

void setup() {
    Serial.begin(BAUD_RATE);
    pinMode(EEG_PIN, INPUT);

    // Motor setup
    pinMode(MOTOR_A_DIR1, OUTPUT);
    pinMode(MOTOR_A_DIR2, OUTPUT);
    pinMode(MOTOR_A_PWM, OUTPUT);
    
    pinMode(MOTOR_B_DIR1, OUTPUT);
    pinMode(MOTOR_B_DIR2, OUTPUT);
    pinMode(MOTOR_B_PWM, OUTPUT);
    
    stopMotors();
    
    // Wait for Serial before starting loop (optional for some boards)
    while (!Serial) { delay(10); }
}

void loop() {
    unsigned long currentMillis = millis();
    
    // 1. Maintain Continuous 250Hz Sampling
    if (currentMillis - lastSampleTime >= SAMPLE_RATE_MS) {
        lastSampleTime = currentMillis;
        int raw_adc_value = analogRead(EEG_PIN);
        
        // Wrap output in JSON format for the Web Serial Engine parsing
        StaticJsonDocument<64> doc;
        doc["value"] = raw_adc_value;
        serializeJson(doc, Serial);
        Serial.println();
    }

    // 2. Listen for Incoming Command Strings
    if (Serial.available() > 0) {
        String command = Serial.readStringUntil('\n');
        command.trim();
        handleCommand(command);
    }
}

// --- Motor Control Logic ---

void handleCommand(String cmd) {
    if (cmd == "FORWARD") {
        moveForward();
    } else if (cmd == "LEFT") {
        moveLeft();
    } else if (cmd == "RIGHT") {
        moveRight();
    } else if (cmd == "STOP" || cmd == "ESTOP") {
        stopMotors();
    }
}

void moveForward() {
    // Both motors forward
    digitalWrite(MOTOR_A_DIR1, HIGH);
    digitalWrite(MOTOR_A_DIR2, LOW);
    analogWrite(MOTOR_A_PWM, 200);

    digitalWrite(MOTOR_B_DIR1, HIGH);
    digitalWrite(MOTOR_B_DIR2, LOW);
    analogWrite(MOTOR_B_PWM, 200);
}

void moveLeft() {
    // Example Differential steering
    digitalWrite(MOTOR_A_DIR1, LOW);
    digitalWrite(MOTOR_A_DIR2, HIGH);
    analogWrite(MOTOR_A_PWM, 150);

    digitalWrite(MOTOR_B_DIR1, HIGH);
    digitalWrite(MOTOR_B_DIR2, LOW);
    analogWrite(MOTOR_B_PWM, 200);
}

void moveRight() {
    // Example Differential steering
    digitalWrite(MOTOR_A_DIR1, HIGH);
    digitalWrite(MOTOR_A_DIR2, LOW);
    analogWrite(MOTOR_A_PWM, 200);

    digitalWrite(MOTOR_B_DIR1, LOW);
    digitalWrite(MOTOR_B_DIR2, HIGH);
    analogWrite(MOTOR_B_PWM, 150);
}

void stopMotors() {
    // Emergency / Safe state
    analogWrite(MOTOR_A_PWM, 0);
    analogWrite(MOTOR_B_PWM, 0);
    
    digitalWrite(MOTOR_A_DIR1, LOW);
    digitalWrite(MOTOR_A_DIR2, LOW);
    digitalWrite(MOTOR_B_DIR1, LOW);
    digitalWrite(MOTOR_B_DIR2, LOW);
}
