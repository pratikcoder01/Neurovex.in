/**
 * Neurovex Landing Page - Basic Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    initMobileMenu();
    initSmoothScrolling();
    initEEGSimulation();
    initScrollAnimations();
});

// Theme Toggle
function initThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    const html = document.documentElement;
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        html.classList.add('dark');
    }
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            html.classList.toggle('dark');
            const isDark = html.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            
            // Update icon
            const icon = themeToggle.querySelector('.material-icons');
            icon.textContent = isDark ? 'light_mode' : 'dark_mode';
        });
    }
}

// Mobile Menu
function initMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.navbar');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            // Simple mobile menu toggle logic
            const icon = mobileToggle.querySelector('.material-icons');
            icon.textContent = icon.textContent === 'menu' ? 'close' : 'menu';
        });
    }
}

// Smooth Scrolling
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// EEG Simulation (Basic)
function initEEGSimulation() {
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
        canvas.width = rect.width;
        canvas.height = rect.height;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // State management
    let currentMode = 'focus';
    let animationId;
    let dataBuffer = new Array(100).fill(0);
    let phase = 0;
    
    // State button handlers
    stateButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            stateButtons.forEach(b => b.classList.remove('state-btn-active'));
            btn.classList.add('state-btn-active');
            currentMode = btn.textContent.toLowerCase().includes('focus') ? 'focus' : 'relax';
        });
    });
    
    // Animation loop
    function animate() {
        animationId = requestAnimationFrame(animate);
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Generate waveform data
        phase += 0.05;
        let intensity = currentMode === 'focus' ? 0.8 : 0.3;
        let value = Math.sin(phase * 2) * intensity + Math.sin(phase * 0.5) * (1 - intensity);
        
        dataBuffer.push(value);
        dataBuffer.shift();
        
        // Draw waveform
        ctx.strokeStyle = currentMode === 'focus' ? '#2563eb' : '#22c55e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const stepX = canvas.width / (dataBuffer.length - 1);
        dataBuffer.forEach((val, i) => {
            const x = i * stepX;
            const y = canvas.height / 2 + val * canvas.height / 4;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        
        ctx.stroke();
        
        // Update metrics
        const attention = currentMode === 'focus' ? 85 : 25;
        const relaxation = currentMode === 'focus' ? 20 : 88;
        const fatigue = 15 + Math.random() * 10;
        
        if (metricValues.attention) metricValues.attention.textContent = `${attention}%`;
        if (metricValues.relaxation) metricValues.relaxation.textContent = `${relaxation}%`;
        if (metricValues.fatigue) metricValues.fatigue.textContent = `${Math.round(fatigue)}%`;
    }
    
    animate();
}

// Scroll Animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe all cards and sections
    document.querySelectorAll('.process-card, .clinical-card, .focus-card, .game-card, .control-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 10) {
        navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    } else {
        navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    }
});
