# NEUROVEX
## AI Powered Brain Computer Interface for Assistive Control Systems
### **Comprehensive Engineering Project Report**

---

## **TABLE OF CONTENTS**
1. ABSTRACT
2. INTRODUCTION
3. PROBLEM STATEMENT
4. OBJECTIVES OF THE PROJECT
5. SYSTEM OVERVIEW
6. SYSTEM ARCHITECTURE
7. HARDWARE COMPONENTS
8. SOFTWARE COMPONENTS
9. DATABASE DESIGN
10. WORKING PRINCIPLE
11. SIGNAL PROCESSING
12. DASHBOARD SYSTEM
13. HARDWARE CONTROL SYSTEM
14. BRAIN TRAINING GAMES
15. CLOUD INTEGRATION
16. REAL-TIME DATA FLOW
17. TESTING AND VALIDATION
18. ADVANTAGES
19. APPLICATIONS
20. FUTURE IMPROVEMENTS
21. CONCLUSION

---

## **1. ABSTRACT**

The Neurovex project introduces a state-of-the-art Brain-Computer Interface (BCI) designed as an assistive control system. This project establishes a direct line of communication between the human brain and external hardware, enabling telekinetic-style control of a robotic vehicle through real-time electroencephalography (EEG) data. Built entirely on an integrated hardware-software architecture, Neurovex captures microvolt-level electrical brainwave activity using a specialized non-invasive sensor, digitizes the signal via an ESP32 microcontroller, and processes the telemetry in an expansive, browser-based web application.

Through sophisticated signal processing methodologies—including rolling standard deviation for variance mapping and Exponential Moving Average (EMA) smoothing—the system extracts fundamental neural states: Focus (Beta-wave correlation), Relaxation (Alpha-wave correlation), Stress, and Fatigue. These neuro-metrics are utilized for bi-directional applications: autonomous assistive hardware control (driving a robotic chassis) and cognitive neuro-feedback training via gamified environments. Neurovex represents a highly scalable, low-latency, and cost-effective approach to modern BCI technology for assistive mobility and human-computer interaction (HCI).

---

## **2. INTRODUCTION**

A Brain-Computer Interface (BCI) is an advanced technological framework that enables direct communication between the brain's electrical activity and an external device. Historically, BCI systems were confined to rigorous clinical settings, requiring bulky multi-channel EEG caps, conductive gels, and immense computational power for signal decoding. However, advancements in embedded systems, cloud computing, and single-node dry-electrode sensors have paved the way for consumer and assistive BCI applications.

Neurovex was created to bridge the gap between complex neurological data and practical, everyday assistive robotics. By leveraging the Web Serial API and edge-computing on an ESP32 microcontroller, Neurovex eliminates the need for expensive intermediary signal-processing servers. The system interprets human intent—specifically, sustained concentration or deep relaxation—and translates these cognitive states into deterministic mechanical actuation. This technology holds profound implications for individuals suffering from severe motor impairments, offering a hands-free, voice-free method of interacting with their physical environment.

---

## **3. PROBLEM STATEMENT**

Individuals suffering from severe neuromuscular disorders—such as Amyotrophic Lateral Sclerosis (ALS), high-level spinal cord injuries, quadriplegia, or cerebral palsy—often retain complete cognitive faculties but lose all voluntary motor control. Traditional assistive devices rely heavily on residual mobility, such as joystick manipulation, eye-tracking, or voice commands, which may not be viable for patients with locked-in syndrome or severe dysarthria.

Current commercial BCI solutions are prohibitively expensive, mathematically opaque, and require substantial technical expertise to operate and calibrate. Furthermore, they suffer from high latency due to external cloud-processing dependencies for signal classification. There is a critical need for an accessible, low-latency, localized BCI system that can interpret raw neurological telemetry and safely actuate mechanical devices in real-time without overwhelming the user interface.

---

## **4. OBJECTIVES OF THE PROJECT**

