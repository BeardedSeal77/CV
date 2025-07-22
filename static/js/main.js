// Main JavaScript for CV Website
document.addEventListener('DOMContentLoaded', function() {
    console.log('CV Website loaded successfully');
    
    // Add active state highlighting to navigation
    updateActiveNavigation();
    
    // Smooth scrolling for any internal links
    initializeSmoothScrolling();
});

function updateActiveNavigation() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('bg-[#c8ae7d]/30', 'text-[#1c1f24]', 'font-medium');
            link.classList.remove('hover:bg-[#2b2f36]');
        } else {
            link.classList.remove('bg-[#c8ae7d]/30', 'text-[#1c1f24]', 'font-medium');
            link.classList.add('hover:bg-[#2b2f36]');
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