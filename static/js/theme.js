// Universal theme initialization and management
// This script should be loaded FIRST, before any other scripts or content

(function() {
    'use strict';
    
    // Initialize theme immediately to prevent flash
    function initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        // Add class to prevent transitions during initial load
        document.documentElement.classList.add('no-transitions');
    }
    
    // Remove transition prevention after page loads
    function enableTransitions() {
        setTimeout(function() {
            document.documentElement.classList.remove('no-transitions');
        }, 50);
    }
    
    // Initialize theme toggle switches
    function initializeThemeToggle() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const desktopToggle = document.getElementById('theme-toggle');
        const mobileToggle = document.getElementById('theme-toggle-mobile');

        if (desktopToggle) {
            desktopToggle.checked = savedTheme === 'light';
        }
        if (mobileToggle) {
            mobileToggle.checked = savedTheme === 'light';
        }
    }

    // Toggle theme function
    function toggleTheme() {
        const isDark = document.documentElement.classList.contains('dark');

        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }

        // Update both toggle switches
        const desktopToggle = document.getElementById('theme-toggle');
        const mobileToggle = document.getElementById('theme-toggle-mobile');

        if (desktopToggle) {
            desktopToggle.checked = isDark;
        }
        if (mobileToggle) {
            mobileToggle.checked = isDark;
        }
    }
    
    // Initialize theme immediately (before DOM loads)
    initializeTheme();
    
    // Set up event listeners when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            enableTransitions();
            // Wait a bit for navbar to load, then initialize toggles
            setTimeout(initializeThemeToggle, 100);
        });
    } else {
        enableTransitions();
        setTimeout(initializeThemeToggle, 100);
    }
    
    // Handle page load event
    window.addEventListener('load', enableTransitions);
    
    // Make functions available globally
    window.toggleTheme = toggleTheme;
    window.initializeThemeToggle = initializeThemeToggle;
    
})();