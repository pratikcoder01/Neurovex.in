// signalProcessor.js
// Handles real-time computation of brain state metrics using EMA smoothing

export class SignalProcessor {
    constructor(bufferSize = 250) {
        this.bufferSize = bufferSize; // ~1 second @ 250hz
        this.buffer = [];
        this.smoothedFocus = 0;

        // Smoothing constant for Exponential Moving Average
        // Lowered from 0.05 to 0.015 for much greater stability against rapid fluctuations
        this.alphaEMA = 0.015;
    }

    feed(dataPoint) {
        const rawValue = typeof dataPoint === 'number' ? dataPoint : (dataPoint.value || 0);
        this.buffer.push(rawValue);

        // Maintain sliding window
        if (this.buffer.length > this.bufferSize) {
            this.buffer.shift();
        }
    }

    computeStats() {
        // Require minimal buffer buildup before processing
        if (this.buffer.length < this.bufferSize) return null;

        // Basic statistical mapping (For MVP approximation before applying external FFT loops)
        const mean = this.buffer.reduce((acc, v) => acc + v, 0) / this.bufferSize;
        const variance = this.buffer.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / this.bufferSize;
        const stdDev = Math.sqrt(variance);

        // Rather than a fixed ratio that gets stuck, we map signal variance 
        // dynamically to represent brain activity.
        let rawFocus = 0, rawStress = 0, rawFatigue = 0;

        if (stdDev < 5) {
            // Signal completely flat
            rawFatigue = 100;
        } else {
            // Normalizing variance into pseudo-metrics for the MVP
            // Moderate waves (stdDev 20-100) = Concentration
            // Huge waves / spikes (stdDev > 100) = Muscle tension / Stress
            // Small waves (stdDev < 30) = Relaxed / Fatigue

            // Expanded stdDev range for live hardware importing
            // Prevent focus from getting stuck at an arbitrary clamp like 60%
            if (stdDev < 20) {
                rawFocus = 20;
            } else if (stdDev >= 20 && stdDev < 400) {
                // Scale focus up across a wider variance band typical of real hardware
                // from 20 to 100%
                rawFocus = 20 + ((stdDev - 20) / 380) * 80;
            } else {
                // Value drops gradually if variance is extreme (muscle noise/movement)
                rawFocus = Math.max(30, 100 - ((stdDev - 400) * 0.1));
            }

            // Re-calibrated stress sensitivity curve for live importing.
            // A much gentler slope prevents the reading from immediately pegging at 100% 
            // when raw muscle artifacts or large baseline shifts occur.
            rawStress = stdDev > 120 ? 5 + ((stdDev - 120) * 0.05) : 5;

            // Artificial suppression of Fatigue (kept very low as requested)
            rawFatigue = stdDev < 15 ? 15 - stdDev : 5;

            // Artificial random organic movement is REMOVED
            // Live hardware already provides enough natural variation; adding random 
            // noise just causes unwanted jumpiness in the progress bars.
        }

        // Keep values strictly within 0 - 100%
        rawFocus = Math.min(Math.max(rawFocus, 0), 100);
        rawStress = Math.min(Math.max(rawStress, 0), 100);
        rawFatigue = Math.min(Math.max(rawFatigue, 0), 100);

        // Apply Exponential Moving Average (EMA) smoothing for each state
        // Use a much softer EMA constant (0.01 instead of 0.03) for rock-solid stability
        const focusEMA = 0.01;
        this.smoothedFocus = (focusEMA * rawFocus) + ((1 - focusEMA) * this.smoothedFocus);
        this.smoothedStress = this.smoothedStress === undefined ? rawStress : (this.alphaEMA * rawStress) + ((1 - this.alphaEMA) * this.smoothedStress);
        this.smoothedFatigue = this.smoothedFatigue === undefined ? rawFatigue : (this.alphaEMA * rawFatigue) + ((1 - this.alphaEMA) * this.smoothedFatigue);

        // Confidence Score (Quality of signal). High variance (huge noise from physical movement) lowers it.
        let rawConfidence = 100;
        if (stdDev > 40) {
            rawConfidence = Math.max(10, 100 - ((stdDev - 40) * 1.2));
        } else if (stdDev < 5 && this.buffer.length > 0) {
            rawConfidence = 0; // Completely flat sensor/disconnected
        }

        // Add tiny bit of jitter for visual effect
        if (rawConfidence > 0) rawConfidence += (Math.random() * 2 - 1);
        rawConfidence = Math.min(Math.max(rawConfidence, 0), 100);

        this.smoothedConfidence = this.smoothedConfidence === undefined ? rawConfidence : (0.1 * rawConfidence) + (0.9 * this.smoothedConfidence);

        // Generate mock Alpha and Beta values for the Car Brain Control Engine
        // Base them on the SMOOTHED focus, not raw focus, to inherently stabilize them
        // Removed artificial random noise to maintain clean signals
        let rawBeta = this.smoothedFocus * 0.85;
        let rawAlpha = (100 - this.smoothedFocus) * 0.85;

        this.smoothedAlpha = this.smoothedAlpha === undefined ? rawAlpha : (this.alphaEMA * rawAlpha) + ((1 - this.alphaEMA) * this.smoothedAlpha);
        this.smoothedBeta = this.smoothedBeta === undefined ? rawBeta : (this.alphaEMA * rawBeta) + ((1 - this.alphaEMA) * this.smoothedBeta);

        return {
            focus: Math.round(this.smoothedFocus),
            stress: Math.round(this.smoothedStress),
            fatigue: Math.round(this.smoothedFatigue),
            confidence: this.smoothedConfidence.toFixed(1),
            alpha: Math.round(Math.max(this.smoothedAlpha, 0)),
            beta: Math.round(Math.max(this.smoothedBeta, 0)),
            raw: this.buffer[this.buffer.length - 1]
        };
    }
}
