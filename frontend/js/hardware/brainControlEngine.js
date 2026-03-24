// brainControlEngine.js
// Analyzes live EEG data against user thresholds to drive the car autonomously.

export class BrainControlEngine {
    constructor(carController) {
        this.carController = carController;
        this.isActive = false;

        // Mode: 'focus', 'relax'
        this.currentMode = 'focus';

        this.focusThreshold = 65;
        this.history = { focus: [], timestamps: [] };

        this.sustainTimeMs = 500; // Require half-second stable lock
        this.lockedInTime = 0;
        this.isMoving = false;
    }

    setMode(mode) {
        this.currentMode = mode;
        this.carController.stop();
        this.isMoving = false;
        this.history = { focus: [], timestamps: [] };
    }

    setThreshold(val) {
        this.focusThreshold = parseInt(val, 10);
    }

    start() {
        this.isActive = true;
    }

    stop() {
        this.isActive = false;
        this.carController.stop();
        this.isMoving = false;
    }

    processSignal(stats) {
        if (!this.isActive) return;

        const now = performance.now();
        const { focus, alpha, beta, confidence } = stats;

        // Exponential smoothing for focus
        const lastFocus = this.history.focus.length > 0 ? this.history.focus[this.history.focus.length - 1] : focus;
        const smoothedFocus = (0.2 * focus) + (0.8 * lastFocus);

        this.history.focus.push(smoothedFocus);
        this.history.timestamps.push(now);

        // Keep last 2 seconds
        if (now - this.history.timestamps[0] > 2000) {
            this.history.focus.shift();
            this.history.timestamps.shift();
        }

        if (this.currentMode === 'focus') {
            this.handleFocusMode(smoothedFocus, confidence, now);
        } else if (this.currentMode === 'relax') {
            this.handleRelaxMode(alpha, beta, smoothedFocus, now);
        }
    }

    handleFocusMode(focus, confidence, timestamp) {
        if (confidence < 60) {
            this.stopMotion();
            return;
        }

        if (focus >= this.focusThreshold) {
            if (this.lockedInTime === 0) {
                this.lockedInTime = timestamp;
            } else if (timestamp - this.lockedInTime >= this.sustainTimeMs && !this.isMoving) {
                this.isMoving = true;
                this.carController.forward();
                document.dispatchEvent(new CustomEvent('neurovex:brainAction', { detail: 'moving' }));
            }
        } else {
            this.lockedInTime = 0;
            if (this.isMoving) {
                this.stopMotion();
            }
        }

        if (focus <= 40 && this.isMoving) {
            this.stopMotion();
        }
    }

    handleRelaxMode(alpha, beta, focus, timestamp) {
        // Example: Only stop the car if deep relaxation is achieved
        if (alpha > beta && focus < 40) {
            if (this.lockedInTime === 0) {
                this.lockedInTime = timestamp;
            } else if (timestamp - this.lockedInTime >= 1000 && this.isMoving) {
                this.stopMotion();
                document.dispatchEvent(new CustomEvent('neurovex:brainAction', { detail: 'stopped_by_relax' }));
            }
        } else {
            this.lockedInTime = 0;
        }
    }

    stopMotion() {
        this.isMoving = false;
        this.carController.stop();
        this.lockedInTime = 0;
        document.dispatchEvent(new CustomEvent('neurovex:brainAction', { detail: 'stopped' }));
    }
}
