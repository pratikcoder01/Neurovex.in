// Neurovex Command Engine
// Stable control layer with hysteresis and safety integration

(() => {
    'use strict';

    class CommandEngine {
        constructor() {
            // Control parameters
            this.lastCommand = null;
            this.commandHistory = [];
            this.stableStartTime = null;
            
            // Thresholds and margins
            this.thresholds = {
                focus: 0.6, // Will be updated by calibration
                confidence: 0.4,
                stabilityTime: 1500 // 1.5 seconds stable
            };
            
            this.hysteresis = {
                margin: 0.1,
                upperThreshold: null,
                lowerThreshold: null
            };
            
            // Safety integration
            this.safety = {
                heartbeatTimeout: false,
                manualOverride: false,
                emergencyStop: false
            };
            
            // Command queue for debouncing
            this.commandQueue = [];
            this.lastSentTime = 0;
            this.minCommandInterval = 200; // Minimum 200ms between commands
            
            console.log('Command Engine initialized');
        }

        // Main decision function
        processBrainState(brainState) {
            try {
                // Check safety overrides first
                if (this.safety.emergencyStop || this.safety.heartbeatTimeout) {
                    return { command: 'STOP', reason: 'safety_override' };
                }
                
                if (this.safety.manualOverride) {
                    return { command: null, reason: 'manual_override' };
                }
                
                // Check for artifacts
                if (brainState.hasArtifact) {
                    return { command: 'STOP', reason: 'artifact_detected' };
                }
                
                // Check confidence threshold
                if (brainState.confidence < this.thresholds.confidence) {
                    return { command: 'STOP', reason: 'low_confidence' };
                }
                
                // Check stability requirement
                if (brainState.stability !== 'stable') {
                    this.stableStartTime = null;
                    return { command: 'STOP', reason: 'unstable_signal' };
                }
                
                // Focus threshold with hysteresis
                const focusResult = this.evaluateFocusWithHysteresis(brainState.focus);
                
                if (focusResult.shouldMove) {
                    // Check if we've been stable long enough
                    if (this.isStableLongEnough()) {
                        return { command: 'FORWARD', reason: 'stable_focus_above_threshold' };
                    } else {
                        return { command: null, reason: 'not_stable_long_enough' };
                    }
                } else {
                    this.stableStartTime = null;
                    return { command: 'STOP', reason: 'focus_below_threshold' };
                }
                
            } catch (error) {
                console.error('Error processing brain state:', error);
                return { command: 'STOP', reason: 'processing_error' };
            }
        }

        // Focus evaluation with hysteresis
        evaluateFocusWithHysteresis(focus) {
            // Update hysteresis thresholds
            if (this.hysteresis.upperThreshold === null) {
                this.hysteresis.upperThreshold = this.thresholds.focus;
                this.hysteresis.lowerThreshold = this.thresholds.focus - this.hysteresis.margin;
            }
            
            const shouldMove = focus > this.hysteresis.upperThreshold;
            const shouldStop = focus < this.hysteresis.lowerThreshold;
            
            // Update thresholds based on current state
            if (shouldMove && this.lastCommand !== 'FORWARD') {
                this.hysteresis.upperThreshold = this.thresholds.focus - this.hysteresis.margin;
                this.hysteresis.lowerThreshold = this.thresholds.focus - (this.hysteresis.margin * 2);
            } else if (shouldStop && this.lastCommand === 'FORWARD') {
                this.hysteresis.upperThreshold = this.thresholds.focus + this.hysteresis.margin;
                this.hysteresis.lowerThreshold = this.thresholds.focus;
            }
            
            return {
                shouldMove,
                shouldStop,
                focus,
                thresholds: { ...this.hysteresis }
            };
        }

        // Check stability duration
        isStableLongEnough() {
            if (this.stableStartTime === null) {
                this.stableStartTime = Date.now();
                return false;
            }
            
            const stableDuration = Date.now() - this.stableStartTime;
            return stableDuration >= this.thresholds.stabilityTime;
        }

        // Command execution with debouncing
        async executeCommand(command, reason) {
            const now = Date.now();
            
            // Debounce - don't send too frequently
            if (now - this.lastSentTime < this.minCommandInterval) {
                console.log('Command debounced:', command);
                return false;
            }
            
            // Don't send duplicate commands
            if (command === this.lastCommand) {
                console.log('Duplicate command ignored:', command);
                return false;
            }
            
            try {
                // Send to MQTT/hardware
                const success = await this.sendToHardware(command);
                
                if (success) {
                    this.lastCommand = command;
                    this.lastSentTime = now;
                    this.addToHistory(command, reason);
                    
                    console.log(`Command executed: ${command} (${reason})`);
                    return true;
                } else {
                    console.error(`Failed to execute command: ${command}`);
                    return false;
                }
                
            } catch (error) {
                console.error('Error executing command:', error);
                return false;
            }
        }

        // Send command to hardware via MQTT
        async sendToHardware(command) {
            try {
                // MQTT implementation would go here
                // For now, simulate with fetch to backend
                const payload = {
                    command: command,
                    timestamp: new Date().toISOString(),
                    source: 'brain_control'
                };
                
                const response = await fetch('/api/command', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                
                return response.ok;
                
            } catch (error) {
                console.error('Hardware communication error:', error);
                return false;
            }
        }

        // Safety integration
        setEmergencyStop(active) {
            this.safety.emergencyStop = active;
            if (active) {
                this.stableStartTime = null;
                console.log('Emergency stop activated in command engine');
            }
        }

        setManualOverride(active) {
            this.safety.manualOverride = active;
            if (active) {
                this.stableStartTime = null;
                console.log('Manual override activated in command engine');
            }
        }

        setHeartbeatTimeout(active) {
            this.safety.heartbeatTimeout = active;
            if (active) {
                this.stableStartTime = null;
                console.log('Heartbeat timeout activated in command engine');
            }
        }

        // Calibration integration
        updateThresholds(calibration) {
            if (calibration.focus && calibration.neutral) {
                // Update focus threshold based on calibration
                const focusRatio = calibration.focus.focus / calibration.neutral.focus;
                this.thresholds.focus = Math.max(0.3, Math.min(0.9, focusRatio * 0.8));
                
                // Update hysteresis thresholds
                this.hysteresis.upperThreshold = this.thresholds.focus;
                this.hysteresis.lowerThreshold = this.thresholds.focus - this.hysteresis.margin;
                
                console.log('Thresholds updated from calibration:', this.thresholds);
            }
        }

        // Command history tracking
        addToHistory(command, reason) {
            this.commandHistory.push({
                command,
                reason,
                timestamp: new Date().toISOString(),
                thresholds: { ...this.thresholds },
                hysteresis: { ...this.hysteresis }
            });
            
            // Keep history limited
            if (this.commandHistory.length > 100) {
                this.commandHistory.shift();
            }
        }

        // Public API methods
        getLastCommand() {
            return this.lastCommand;
        }

        getCommandHistory(limit = 10) {
            return this.commandHistory.slice(-limit);
        }

        getCurrentThresholds() {
            return {
                focus: this.thresholds.focus,
                confidence: this.thresholds.confidence,
                hysteresis: { ...this.hysteresis }
            };
        }

        getStatus() {
            return {
                lastCommand: this.lastCommand,
                stableStartTime: this.stableStartTime,
                thresholds: { ...this.thresholds },
                hysteresis: { ...this.hysteresis },
                safety: { ...this.safety },
                isStable: this.stableStartTime !== null
            };
        }

        reset() {
            this.lastCommand = null;
            this.stableStartTime = null;
            this.commandHistory = [];
            this.lastSentTime = 0;
            
            // Reset hysteresis
            this.hysteresis.upperThreshold = null;
            this.hysteresis.lowerThreshold = null;
            
            console.log('Command engine reset');
        }

        // Performance monitoring
        getPerformanceMetrics() {
            const recent = this.commandHistory.slice(-20);
            const commandCounts = {};
            
            recent.forEach(entry => {
                commandCounts[entry.command] = (commandCounts[entry.command] || 0) + 1;
            });
            
            return {
                totalCommands: this.commandHistory.length,
                recentCommands: commandCounts,
                averageInterval: this.calculateAverageInterval(),
                stabilityRate: this.calculateStabilityRate()
            };
        }

        calculateAverageInterval() {
            if (this.commandHistory.length < 2) return 0;
            
            const intervals = [];
            for (let i = 1; i < this.commandHistory.length; i++) {
                const prev = new Date(this.commandHistory[i-1].timestamp);
                const curr = new Date(this.commandHistory[i].timestamp);
                intervals.push(curr - prev);
            }
            
            const sum = intervals.reduce((a, b) => a + b, 0);
            return sum / intervals.length;
        }

        calculateStabilityRate() {
            const recent = this.commandHistory.slice(-20);
            const stableCommands = recent.filter(entry => 
                entry.reason && entry.reason.includes('stable')
            ).length;
            
            return recent.length > 0 ? stableCommands / recent.length : 0;
        }
    }

    // Export for global access
    window.CommandEngine = CommandEngine;

})();
