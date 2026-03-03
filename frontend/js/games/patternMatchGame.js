// patternMatchGame.js
export class PatternMatchGame {
    constructor(engine, alphaMeterElement) {
        this.engine = engine;
        this.meter = alphaMeterElement;
        this.currentAlpha = 0;
        this.alphaThreshold = 65;
        this.sustainTime = 2000; // 2 seconds
        this.sustainStart = null;
        this.level = 1;
        this.isActive = false;

        this.engine.on('onAlphaChange', (alpha) => this.handleAlpha(alpha));
        this.engine.on('onFocusChange', ({ stress }) => this.handleStress(stress));
    }

    start() {
        this.isActive = true;
        this.sustainStart = null;
    }

    stop() {
        this.isActive = false;
    }

    handleStress(stress) {
        if (!this.isActive) return;
        // Stress spike resets progress instantly
        if (stress > 80) {
            this.sustainStart = null;
            this.updateMeter(0); // Reset visual meter
        }
    }

    handleAlpha(alpha) {
        if (!this.isActive) return;

        // Sliding window average implicitly handled by engine
        this.currentAlpha = (0.2 * alpha) + (0.8 * this.currentAlpha);

        if (this.currentAlpha > this.alphaThreshold) {
            if (!this.sustainStart) {
                this.sustainStart = performance.now();
            } else {
                const sustainedFor = performance.now() - this.sustainStart;
                this.updateMeter(sustainedFor / this.sustainTime * 100);

                if (sustainedFor >= this.sustainTime) {
                    this.unlockNextTile();
                }
            }
        } else {
            // Drop progress if alpha falls
            this.sustainStart = null;
            this.updateMeter(this.currentAlpha);
        }
    }

    updateMeter(percent) {
        if (this.meter) {
            this.meter.style.width = Math.min(100, Math.max(0, percent)) + '%';
        }
    }

    unlockNextTile() {
        this.level += 1;
        this.sustainStart = null;
        this.updateMeter(0);
        // Dispatch UI event for tile unlock graphic
        document.dispatchEvent(new CustomEvent('neurovex:tileUnlocked', { detail: { level: this.level } }));
    }
}