The primary objectives of the Neurovex project are defined as follows:
1. **Develop a Low-Latency Signal Pipeline:** Create a hardware-to-browser communication protocol capable of streaming EEG data at a minimum of 250Hz with sub-10ms latency.
2. **Implement Edge-Based Signal Processing:** Design mathematical algorithms within JavaScript to dynamically extract Focus, Relaxation, Stress, and Fatigue metrics from raw analog variance without relying on external Python/MATLAB servers.
3. **Establish Actuation Control Mechanisms:** Build an ESP32-driven robotic framework capable of translating cognitive thresholds into physical hardware movement (Forward, Left, Right, Stop).
4. **Ensure Operational Safety:** Implement a hardware and software `SafetyManager` to analyze signal confidence/noise ratios and execute emergency stops during sensor detachment or electrical brownouts.
5. **Provide Cognitive Gamification:** Develop integrated web-based Brain Games (Telekinesis, Zen Match, Beta Reflex) to allow users to train their neural pathways to generate stronger, more recognizable EEG patterns.
6. **Integrate Cloud Analytics:** Maintain secure, authenticated medical data logging via Supabase for historical session analysis and CSV exports.

---

## **5. SYSTEM OVERVIEW**

The Neurovex ecosystem is horizontally integrated across three distinct domains: Physical Hardware (Sensor & Actuator), Edge/Client Software (Dashboard & Processing), and Cloud Service (Supabase Authentication & Storage).

At its core, a human user wears a single-channel dry-electrode EEG sensor placed on the forehead (Fp1 position in the 10-20 international system) to monitor the prefrontal cortex. As the user performs cognitive tasks, the sensor outputs analog voltage fluctuations. The ESP32 digitizes this analog data at 250Hz, wrapping it into JSON payloads mapped as `{"value": x}`. This data hops through a USB Serial connection directly into a Google Chrome environment. 

Inside the browser, the Neurovex Dashboard intercepts the Web Stream. The `signalProcessor.js` core calculates the standard deviation of a rolling 250-length buffer to determine neuro-metrics. If the user decides to initiate "Brain Control", the parsed Focus state is fed into the `brainControlEngine.js`. If Focus breaches the user-defined threshold (e.g., >65%) for a sustained 500 milliseconds, the engine fires a 'FORWARD' string back down the USB cable to the ESP32. The ESP32 interprets the serial command, toggles the L298N Motor Driver, and the robotic vehicle moves forward.

---

## **6. SYSTEM ARCHITECTURE**

The system architecture features a bi-directional, full-duplex communication model relying upon synchronous asynchronous processing.

1. **The Telemetry Stream (Uplink):**
   `Brain` -> `EEG Sensor` -> `ESP32 ADC (Pin 34)` -> `UART over USB (115200 Baud)` -> `Web Serial API` -> `JavaScript Array Buffer`
2. **The Processing Core (Client):**
   `Array Buffer` -> `SignalProcessor.js (Variance/EMA Math)` -> `State Machine (Focus/Alpha/Beta/Confidence)` -> `DOM Rendering (Canvas/Meters)`
3. **The Command Stream (Downlink):**
   `BrainControlEngine.js` -> `CarController.js` -> `Web Serial Writer` -> `ESP32 UART RX` -> `L298N Motor Driver` -> `DC Motors`

**Architecture Layout:**
By utilizing the browser's V8 Javascript engine for mathematics rather than the ESP32, Neurovex preserves the microcontroller's limited processing cycles strictly for maintaining the strict 4-millisecond (250Hz) analog sampling rate and handling motor PWM duties. The cloud architecture (Supabase) operates asynchronously via REST API calls, ensuring that database commits never block the main thread responsible for real-time safety and hardware control.

---

## **7. HARDWARE COMPONENTS**

