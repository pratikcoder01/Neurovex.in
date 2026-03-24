/**
 * Enhanced Neurovex Landing Page - Advanced Interactions & UI/UX
 */

document.addEventListener('DOMContentLoaded', () => {
    initEnhancedThemeToggle();
    initMobileMenu();
    initSmoothScrolling();
    initEnhancedEEGSimulation();
    initScrollAnimations();
    initMicroInteractions();
    initNavbarEffects();
});

// Enhanced Theme Toggle with smooth transitions
function initEnhancedThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    const html = document.documentElement;
    
    // Load saved theme
    const savedTheme = localStorage.getItem('neurovex-theme');
    if (savedTheme === 'dark') {
        html.classList.add('dark');
        updateThemeIcon(true);
    }
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = html.classList.toggle('dark');
            localStorage.setItem('neurovex-theme', isDark ? 'dark' : 'light');
            updateThemeIcon(isDark);
            
            // Add ripple effect
            createRipple(themeToggle, event);
        });
    }
}

function updateThemeIcon(isDark) {
    const icon = document.querySelector('.theme-toggle .material-icons');
    if (icon) {
        icon.textContent = isDark ? 'light_mode' : 'dark_mode';
    }
}

// Enhanced Mobile Menu with slide animation
function initMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            const icon = mobileToggle.querySelector('.material-icons');
            const isOpen = icon.textContent === 'menu';
            
            icon.textContent = isOpen ? 'close' : 'menu';
            
            // Add animation class
            mobileToggle.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
            
            // Create mobile menu overlay
            toggleMobileMenu(isOpen);
        });
    }
}

function toggleMobileMenu(isOpen) {
    // Create mobile menu if it doesn't exist
    let mobileMenu = document.querySelector('.mobile-menu-overlay');
    
    if (!isOpen && !mobileMenu) {
        mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-menu-overlay';
        mobileMenu.innerHTML = `
            <div class="mobile-menu-content">
                <div class="mobile-menu-header">
                    <img src="assets/images/logo.jpeg" alt="Neurovex" class="mobile-logo">
                    <span class="mobile-brand">Neurovex</span>
                </div>
                <div class="mobile-nav-links">
                    <a href="#how-it-works">How It Works</a>
                    <a href="#use-cases">Use Cases</a>
                    <a href="#hardware-control">Hardware Control</a>
                    <a href="#live-demo">Live Demo</a>
                    <a href="#study-focus">Study Focus Mode</a>
                    <a href="#neurovex-games">Neurovex Games</a>
                    <a href="#safety-ethics">Safety & Ethics</a>
                </div>
                <div class="mobile-menu-actions">
                    <a href="#signin" class="mobile-sign-in">Sign In</a>
                    <a href="#get-started" class="mobile-get-started">Get Started</a>
                </div>
            </div>
        `;
        document.body.appendChild(mobileMenu);
        
        // Animate in
        requestAnimationFrame(() => {
            mobileMenu.classList.add('mobile-menu-open');
        });
    } else if (mobileMenu) {
        // Animate out and remove
        mobileMenu.classList.remove('mobile-menu-open');
        setTimeout(() => {
            if (mobileMenu.parentNode) {
                mobileMenu.parentNode.removeChild(mobileMenu);
            }
        }, 300);
    }
}

