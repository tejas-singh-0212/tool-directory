/* script.js */

let allTools = [];
let currentCategory = 'all';

const planeSVG = `<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: translate(-1px, 1px);"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
const checkSVG = `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;

function getStoredTheme() {
    try {
        return localStorage.getItem('theme');
    } catch (error) {
        console.warn('Unable to read theme preference:', error);
        return null;
    }
}

function setStoredTheme(theme) {
    try {
        localStorage.setItem('theme', theme);
    } catch (error) {
        console.warn('Unable to save theme preference:', error);
    }
}

function sortToolsByName(tools) {
    return [...tools].sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
    });
}

function copyLink(button, url) {
    const originalLabel = button.getAttribute('aria-label') || 'Copy link';

    const handleSuccess = () => {
        button.innerHTML = checkSVG;
        button.setAttribute('aria-label', 'Link copied');
        button.title = 'Link copied';

        showToast('Link copied to clipboard!');

        setTimeout(() => {
            button.innerHTML = planeSVG;
            button.setAttribute('aria-label', originalLabel);
            button.title = originalLabel;
        }, 2000);
    };

    const handleError = (error) => {
        console.error('Failed to copy link:', error);
        showToast('Could not copy link.', true);
    };

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url)
            .then(handleSuccess)
            .catch(() => {
                fallbackCopyText(url)
                    .then(handleSuccess)
                    .catch(handleError);
            });
    } else {
        fallbackCopyText(url)
            .then(handleSuccess)
            .catch(handleError);
    }
}

function fallbackCopyText(text) {
    return new Promise((resolve, reject) => {
        const textarea = document.createElement('textarea');

        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '-9999px';
        textarea.style.left = '-9999px';

        document.body.appendChild(textarea);
        textarea.select();

        try {
            const successful = document.execCommand('copy');
            document.body.removeChild(textarea);

            if (successful) {
                resolve();
            } else {
                reject(new Error('Fallback copy command failed'));
            }
        } catch (error) {
            document.body.removeChild(textarea);
            reject(error);
        }
    });
}

function showToast(message = 'Link copied to clipboard!', isError = false) {
    const toast = document.getElementById('toast');

    toast.textContent = message;
    toast.classList.toggle('error', isError);
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.remove('error');
    }, 2000);
}

function renderTableRows(tools) {
    const tbody = document.getElementById('toolTableBody');
    const noResults = document.getElementById('noResults');

    tbody.innerHTML = '';

    tools.forEach((tool) => {
        const safeName = tool.name || 'Untitled';
        const safeUrl = tool.url || '#';
        const safePurpose = tool.purpose || '';

        const row = document.createElement('tr');

        const nameCell = document.createElement('td');
        const link = document.createElement('a');
        link.textContent = safeName;
        link.href = safeUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        nameCell.appendChild(link);

        const purposeCell = document.createElement('td');
        purposeCell.textContent = safePurpose;

        const copyCell = document.createElement('td');
        const copyButton = document.createElement('button');
        copyButton.type = 'button';
        copyButton.className = 'copy-btn';
        copyButton.title = `Copy link for ${safeName}`;
        copyButton.setAttribute('aria-label', `Copy link for ${safeName}`);
        copyButton.innerHTML = planeSVG;
        copyButton.addEventListener('click', () => {
            copyLink(copyButton, safeUrl);
        });

        copyCell.appendChild(copyButton);

        row.appendChild(nameCell);
        row.appendChild(purposeCell);
        row.appendChild(copyCell);

        tbody.appendChild(row);
    });

    updateEmptyState(tools.length === 0);
}

function updateEmptyState(isEmpty) {
    const noResults = document.getElementById('noResults');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const searchInput = document.getElementById('toolSearch');

    if (!noResults) return;

    noResults.hidden = !isEmpty;

    if (!isEmpty || !noResultsMessage) return;

    const searchTerm = searchInput ? searchInput.value.trim() : '';
    const selectedCategory = currentCategory !== 'all' ? currentCategory : '';

    if (searchTerm && selectedCategory) {
        noResultsMessage.textContent = `No tools found for "${searchTerm}" in ${selectedCategory}. Try clearing the search or choosing another category.`;
    } else if (searchTerm) {
        noResultsMessage.textContent = `No tools found for "${searchTerm}". Try a different keyword.`;
    } else if (selectedCategory) {
        noResultsMessage.textContent = `No tools found in ${selectedCategory}. Try another category.`;
    } else {
        noResultsMessage.textContent = 'Try a different search term or category.';
    }
}

