// Main JavaScript for CV Website
document.addEventListener('DOMContentLoaded', function() {
    console.log('CV Website loaded successfully');
    
    // Initialize theme
    initializeTheme();
    
    // Add active state highlighting to navigation
    updateActiveNavigation();
    
    // Smooth scrolling for any internal links
    initializeSmoothScrolling();
});

function updateActiveNavigation() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        let isActive = false;
        
        // Check if we're on the index page
        if (currentPath.endsWith('/') || currentPath.endsWith('/index.html')) {
            isActive = href === 'index.html' || href === './index.html';
        } 
        // Check if we're on a page in the pages directory
        else if (currentPath.includes('/pages/')) {
            const pageName = currentPath.split('/').pop();
            isActive = href.endsWith(pageName);
        }
        // Check if we're at the root level but not index
        else {
            const pageName = currentPath.split('/').pop();
            isActive = href === `pages/${pageName}` || href.endsWith(pageName);
        }
        
        if (isActive) {
            link.classList.add('font-medium');
            link.style.backgroundColor = 'var(--color-primary)';
            link.style.color = 'var(--color-base)';
            // Remove hover effect for active link
            link.onmouseover = null;
            link.onmouseout = null;
        } else {
            link.classList.remove('font-medium');
            link.style.backgroundColor = 'transparent';
            link.style.color = 'var(--color-text)';
        }
    });
}

function initializeSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
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

// Utility function for future use
function showNotification(message, type = 'info') {
    // Can be expanded later for user feedback
    console.log(`${type.toUpperCase()}: ${message}`);
}

// Theme management functions
function initializeTheme() {
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Update toggle switch position
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
        toggle.checked = savedTheme === 'dark';
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Make toggleTheme available globally
window.toggleTheme = toggleTheme;