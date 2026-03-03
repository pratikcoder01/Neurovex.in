// hardwareController.js
// Directs physical car movement over Serial based on UI thresholds and Signal conditions

export class HardwareController {
    constructor(serialEngine) {
        this.serialEngine = serialEngine;
        this.focusThreshold = 65;
        this.isMoving = false;

        // Fallback safety triggers
        this.lastMoveTime = 0;
        this.safetyTimeoutMs = 1500;
        this.overrideActive = false;
    }

    setThreshold(val) {
        this.focusThreshold = val;
    }

    enableOverride(enabled) {
        this.overrideActive = enabled;
        if (!enabled) this.emergencyStop();
    }

    // Runs inside the loop triggered by the signalProcessor computations
    processFocus(focusValue) {
        if (this.overrideActive) return; // Ignore brain signals if overridden manually

        const now = Date.now();

        if (focusValue >= this.focusThreshold) {
            // Signal intent detected -> Push Forward
            if (!this.isMoving) {
                this.serialEngine.sendCommand('FORWARD');
                this.isMoving = true;
            }
            this.lastMoveTime = now;
        } else {
            // Signal absent -> Check timeout constraints to avoid jitter
            if (this.isMoving && ((now - this.lastMoveTime) > this.safetyTimeoutMs)) {
                this.emergencyStop();
            }
        }
    }

    manualCommand(direction) {
        // 'FORWARD', 'LEFT', 'RIGHT', 'STOP'
        this.serialEngine.sendCommand(direction);
        this.isMoving = (direction !== 'STOP');
    }

    emergencyStop() {
        this.serialEngine.sendCommand('ESTOP');
        this.isMoving = false;
    }
}
