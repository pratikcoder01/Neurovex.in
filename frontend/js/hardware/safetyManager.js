// safetyManager.js
// Watches over hardware status and signal confidence. Locks all systems if dangerous conditions arise.

export class SafetyManager {
    constructor(carController, brainEngine) {
        this.carController = carController;
        this.brainEngine = brainEngine;

        this.isConnected = false;
        this.lastSignalTime = 0;

        this.monitorInterval = setInterval(() => this.checkSafety(), 500);
    }

    setConnected(state) {
        this.isConnected = state;
        if (!state) {
            this.emergencyStop("Hardware Disconnected");
        } else {
            this.carController.setLocked(false);
        }
    }

    updateSignal(confidence) {
        this.lastSignalTime = performance.now();
        if (this.isConnected && this.brainEngine.isActive) {
            if (confidence < 50) {
                this.emergencyStop("Signal Lost / High Noise");
                document.dispatchEvent(new CustomEvent('neurovex:safetyAlert', { detail: "Weak Signal (Confidence < 50%)!" }));
            }
        }
    }

    checkSafety() {
        if (!this.isConnected) return;

        const now = performance.now();
        // If 1 second passes with no EEG data and we are relying on Mind Control
        if (now - this.lastSignalTime > 1000 && this.brainEngine.isActive) {
            this.emergencyStop("EEG Stream Timeout");
            document.dispatchEvent(new CustomEvent('neurovex:safetyAlert', { detail: "Sensor Offline" }));
        }
    }

    emergencyStop(reason) {
        console.warn(`[SAFETY] Emergency Stop Triggered: ${reason}`);
        this.brainEngine.stop();
        this.carController.stop();
        this.carController.setLocked(true); // Lock manual overrides
    }

    releaseLock() {
        this.carController.setLocked(false);
    }
}
