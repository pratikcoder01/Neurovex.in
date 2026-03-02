// Utility Functions
class Utils {
    // Format date to readable string
    static formatDate(date) {
        if (!date) return 'N/A';
        
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return date.toLocaleDateString('en-US', options);
    }

    // Format duration in seconds to readable string
    static formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    // Format percentage
    static formatPercentage(value) {
        return `${Math.round(value)}%`;
    }

    // Show loading state
    static showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = '<div class="loading-spinner">Loading...</div>';
        }
    }

    // Hide loading state
    static hideLoading(elementId, content = '') {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = content;
        }
    }

    // Show error message
    static showError(message, elementId = 'error-message') {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
            element.className = 'error-message';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                element.style.display = 'none';
            }, 5000);
        } else {
            alert(message);
        }
    }

    // Show success message
    static showSuccess(message, elementId = 'success-message') {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
            element.className = 'success-message';
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                element.style.display = 'none';
            }, 3000);
        }
    }

    // Validate email
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Validate password (minimum 6 characters)
    static validatePassword(password) {
        return password && password.length >= 6;
    }

    // Generate random ID
    static generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Copy to clipboard
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showSuccess('Copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy: ', err);
            this.showError('Failed to copy to clipboard');
        }
    }

    // Download file from URL
    static downloadFile(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Get color based on value (for focus levels)
    static getFocusColor(value) {
        if (value >= 80) return '#4CAF50'; // Green
        if (value >= 60) return '#8BC34A'; // Light Green
        if (value >= 40) return '#FFC107'; // Amber
        if (value >= 20) return '#FF9800'; // Orange
        return '#F44336'; // Red
    }

    // Get status color
    static getStatusColor(status) {
        switch (status) {
            case 'connected': return '#4CAF50';
            case 'disconnected': return '#F44336';
            case 'connecting': return '#FF9800';
            default: return '#9E9E9E';
        }
    }

    // Format file size
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Check if device is mobile
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // Get device type
    static getDeviceType() {
        if (this.isMobile()) {
            return 'mobile';
        } else if (window.innerWidth < 1024) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    }

    // Set theme
    static setTheme(theme) {
        document.body.className = theme;
        localStorage.setItem('theme', theme);
    }

    // Get saved theme
    static getTheme() {
        return localStorage.getItem('theme') || 'light';
    }

    // Initialize theme
    static initTheme() {
        const theme = this.getTheme();
        this.setTheme(theme);
    }

    // Parse URL parameters
    static getUrlParams() {
        const params = {};
        const urlParams = new URLSearchParams(window.location.search);
        
        for (const [key, value] of urlParams) {
            params[key] = value;
        }
        
        return params;
    }

    // Redirect to URL
    static redirect(url) {
        window.location.href = url;
    }

    // Reload page
    static reload() {
        window.location.reload();
    }

    // Get current timestamp
    static getTimestamp() {
        return new Date().toISOString();
    }

    // Calculate age from date
    static calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }

    // Generate chart colors
    static getChartColors() {
        return {
            primary: '#2196F3',
            secondary: '#4CAF50',
            accent: '#FF9800',
            danger: '#F44336',
            warning: '#FFC107',
            info: '#2196F3',
            success: '#4CAF50',
            light: '#F5F5F5',
            dark: '#212121'
        };
    }

    // Create gradient
    static createGradient(color1, color2, angle = 45) {
        return `linear-gradient(${angle}deg, ${color1}, ${color2})`;
    }

    // Animate number
    static animateNumber(element, start, end, duration = 1000) {
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = start + (end - start) * progress;
            element.textContent = Math.round(current);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    // Scroll to element
    static scrollToElement(elementId, offset = 0) {
        const element = document.getElementById(elementId);
        if (element) {
            const top = element.offsetTop - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    }

    // Check if element is in viewport
    static isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Lazy load images
    static lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]');
        
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }

    // Initialize all utilities
    static init() {
        this.initTheme();
        this.lazyLoadImages();
    }
}

// Export for use in other modules
export default Utils;
