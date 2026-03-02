// Neurovex Integrated System
// Complete BCI control system with AI layer, calibration, and stable control

(() => {
    'use strict';

    class NeurovexIntegrated {
        constructor() {
            // Initialize all modules
            this.brainState = new BrainStateEngine();
            this.commandEngine = new CommandEngine();
            this.calibration = new CalibrationModule();
            this.mqtt = new MQTTClient();
            
            // System state
            this.isRunning = false;
            this.sessionId = null;
            this.lastBrainState = null;
            this.processingInterval = null;
            
            // Timing
            this.processingRate = 1000; // 1 Hz processing
            
            console.log('Neurovex Integrated System initialized');
        }

        // Initialize the complete system
        async init() {
            try {
                // Load session
                this.loadSession();
                
                // Connect to MQTT
                await this.mqtt.connect();
                this.mqtt.startHeartbeat();
                
                // Setup calibration event listeners
                this.setupCalibrationEvents();
                
                // Start processing if session exists
                if (this.sessionId) {
                    this.startProcessing();
                }
                
                console.log('Neurovex system ready');
                
            } catch (error) {
                console.error('Error initializing Neurovex system:', error);
            }
        }

        // Load session from localStorage
        loadSession() {
            this.sessionId = localStorage.getItem('session_id');
            if (!this.sessionId) {
                console.warn('No session found - system in standby mode');
                return false;
            }
            
            console.log(`Session loaded: ${this.sessionId}`);
            return true;
        }

        // Setup calibration event handlers
        setupCalibrationEvents() {
            document.addEventListener('calibrationComplete', (event) => {
                this.onCalibrationComplete(event.detail);
            });
        }

        // Start main processing loop
        startProcessing() {
            if (this.isRunning) {
                console.log('Processing already running');
                return;
            }
            
            this.isRunning = true;
            console.log('Starting BCI processing loop');
            
            // Start processing interval
            this.processingInterval = setInterval(() => {
                this.processEEGData();
            }, this.processingRate);
        }

        // Stop processing loop
        stopProcessing() {
            if (!this.isRunning) {
                return;
            }
            
            this.isRunning = false;
            
            if (this.processingInterval) {
                clearInterval(this.processingInterval);
                this.processingInterval = null;
            }
            
            console.log('BCI processing stopped');
        }

        // Main EEG data processing
        async processEEGData() {
            try {
                // Get current EEG bands (from dashboard or real sensor)
                const bands = this.getCurrentEEGBands();
                
                if (!bands) {
                    console.warn('No EEG data available');
                    return;
                }
                
                // Process through AI layer
                const brainState = this.brainState.processEEGData(bands);
                
                // Add calibration sample if calibrating
                if (this.calibration.isCalibrating()) {
                    this.calibration.addCalibrationSample(brainState);
                }
                
                // Process through command engine
                const commandResult = this.commandEngine.processBrainState(brainState);
                
                // Execute command if valid
                if (commandResult.command) {
                    await this.executeCommand(commandResult.command, commandResult.reason);
                }
                
                // Update UI with new state
                this.updateUI(brainState, commandResult);
                
                // Store for comparison
                this.lastBrainState = brainState;
                
            } catch (error) {
                console.error('Error processing EEG data:', error);
            }
        }

        // Get current EEG bands (simulated or real)
        getCurrentEEGBands() {
            // Try to get from dashboard first
            const focusElement = document.getElementById('live-focus');
            const deltaElement = document.getElementById('delta-power');
            const thetaElement = document.getElementById('theta-power');
            const alphaElement = document.getElementById('alpha-power');
            const betaElement = document.getElementById('beta-power');
            const gammaElement = document.getElementById('gamma-power');
            
            if (focusElement && deltaElement && thetaElement && alphaElement && betaElement && gammaElement) {
                // Extract values from UI (for demo mode)
                const extractValue = (element) => {
                    const text = element.textContent;
                    return parseFloat(text.replace(/[^\d.]/g, '')) || 0;
                };
                
                return {
                    delta: extractValue(deltaElement) / 100, // Convert from µV²
                    theta: extractValue(thetaElement) / 100,
                    alpha: extractValue(alphaElement) / 100,
                    beta: extractValue(betaElement) / 100,
                    gamma: extractValue(gammaElement) / 100
                };
            }
            
            // Fallback to simulated data
            return this.generateSimulatedBands();
        }

        // Generate simulated EEG data for testing
        generateSimulatedBands() {
            const time = Date.now() / 1000;
            const base = {
                delta: 0.4 + Math.sin(time * 0.1) * 0.2,
                theta: 0.3 + Math.sin(time * 0.15) * 0.15,
                alpha: 0.2 + Math.sin(time * 0.2) * 0.1,
                beta: 0.25 + Math.sin(time * 0.25) * 0.15,
                gamma: 0.15 + Math.sin(time * 0.3) * 0.05
            };
            
            // Add some randomness
            Object.keys(base).forEach(band => {
                base[band] += (Math.random() - 0.5) * 0.1;
                base[band] = Math.max(0.05, Math.min(0.95, base[band]));
            });
            
            return base;
        }

        // Execute command through hardware layer
        async executeCommand(command, reason) {
            try {
                // Update command engine safety
                this.updateCommandEngineSafety();
                
                // Execute through command engine
                const success = await this.commandEngine.executeCommand(command, reason);
                
                // Publish to MQTT if successful
                if (success) {
                    await this.mqtt.publishCommand(command, 'integrated_system');
                }
                
                return success;
                
            } catch (error) {
                console.error('Error executing command:', error);
                return false;
            }
        }

        // Update command engine with safety states
        updateCommandEngineSafety() {
            // Get safety states from hardware control if available
            const hardwareControl = window.hardwareController;
            if (hardwareControl) {
                const status = hardwareControl.getStatus();
                this.commandEngine.setEmergencyStop(status.emergencyStopped);
                this.commandEngine.setManualOverride(status.lastManualCommand !== null);
            }
        }

        // Update UI with current state
        updateUI(brainState, commandResult) {
            // Update WebSocket clients with new structure
            this.broadcastWebSocketUpdate(brainState, commandResult);
            
            // Update local UI elements
            this.updateUIElements(brainState, commandResult);
        }

        // Broadcast WebSocket update with new structure
        broadcastWebSocketUpdate(brainState, commandResult) {
            const payload = {
                type: 'brain_state',
                timestamp: new Date().toISOString(),
                bands: {
                    delta: brainState.focus * 0.8, // Simulate band powers
                    theta: brainState.fatigue * 0.6,
                    alpha: brainState.focus * 0.4,
                    beta: brainState.focus,
                    gamma: brainState.stress * 0.3
                },
                brain_state: {
                    focus: brainState.focus,
                    stress: brainState.stress,
                    fatigue: brainState.fatigue,
                    confidence: brainState.confidence,
                    stability: brainState.stability
                },
                command: commandResult.command || null,
                command_reason: commandResult.reason || null,
                calibration: this.calibration.getResults(),
                system_status: {
                    processing: this.isRunning,
                    session_active: !!this.sessionId,
                    mqtt_connected: this.mqtt.isConnected()
                }
            };
            
            // Dispatch event for WebSocket handlers
            const event = new CustomEvent('brainStateUpdate', {
                detail: payload
            });
            document.dispatchEvent(event);
        }

        // Update UI elements
        updateUIElements(brainState, commandResult) {
            // Update confidence display
            const confidenceElement = document.getElementById('confidence-score');
            if (confidenceElement) {
                confidenceElement.textContent = `${(brainState.confidence * 100).toFixed(1)}%`;
            }
            
            // Update stability indicator
            const stabilityElement = document.getElementById('stability-indicator');
            if (stabilityElement) {
                stabilityElement.textContent = brainState.stability;
                stabilityElement.className = brainState.stability === 'stable' ? 
                    'text-green-600' : 'text-red-600';
            }
            
            // Update command display
            const commandElement = document.getElementById('last-command');
            if (commandElement && commandResult.command) {
                commandElement.textContent = commandResult.command;
                commandElement.className = 'text-blue-600 font-bold';
            }
        }

        // Handle calibration completion
        onCalibrationComplete(calibrationData) {
            console.log('Calibration completed in integrated system:', calibrationData);
            
            // Update command engine with adaptive thresholds
            this.commandEngine.updateThresholds(calibrationData.thresholds);
            
            // Publish calibration results
            this.mqtt.publishCalibration(calibrationData.results);
        }

        // Calibration control methods
        async startCalibration(type) {
            if (!this.sessionId) {
                console.warn('Cannot start calibration - no active session');
                return false;
            }
            
            const success = this.calibration.startCalibration(type);
            if (success) {
                // Notify system
                this.broadcastCalibrationStatus(type, 'started');
            }
            
            return success;
        }

        broadcastCalibrationStatus(type, status) {
            const payload = {
                type: type,
                status: status,
                progress: this.calibration.getProgress(),
                timestamp: new Date().toISOString()
            };
            
            const event = new CustomEvent('calibrationStatus', {
                detail: payload
            });
            document.dispatchEvent(event);
        }

        // Emergency control
        async triggerEmergencyStop() {
            console.log('Emergency stop triggered in integrated system');
            
            // Stop processing
            this.stopProcessing();
            
            // Set emergency states
            this.commandEngine.setEmergencyStop(true);
            
            // Send emergency command
            await this.executeCommand('STOP', 'emergency_integrated');
            
            // Publish emergency status
            this.mqtt.publishStatus('emergency_stop');
        }

        // Get comprehensive system status
        getSystemStatus() {
            return {
                processing: this.isRunning,
                session_id: this.sessionId,
                brain_state: this.brainState.getCurrentState(),
                command_engine: this.commandEngine.getStatus(),
                calibration: this.calibration.getResults(),
                mqtt: this.mqtt.getConnectionStatus(),
                performance: this.getPerformanceMetrics()
            };
        }

        // Performance metrics
        getPerformanceMetrics() {
            const brainStateMetrics = {
                processingTime: this.processingRate,
                artifactRate: this.calculateArtifactRate(),
                averageConfidence: this.calculateAverageConfidence()
            };
            
            const commandMetrics = this.commandEngine.getPerformanceMetrics();
            
            return {
                brain_state: brainStateMetrics,
                commands: commandMetrics,
                system: {
                    uptime: Date.now() - (this.startTime || Date.now()),
                    memoryUsage: this.estimateMemoryUsage()
                }
            };
        }

        calculateArtifactRate() {
            // This would track artifact detection rate over time
            return 0.05; // Placeholder
        }

        calculateAverageConfidence() {
            // This would track average confidence over recent samples
            return 0.75; // Placeholder
        }

        estimateMemoryUsage() {
            // Simple memory usage estimation
            return {
                brainState: this.brainState.stabilityBuffer.length * 64,
                commandEngine: this.commandEngine.commandHistory.length * 128,
                calibration: this.calibration.calibrationData.length * 256
            };
        }

        // Public API methods
        async startNewSession() {
            if (!this.sessionId) {
                console.warn('No session ID available');
                return false;
            }
            
            this.startProcessing();
            return true;
        }

        stopSystem() {
            this.stopProcessing();
            this.mqtt.disconnect();
            console.log('Neurovex system stopped');
        }

        resetSystem() {
            this.stopProcessing();
            
            // Reset all modules
            this.brainState.resetCalibration();
            this.commandEngine.reset();
            this.calibration.resetCalibration();
            
            console.log('Neurovex system reset');
        }

        // Cleanup
        destroy() {
            this.stopSystem();
            
            // Cleanup modules
            if (this.brainState.destroy) this.brainState.destroy();
            if (this.commandEngine.destroy) this.commandEngine.destroy();
            if (this.calibration.destroy) this.calibration.destroy();
            if (this.mqtt.destroy) this.mqtt.destroy();
            
            console.log('Neurovex integrated system destroyed');
        }
    }

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        // Wait for other modules to load
        setTimeout(() => {
            window.neurovexIntegrated = new NeurovexIntegrated();
            window.neurovexIntegrated.init();
        }, 1000);
    });

    // Export for global access
    window.NeurovexIntegrated = NeurovexIntegrated;

})();