// Enhanced Smooth Scrolling with progress indicator
function initSmoothScrolling() {
    const progressIndicator = document.createElement('div');
    progressIndicator.className = 'scroll-progress';
    document.body.appendChild(progressIndicator);
    
    // Update scroll progress
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress = (scrollTop / scrollHeight) * 100;
        progressIndicator.style.width = `${scrollProgress}%`;
    });
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80; // Account for navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Enhanced EEG Simulation with realistic waveforms
function initEnhancedEEGSimulation() {
    const canvas = document.getElementById('eeg-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const stateButtons = document.querySelectorAll('.state-btn');
    const metricValues = {
        attention: document.querySelector('.metric-blue'),
        relaxation: document.querySelector('.metric-teal'),
        fatigue: document.querySelector('.metric-gray')
    };
    
    // Set canvas size
    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Enhanced state management
    let currentMode = 'focus';
    let animationId;
    let dataBuffer = new Array(200).fill(0);
    let phase = 0;
    let noiseLevel = 0.1;
    
    // State button handlers with enhanced feedback
    stateButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            stateButtons.forEach(b => b.classList.remove('state-btn-active'));
            btn.classList.add('state-btn-active');
            currentMode = btn.textContent.toLowerCase().includes('focus') ? 'focus' : 'relax';
            
            // Add click feedback
            createRipple(btn, event);
            
            // Update status
            updateConnectionStatus(true);
        });
    });
    
    function updateConnectionStatus(connected) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        const channelInfo = document.querySelector('.channel-info');
        
        if (statusDot && statusText && channelInfo) {
            if (connected) {
                statusDot.classList.remove('status-disconnected');
                statusDot.classList.add('status-connected');
                statusText.textContent = 'SIGNAL: CONNECTED';
                channelInfo.textContent = 'CHANNEL: Fp1';
            } else {
                statusDot.classList.add('status-disconnected');
                statusDot.classList.remove('status-connected');
                statusText.textContent = 'SIGNAL: DISCONNECTED';
                channelInfo.textContent = 'CHANNEL: --';
            }
        }
    }
    
    // Enhanced animation loop
    function animate() {
        animationId = requestAnimationFrame(animate);
        
        // Clear canvas with fade effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Generate realistic waveform data
        phase += 0.03;
        const time = Date.now() / 1000;
        
        // Multiple frequency components for realistic EEG
        let value = 0;
        if (currentMode === 'focus') {
            // Beta waves (13-30 Hz) for focus
            value += Math.sin(phase * 8) * 0.6;  // 16 Hz
            value += Math.sin(phase * 12) * 0.3; // 24 Hz
            value += Math.sin(phase * 20) * 0.2; // 40 Hz
            value += Math.sin(phase * 0.5) * 0.1; // Slow drift
            noiseLevel = 0.05;
        } else {
            // Alpha waves (8-13 Hz) for relaxation
            value += Math.sin(phase * 2) * 0.8;   // 10 Hz
            value += Math.sin(phase * 3) * 0.4;   // 15 Hz
            value += Math.sin(phase * 0.3) * 0.2;  // Slow drift
            noiseLevel = 0.03;
        }
        
        // Add realistic noise
        value += (Math.random() - 0.5) * noiseLevel;
        
        dataBuffer.push(value);
        dataBuffer.shift();
        
        // Draw enhanced waveform
        ctx.strokeStyle = currentMode === 'focus' ? '#3b82f6' : '#14b8a6';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Main waveform
        ctx.beginPath();
        const stepX = canvas.width / (dataBuffer.length - 1);
        dataBuffer.forEach((val, i) => {
            const x = i * stepX;
            const y = canvas.height / 2 + val * canvas.height / 3;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // Add glow effect
        ctx.strokeStyle = currentMode === 'focus' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(20, 184, 166, 0.3)';
        ctx.lineWidth = 6;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        // Update metrics with realistic values
        const baseAttention = currentMode === 'focus' ? 85 : 25;
        const baseRelaxation = currentMode === 'focus' ? 20 : 88;
        const baseFatigue = 15 + Math.sin(time * 0.5) * 8;
        
        if (metricValues.attention) metricValues.attention.textContent = `${Math.round(baseAttention + Math.random() * 10)}%`;
        if (metricValues.relaxation) metricValues.relaxation.textContent = `${Math.round(baseRelaxation + Math.random() * 10)}%`;
        if (metricValues.fatigue) metricValues.fatigue.textContent = `${Math.round(baseFatigue)}%`;
    }
    
    animate();
}

// Enhanced Scroll Animations with staggered effects
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    entry.target.classList.add('animate-in');
                }, index * 100); // Staggered animation
            }
        });
    }, observerOptions);
    
    // Observe all cards and sections
    document.querySelectorAll('.enhanced-card, .control-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(el);
    });
}

// Micro-interactions for better UX
function initMicroInteractions() {
    // Add hover effects to all interactive elements
    document.querySelectorAll('a, button, .enhanced-card').forEach(element => {
        element.addEventListener('mouseenter', function(e) {
            this.style.transform = 'scale(1.02)';
        });
        
        element.addEventListener('mouseleave', function(e) {
            if (!this.classList.contains('state-btn-active')) {
                this.style.transform = 'scale(1)';
            }
        });
    });
    
    // Add parallax effect to hero section
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallax = scrolled * 0.5;
            heroSection.style.transform = `translateY(${parallax}px)`;
        });
    }
}

// Enhanced Navbar scroll effects
function initNavbarEffects() {
    const navbar = document.querySelector('.navbar');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down
            navbar.style.transform = 'translateY(-100%)';
            navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        } else {
            // Scrolling up or at top
            navbar.style.transform = 'translateY(0)';
            navbar.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        }
        
        lastScrollTop = scrollTop;
    });
}

// Ripple effect for better feedback
function createRipple(element, event) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Add CSS for new elements
const style = document.createElement('style');
style.textContent = `
    .mobile-menu-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(20px);
        z-index: 999;
        transform: translateX(100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .mobile-menu-overlay.mobile-menu-open {
        transform: translateX(0);
    }
    
    .mobile-menu-content {
        padding: 80px 24px 24px;
        height: 100%;
        overflow-y: auto;
    }
    
    .mobile-menu-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 32px;
    }
    
    .mobile-logo {
        width: 32px;
        height: 32px;
        border-radius: 8px;
    }
    
    .mobile-brand {
        font-size: 20px;
        font-weight: 700;
        color: white;
    }
    
    .mobile-nav-links {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-bottom: 32px;
    }
    
    .mobile-nav-links a {
        color: #cbd5e1;
        text-decoration: none;
        font-size: 16px;
        padding: 12px 16px;
        border-radius: 8px;
        transition: all 0.2s ease;
    }
    
    .mobile-nav-links a:hover {
        background: rgba(59, 130, 246, 0.1);
        color: white;
    }
    
    .mobile-menu-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    
    .mobile-sign-in {
        background: transparent;
        color: white;
        border: 1px solid #475569;
        padding: 12px 16px;
        border-radius: 8px;
        text-decoration: none;
        text-align: center;
        transition: all 0.2s ease;
    }
    
    .mobile-get-started {
        background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        text-decoration: none;
        text-align: center;
        transition: all 0.2s ease;
    }
    
    .scroll-progress {
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, #3b82f6, #8b5cf6);
        z-index: 1001;
        transition: width 0.1s ease;
    }
    
    .status-connected {
        background: #10b981;
        animation: pulse 2s infinite;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .animate-in {
        animation: slideInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .process-number {
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        color: white;
        font-weight: 700;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
    
    .clinical-icon, .focus-icon, .game-icon {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
`;
document.head.appendChild(style);
