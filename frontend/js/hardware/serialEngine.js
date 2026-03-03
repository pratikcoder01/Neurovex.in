// serialEngine.js
// Handles Web Serial API for consistent ESP32 communication

export class SerialEngine {
    constructor() {
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.keepReading = false;

        this.onDataCallback = null;
        this.onDisconnectCallback = null;
    }

    async connect() {
        try {
            if (!navigator.serial) {
                alert("Web Serial API not supported in this browser. Please use Chrome or Edge.");
                return false;
            }

            this.port = await navigator.serial.requestPort();
            await this.port.open({ baudRate: 115200 });

            this.keepReading = true;
            this.readLoop();

            return true;
        } catch (error) {
            console.error("Serial connection failed:", error);
            return false;
        }
    }

    async disconnect() {
        this.keepReading = false;

        // Immediately STOP motors on software disconnect request
        await this.send("STOP");

        if (this.reader) {
            try { await this.reader.cancel(); } catch (e) { }
        }
        if (this.writer) {
            this.writer.releaseLock();
            this.writer = null;
        }
        if (this.port) {
            try { await this.port.close(); } catch (e) { }
            this.port = null;
        }

        if (this.onDisconnectCallback) this.onDisconnectCallback();
    }

    async readLoop() {
        while (this.port && this.port.readable && this.keepReading) {
            const textDecoder = new TextDecoderStream();
            this.readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
            this.reader = textDecoder.readable.getReader();

            try {
                let buffer = "";
                while (true) {
                    const { value, done } = await this.reader.read();
                    if (done) break;
                    if (value) {
                        buffer += value;
                        let lines = buffer.split('\n');
                        buffer = lines.pop(); // keep remainder

                        for (let line of lines) {
                            line = line.trim();
                            if (line.startsWith('{') && line.endsWith('}')) {
                                try {
                                    const parsed = JSON.parse(line);
                                    if (parsed.value !== undefined && this.onDataCallback) {
                                        this.onDataCallback(parsed.value);
                                    }
                                } catch (e) {
                                    // Parse error
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.warn("Serial read error. Hardware likely disconnected:", error);
            } finally {
                if (this.reader) this.reader.releaseLock();
            }
        }

        // Loop broken = Hardware disconnected abruptly
        if (this.onDisconnectCallback) this.onDisconnectCallback();
    }

    async send(command) {
        if (!this.port || !this.port.writable) return;

        if (!this.writer) {
            const encoder = new TextEncoderStream();
            this.writableStreamClosed = encoder.readable.pipeTo(this.port.writable);
            this.writer = encoder.writable.getWriter();
        }

        try {
            await this.writer.write(command + "\n");
        } catch (e) {
            console.error("Failed to send command:", e);
        }
    }

    onData(callback) {
        this.onDataCallback = callback;
    }

    onDisconnect(callback) {
        this.onDisconnectCallback = callback;
    }
}
