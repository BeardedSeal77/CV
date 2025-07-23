// Navbar component for CV website
function createNavbar(currentPage = '') {
    // Determine the correct path prefix based on current location
    const isInPagesDir = window.location.pathname.includes('/pages/');
    const pathPrefix = isInPagesDir ? '../' : '';
    
    // Navigation items with their paths
    const navItems = [
        { name: 'About Me', href: `${isInPagesDir ? '../' : ''}index.html`, id: 'about' },
        { name: 'Education', href: `${pathPrefix}pages/education.html`, id: 'education' },
        { name: 'Experience', href: `${pathPrefix}pages/experience.html`, id: 'experience' },
        { name: 'Projects', href: `${pathPrefix}pages/projects.html`, id: 'projects' },
        { name: 'Hobbies', href: `${pathPrefix}pages/hobbies.html`, id: 'hobbies' },
        { name: 'CV', href: `${pathPrefix}pages/cv.html`, id: 'cv' }
    ];

    return `
        <nav class="shadow-md" style="background-color: var(--color-surface);">
            <div class="flex justify-between items-center px-6 py-4">
                <!-- Navigation Links -->
                <div class="flex space-x-4">
                    ${navItems.map(item => {
                        const isActive = currentPage === item.id;
                        return `
                            <a class="px-4 py-2 rounded-xl transition-colors ${isActive ? 'font-medium' : 'hover:bg-opacity-80'}" 
                               style="${isActive ? 
                                   'background-color: var(--color-primary); color: var(--color-base);' : 
                                   'color: var(--color-text);'}"
                               ${!isActive ? `onmouseover="this.style.backgroundColor='var(--color-overlay)'" 
                                            onmouseout="this.style.backgroundColor='transparent'"` : ''}
                               href="${item.href}">${item.name}</a>
                        `;
                    }).join('')}
                </div>
                
                <!-- Right side: Theme toggle and Name -->
                <div class="flex items-center space-x-4">
                    <!-- Theme Toggle Switch -->
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="theme-toggle" class="sr-only peer" onchange="toggleTheme()">
                        <div class="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700
                                    relative after:content-[''] after:absolute after:top-1 after:left-1
                                    after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all
                                    peer-checked:after:translate-x-6 peer-checked:bg-blue-600 flex items-center justify-between px-2">
                            <!-- Sun icon for light mode -->
                            <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path>
                            </svg>
                            <!-- Moon icon for dark mode -->
                            <svg class="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                            </svg>
                        </div>
                    </label>
                    
                    <!-- Name/Brand -->
                    <span class="text-lg font-semibold" style="color: var(--color-primary);">
                        Erin David Cullen
                    </span>
                </div>
            </div>
        </nav>
    `;
}

// Function to load navbar
function loadNavbar(currentPage) {
    const navbarContainer = document.getElementById('navbar-container');
    if (navbarContainer) {
        navbarContainer.innerHTML = createNavbar(currentPage);
        console.log('Navbar loaded successfully for page:', currentPage);
    } else {
        console.error('Navbar container not found! Make sure you have <div id="navbar-container"></div> in your HTML.');
    }
}

// Function to initialize navbar on page load
function initializeNavbar(currentPage = '') {
    // Check if we're already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            loadNavbar(currentPage);
        });
    } else {
        // DOM is already loaded
        loadNavbar(currentPage);
    }
}

// Auto-detect current page and initialize
document.addEventListener('DOMContentLoaded', function() {
    // Auto-detect the current page based on URL
    const path = window.location.pathname;
    let currentPage = 'about'; // default
    
    if (path.includes('education.html')) currentPage = 'education';
    else if (path.includes('experience.html')) currentPage = 'experience';
    else if (path.includes('projects.html')) currentPage = 'projects';
    else if (path.includes('hobbies.html')) currentPage = 'hobbies';
    else if (path.includes('cv.html')) currentPage = 'cv';
    else if (path.includes('index.html') || path.endsWith('/')) currentPage = 'about';
    
    console.log('Auto-detected page:', currentPage);
    loadNavbar(currentPage);
});