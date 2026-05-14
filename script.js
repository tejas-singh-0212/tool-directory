/* script.js */

let allTools = [];

function sortToolsByName(tools) {
    return [...tools].sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
    });
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
    } catch (error) {
        tbody.innerHTML = `
            <tr>
                <td colspan="2">Failed to load tools.json. Start a local server (for example: <code>python -m http.server</code>) and open the site through <code>http://localhost:8000</code>.</td>
            </tr>
        `;
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