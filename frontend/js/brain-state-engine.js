// Neurovex Brain State Engine
// Professional AI layer for EEG signal processing and brain state analysis

(() => {
    'use strict';

    class BrainStateEngine {
        constructor() {
            // Smoothing parameters
            this.windowSize = 10;
            this.smoothingAlpha = 0.15;
            
            // Data buffers for rolling averages
            this.bandBuffers = {
                delta: [],
                theta: [],
                alpha: [],
                beta: [],
                gamma: []
            };
            
            // Exponential smoothing values
            this.smoothedStates = {
                focus: 0,
                stress: 0,
                fatigue: 0
            };
            
            // Calibration data
            this.calibration = {
                neutral: null,
                focus: null,
                calibrated: false
            };
            
            // Artifact detection thresholds
            this.artifactThresholds = {
                minTotalPower: 0.1,
                maxDeltaSpike: 2.0,
                maxVarianceSpike: 1.5
            };
            
            // Stability tracking
            this.stabilityBuffer = [];
            this.stabilityWindowSize = 30; // 30 samples for stability
            
            console.log('Brain State Engine initialized');
        }

        // Main processing function
        processEEGData(bands) {
            try {
                // Step 1: Apply rolling average smoothing
                const smoothedBands = this.applyRollingAverage(bands);
                
                // Step 2: Normalize bands relative to total power
                const normalizedBands = this.normalizeBands(smoothedBands);
                
                // Step 3: Compute brain states
                const rawStates = this.computeBrainStates(normalizedBands);
                
                // Step 4: Apply exponential smoothing
                const smoothedStates = this.applyExponentialSmoothing(rawStates);
                
                // Step 5: Artifact detection
                const artifactResult = this.detectArtifacts(smoothedBands, normalizedBands);
                
                // Step 6: Confidence calculation
                const confidence = this.calculateConfidence(smoothedBands, artifactResult);
                
                // Step 7: Stability assessment
                const stability = this.assessStability(smoothedStates);
                
                // Step 8: Apply calibration if available
                const calibratedStates = this.applyCalibration(smoothedStates);
                
                // Step 9: Update stability buffer
                this.updateStabilityBuffer(stability);
                
                const result = {
                    focus: this.clamp(calibratedStates.focus, 0, 1),
                    stress: this.clamp(calibratedStates.stress, 0, 1),
                    fatigue: this.clamp(calibratedStates.fatigue, 0, 1),
                    confidence: artifactResult.hasArtifact ? confidence * 0.5 : confidence,
                    stability: stability,
                    hasArtifact: artifactResult.hasArtifact,
                    artifactType: artifactResult.type
                };
                
                console.log('Brain state processed:', result);
                return result;
                
            } catch (error) {
                console.error('Error processing EEG data:', error);
                return this.getSafeState();
            }
        }

        // Rolling average smoothing
        applyRollingAverage(bands) {
            const smoothed = {};
            
            Object.keys(bands).forEach(band => {
                const buffer = this.bandBuffers[band];
                buffer.push(bands[band]);
                
                // Keep buffer size limited
                if (buffer.length > this.windowSize) {
                    buffer.shift();
                }
                
                // Calculate rolling average
                const sum = buffer.reduce((a, b) => a + b, 0);
                smoothed[band] = sum / buffer.length;
            });
            
            return smoothed;
        }

        // Normalize bands relative to total power
        normalizeBands(bands) {
            const total = Object.values(bands).reduce((sum, value) => sum + value, 0);
            
            if (total === 0) {
                return bands; // Avoid division by zero
            }
            
            const normalized = {};
            Object.keys(bands).forEach(band => {
                normalized[band] = bands[band] / total;
            });
            
            return normalized;
        }

        // Compute brain states from normalized bands
        computeBrainStates(normalizedBands) {
            return {
                focus: normalizedBands.beta, // Beta dominance
                stress: normalizedBands.beta / (normalizedBands.alpha + 0.001), // Beta/alpha ratio
                fatigue: normalizedBands.theta // Theta dominance
            };
        }

        // Apply exponential smoothing to brain states
        applyExponentialSmoothing(rawStates) {
            Object.keys(rawStates).forEach(state => {
                const current = rawStates[state];
                const previous = this.smoothedStates[state];
                
                this.smoothedStates[state] = 
                    this.smoothingAlpha * current + (1 - this.smoothingAlpha) * previous;
            });
            
            return { ...this.smoothedStates };
        }

        // Artifact detection
        detectArtifacts(smoothedBands, normalizedBands) {
            const totalPower = Object.values(smoothedBands).reduce((sum, val) => sum + val, 0);
            
            // Check 1: Total power below threshold
            if (totalPower < this.artifactThresholds.minTotalPower) {
                return { hasArtifact: true, type: 'low_power' };
            }
            
            // Check 2: Delta spike detection
            if (smoothedBands.delta > this.artifactThresholds.maxDeltaSpike) {
                return { hasArtifact: true, type: 'delta_spike' };
            }
            
            // Check 3: Variance spike detection
            const variance = this.calculateVariance(Object.values(normalizedBands));
            if (variance > this.artifactThresholds.maxVarianceSpike) {
                return { hasArtifact: true, type: 'variance_spike' };
            }
            
            return { hasArtifact: false, type: null };
        }

        // Calculate confidence score
        calculateConfidence(smoothedBands, artifactResult) {
            let confidence = 0.5; // Base confidence
            
            // Factor 1: Total signal strength
            const totalPower = Object.values(smoothedBands).reduce((sum, val) => sum + val, 0);
            const signalStrength = Math.min(totalPower * 2, 1); // Normalize to 0-1
            confidence += signalStrength * 0.3;
            
            // Factor 2: Signal stability
            const stability = this.getCurrentStability();
            const stabilityBonus = stability === 'stable' ? 0.2 : 0;
            confidence += stabilityBonus;
            
            // Factor 3: Artifact penalty (applied in main process)
            // Already handled by artifact detection
            
            return this.clamp(confidence, 0, 1);
        }

        // Assess signal stability
        assessStability(states) {
            // Add current states to stability buffer
            this.stabilityBuffer.push({ ...states });
            
            if (this.stabilityBuffer.length > this.stabilityWindowSize) {
                this.stabilityBuffer.shift();
            }
            
            if (this.stabilityBuffer.length < 10) {
                return 'insufficient_data';
            }
            
            // Calculate variance in recent states
            const focusVariance = this.calculateVariance(
                this.stabilityBuffer.map(s => s.focus)
            );
            
            // Stability threshold
            const stabilityThreshold = 0.05;
            
            return focusVariance < stabilityThreshold ? 'stable' : 'unstable';
        }

        // Update stability buffer
        updateStabilityBuffer(stability) {
            // Buffer already updated in assessStability
        }

        // Get current stability
        getCurrentStability() {
            if (this.stabilityBuffer.length < 10) {
                return 'insufficient_data';
            }
            
            const recentStates = this.stabilityBuffer.slice(-10);
            const focusVariance = this.calculateVariance(
                recentStates.map(s => s.focus)
            );
            
            return focusVariance < 0.05 ? 'stable' : 'unstable';
        }

        // Calibration system
        startCalibration(type) {
            console.log(`Starting ${type} calibration...`);
            this.calibrationMode = type;
            this.calibrationBuffer = [];
            this.calibrationStartTime = Date.now();
        }

        addCalibrationSample(bands) {
            if (!this.calibrationMode || !this.calibrationBuffer) {
                return false;
            }
            
            const processed = this.processEEGData(bands);
            this.calibrationBuffer.push(processed);
            
            // 10 seconds of data at ~1Hz = 10 samples
            if (this.calibrationBuffer.length >= 10) {
                this.completeCalibration();
                return true;
            }
            
            return false;
        }

        completeCalibration() {
            if (!this.calibrationBuffer || this.calibrationBuffer.length === 0) {
                return;
            }
            
            const averages = this.calculateCalibrationAverages();
            
            if (this.calibrationMode === 'neutral') {
                this.calibration.neutral = averages;
                console.log('Neutral calibration completed:', averages);
            } else if (this.calibrationMode === 'focus') {
                this.calibration.focus = averages;
                console.log('Focus calibration completed:', averages);
            }
            
            // Check if both calibrations are complete
            if (this.calibration.neutral && this.calibration.focus) {
                this.calibration.calibrated = true;
                console.log('Full calibration completed - system ready');
            }
            
            // Reset calibration mode
            this.calibrationMode = null;
            this.calibrationBuffer = null;
        }

        calculateCalibrationAverages() {
            const averages = { focus: 0, stress: 0, fatigue: 0 };
            const count = this.calibrationBuffer.length;
            
            this.calibrationBuffer.forEach(sample => {
                averages.focus += sample.focus;
                averages.stress += sample.stress;
                averages.fatigue += sample.fatigue;
            });
            
            Object.keys(averages).forEach(key => {
                averages[key] /= count;
            });
            
            return averages;
        }

        applyCalibration(states) {
            if (!this.calibration.calibrated) {
                return states;
            }
            
            const calibrated = {};
            const neutral = this.calibration.neutral;
            const focus = this.calibration.focus;
            
            // Apply relative thresholds
            calibrated.focus = states.focus / (neutral.focus + 0.001);
            calibrated.stress = states.stress / (neutral.stress + 0.001);
            calibrated.fatigue = states.fatigue / (neutral.fatigue + 0.001);
            
            return calibrated;
        }

        // Utility functions
        calculateVariance(values) {
            if (values.length === 0) return 0;
            
            const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
            const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
            const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
            
            return variance;
        }

        clamp(value, min, max) {
            return Math.max(min, Math.min(max, value));
        }

        getSafeState() {
            return {
                focus: 0,
                stress: 0,
                fatigue: 0,
                confidence: 0,
                stability: 'unstable',
                hasArtifact: true,
                artifactType: 'error'
            };
        }

        // Public API methods
        isCalibrated() {
            return this.calibration.calibrated;
        }

        getCalibrationStatus() {
            return {
                calibrated: this.calibration.calibrated,
                neutral: this.calibration.neutral,
                focus: this.calibration.focus,
                mode: this.calibrationMode
            };
        }

        resetCalibration() {
            this.calibration = {
                neutral: null,
                focus: null,
                calibrated: false
            };
            console.log('Calibration reset');
        }

        // Get current processed state
        getCurrentState() {
            return {
                smoothed: { ...this.smoothedStates },
                stability: this.getCurrentStability(),
                calibration: this.getCalibrationStatus()
            };
        }
    }

    // Export for global access
    window.BrainStateEngine = BrainStateEngine;

})();
