// Stitch Theme Tailwind Configuration
window.tailwind = window.tailwind || {};
window.tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: '#2563eb', // Blue 600
                'primary-dark': '#1d4ed8', // Blue 700
                'medical-teal': '#0d9488', // Teal 600
                'safe-emerald': '#10b981', // Emerald 500
                'alert-amber': '#f59e0b', // Amber 500
                'danger-rose': '#f43f5e', // Rose 500
                text: {
                    main: '#1f2937', // Gray 800
                    sub: '#6b7280', // Gray 500
                    muted: '#9ca3af' // Gray 400
                },
                surface: {
                    light: '#ffffff',
                    highlight: '#f3f4f6', // Gray 100
                    dark: '#1f2937'
                },
                background: {
                    light: '#f9fafb', // Gray 50
                    dark: '#111827' // Gray 900
                },
                border: {
                    light: '#e5e7eb', // Gray 200
                    dark: '#374151' // Gray 700
                }
            },
            fontFamily: {
                display: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace']
            }
        }
    }
};
