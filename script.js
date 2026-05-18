let toolsData = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchTools();
});

async function fetchTools() {
    try {
        const response = await fetch('tools.json');
        if (!response.ok) throw new Error('Network response was not ok');
        toolsData = await response.json();
        renderTable(toolsData);
    } catch (error) {
        console.error('Error fetching tools:', error);
        document.getElementById('toolTableBody').innerHTML = '<tr><td colspan="2">Error loading directory data.</td></tr>';
    }
}

function renderTable(data) {
    const tbody = document.getElementById('toolTableBody');
    const noResults = document.getElementById('noResults');
    const table = document.getElementById('myTable');
    
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        noResults.style.display = 'block';
        table.style.display = 'none';
        return;
    }
    
    noResults.style.display = 'none';
    table.style.display = 'table';
    
    data.forEach(tool => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><a href="${tool.url}" target="_blank" rel="noopener noreferrer">${tool.name}</a></td>
            <td>${tool.purpose}</td>
            <td><button class="copy-btn" onclick="copyToClipboard('${tool.url}', this)">COPY LINK</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function searchTable() {
    const query = document.getElementById('toolSearch').value.toLowerCase();
    const filteredData = toolsData.filter(tool => 
        tool.name.toLowerCase().includes(query) || 
        tool.purpose.toLowerCase().includes(query)
    );
    renderTable(filteredData);
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const themeBtn = document.querySelector('.theme-toggle');
    if (document.body.classList.contains('light-mode')) {
        themeBtn.textContent = 'DARK_MODE';
    } else {
        themeBtn.textContent = 'LIGHT_MODE';
    }
}

function copyToClipboard(url, buttonElement) {
    navigator.clipboard.writeText(url).then(() => {
        const originalText = buttonElement.textContent;
        buttonElement.textContent = 'COPIED!';
        buttonElement.classList.add('copied');
        setTimeout(() => {
            buttonElement.textContent = originalText;
            buttonElement.classList.remove('copied');
        }, 2000);
    }).catch(err => console.error('Failed to copy text: ', err));
}