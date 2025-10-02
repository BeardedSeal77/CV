// Navbar component for CV website
function createNavbar(currentPage = '') {
    // Determine the correct path prefix based on current location depth
    const path = window.location.pathname;
    let pathPrefix = '';
    let indexPath = 'index.html';

    if (path.includes('/pages/aetherflow/')) {
        // In subdirectory like /pages/aetherflow/
        pathPrefix = '../../';
        indexPath = '../../index.html';
    } else if (path.includes('/pages/')) {
        // In pages directory like /pages/
        pathPrefix = '../';
        indexPath = '../index.html';
    } else {
        // At root level
        pathPrefix = '';
        indexPath = 'index.html';
    }

    // Check dev mode state
    const isDevMode = sessionStorage.getItem('devMode') === 'true';

    // Navigation items with their paths
    const navItems = [
        { name: 'About Me', href: indexPath, id: 'about' },
        { name: 'Education', href: `${pathPrefix}pages/education.html`, id: 'education' },
        { name: 'Experience', href: `${pathPrefix}pages/experience.html`, id: 'experience' },
        { name: 'Projects', href: `${pathPrefix}pages/projects.html`, id: 'projects' },
        { name: 'Hobbies', href: `${pathPrefix}pages/hobbies.html`, id: 'hobbies' },
        { name: 'CV', href: `${pathPrefix}pages/cv.html`, id: 'cv' }
    ];

    // Add dev mode items if dev mode is enabled
    if (isDevMode) {
        navItems.push({ name: 'AetherFlow', href: `${pathPrefix}pages/aetherflow.html`, id: 'aetherflow' });
        navItems.push({ name: 'Pallet', href: `${pathPrefix}pages/pallet.html`, id: 'pallet' });
    }

    return `
        <style>
            /* Mobile navbar - shown by default, hidden on desktop */
            .mobile-nav {
                display: block;
            }
            
            /* Desktop navbar - hidden by default */
            .desktop-nav {
                display: none;
            }
            
            /* On larger screens, hide mobile and show desktop */
            @media (min-width: 768px) {
                .desktop-nav {
                    display: flex;
                }
                .mobile-nav {
                    display: none;
                }
            }
            
            /* Mobile menu dropdown hidden by default */
            .mobile-menu-hidden {
                display: none;
            }
            
            /* Ribbon styles */
            .ribbon-container {
                position: relative;
                z-index: 10;
                overflow: hidden;
                max-height: 0;
                transition: max-height 0.3s ease-in-out;
            }
            
            .ribbon-container.show {
                max-height: 100px;
            }
            
            .ribbon {
                padding: 12px 24px;
                background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                transform: translateY(-100%);
                transition: transform 0.3s ease-in-out;
            }
            
            .ribbon-container.show .ribbon {
                transform: translateY(0);
            }
            
            .ribbon-item {
                display: inline-block;
                padding: 8px 16px;
                margin: 0 4px;
                background-color: rgba(255, 255, 255, 0.2);
                color: white;
                text-decoration: none;
                border-radius: 6px;
                transition: all 0.2s ease;
                backdrop-filter: blur(10px);
            }
            
            .ribbon-item:hover {
                background-color: rgba(255, 255, 255, 0.3);
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }
        </style>
        <nav class="shadow-md bg-surface">
            <div class="px-6 py-4">
                <!-- Desktop Layout -->
                <div class="desktop-nav justify-between items-center">
                    <!-- Navigation Links -->
                    <div class="flex space-x-4">
                        ${navItems.map(item => {
                            const isActive = currentPage === item.id;
                            if (item.hasRibbon) {
                                return `
                                    <button class="px-4 py-2 rounded-xl transition-colors ${isActive ? 'font-medium bg-primary text-base' : 'bg-surface text-body hover:bg-overlay'}"
                                       onclick="toggleRibbon('${item.id}')">${item.name}</button>
                                `;
                            }
                            return `
                                <a class="px-4 py-2 rounded-xl transition-colors ${isActive ? 'font-medium bg-primary text-base' : 'bg-surface text-body hover:bg-overlay'}"
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

                        <!-- Name/Brand (Secret Dev Mode Button) -->
                        <span class="text-lg font-semibold text-primary cursor-pointer select-none" onclick="toggleDevMode()">
                            Erin David Cullen
                        </span>
                    </div>
                </div>

                <!-- Mobile Layout -->
                <div class="mobile-nav">
                    <!-- Mobile Header -->
                    <div class="flex justify-between items-center">
                        <!-- Name/Brand (Secret Dev Mode Button) -->
                        <span class="text-lg font-semibold text-primary cursor-pointer select-none" onclick="toggleDevMode()">
                            Erin David Cullen
                        </span>
                        
                        <!-- Mobile Menu Button and Theme Toggle -->
                        <div class="flex items-center space-x-3">
                            <!-- Theme Toggle (smaller for mobile) -->
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="theme-toggle-mobile" class="sr-only peer" onchange="toggleTheme()">
                                <div class="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700
                                            relative after:content-[''] after:absolute after:top-0.5 after:left-0.5
                                            after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
                                            peer-checked:after:translate-x-6 peer-checked:bg-blue-600">
                                </div>
                            </label>
                            
                            <!-- Hamburger Menu Button -->
                            <button id="mobile-menu-button" class="p-3 rounded-lg transition-colors bg-overlay text-body border-2 border-primary hover:bg-surface flex items-center justify-center"
                                    style="min-width: 50px; min-height: 50px; font-size: 18px; font-weight: bold;"
                                    onclick="toggleMobileMenu()">
                                ☰
                            </button>
                        </div>
                    </div>
                    
                    <!-- Mobile Menu (Hidden by default) -->
                    <div id="mobile-menu" class="mobile-menu-hidden mt-4 space-y-2">
                        ${navItems.map(item => {
                            const isActive = currentPage === item.id;
                            if (item.hasRibbon) {
                                return `
                                    <button class="block w-full text-left px-4 py-3 rounded-lg transition-colors ${isActive ? 'font-medium bg-primary text-base' : 'bg-surface text-body hover:bg-overlay'}"
                                       onclick="toggleRibbon('${item.id}')">${item.name}</button>
                                `;
                            }
                            return `
                                <a class="block px-4 py-3 rounded-lg transition-colors ${isActive ? 'font-medium bg-primary text-base' : 'bg-surface text-body hover:bg-overlay'}"
                                   href="${item.href}">${item.name}</a>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </nav>
        
        <!-- Ribbon Container -->
        <div id="ribbon-container"></div>
    `;
}

// Function to load navbar
function loadNavbar(currentPage) {
    const navbarContainer = document.getElementById('navbar-container');
    if (navbarContainer) {
        navbarContainer.innerHTML = createNavbar(currentPage);
        console.log('Navbar loaded successfully for page:', currentPage);
        
        // Initialize theme toggles after navbar is loaded
        setTimeout(() => {
            if (window.initializeThemeToggle) {
                window.initializeThemeToggle();
            }
            
            // Initialize ribbon if available
            if (window.loadRibbon) {
                setTimeout(() => {
                    window.loadRibbon();
                }, 100);
            }
        }, 100);
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

// Function to toggle mobile menu
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const menuButton = document.getElementById('mobile-menu-button');
    
    if (mobileMenu && menuButton) {
        const isHidden = mobileMenu.classList.contains('mobile-menu-hidden');
        
        if (isHidden) {
            // Show menu
            mobileMenu.classList.remove('mobile-menu-hidden');
            // Change hamburger to X
            menuButton.innerHTML = '✕';
        } else {
            // Hide menu
            mobileMenu.classList.add('mobile-menu-hidden');
            // Change X back to hamburger
            menuButton.innerHTML = '☰';
        }
    }
}

// Function to toggle ribbon visibility
function toggleRibbon(itemId) {
    const ribbonContainer = document.getElementById('ribbon-container');
    const ribbonContent = document.getElementById('ribbon-content');
    
    if (!ribbonContainer || !ribbonContent) return;
    
    // Find the nav item with ribbon data
    const navItem = getNavItems().find(item => item.id === itemId);
    if (!navItem || !navItem.hasRibbon) return;
    
    const isCurrentlyVisible = ribbonContainer.classList.contains('show');
    
    if (isCurrentlyVisible) {
        // Hide ribbon
        ribbonContainer.classList.remove('show');
    } else {
        // Show ribbon with content
        ribbonContent.innerHTML = navItem.ribbonItems.map(ribItem => 
            `<a href="${ribItem.href}" class="ribbon-item">${ribItem.name}</a>`
        ).join('');
        ribbonContainer.classList.add('show');
    }
}

// Helper function to get nav items (needed for ribbon toggle)
function getNavItems() {
    // Determine the correct path prefix based on current location depth
    const path = window.location.pathname;
    let pathPrefix = '';
    let indexPath = 'index.html';

    if (path.includes('/pages/aetherflow/')) {
        // In subdirectory like /pages/aetherflow/
        pathPrefix = '../../';
        indexPath = '../../index.html';
    } else if (path.includes('/pages/')) {
        // In pages directory like /pages/
        pathPrefix = '../';
        indexPath = '../index.html';
    } else {
        // At root level
        pathPrefix = '';
        indexPath = 'index.html';
    }

    const items = [
        { name: 'About Me', href: indexPath, id: 'about' },
        { name: 'Education', href: `${pathPrefix}pages/education.html`, id: 'education' },
        { name: 'Experience', href: `${pathPrefix}pages/experience.html`, id: 'experience' },
        { name: 'Projects', href: `${pathPrefix}pages/projects.html`, id: 'projects' },
        { name: 'Hobbies', href: `${pathPrefix}pages/hobbies.html`, id: 'hobbies' },
        { name: 'CV', href: `${pathPrefix}pages/cv.html`, id: 'cv' }
    ];

    const isDevMode = sessionStorage.getItem('devMode') === 'true';
    if (isDevMode) {
        items.push({ name: 'AetherFlow', href: `${pathPrefix}pages/aetherflow.html`, id: 'aetherflow' });
        items.push({ name: 'Pallet', href: `${pathPrefix}pages/pallet.html`, id: 'pallet' });
    }

    return items;
}

// Function to toggle dev mode
function toggleDevMode() {
    const currentMode = sessionStorage.getItem('devMode') === 'true';
    sessionStorage.setItem('devMode', (!currentMode).toString());

    // Reload the page to update navbar
    window.location.reload();
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
    else if (path.includes('aetherflow.html') || path.includes('aetherflow/')) currentPage = 'aetherflow';
    else if (path.includes('cv.html')) currentPage = 'cv';
    else if (path.includes('pallet.html')) currentPage = 'pallet';
    else if (path.includes('index.html') || path.endsWith('/')) currentPage = 'about';

    console.log('Auto-detected page:', currentPage);
    loadNavbar(currentPage);
});