### **ESP32 Microcontroller**
The ESP32 serves as the central hardware nervous system. It possesses a 12-bit Analog-to-Digital Converter (ADC), allowing it to read EEG sensor voltages from 0-4095, providing high-resolution brainwave mapping. 
- *Role:* Captures raw sensor data via Pin 34 and controls the L298N Motor driver via Digital Pins (12, 13, 14, 25, 26, 27). 

### **EEG Sensor Module**
A single-channel dry-electrode sensor (frequently utilizing a NeuroSky TGAM1 core or custom analog amplifier cascade) which filters out ambient 50Hz/60Hz AC electrical noise and amplifies microvolt signals from the scalp.
- *Role:* Biological signal acquisition and artifact filtering.

### **L298N Motor Driver**
A dual H-Bridge motor driver capable of handling high-current loads required by DC motors. It isolates the high-voltage motor power from the sensitive 3.3V logic signals of the ESP32.
- *Role:* Acts as a high-current switch, taking logic commands (HIGH/LOW) from the ESP32 to reverse motor polarity for differential steering.

### **DC Motors / Chassis**
Standard 12V brushed DC gear motors attached to a mechanical chassis.
- *Role:* Provides physical locomotion to validate the telekinetic interface.

### **Power Supply System**
To prevent stall-current-induced logic brownouts, the physical architecture relies on an isolated power infrastructure. High-drain Lithium-Ion batteries (18650s) deliver 12V directly to the L298N motor block, while the ESP32 is powered via the USB connection. A common Ground (GND) wire unifies the logic voltages across the chassis.

---

## **8. SOFTWARE COMPONENTS**

### **Frontend Framework**
- **HTML5 & Vanilla JavaScript (ES6+):** Utilized for maximum performance and minimum bundle overhead, bypassing heavier state-driven frameworks like React to ensure zero garbage-collection stutter during live hardware telemetry rendering.
- **Tailwind CSS:** Handled through a PostCSS/CDN pipeline for rapid, modern, utility-first UI design featuring glassmorphism, responsive arenas, and flex-layouts.
- **Canvas API:** Facilitates the 60FPS fluid drawing of the live EEG waveform (`drawWave`), calculating mid-points dynamically to center turbulent signals.

### **Core JavaScript Modules**
- `serialEngine.js`: Manages the `navigator.serial` object. Handles opening data streams, attaching `TextDecoderStream`, parsing incoming JSON, and maintaining the writable stream for hardware commands.
- `signalProcessor.js`: The mathematical heart. Converts raw integer points into floating-point neuro-metrics using dynamic variance mapping.
- `brainControlEngine.js`: A state-machine that accepts neuro-metrics, manages trailing timestamps, checks for sustained threshold breaches, and conditionally fires motor commands.
- `safetyManager.js`: The watchdog constraint system. Continually monitors the "Confidence" metric and `performance.now()` timestamps. Triggers an Immediate `ESTOP` if data is lost for >1000ms.

---

## **9. DATABASE DESIGN**

Neurovex utilizes **Supabase** (an open-source Firebase alternative based on PostgreSQL). The schema is fully relational.

**1. `profiles` Table**
- `id` (UUID, Primary Key, Maps to Auth.users)
- `full_name` (Text)
- `created_at` (Timestamp)

**2. `sessions` Table**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key -> profiles.id)
- `session_name` (Text)
- `duration_seconds` (Integer)
- `avg_focus` (Integer)
- `created_at` (Timestamp)

**3. `eeg_data` Table**
- `id` (BigInt, Primary Key)
- `session_id` (UUID, Foreign Key -> sessions.id)
- `timestamp_ms` (BigInt)
- `raw_value` (Integer)
- `focus_score` (Integer)

**4. `hardware_logs` Table**
- `id` (BigInt)
- `event_type` (Text — e.g., "ESTOP", "CONNECT", "MOVE_FORWARD")
- `trigger_reason` (Text)

Row Level Security (RLS) is strictly enforced at the Postgres level, ensuring that users can only `SELECT` and `INSERT` rows where `user_id == auth.uid()`.

---

## **10. WORKING PRINCIPLE**

