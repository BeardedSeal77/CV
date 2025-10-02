function createRibbon() {
    const path = window.location.pathname;
    let pathPrefix = '';

    if (path.includes('/pages/aetherflow/')) {
        pathPrefix = '';
    } else if (path.includes('/pages/')) {
        pathPrefix = 'aetherflow/';
    } else {
        pathPrefix = 'pages/aetherflow/';
    }

    const ribbonConfigs = {
        aetherflow: [
            { name: 'Overview', href: `${pathPrefix}overview.html`, id: 'overview' },
            { name: 'Introduction', href: `${pathPrefix}introduction.html`, id: 'introduction' },
            { name: 'Business', href: `${pathPrefix}business.html`, id: 'business' },
            { name: 'Features', href: `${pathPrefix}features.html`, id: 'features' },
            { name: 'Demonstration', href: `${pathPrefix}demonstration.html`, id: 'demonstration' },
            { name: 'Database', href: `${pathPrefix}database.html`, id: 'database' },
            { name: 'Data Layer', href: `${pathPrefix}data-layer.html`, id: 'data-layer' },
            { name: 'Frontend', href: `${pathPrefix}frontend.html`, id: 'frontend' }
        ]
    };

    function getCurrentPageFromPath() {
        const filename = path.split('/').pop().replace('.html', '');
        return filename || 'overview';
    }

    function isAetherFlowPage() {
        return path.includes('/aetherflow/') || path.includes('aetherflow.html');
    }

    function renderRibbon(configKey) {
        const items = ribbonConfigs[configKey];
        if (!items) return '';

        const currentPage = getCurrentPageFromPath();

        return `
            <nav class="bg-overlay rounded-b-lg border-b-2 border-primary shadow-theme-sm">
                <div class="max-w-6xl mx-auto px-4">
                    <div class="flex space-x-1 overflow-x-auto">
                        ${items.map(item => {
                            const isActive = currentPage === item.id;
                            return `
                                <a href="${item.href}"
                                   class="px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                                       isActive
                                           ? 'bg-primary text-base'
                                           : 'hover:bg-highlight-low text-secondary'
                                   }">
                                    ${item.name}
                                </a>
                            `;
                        }).join('')}
                    </div>
                </div>
            </nav>
        `;
    }

    function shouldShowRibbon() {
        return isAetherFlowPage();
    }

    function initializeRibbon() {
        const ribbonContainer = document.getElementById('ribbon-container');
        if (!ribbonContainer) return;

        if (shouldShowRibbon()) {
            ribbonContainer.innerHTML = renderRibbon('aetherflow');
            ribbonContainer.style.display = 'block';
        } else {
            ribbonContainer.style.display = 'none';
        }
    }

    return {
        initialize: initializeRibbon,
        shouldShow: shouldShowRibbon,
        render: renderRibbon
    };
}

function loadRibbon() {
    const ribbon = createRibbon();
    ribbon.initialize();
}

document.addEventListener('DOMContentLoaded', function() {
    loadRibbon();
});