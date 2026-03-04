// signalProcessor.js
// Handles real-time computation of brain state metrics using EMA smoothing

export class SignalProcessor {
    constructor(bufferSize = 250) {
        this.bufferSize = bufferSize; // ~1 second @ 250hz
        this.buffer = [];
        this.smoothedFocus = 0;

        // Smoothing constant for Exponential Moving Average
        this.alphaEMA = 0.05;
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

            rawFocus = (stdDev > 20 && stdDev < 100) ? ((stdDev - 20) / 80) * 100 : (stdDev >= 100 ? 60 : 20);
            rawStress = stdDev > 80 ? ((stdDev - 80) / 100) * 100 : 10;

            // Artificial suppression of Fatigue (kept very low as requested)
            rawFatigue = stdDev < 15 ? 15 - stdDev : 5;

            // Add slight random organic movement
            rawFocus += (Math.random() * 10 - 5);
            rawStress += (Math.random() * 10 - 5);
            rawFatigue += (Math.random() * 4 - 2); // Less random noise for fatigue so it stays very low
        }

        // Keep values strictly within 0 - 100%
        rawFocus = Math.min(Math.max(rawFocus, 0), 100);
        rawStress = Math.min(Math.max(rawStress, 0), 100);
        rawFatigue = Math.min(Math.max(rawFatigue, 0), 100);

        // Apply Exponential Moving Average (EMA) smoothing for each state
        this.smoothedFocus = (this.alphaEMA * rawFocus) + ((1 - this.alphaEMA) * this.smoothedFocus);
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
        // Focus relies on higher Beta, Relaxation relies on higher Alpha
        let fakeBeta = rawFocus * 0.8 + (Math.random() * 5);
        let fakeAlpha = (100 - rawFocus) * 0.7 + (Math.random() * 5);

        return {
            focus: Math.round(this.smoothedFocus),
            stress: Math.round(this.smoothedStress),
            fatigue: Math.round(this.smoothedFatigue),
            confidence: this.smoothedConfidence.toFixed(1),
            alpha: Math.round(Math.max(fakeAlpha, 0)),
            beta: Math.round(Math.max(fakeBeta, 0)),
            raw: this.buffer[this.buffer.length - 1]
        };
    }
}
