// mindControlGame.js
export class MindControlGame {
    constructor(engine, playerElement) {
        this.engine = engine;
        this.playerElement = playerElement; // The UI element to move
        this.position = 0;
        this.speed = 0;
        this.lastFrame = 0;
        this.isActive = false;

        this.engine.on('onFocusChange', (data) => this.handleFocus(data));
        this.engine.on('onAlphaChange', (alpha) => this.handleAlpha(alpha));
        this.engine.on('onBetaSpike', () => this.handleBoost());
    }

    start() {
        this.isActive = true;
        this.lastFrame = performance.now();
        this.gameLoop(this.lastFrame);
    }

    stop() {
        this.isActive = false;
    }

    handleFocus({ focus, stress, fatigue }) {
        if (!this.isActive) return;

        let targetSpeed = 0;

        // Base thrust logic
        if (focus > 60) {
            targetSpeed = 1.0;
        } else if (focus < 40) {
            targetSpeed = 0;
        } else {
            targetSpeed = 0.3; // gradual coast
        }

        // Fatigue penalty
        if (fatigue > 70) {
            targetSpeed *= 0.5;
        }

        // Stress instability
        if (stress > 75) {
            // Apply jitter / unstable speed
            targetSpeed += (Math.random() * 0.4 - 0.2);
        }

        // Exponential smoothing for physical momentum
        this.speed = (0.1 * targetSpeed) + (0.9 * this.speed);
    }

    handleAlpha(alpha) {
        // High alpha (relaxation) slows things down directly
        if (alpha > 70) {
            this.speed *= 0.8;
        }
    }

    handleBoost() {
        if (this.isActive) {
            this.speed += 2.0; // momentary thrust
        }
    }

    gameLoop(timestamp) {
        if (!this.isActive) return;

        const dt = timestamp - this.lastFrame;
        this.lastFrame = timestamp;

        if (dt > 0) {
            this.position += this.speed * dt * 0.1; // Transform speed to pixels
            this.updateUI();
        }

        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    updateUI() {
        if (this.playerElement) {
            // Example map position to a CSS translate
            this.playerElement.style.transform = `translateX(${this.position}px)`;
        }
    }
}
