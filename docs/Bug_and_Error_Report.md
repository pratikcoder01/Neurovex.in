# Neurovex Architecture: Defect & Technical Debt Report
**Document ID:** NVX-QA-BUG-002  
**Version:** 1.0.0  
**Inspection Date:** March 2026

---

## 1. Executive Summary
A comprehensive static analysis and logic review was performed against the final codebase of the Neurovex system spanning HTML layouts, JS Modules, Supabase API hooks, and ESP32 Firmware. While the system operates beautifully in optimal `localhost` conditions over Chrome, several major architectural risks, redundancy flaws, and platform-specific bugs were identified that require immediate remediation before a "1.0" production release.

---

## 2. High-Severity Bugs (Immediate Fix Required)

### 2.1 Fragmented Engine Duplication
*   **Location:** `/frontend/js/serialEngine.js` vs `/frontend/js/hardware/serialEngine.js`
*   **Description:** During the refactoring of `hardware.html`, a new clean instance of `serialEngine.js` was created inside the `/hardware/` directory. However, `dashboard.html` and `games.html` are statically importing the older version in the parent `/js/` directory.
*   **Impact:** If the serial baud protocol or JSON parser receives an update in one file, it will desynchronize the platform. The other pages will crash or fail to parse data.
*   **Resolution:** Consolidate all files to import exclusively from `frontend/js/hardware/serialEngine.js` and delete the legacy parent wrapper.

### 2.2 ESP32 Sample Drift (Firmware)
*   **Location:** `neurovex_car_esp32.ino` (Line 46 & `millis()` logic)
*   **Description:** The 250Hz sample rate assumes `currentMillis - lastSampleTime >= 4ms`. However, `Serial.readStringUntil()` is a blocking function. When the browser sends a command like "FORWARD", it forces the loop to halt and wait for the carriage return `\n`.
*   **Impact:** Sending commands physically delays the EEG read cycle, dropping the frequency below 250Hz and causing the Javascript `SignalProcessor.js` sliding FFT window to desync its frequency calculations briefly.
*   **Resolution:** Offload the ADC EEG sampling entirely into an ESP32 hardware timer interrupt (`timerBegin`) so it maintains sub-millisecond accuracy independently of the main `loop()` UART text parser.

### 2.3 Local Development Crash on Supabase Environment Variables
*   **Location:** `/frontend/js/backend/supabase.js`
*   **Description:** Calling `import.meta.env` natively throws syntactical context errors when running via plain HTML (Live Server) without `Vite` acting as a strict bundler. 
*   **Impact:** We applied a `try/catch` fallback patch recently, but statically querying `import.meta.env` can still cause mobile browsers or older Safari engines to halt JS execution entirely before the `catch` block fires.
*   **Resolution:** Expose Supabase keys using a runtime config file or enforce the build step via `vite build` prior to all deployments.

---

## 3. Medium-Severity Issues (UX / Technical Debt)

### 3.1 Unhandled `Web Serial API` Browser Rejection
*   **Location:** `/frontend/js/hardware/serialEngine.js`
*   **Description:** `navigator.serial` is an exclusive Chrome / Edge experimental API. iOS, Safari, Firefox, and all mobile environments do completely block this.
*   **Impact:** If a user accesses the dashboard from an iPad or iPhone, the `Connect Hardware` button silently fails or throws an undefined object error under the hood. 
*   **Resolution:** Inject a UI blocker on page load: `if (!navigator.serial) { disableConnectButton(); showWarning("Chrome Required"); }`

### 3.2 Tailwind CDN Production Warning
*   **Location:** `<head>` of all `.html` pages
*   **Description:** Chrome emits a yellow `console.warn` specifying: *"cdn.tailwindcss.com should not be used in production"*.
*   **Impact:** The CDN injects severe performance latency on slow internet connections as it mathematically cross-compiles all DOM classes on every single page load dynamically.
*   **Resolution:** Install Tailwind CLI via Node.js (`npm install -g tailwindcss`) and compile a static `output.css` file containing only the strictly used CSS classes.

### 3.3 Auth Pipeline Null Profiles
*   **Location:** `/frontend/dashboard.html` (Profile render block)
*   **Description:** When the user hits the "Sign Out" button, Supabase securely wipes local tokens. However, prior to kicking the user to `signin.html`, asynchronous rendering loops occasionally attempt to pull `.profile` values from the destroyed auth object, throwing benign but annoying red Console errors. 
*   **Resolution:** Wrap all token-access DOM events in `{ user } = getCurrentUser(); if(!user) return;`.

---

## 4. Low-Severity / Cleanliness

### 4.1 Missing Pattern Match Win State UX
*   **Location:** `games.html` / `patternMatchGame.js`
*   **Description:** When the user unlocks all 16 Zen Match tiles, it throws a rigid browser `alert("You've mastered Zen Match!");`. This violates the premium Apple-style UI requirement.
*   **Resolution:** Replace with a stylized modal popup using Tailwind and CustomEvents.

### 4.2 L298N Flyback Voltage Risk on USB
*   **Location:** Hardware Wire Routing
*   **Description:** If the ESP32 is powered via the same 5V rail as the L298N dual motors, the EMF kickback when `STOP` is invoked could travel into the laptop's USB port, causing the Serial connection to instantly disconnect.
*   **Resolution:** Optocoupler isolation or strict 9V separate battery pack must be mandated for the motors, leaving the ESP32 solely powered via the laptop USB.

---
**Report Generated By:** Neurovex QA Automation Architecture
