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
        const rawValue = dataPoint.value || 0;
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

        // Map approximated frequency weights
        const alphaBand = stdDev * 0.4;
        const betaBand = stdDev * 0.6; // Higher frequency = higher standard deviation noise

        // Raw focus formula (Beta to Alpha ratio)
        let rawFocus = (betaBand / (alphaBand + 0.1)) * 50;
        rawFocus = Math.min(Math.max(rawFocus, 0), 100);

        // Apply Exponential Moving Average (EMA) smoothing
        this.smoothedFocus = (this.alphaEMA * rawFocus) + ((1 - this.alphaEMA) * this.smoothedFocus);

        return {
            focus: Math.round(this.smoothedFocus),
            stress: Math.round(Math.min(this.smoothedFocus * 1.1, 100)),
            fatigue: Math.round(Math.max(100 - this.smoothedFocus, 0)),
            raw: this.buffer[this.buffer.length - 1]
        };
    }
}
