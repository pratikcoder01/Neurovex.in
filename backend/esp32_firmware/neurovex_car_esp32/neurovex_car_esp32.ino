// neurovex_car_esp32.ino
// Firmware for the Neurovex Car ESP32
// Listens for serial commands from the dashboard to control the L298N Motor Driver

const int BAUD_RATE = 115200;

// --- Motor Pins (e.g. L298N Motor Driver) ---
const int MOTOR_A_DIR1 = 12;
const int MOTOR_A_DIR2 = 13;
const int MOTOR_A_PWM  = 14;

const int MOTOR_B_DIR1 = 27;
const int MOTOR_B_DIR2 = 26;
const int MOTOR_B_PWM  = 25;

void setup() {
    Serial.begin(BAUD_RATE);

    // Motor setup
    pinMode(MOTOR_A_DIR1, OUTPUT);
    pinMode(MOTOR_A_DIR2, OUTPUT);
    pinMode(MOTOR_A_PWM, OUTPUT);
    
    pinMode(MOTOR_B_DIR1, OUTPUT);
    pinMode(MOTOR_B_DIR2, OUTPUT);
    pinMode(MOTOR_B_PWM, OUTPUT);
    
    stopMotors();
    
    // Wait for Serial before starting loop
    while (!Serial) { delay(10); }
    Serial.println("CAR_READY");
}

void loop() {
    // Listen for Incoming Command Strings from Dashboard
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
    } else if (cmd == "BACKWARD") {
        moveBackward();
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
    digitalWrite(MOTOR_A_PWM, HIGH);

    digitalWrite(MOTOR_B_DIR1, HIGH);
    digitalWrite(MOTOR_B_DIR2, LOW);
    digitalWrite(MOTOR_B_PWM, HIGH);
}

void moveBackward() {
    // Both motors backward
    digitalWrite(MOTOR_A_DIR1, LOW);
    digitalWrite(MOTOR_A_DIR2, HIGH);
    digitalWrite(MOTOR_A_PWM, HIGH);

    digitalWrite(MOTOR_B_DIR1, LOW);
    digitalWrite(MOTOR_B_DIR2, HIGH);
    digitalWrite(MOTOR_B_PWM, HIGH);
}

void moveLeft() {
    // Left wheel back, Right wheel forward
    digitalWrite(MOTOR_A_DIR1, LOW);
    digitalWrite(MOTOR_A_DIR2, HIGH);
    digitalWrite(MOTOR_A_PWM, HIGH);

    digitalWrite(MOTOR_B_DIR1, HIGH);
    digitalWrite(MOTOR_B_DIR2, LOW);
    digitalWrite(MOTOR_B_PWM, HIGH);
}

void moveRight() {
    // Left wheel forward, Right wheel back
    digitalWrite(MOTOR_A_DIR1, HIGH);
    digitalWrite(MOTOR_A_DIR2, LOW);
    digitalWrite(MOTOR_A_PWM, HIGH);

    digitalWrite(MOTOR_B_DIR1, LOW);
    digitalWrite(MOTOR_B_DIR2, HIGH);
    digitalWrite(MOTOR_B_PWM, HIGH);
}

void stopMotors() {
    // Emergency / Safe state
    digitalWrite(MOTOR_A_PWM, LOW);
    digitalWrite(MOTOR_B_PWM, LOW);
    
    digitalWrite(MOTOR_A_DIR1, LOW);
    digitalWrite(MOTOR_A_DIR2, LOW);
    digitalWrite(MOTOR_B_DIR1, LOW);
    digitalWrite(MOTOR_B_DIR2, LOW);
}
