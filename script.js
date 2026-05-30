/* script.js */

let allTools = [];

const planeSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: translate(-1px, 1px);"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
const checkSVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;

function sortToolsByName(tools) {
    return [...tools].sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
    });
}

function copyLink(button, url) {
    const handleSuccess = () => {
        button.innerHTML = checkSVG;
        showToast('Link copied to clipboard!');

        setTimeout(() => {
            button.innerHTML = planeSVG;
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
        copyButton.className = 'copy-btn';
        copyButton.title = 'Copy Link';
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

    noResults.style.display = tools.length === 0 ? 'block' : 'none';
}

function searchTable() {
    const input = document.getElementById('toolSearch').value.trim().toUpperCase();

    if (!input) {
        renderTableRows(allTools);
        return;
    }

    const filtered = allTools.filter((tool) => {
        const haystack = `${tool.name || ''} ${tool.purpose || ''} ${tool.url || ''}`.toUpperCase();
        return haystack.includes(input);
    });

    renderTableRows(filtered);
}

function showLoadingState() {
    const tbody = document.getElementById('toolTableBody');
    const noResults = document.getElementById('noResults');

    tbody.innerHTML = `
        <tr>
            <td colspan="3" class="loading-cell">Loading tools...</td>
        </tr>
    `;

    noResults.style.display = 'none';
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
        renderTableRows(allTools);
        updateToolCount();
    } catch (error) {
        console.error('Failed to load tools:', error);

        tbody.innerHTML = `
            <tr>
                <td colspan="3">Failed to load tools.json. Start a local server or check that tools.json exists and contains valid JSON.</td>
            </tr>
        `;
        updateToolCount(0);
    }
}

function updateToolCount(count = allTools.length) {
    const counter = document.querySelector('.tool-counter');
    if (counter) {
        counter.textContent = `TOOLS: ${count}`;
        counter.setAttribute('aria-label', `${count} tools in directory`);
        counter.title = `${count} tools in directory`;
    }
}

function toggleTheme() {
    const body = document.body;
    const btn = document.querySelector('.theme-toggle');

    body.classList.toggle('light-mode');

    const isLight = body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');

    btn.textContent = isLight ? 'DARK_MODE' : 'LIGHT_MODE';
}

(function applyTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        document.addEventListener('DOMContentLoaded', () => {
            const btn = document.querySelector('.theme-toggle');
            if (btn) btn.textContent = 'DARK_MODE';
        });
    }
})();

document.addEventListener('DOMContentLoaded', loadTools);