The operation of the Neurovex system follows a strict real-time sequential pipeline:
1. **Biological Acquisition:** Neurons in the user's prefrontal cortex fire during concentration. The resulting electrical field propagates through the skull and is picked up by the dry electrode.
2. **Digitization:** The ESP32 `analogRead` function samples this voltage every 4ms, producing 250 payloads a second over USB as `{"value": 1450}`.
3. **Stream Decoding:** The browser's Web Serial API receives the stream, parses the JSON payload, and pushes the integer to the `SignalProcessor` buffer.
4. **Calculus Application:** The `SignalProcessor` calculates the signal Standard Deviation. Huge spikes (variance > 100) are classified as physical movement/noise and drop the `Confidence` score. Medium-to-high variances correspond to Beta waves (`Focus`). Micro-variances correspond to Alpha waves (`Relaxation`).
5. **EMA Smoothing:** The raw Focus score is jagged. An Exponential Moving Average (`Smoothed = (Alpha * Raw) + ((1-Alpha) * Smoothed)`) is applied to prevent instantaneous UI flashing.
6. **Engine Actuation:** The `BrainControlEngine` observes the smoothed focus passing 65%. It waits 500ms. If focus holds, it calls `carController.forward()`.
7. **Physical Execution:** `carController` writes `"FORWARD\n"` to the Serial output stream. The ESP32 parses this string and rapidly toggles Digital Pins 12, 13, 27, and 26 to spin the magnetic fields of the DC motors.

---

## **11. SIGNAL PROCESSING**

EEG data operates in distinctly categorized frequency bands:
- **Delta (1-4 Hz):** Deep, dreamless sleep.
- **Theta (4-8 Hz):** Deep meditation / REM sleep.
- **Alpha (8-13 Hz):** Relaxed, awake, eyes closed. Mind wandering.
- **Beta (13-30 Hz):** Active thinking, singular focus, high alertness.
- **Gamma (30+ Hz):** Advanced cognitive processing and motor planning.

**Neurovex Focus Detection Algorithm:**
Due to computational constraints of running Fast Fourier Transforms (FFTs) entirely in-browser without halting the main UI thread, Neurovex employs a temporal variance approximation approach. Concentration (Beta waves) generates a higher amplitude variability than resting states, but lower variability than physical muscle artifacts (EMG noise). 
The formula deployed in `signalProcessor.js`:
1. Calculate Mean: `μ = Σ(xi) / N` 
2. Calculate Variance: `σ² = Σ(xi - μ)² / N`
3. Map Deviation: `Focus = f(σ)` where optimal focus falls within a standard deviation band of `20 < σ < 100`. Signal noise `σ > 100` triggers the artifact rejection filter, lowering the Confidence Score and preventing false-positive actuation.

---

## **12. DASHBOARD SYSTEM**

The dashboard acts as the telemetric control center of Neurovex. 
- **The Waveform Graph:** A dynamically scaled HTML5 Canvas. To accurately display the EEG signal, which naturally drifts up and down the Y-axis due to galvanic skin response changes, the rendering algorithm subtracts the rolling mean from each point before drawing it. This auto-centers the wave perfectly.
- **Biometric Displays:** Dynamic progress bars update in real-time, displaying Focus (Blue), Confidence (Emerald/Red), Stress, and Fatigue.
- **Session Manager:** Captures state chunks array and permits the user to hit "Record Session". Upon saving, data is passed to the Supabase integration module, or can act locally to generate a downloadable CSV `Blob` containing timestamped multi-metric analysis.

---

## **13. HARDWARE CONTROL SYSTEM**

The Car architecture (`hardware.html`) bifurcates control methodologies.

**Manual Control Mode:**
A failsafe and debugging mode. Event listeners are bound to Keyboard `keydown` ('W', 'A', 'S', 'D'). This transmits immediate movement strings, completely bypassing the brain engine, but relies on the Web Serial connection remaining stable.

