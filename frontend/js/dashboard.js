// Dashboard Controller - Modular v12 SDK
import { authManager } from './auth.js';
import { sessionManager } from './sessions.js';
import { eegManager } from './eeg.js';
import Utils from './utils.js';

class DashboardController {
    constructor() {
        this.chart = null;
        this.isSimulating = false;
        this.simulationInterval = null;
        this.sessionInterval = null;
        
        this.init();
    }

    async init() {
        // Check authentication
        if (!authManager.isAuthenticated()) {
            Utils.redirect('login.html');
            return;
        }

        // Initialize dashboard
        await this.loadDashboardData();
        this.setupEventListeners();
        this.initializeChart();
        this.startRealTimeUpdates();
    }

    async loadDashboardData() {
        try {
            // Load user stats
            await this.loadUserStats();
            
            // Load recent sessions
            await this.loadRecentSessions();
            
            // Update UI
            this.updateUI();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            Utils.showError('Failed to load dashboard data');
        }
    }

    async loadUserStats() {
        const result = await sessionManager.getUserSessionStats();
        
        if (result.success) {
            this.userStats = result.stats;
            this.animateStats();
        } else {
            console.error('Failed to load user stats:', result.error);
        }
    }

    async loadRecentSessions() {
        const user = authManager.getCurrentUser();
        const result = await eegManager.getSessionHistory(user.uid, 10);
        
        if (result.success) {
            this.recentSessions = result.sessions;
            this.updateSessionsTable();
        } else {
            console.error('Failed to load recent sessions:', result.error);
        }
    }

