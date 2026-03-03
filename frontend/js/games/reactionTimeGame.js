// reactionTimeGame.js
export class ReactionTimeGame {
    constructor(engine, cueElement) {
        this.engine = engine;
        this.cueElement = cueElement;
        this.isActive = false;
        this.cueTime = 0;
        this.waitingForSpike = false;
        this.bestTime = null;

        this.engine.on('onBetaSpike', () => this.handleSpike());
    }

    start() {
        this.isActive = true;
        this.prepareNextCue();
    }

    stop() {
        this.isActive = false;
        this.waitingForSpike = false;
        if (this.cueTimeout) clearTimeout(this.cueTimeout);
    }

    prepareNextCue() {
        if (!this.isActive) return;

        // Hide cue visually
        if (this.cueElement) this.cueElement.style.opacity = '0';
        this.waitingForSpike = false;

        // Random wait between 2-6 seconds
        const waitMs = Math.random() * 4000 + 2000;
        this.cueTimeout = setTimeout(() => this.showCue(), waitMs);
    }

    showCue() {
        if (!this.isActive) return;

        this.cueTime = performance.now();
        this.waitingForSpike = true;

        // Show visual cue instantly
        if (this.cueElement) this.cueElement.style.opacity = '1';
    }

    handleSpike() {
        if (!this.isActive || !this.waitingForSpike) return;

        const reactionTime = performance.now() - this.cueTime;
        this.waitingForSpike = false;

        if (!this.bestTime || reactionTime < this.bestTime) {
            this.bestTime = reactionTime;
        }

        document.dispatchEvent(new CustomEvent('neurovex:reactionRecorded', { detail: { time: reactionTime } }));

        this.prepareNextCue();
    }
}
