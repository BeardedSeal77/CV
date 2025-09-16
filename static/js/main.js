// Main JavaScript for CV Website
document.addEventListener('DOMContentLoaded', function() {
    console.log('CV Website loaded successfully');
    
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
            link.classList.add('font-medium', 'bg-primary', 'text-white');
            // Remove hover effect for active link
            link.onmouseover = null;
            link.onmouseout = null;
        } else {
            link.classList.remove('font-medium', 'bg-primary', 'text-white');
            link.classList.add('text-body');
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

// Theme functionality is now handled by theme.js