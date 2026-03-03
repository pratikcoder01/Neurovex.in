// carController.js
// Interfaces directly with serialEngine to send movement commands.

export class CarController {
    constructor(serialEngine) {
        this.serialEngine = serialEngine;
        this.locked = true;
    }

    setLocked(isLocked) {
        this.locked = isLocked;
        if (this.locked) {
            this.stop();
        }
    }

    async sendCommand(cmd) {
        if (this.locked && cmd !== "STOP") return; // Allow STOP even if locked
        if (this.serialEngine) {
            await this.serialEngine.send(cmd);
        }
    }

    forward() { this.sendCommand("FORWARD"); }
    backward() { this.sendCommand("BACKWARD"); }
    left() { this.sendCommand("LEFT"); }
    right() { this.sendCommand("RIGHT"); }
    stop() { this.sendCommand("STOP"); }
}