**Brain Control Mode:**
Disables manual keyboard events and gives exclusive hardware authority to the `BrainControlEngine`. 
- **Focus Thrust Sub-Mode:** Movement demands sustained concentration. The user adjusts a visual slider to set their personalized Focus Threshold (e.g., 65%). 
- **Relax Stop Sub-Mode:** Used for emergency braking. The user must intentionally relax (spike Alpha waves) to forcefully drop the motor PWM to zero. 

**Safety Watchdog:**
If the Confidence Score drops below 50% (due to heavy blinking, jaw clenching, or poor hardware connection), the `SafetyManager` immediately injects a `"STOP"` command into the write buffer, activates the UI Emergency Lockout, and prevents the car from driving into obstacles wildly.

---

## **14. BRAIN TRAINING GAMES**

A unique feature of Neurovex is cognitive gamification. BCIs require users to learn how to actively control their neural outputs, a process called Neurofeedback Training. Neurovex provides a `games.html` suite with embedded web-audio synthesized sound effects.

1. **Telekinesis Arena:** Tests sheer magnitude of Beta-wave output. The user stares at an interactive 3D-styled cube and attempts to push it physically across the screen utilizing mental math or intense visualization to spike focus.
2. **Zen Match:** Tests parasympathetic nervous system control. The UI features 16 locked tiles. The user is forced to close their eyes and lower their heart rate. Holding an Alpha-dominant state for 2 seconds recursively unlocks the patterns.
3. **Beta Reflex:** A neurological reaction-time drill. An orb disappears. The moment the orb reappears on screen, the user's brain processes the visual cue and involuntarily spikes Beta-waves. The system measures the exact millisecond latency between visual DOM rendering and the biological spike.
4. **Leaderboards:** Utilizes Supabase cloud syncing to display the fastest reaction times globally among recorded user profiles. 

---

## **15. CLOUD INTEGRATION**

The Neurovex Backend heavily utilizes the Supabase SDK (`@supabase/supabase-js`).
- **Auth Service:** Implements JWT-based user authentication. Users can sign up securely, ensuring their medical and telemetry data remains sandboxed.
- **Data Insertion:** Throughout a 5-minute study session, thousands of integer points are generated. To preserve REST API limits, the UI buffers this data and commits large batch inserts (`.insert([...data])`) at the end of the session.
- **Export Logic:** Data portability is crucial for medical BCI evaluation. A secondary function stringifies the telemetry arrays, creates a `Content-Type: text/csv` Blob, and invokes an anchor tag download to yield an `eeg_export.csv` file for external analysis in Python Pandas or Excel.

---

## **16. REAL-TIME DATA FLOW**

The operational lifecycle of a single neural command (Latencies are approximated):
1. **t=0ms:** Concept formulation in User's Prefrontal Cortex.
2. **t=2ms:** Voltage fluctuation detected by sensor, passed via wire to ESP32 Pin 34.
3. **t=4ms:** ESP32 `analogRead()` converts voltage to int `1450`, serializes JSON.
4. **t=6ms:** Bytes cross the USB UART chip at 115200 baud to the PC OS.
5. **t=8ms:** Chrome Web Serial API stream resolves the promise, JavaScript splits the string `\n` character.
6. **t=10ms:** `SignalProcessor` averages the buffer. Focus score crests above 65%.
7. **t=510ms:** `BrainControlEngine` confirms 500ms locked-in constraint is met.
8. **t=512ms:** Web Serial API flushes `"FORWARD"` string back to USB port.
9. **t=515ms:** ESP32 loop matches string `"FORWARD"`, sets `MOTOR_A_PWM` to HIGH.
10. **t=525ms:** L298N completes transistor switching, wheel begins torque generation.

Total mechanical latency from brain to mechanical torque is heavily front-loaded by the necessary 500ms safety-sustain software lock (to prevent jitter). Absolute electrical latency is under 20ms.

---

## **17. TESTING AND VALIDATION**

