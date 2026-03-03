// brainGameEngine.js
// Subscribes to signalProcessor and emits game-ready events

export class BrainGameEngine {
    constructor() {
        this.listeners = {
            onFocusChange: [],
            onAlphaChange: [],
            onBetaSpike: [],
            onConfidenceDrop: [],
            onStateUpdate: []
        };

        // State history to track sustains and spikes
        this.history = {
            focus: [],
            alpha: [],
            beta: [],
            timestamps: []
        };

        this.maxHistory = 100; // Keep roughly ~100 frames

        // Thresholds
        this.focusThreshold = 60;
        this.confidenceThreshold = 50;

        // Peak / Baseline trackers
        this.baselineBeta = 0;
        this.betaPeakTime = 0;
        this.isBetaSpiking = false;

        this.isPaused = false;
        this.engineLoop = null;

        // Emulated confidence since basic processing lacks full artifact rejection
        this.currentConfidence = 100;

        this.startEngine();
    }

    // Bind this to your dashboard or global Serial receiver loop
    feedProcessedSignal(stats) {
        if (this.isPaused) return;

        const now = performance.now();
        const focus = stats.focus || 0;
        const alpha = stats.alpha || (100 - focus); // Approximate since raw processor sends beta/alpha mock
        const beta = stats.beta || focus;
        const stress = stats.stress || 0;
        const fatigue = stats.fatigue || 0;

        // Mock confidence drop if signal varies too wildly (artifact) or stress spikes abruptly
        const variance = Math.abs(focus - (this.history.focus[this.history.focus.length - 1] || focus));
        if (variance > 40) {
            this.currentConfidence = Math.max(0, this.currentConfidence - 10);
        } else {
            this.currentConfidence = Math.min(100, this.currentConfidence + 2);
        }

        // Force Drop if extreme variance
        if (this.currentConfidence < this.confidenceThreshold) {
            this.emit('onConfidenceDrop', this.currentConfidence);
            return; // Pause processing valid game commands if noise is high
        }

        // Add to history
        this.history.focus.push(focus);
        this.history.alpha.push(alpha);
        this.history.beta.push(beta);
        this.history.timestamps.push(now);

        if (this.history.focus.length > this.maxHistory) {
            this.history.focus.shift();
            this.history.alpha.shift();
            this.history.beta.shift();
            this.history.timestamps.shift();
        }

        // Calculate baseline beta from trailing window
        this.baselineBeta = this.history.beta.reduce((a, b) => a + b, 0) / this.history.beta.length;

        // Spike Detection
        if (beta > this.baselineBeta * 1.2 && !this.isBetaSpiking) {
            this.betaPeakTime = now;
            this.isBetaSpiking = true;
        } else if (beta <= this.baselineBeta * 1.2) {
            this.isBetaSpiking = false;
        }

        if (this.isBetaSpiking && (now - this.betaPeakTime) >= 250) {
            this.emit('onBetaSpike', beta);
            this.isBetaSpiking = false; // reset to prevent spam
        }

        this.emit('onFocusChange', { focus, stress, fatigue });
        this.emit('onAlphaChange', alpha);

        this.emit('onStateUpdate', {
            focus, alpha, beta, stress, fatigue, confidence: this.currentConfidence
        });
    }

    startEngine() {
        // Keeps the loop alive for temporal checks (sustains)
        const loop = (timestamp) => {
            if (!this.isPaused && this.history.focus.length > 0) {
                // Check sustained focus
                const recentFocus = this.history.focus[this.history.focus.length - 1];
            }
            this.engineLoop = requestAnimationFrame(loop);
        };
        this.engineLoop = requestAnimationFrame(loop);
    }

    stopEngine() {
        if (this.engineLoop) cancelAnimationFrame(this.engineLoop);
    }

    pauseGames() {
        this.isPaused = true;
    }

    resumeGames() {
        this.isPaused = false;
        this.currentConfidence = 100;
    }

    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }
}
