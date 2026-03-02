// Neurovex Calibration Module
// Professional calibration system for baseline recording and threshold adaptation

(() => {
    'use strict';

    class CalibrationModule {
        constructor() {
            this.isCalibrating = false;
            this.calibrationType = null;
            this.calibrationData = [];
            this.startTime = null;
            
            // Calibration parameters
            this.duration = 10000; // 10 seconds per calibration
            this.sampleRate = 1000; // 1 Hz (1 sample per second)
            this.requiredSamples = this.duration / this.sampleRate;
            
            // Calibration results
            this.results = {
                neutral: null,
                focus: null,
                completed: false,
                timestamp: null
            };
            
            console.log('Calibration Module initialized');
        }

        // Start calibration process
        startCalibration(type) {
            if (this.isCalibrating) {
                console.warn('Calibration already in progress');
                return false;
            }
            
            this.isCalibrating = true;
            this.calibrationType = type;
            this.calibrationData = [];
            this.startTime = Date.now();
            
            console.log(`Starting ${type} calibration (${this.duration}ms)`);
            
            // Auto-complete calibration after duration
            setTimeout(() => {
                this.completeCalibration();
            }, this.duration);
            
            return true;
        }

        // Add brain state sample during calibration
        addCalibrationSample(brainState) {
            if (!this.isCalibrating || !brainState) {
                return false;
            }
            
            // Only accept high-quality samples
            if (brainState.hasArtifact || brainState.confidence < 0.3) {
                console.log('Rejecting low-quality calibration sample');
                return false;
            }
            
            const sample = {
                focus: brainState.focus,
                stress: brainState.stress,
                fatigue: brainState.fatigue,
                confidence: brainState.confidence,
                stability: brainState.stability,
                timestamp: Date.now()
            };
            
            this.calibrationData.push(sample);
            console.log(`Calibration sample added: ${this.calibrationData.length}/${this.requiredSamples}`);
            
            return true;
        }

        // Complete calibration and compute baselines
        completeCalibration() {
            if (!this.isCalibrating || this.calibrationData.length === 0) {
                console.error('No calibration data to process');
                return false;
            }
            
            const averages = this.computeAverages();
            const quality = this.assessCalibrationQuality();
            
            // Store results
            if (this.calibrationType === 'neutral') {
                this.results.neutral = {
                    ...averages,
                    quality,
                    sampleCount: this.calibrationData.length
                };
                console.log('Neutral calibration completed:', this.results.neutral);
            } else if (this.calibrationType === 'focus') {
                this.results.focus = {
                    ...averages,
                    quality,
                    sampleCount: this.calibrationData.length
                };
                console.log('Focus calibration completed:', this.results.focus);
            }
            
            // Check if both calibrations are complete
            if (this.results.neutral && this.results.focus) {
                this.results.completed = true;
                this.results.timestamp = Date.now();
                console.log('Full calibration completed - system ready for adaptive control');
                
                // Trigger calibration complete event
                this.onCalibrationComplete();
            }
            
            // Reset calibration state
            this.isCalibrating = false;
            this.calibrationType = null;
            this.calibrationData = [];
            
            return true;
        }

        // Compute averages from calibration data
        computeAverages() {
            if (this.calibrationData.length === 0) {
                return { focus: 0, stress: 0, fatigue: 0 };
            }
            
            const sums = this.calibrationData.reduce((acc, sample) => ({
                focus: acc.focus + sample.focus,
                stress: acc.stress + sample.stress,
                fatigue: acc.fatigue + sample.fatigue
            }), { focus: 0, stress: 0, fatigue: 0 });
            
            const count = this.calibrationData.length;
            
            return {
                focus: sums.focus / count,
                stress: sums.stress / count,
                fatigue: sums.fatigue / count
            };
        }

        // Assess calibration quality
        assessCalibrationQuality() {
            if (this.calibrationData.length < 5) {
                return { score: 0, status: 'insufficient_data' };
            }
            
            // Calculate variance for each metric
            const variance = this.calculateVariance();
            
            // Quality factors
            const sampleQuality = this.calibrationData.reduce((sum, sample) => 
                sum + (sample.confidence + (sample.stability === 'stable' ? 1 : 0)), 0
            ) / this.calibrationData.length;
            
            // Lower variance = higher quality
            const stabilityScore = Math.max(0, 1 - (variance.focus * 2));
            
            // Overall quality score (0-1)
            const qualityScore = (sampleQuality * 0.6 + stabilityScore * 0.4);
            
            let status = 'excellent';
            if (qualityScore < 0.3) status = 'poor';
            else if (qualityScore < 0.6) status = 'fair';
            else if (qualityScore < 0.8) status = 'good';
            
            return {
                score: qualityScore,
                status,
                variance,
                sampleQuality: sampleQuality / 2 // Normalize to 0-1
            };
        }

        // Calculate variance for quality assessment
        calculateVariance() {
            if (this.calibrationData.length < 2) {
                return { focus: 0, stress: 0, fatigue: 0 };
            }
            
            const means = this.computeAverages();
            const squaredDiffs = this.calibrationData.reduce((acc, sample) => ({
                focus: acc.focus + Math.pow(sample.focus - means.focus, 2),
                stress: acc.stress + Math.pow(sample.stress - means.stress, 2),
                fatigue: acc.fatigue + Math.pow(sample.fatigue - means.fatigue, 2)
            }), { focus: 0, stress: 0, fatigue: 0 });
            
            const count = this.calibrationData.length;
            
            return {
                focus: squaredDiffs.focus / count,
                stress: squaredDiffs.stress / count,
                fatigue: squaredDiffs.fatigue / count
            };
        }

        // Get adaptive thresholds based on calibration
        getAdaptiveThresholds() {
            if (!this.results.completed) {
                return {
                    focus: 0.6, // Default threshold
                    stress: 0.7,
                    fatigue: 0.6,
                    adaptive: false
                };
            }
            
            const neutral = this.results.neutral;
            const focus = this.results.focus;
            
            // Calculate relative thresholds
            const focusRatio = focus.focus / (neutral.focus + 0.001);
            const stressRatio = focus.stress / (neutral.stress + 0.001);
            const fatigueRatio = focus.fatigue / (neutral.fatigue + 0.001);
            
            // Apply safety margins
            const thresholds = {
                focus: Math.max(0.3, Math.min(0.9, focusRatio * 0.8)),
                stress: Math.max(0.3, Math.min(0.9, stressRatio * 0.8)),
                fatigue: Math.max(0.3, Math.min(0.9, fatigueRatio * 0.8)),
                adaptive: true
            };
            
            console.log('Adaptive thresholds calculated:', thresholds);
            return thresholds;
        }

        // Calibration complete callback
        onCalibrationComplete() {
            // Dispatch custom event for other modules
            const event = new CustomEvent('calibrationComplete', {
                detail: {
                    results: this.results,
                    thresholds: this.getAdaptiveThresholds()
                }
            });
            document.dispatchEvent(event);
        }

        // Public API methods
        isCalibrating() {
            return this.isCalibrating;
        }

        getCalibrationType() {
            return this.calibrationType;
        }

        getProgress() {
            if (!this.isCalibrating) {
                return 0;
            }
            
            const elapsed = Date.now() - this.startTime;
            const progress = Math.min(100, (elapsed / this.duration) * 100);
            
            return {
                progress,
                elapsed,
                samplesCollected: this.calibrationData.length,
                samplesRequired: this.requiredSamples
            };
        }

        getResults() {
            return { ...this.results };
        }

        resetCalibration() {
            this.isCalibrating = false;
            this.calibrationType = null;
            this.calibrationData = [];
            this.results = {
                neutral: null,
                focus: null,
                completed: false,
                timestamp: null
            };
            
            console.log('Calibration reset');
        }

        // Export calibration data
        exportCalibration() {
            if (!this.results.completed) {
                return null;
            }
            
            return {
                version: '1.0',
                timestamp: this.results.timestamp,
                neutral: this.results.neutral,
                focus: this.results.focus,
                adaptiveThresholds: this.getAdaptiveThresholds()
            };
        }

        // Import calibration data
        importCalibration(data) {
            if (!data || !data.neutral || !data.focus) {
                console.error('Invalid calibration data');
                return false;
            }
            
            this.results = {
                neutral: data.neutral,
                focus: data.focus,
                completed: true,
                timestamp: data.timestamp || Date.now()
            };
            
            console.log('Calibration data imported successfully');
            return true;
        }

        // Validation methods
        validateCalibrationData() {
            if (!this.results.completed) {
                return { valid: false, reason: 'calibration_incomplete' };
            }
            
            const neutralQuality = this.results.neutral.quality;
            const focusQuality = this.results.focus.quality;
            
            if (neutralQuality.score < 0.3 || focusQuality.score < 0.3) {
                return { valid: false, reason: 'poor_quality' };
            }
            
            // Check for reasonable ranges
            const focusRatio = this.results.focus.focus / (this.results.neutral.focus + 0.001);
            if (focusRatio < 1.1 || focusRatio > 3.0) {
                return { valid: false, reason: 'unrealistic_focus_ratio' };
            }
            
            return { valid: true };
        }

        // Get calibration summary
        getSummary() {
            if (!this.results.completed) {
                return { status: 'not_completed' };
            }
            
            const validation = this.validateCalibrationData();
            const thresholds = this.getAdaptiveThresholds();
            
            return {
                status: 'completed',
                validation,
                thresholds,
                neutralBaseline: this.results.neutral,
                focusBaseline: this.results.focus,
                quality: {
                    neutral: this.results.neutral.quality.score,
                    focus: this.results.focus.quality.score,
                    overall: (this.results.neutral.quality.score + this.results.focus.quality.score) / 2
                }
            };
        }
    }

    // Export for global access
    window.CalibrationModule = CalibrationModule;

})();
