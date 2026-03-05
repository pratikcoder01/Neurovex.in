export class BallBalanceGame {
    constructor(engine, ballElement, plankElement) {
        this.engine = engine;
        this.ballElement = ballElement;
        this.plankElement = plankElement;

        this.position = 0;
        this.velocity = 0;
        this.tilt = 0;

        this.isActive = false;
        this.lastFrame = 0;

        this.currentFocus = 50;
        this.maxDistance = 110; // Max allowed distance from center before falling

        this.engine.on('onFocusChange', (data) => this.handleFocus(data));
        this.engine.on('onAlphaChange', (alpha) => this.handleAlpha(alpha));
    }

    start() {
        this.isActive = true;
        this.position = 0;
        this.velocity = 0;
        this.tilt = 0;
        this.lastFrame = performance.now();

        if (this.ballElement) {
            this.ballElement.style.transition = 'none';
            this.ballElement.style.opacity = '1';
        }

        this.gameLoop(this.lastFrame);
    }

    stop() {
        this.isActive = false;
    }

    handleFocus({ focus }) {
        this.currentFocus = focus;

        // UI Updates for Real-time Signal Gauges
        const now = Date.now();
        if (!this.lastFocusUI || now - this.lastFocusUI > 100) {
            const focusVal = document.getElementById('bb-focus-val');
            const focusBar = document.getElementById('bb-focus-bar');
            if (focusVal) focusVal.innerText = focus.toFixed(0) + '%';
            if (focusBar) {
                focusBar.style.width = focus + '%';
                focusBar.className = `h-full transition-all duration-100 ease-linear ${focus >= 55 ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]' : 'bg-slate-400'}`;
            }
            this.lastFocusUI = now;
        }
    }

    handleAlpha(alpha) {
        const now = Date.now();
        if (!this.lastAlphaUI || now - this.lastAlphaUI > 100) {
            const relaxVal = document.getElementById('bb-relax-val');
            const relaxBar = document.getElementById('bb-relax-bar');
            if (relaxVal) relaxVal.innerText = alpha.toFixed(0) + '%';
            if (relaxBar) relaxBar.style.width = alpha + '%';
            this.lastAlphaUI = now;
        }
    }

    gameLoop(timestamp) {
        if (!this.isActive) return;

        const dt = (timestamp - this.lastFrame) / 1000;
        this.lastFrame = timestamp;

        if (dt > 0 && dt < 0.1) {
            let targetTilt = 0;

            if (this.currentFocus >= 55) {
                // Focus is high: balance the ball by countering its position
                targetTilt = (this.position / this.maxDistance) * 30;
                // Add minor jitter that reduces as focus nears 100
                targetTilt += (Math.random() - 0.5) * Math.max(0, (90 - this.currentFocus) * 0.2);
            } else {
                // Focus is low: plank sways and loses balance
                const direction = this.position > 0 ? 1 : (this.position < 0 ? -1 : (Math.random() > 0.5 ? 1 : -1));
                targetTilt = direction * 20;
                targetTilt += (Math.random() - 0.5) * 15;
            }

            // smooth tilt transition
            this.tilt += (targetTilt - this.tilt) * dt * 4;

            // Physics
            const gravityForce = Math.sin(this.tilt * Math.PI / 180) * 1000;
            this.velocity += gravityForce * dt;
            this.velocity *= 0.98; // friction

            this.position += this.velocity * dt;

            this.updateUI();

            if (Math.abs(this.position) > this.maxDistance) {
                this.handleFall();
                return;
            }
        }

        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    handleFall() {
        this.isActive = false;

        // Visual Fall
        if (this.ballElement) {
            this.ballElement.style.transition = 'all 0.5s ease-in';
            this.ballElement.style.transform = `translate(${this.position}px, 200px)`;
            this.ballElement.style.opacity = '0';
        }

        // Reset after 1.5 seconds
        setTimeout(() => {
            this.position = 0;
            this.velocity = 0;
            this.tilt = 0;

            if (this.ballElement) {
                this.ballElement.style.transition = 'none';
                this.updateUI();
                this.ballElement.style.opacity = '1';
            }

            // Small pause before game auto-resumes
            setTimeout(() => {
                if (this.ballElement) this.ballElement.style.transition = 'none';
                this.lastFrame = performance.now();
                this.isActive = true;
                this.gameLoop(this.lastFrame);
            }, 500);

        }, 1500);
    }

    updateUI() {
        if (this.plankElement) {
            this.plankElement.style.transform = `rotate(${this.tilt}deg)`;
        }
        if (this.ballElement) {
            this.ballElement.style.transform = `translate(${this.position}px, -18px)`;
        }
    }
}
