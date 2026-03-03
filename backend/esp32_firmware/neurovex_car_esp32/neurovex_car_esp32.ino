// neurovex_car_esp32.ino
// Production Real-Time Firmware for Neurovex Car

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
const unsigned long TIMEOUT_MS = 1000; 

// --- Real-Time State ---
hw_timer_t * timer = NULL;
volatile int latestAdcValue = 0;
volatile bool sampleReady = false;

// --- Serial Buffer ---
String inputBuffer = "";

// --- Safety Tracking ---
unsigned long lastCommandTime = 0;

// --- ISR: Hardware Timer ---
// Triggers exactly every 4ms (250Hz)
void IRAM_ATTR onTimer() {
    latestAdcValue = analogRead(EEG_PIN);
    sampleReady = true;
}

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

    // Configure Timer 0
    // ESP32 clock is 80MHz. Prescaler = 80 means 1 tick = 1 microsecond.
    timer = timerBegin(0, 80, true); 
    timerAttachInterrupt(timer, &onTimer, true);
    // 4ms = 4000 microseconds
    timerAlarmWrite(timer, 4000, true);
    timerAlarmEnable(timer);

    lastCommandTime = millis();
}

void loop() {
    // 1. Check strict 250Hz sampling flag
    if (sampleReady) {
        sampleReady = false;
        int adc = latestAdcValue; // Atomic read
        
        StaticJsonDocument<64> doc;
        doc["value"] = adc;
        serializeJson(doc, Serial);
        Serial.println(); 
    }

    // 2. Non-blocking Serial Parsing
    handleSerialInput();

    // 3. Safety Timeout
    if (millis() - lastCommandTime > TIMEOUT_MS) {
        stopAllMotors();
    }
}

// --- Serial Handling ---
void handleSerialInput() {
    while (Serial.available() > 0) {
        char c = Serial.read();
        if (c == '\n') {
            inputBuffer.trim();
            if (inputBuffer.length() > 0) {
                processCommand(inputBuffer);
            }
            inputBuffer = "";
        } else if (c != '\r') {
            inputBuffer += c;
            // Prevent buffer overflow
            if (inputBuffer.length() > 64) {
                inputBuffer = "";
            }
        }
    }
}

void processCommand(String cmd) {
    lastCommandTime = millis();

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

// --- L298N Motor Control Logic ---
void moveForward() {
    digitalWrite(IN1, HIGH);
    digitalWrite(IN2, LOW);
    analogWrite(ENA, 255);
    
    digitalWrite(IN3, HIGH);
    digitalWrite(IN4, LOW);
    analogWrite(ENB, 255);
}

void moveBackward() {
    digitalWrite(IN1, LOW);
    digitalWrite(IN2, HIGH);
    analogWrite(ENA, 255);
    
    digitalWrite(IN3, LOW);
    digitalWrite(IN4, HIGH);
    analogWrite(ENB, 255);
}

void moveLeft() {
    digitalWrite(IN1, HIGH);
    digitalWrite(IN2, LOW);
    analogWrite(ENA, 200);
    
    digitalWrite(IN3, LOW);
    digitalWrite(IN4, LOW);
    analogWrite(ENB, 0);
}

void moveRight() {
    digitalWrite(IN1, LOW);
    digitalWrite(IN2, LOW);
    analogWrite(ENA, 0);
    
    digitalWrite(IN3, HIGH);
    digitalWrite(IN4, LOW);
    analogWrite(ENB, 200);
}

void stopAllMotors() {
    digitalWrite(IN1, LOW);
    digitalWrite(IN2, LOW);
    analogWrite(ENA, 0);
    
    digitalWrite(IN3, LOW);
    digitalWrite(IN4, LOW);
    analogWrite(ENB, 0);
}