    setupEventListeners() {
        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.handleLogout();
        });

        // Device connection
        document.getElementById('connectBtn')?.addEventListener('click', () => {
            this.toggleDeviceConnection();
        });

        // Session controls
        document.getElementById('startSessionBtn')?.addEventListener('click', () => {
            this.startSession();
        });

        document.getElementById('endSessionBtn')?.addEventListener('click', () => {
            this.endSession();
        });

        // Window resize
        window.addEventListener('resize', () => {
            if (this.chart) {
                this.chart.resize();
            }
        });
    }

    initializeChart() {
        const ctx = document.getElementById('eegChart');
        if (!ctx) return;

        this.chart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'EEG Signal',
                    data: [],
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Time',
                            color: '#666'
                        },
                        ticks: {
                            maxTicksLimit: 10
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Amplitude',
                            color: '#666'
                        },
                        min: -100,
                        max: 100
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false
                    }
                },
                animation: {
                    duration: 0
                }
            }
        });
    }

    startRealTimeUpdates() {
        // Update session duration
        this.sessionInterval = setInterval(() => {
            this.updateSessionDuration();
        }, 1000);

        // Start EEG simulation if device is connected
        if (this.isDeviceConnected()) {
            this.startEEGSimulation();
        }
    }

    animateStats() {
        if (!this.userStats) return;

        const stats = this.userStats;
        
        // Animate numbers
        this.animateValue('totalSessions', 0, stats.totalSessions, 1000);
        this.animateValue('avgFocus', 0, Math.round(stats.averageFocus), 1000);
        this.animateValue('maxFocus', 0, Math.round(stats.maxFocus), 1000);
    }

    animateValue(elementId, start, end, duration) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.round(start + (end - start) * progress);
            element.textContent = elementId === 'avgFocus' || elementId === 'maxFocus' ? 
                `${current}%` : current;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    updateSessionsTable() {
        const tbody = document.getElementById('sessionsTableBody');
        if (!tbody) return;

        if (!this.recentSessions || this.recentSessions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-gray-500">No sessions yet</td></tr>';
            return;
        }

        tbody.innerHTML = this.recentSessions.map(session => {
            const startTime = Utils.formatDate(session.startTime);
            const duration = session.endTime ? 
                Utils.formatDuration(Math.floor((session.endTime - session.startTime) / 1000)) : 
                'In progress';
            const avgFocus = session.avgFocus ? Utils.formatPercentage(session.avgFocus) : 'N/A';
            const maxFocus = session.maxFocus ? Utils.formatPercentage(session.maxFocus) : 'N/A';
            const status = session.endTime ? 'Completed' : 'Active';
            const statusClass = session.endTime ? 'status-connected' : 'status-connecting';
            
            return `
                <tr>
                    <td>${startTime}</td>
                    <td>${duration}</td>
                    <td>${avgFocus}</td>
                    <td>${maxFocus}</td>
                    <td><span class="status ${statusClass}">${status}</span></td>
                    <td>
                        ${session.csvFileUrl ? 
                            `<button class="btn btn-outline btn-sm" onclick="dashboard.downloadCSV('${session.id}', '${session.csvFileUrl}')">Download</button>` : 
                            '<span class="text-gray-400">No data</span>'
                        }
                    </td>
                </tr>
            `;
        }).join('');
    }

    updateUI() {
        // Update device status
        this.updateDeviceStatus();
        
        // Update session controls
        this.updateSessionControls();
    }

    updateDeviceStatus() {
        const statusElement = document.getElementById('deviceStatus');
        const connectBtn = document.getElementById('connectBtn');
        
        if (!statusElement || !connectBtn) return;

        if (this.isDeviceConnected()) {
            statusElement.textContent = 'Connected';
            statusElement.className = 'status status-connected';
            connectBtn.textContent = 'Disconnect';
            connectBtn.className = 'btn btn-danger btn-sm';
        } else {
            statusElement.textContent = 'Disconnected';
            statusElement.className = 'status status-disconnected';
            connectBtn.textContent = 'Connect Device';
            connectBtn.className = 'btn btn-primary btn-sm';
        }
    }

    updateSessionControls() {
        const startBtn = document.getElementById('startSessionBtn');
        const endBtn = document.getElementById('endSessionBtn');
        const sessionMessage = document.getElementById('sessionMessage');
        
        if (!startBtn || !endBtn || !sessionMessage) return;

        const sessionStatus = sessionManager.getCurrentSessionStatus();
        
        if (sessionStatus.isActive) {
            startBtn.disabled = true;
            endBtn.disabled = false;
            sessionMessage.textContent = 'Session in progress...';
        } else {
            startBtn.disabled = false;
            endBtn.disabled = true;
            sessionMessage.textContent = 'Ready to start session';
        }
    }

    updateSessionDuration() {
        const sessionStatus = sessionManager.getCurrentSessionStatus();
        const sessionTimeElement = document.getElementById('sessionTime');
        const sessionDurationElement = document.getElementById('sessionDuration');
        
        if (sessionStatus.isActive && sessionTimeElement) {
            sessionTimeElement.textContent = sessionStatus.duration;
        }
        
        if (sessionStatus.isActive && sessionDurationElement) {
            sessionDurationElement.textContent = sessionStatus.duration;
        }
    }

    isDeviceConnected() {
        const statusElement = document.getElementById('deviceStatus');
        return statusElement?.classList.contains('status-connected') || false;
    }

    async toggleDeviceConnection() {
        const isConnected = this.isDeviceConnected();
        
        if (isConnected) {
            this.disconnectDevice();
        } else {
            this.connectDevice();
        }
    }

    connectDevice() {
        eegManager.setConnectionStatus(true);
        this.updateDeviceStatus();
        this.startEEGSimulation();
        Utils.showSuccess('Device connected successfully!');
    }

    disconnectDevice() {
        eegManager.setConnectionStatus(false);
        this.updateDeviceStatus();
        this.stopEEGSimulation();
        Utils.showSuccess('Device disconnected');
    }

    startEEGSimulation() {
        if (this.isSimulating) return;
        
        this.isSimulating = true;
        this.simulationInterval = setInterval(() => {
            this.updateEEGData();
            this.updateBrainStates();
        }, 100);
    }

    stopEEGSimulation() {
        if (!this.isSimulating) return;
        
        this.isSimulating = false;
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
        }
    }

    updateEEGData() {
        if (!this.chart) return;

        // Generate simulated EEG data
        const timestamp = new Date().toLocaleTimeString();
        const value = Math.sin(Date.now() / 100) * 50 + Math.random() * 20;
        
        // Update chart
        if (this.chart.data.labels.length > 50) {
            this.chart.data.labels.shift();
            this.chart.data.datasets[0].data.shift();
        }
        
        this.chart.data.labels.push(timestamp);
        this.chart.data.datasets[0].data.push(value);
        this.chart.update('none');
    }

    updateBrainStates() {
        // Generate simulated brain states
        const focus = Math.random() * 100;
        const relaxation = Math.random() * 100;
        const stress = Math.random() * 100;
        
        // Update focus meter
        this.updateFocusMeter(focus);
        
        // Update brain state bars
        this.updateBrainStateBars(focus, relaxation, stress);
        
        // Add to EEG manager if session is active
        if (sessionManager.isSessionActive()) {
            sessionManager.simulateEEGData();
        }
    }

    updateFocusMeter(focus) {
        const meterFill = document.getElementById('focusMeterFill');
        const meterValue = document.getElementById('focusValue');
        const focusPercent = document.getElementById('focusPercent');
        const focusBar = document.getElementById('focusBar');
        
        if (meterFill) meterFill.style.height = `${focus}%`;
        if (meterValue) meterValue.textContent = `${Math.round(focus)}%`;
        if (focusPercent) focusPercent.textContent = `${Math.round(focus)}%`;
        if (focusBar) focusBar.style.width = `${focus}%`;
    }

    updateBrainStateBars(focus, relaxation, stress) {
        const relaxPercent = document.getElementById('relaxPercent');
        const relaxBar = document.getElementById('relaxBar');
        const stressPercent = document.getElementById('stressPercent');
        const stressBar = document.getElementById('stressBar');
        
        if (relaxPercent) relaxPercent.textContent = `${Math.round(relaxation)}%`;
        if (relaxBar) relaxBar.style.width = `${relaxation}%`;
        if (stressPercent) stressPercent.textContent = `${Math.round(stress)}%`;
        if (stressBar) stressBar.style.width = `${stress}%`;
    }

    async startSession() {
        const result = await sessionManager.startSession();
        
        if (result.success) {
            this.updateSessionControls();
            Utils.showSuccess('Session started successfully!');
        } else {
            Utils.showError(result.error);
        }
    }

    async endSession() {
        const result = await sessionManager.endSession();
        
        if (result.success) {
            this.updateSessionControls();
            Utils.showSuccess('Session ended successfully!');
            
            // Reload data
            await this.loadDashboardData();
        } else {
            Utils.showError(result.error);
        }
    }

    async handleLogout() {
        const result = await authManager.signOut();
        
        if (result.success) {
            Utils.redirect('login.html');
        } else {
            Utils.showError('Failed to logout');
        }
    }

    async downloadCSV(sessionId, csvUrl) {
        Utils.downloadFile(csvUrl, `neurovex_session_${sessionId}.csv`);
    }

    // Cleanup
    destroy() {
        this.stopEEGSimulation();
        
        if (this.sessionInterval) {
            clearInterval(this.sessionInterval);
        }
        
        if (this.chart) {
            this.chart.destroy();
        }
    }
}

// Initialize dashboard
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    Utils.init();
    dashboard = new DashboardController();
    
    // Make dashboard available globally for download function
    window.dashboard = dashboard;
});

// Export for module usage
export default DashboardController;
