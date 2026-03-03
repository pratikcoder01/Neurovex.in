// serialEngine.js
// Handles Web Serial API connections for 115200 baud structured streams

export class SerialEngine {
    constructor() {
        this.port = null;
        this.reader = null;
        this.keepReading = true;
        this.callbacks = [];
    }

    async connect() {
        try {
            this.port = await navigator.serial.requestPort();
            await this.port.open({ baudRate: 115200 });

            const textDecoder = new TextDecoderStream();
            this.readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
            this.reader = textDecoder.readable.getReader();
            this.keepReading = true;

            this.readLoop();
            return true;
        } catch (err) {
            console.error('⚠️ Serial Connection Failed:', err);
            return false;
        }
    }

    async disconnect() {
        this.keepReading = false;
        if (this.reader) {
            await this.reader.cancel();
        }
        if (this.port) {
            await this.port.close();
        }
        console.log("Serial Disconnected");
    }

    onData(callback) {
        this.callbacks.push(callback);
    }

    async readLoop() {
        let buffer = '';
        while (this.port.readable && this.keepReading) {
            try {
                const { value, done } = await this.reader.read();
                if (done) break;

                buffer += value;
                const lines = buffer.split('\n');

                // Keep the incomplete json snippet in buffer for the next loop
                buffer = lines.pop();

                for (const line of lines) {
                    try {
                        const parsed = JSON.parse(line.trim());
                        // Trigger subscribers providing the raw parsed value
                        this.callbacks.forEach(cb => cb(parsed));
                    } catch (e) {
                        // Drop invalid JSON fragments silently
                    }
                }
            } catch (error) {
                console.error('Serial stream read error:', error);
                this.keepReading = false;
            }
        }
    }

    async sendCommand(command) {
        if (!this.port || !this.port.writable) return;
        const writer = this.port.writable.getWriter();
        const encoder = new TextEncoder();
        await writer.write(encoder.encode(command + '\n'));
        writer.releaseLock();
    }
}