Extensive unit and field testing was executed to validate system integrity:
1. **Hardware Stress Testing:** Analyzed the stall-current of the DC motors to identify "brown-out" circumstances on the ESP32. Implementing isolated power grids with a shared-Ground logic path fully resolved hardware reset instability.
2. **Confidence/Noise Rejection:** Deliberate physical artifacts (coughing, violent head shaking) were introduced. The standard deviation algorithms successfully identified the high-amplitude anomalies and forcefully dropped confidence to 0%, proving the efficacy of the `SafetyManager`.
3. **Firmware Verification:** A known ESP32 IDE bug regarding `analogWrite` PWM failures natively was bypassed by modifying the C++ firmware to utilize absolute digital state switching (`digitalWrite`), ensuring maximum reliability during motor actuation sequences.

---

## **18. ADVANTAGES**

- **Absolute Portability:** Requires zero installation of server environments like Node.js or Python on the host machine. The whole system runs in a standard Google Chrome web browser.
- **Zero-Latency Processing:** By conducting calculus client-side via V8 JavaScript, the system mathematically circumvents the latency lag of traditional API-driven BCI systems.
- **Platform Agnostic Control:** The Web Serial API allows the HTML dashboard to run seamlessly on Windows, macOS, or Linux without OS-specific drivers.
- **Cost Efficiency:** Utilizing standard ESP32 microcontrollers and budget-friendly L298N drivers shatters the $1000+ barrier of clinical BCI systems, democratizing access to assistive technology.

---

## **19. APPLICATIONS**

The architecture designed within Neurovex serves multiple immediate domains:
1. **Assistive Mobility:** Telekinetic control routines that power the Neurovex car can be linearly scaled up to control motorized wheelchairs for quadriplegic individuals.
2. **Smart Home Integration:** Focus thresholds can be rerouted through the internet (via WebSockets) to trigger standard IoT relays (lights, doors, HVAC).
3. **Neurological Rehabilitation:** The Gamification suite provides victims of stroke or Traumatic Brain Injury (TBI) with an engaging mechanism to retrain specific localized neural pathways.
4. **Esports & High-Performance:** Measuring raw `Beta Reflex` latencies provides analytical insight for competitive athletes and fighter pilots requiring superhuman reaction training.

---

## **20. FUTURE IMPROVEMENTS**

While the Neurovex MVP represents a complete ecosystem, future iterations can introduce:
1. **Machine Learning / Fast Fourier Transforms:** Upgrading the client-side JavaScript to utilize TensorFlow.js for localized deep-learning classification. This would allow the system to differentiate commands like `"Think Left"` vs `"Think Right"` using multivariable FFT arrays, rather than relying strictly on Focus thresholds.
2. **Wireless Telemetry Protocols:** Bypassing the USB serial constraint by utilizing the ESP32's native Bluetooth Low Energy (BLE) or WebSockets over WiFi functionality for entirely untethered user mobility.
3. **Multi-Channel Nodes:** Implementing multiple electrodes over the motor cortex (C3/C4 sites) to capture distinct motor-imagery tasks (imagining moving a left hand vs right hand).
4. **Prosthetic Actuation:** Replacing the dual-motor robotic car architecture with fine-motor servo arrays to control 3D-printed bionic hands.

---

## **21. CONCLUSION**

The Neurovex project successfully demonstrates that advanced Brain-Computer Interface technology is no longer constrained to heavily funded research laboratories. By unifying affordable edge microcontrollers (ESP32) with cutting-edge web technologies (Web Serial API, Supabase) and mathematical signal mapping, the project achieved a unified, low-latency telemetric system. 

Neurovex not only provides a highly responsive assistive control system capable of actuating robotic vehicles via pure concentration, but it introduces an ethical, accessible layer of cognitive training and data logging. It serves as a comprehensive proof-of-concept that human intent can be digitized, interpreted, and weaponized for good—granting autonomy and interactivity to those who may have been silenced by physical limitations. 

---
*End of Report*