function getToolCategory(tool) {
    const category = (tool.category || '').trim();
    return category || 'Uncategorized';
}

function populateCategoryFilter(tools) {
    const categoryFilter = document.getElementById('categoryFilter');

    if (!categoryFilter) return;

    const categories = [...new Set(tools.map(getToolCategory))]
        .sort((a, b) => a.localeCompare(b));

    categoryFilter.innerHTML = '<option value="all">All categories</option>';

    categories.forEach((category) => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });

    categoryFilter.value = currentCategory;
}

function getFilteredTools() {
    const searchInput = document.getElementById('toolSearch');
    const searchTerm = searchInput ? searchInput.value.trim().toUpperCase() : '';

    return allTools.filter((tool) => {
        const category = getToolCategory(tool);

        const matchesCategory =
            currentCategory === 'all' || category === currentCategory;

        const haystack = `${tool.name || ''} ${tool.purpose || ''} ${tool.url || ''} ${category}`.toUpperCase();

        const matchesSearch =
            !searchTerm || haystack.includes(searchTerm);

        return matchesCategory && matchesSearch;
    });
}

function searchTable() {
    const filteredTools = getFilteredTools();
    renderTableRows(filteredTools);
    updateToolCount(filteredTools.length);
}

function showLoadingState() {
    const tbody = document.getElementById('toolTableBody');
    const noResults = document.getElementById('noResults');

    tbody.innerHTML = `
        <tr>
            <td colspan="3" class="loading-cell">Loading tools...</td>
        </tr>
    `;

    if (noResults) {
        noResults.hidden = true;
    }
}

async function loadTools() {
    const tbody = document.getElementById('toolTableBody');

    showLoadingState();
    try {
        const response = await fetch('tools.json', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        allTools = sortToolsByName(Array.isArray(data) ? data : []);

        populateCategoryFilter(allTools);

        const filteredTools = getFilteredTools();
        renderTableRows(filteredTools);
        updateToolCount(filteredTools.length);
    } catch (error) {
        console.error('Failed to load tools.json:', error);

        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="error-cell">
                    <strong>Failed to load tools.</strong><br>
                    Please check that <code>tools.json</code> exists, is valid JSON, and is deployed in the same folder as <code>index.html</code>.<br>
                    If you are opening this site locally, run it through a local server such as <code>python -m http.server</code>.
                </td>
            </tr>
        `;

        const noResults = document.getElementById('noResults');
        if (noResults) {
            noResults.hidden = true;
        }

        updateToolCount(0);
    }
}

function updateToolCount(visibleCount = allTools.length) {
    const counter = document.querySelector('.tool-counter');
    const searchInput = document.getElementById('toolSearch');

    if (!counter) return;

    const searchTerm = searchInput ? searchInput.value.trim() : '';
    const isFiltering = searchTerm || currentCategory !== 'all';
    const totalCount = allTools.length;

    if (isFiltering) {
        counter.textContent = `SHOWING: ${visibleCount} / ${totalCount}`;
        counter.setAttribute('aria-label', `Showing ${visibleCount} of ${totalCount} tools`);
        counter.title = `Showing ${visibleCount} of ${totalCount} tools`;
    } else {
        counter.textContent = `TOOLS: ${totalCount}`;
        counter.setAttribute('aria-label', `${totalCount} tools in directory`);
        counter.title = `${totalCount} tools in directory`;
    }
}

function toggleTheme() {
    const body = document.body;
    const btn = document.querySelector('.theme-toggle');

    body.classList.toggle('light-mode');

    const isLight = body.classList.contains('light-mode');
    setStoredTheme(isLight ? 'light' : 'dark');

    if (btn) {
        btn.textContent = isLight ? 'DARK_MODE' : 'LIGHT_MODE';
    }
}

(function applyTheme() {
    const savedTheme = getStoredTheme();

    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        document.addEventListener('DOMContentLoaded', () => {
            const btn = document.querySelector('.theme-toggle');
            if (btn) btn.textContent = 'DARK_MODE';
        });
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('toolSearch');
    const categoryFilter = document.getElementById('categoryFilter');
    const themeToggle = document.querySelector('.theme-toggle');

    if (searchInput) {
        searchInput.addEventListener('input', searchTable);
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            currentCategory = categoryFilter.value;

            const filteredTools = getFilteredTools();
            renderTableRows(filteredTools);
            updateToolCount(filteredTools.length);
        });
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    loadTools();
});