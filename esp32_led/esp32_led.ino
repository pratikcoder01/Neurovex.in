/*
  Mind LED Control | ESP32 Receiver
  Listens for "LED_ON" and "LED_OFF" commands over Serial 
  and toggles an LED connected to a GPIO pin.
*/

// Define the GPIO pin where the LED is connected
const int LED_PIN = 2; // Adjust if using a different pin on your ESP32

void setup() {
  // Initialize serial communication at 115200 baud
  Serial.begin(115200);
  
  // Set the LED pin as an output
  pinMode(LED_PIN, OUTPUT);
  
  // Start with LED turned off
  digitalWrite(LED_PIN, LOW);
  
  Serial.println("ESP32 Ready. Waiting for commands...");
}

void loop() {
  // Check if a command is available on the Serial port
  if (Serial.available() > 0) {
    // Read the incoming string until newline
    String command = Serial.readStringUntil('\n');
    command.trim(); // Remove any extra carriage returns or whitespace
    
    // Evaluate the command
    if (command == "LED_ON") {
      digitalWrite(LED_PIN, HIGH);
      Serial.println("ACK: LED turned ON");
    } 
    else if (command == "LED_OFF") {
      digitalWrite(LED_PIN, LOW);
      Serial.println("ACK: LED turned OFF");
    }
  }
}
