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
    navigator.clipboard.writeText(url).then(() => {
        button.innerHTML = checkSVG;
        showToast();
        setTimeout(() => {
            button.innerHTML = planeSVG;
        }, 2000);
    });
}

function showToast() {
    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

function renderTableRows(tools) {
    const tbody = document.getElementById('toolTableBody');
    const noResults = document.getElementById('noResults');

    tbody.innerHTML = tools.map((tool) => {
        const safeName = tool.name || 'Untitled';
        const safeUrl = tool.url || '#';
        const safePurpose = tool.purpose || '';

        return `
            <tr>
                <td><a href="${safeUrl}" target="_blank" rel="noopener">${safeName}</a></td>
                <td>${safePurpose}</td>
                <td><button class="copy-btn" title="Copy Link" onclick="copyLink(this, '${safeUrl}')">${planeSVG}</button></td>
            </tr>
        `;
    }).join('');

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

async function loadTools() {
    const tbody = document.getElementById('toolTableBody');

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
        tbody.innerHTML = `
            <tr>
                <td colspan="3">Failed to load tools.json. Start a local server (for example: <code>python -m http.server</code>) and open the site through <code>http://localhost:8000</code>.</td>
            </tr>
        `;
        updateToolCount(0);
    }
}

function updateToolCount(count = allTools.length) {
    const counter = document.querySelector('.tool-counter');
    if (counter) {
        counter.textContent = count;
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