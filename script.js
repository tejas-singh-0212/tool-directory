/* script.js */

// 1. SEARCH FUNCTION
function searchTable() {
    const input = document.getElementById('toolSearch').value.toUpperCase();
    const rows = document.querySelectorAll('#myTable tbody tr');

    rows.forEach(row => {
        const text = row.textContent.toUpperCase();
        row.style.display = text.includes(input) ? "" : "none";
    });
}

// 2. THEME TOGGLE FUNCTION
function toggleTheme() {
    const body = document.body;
    const btn = document.querySelector('.theme-toggle');
    
    body.classList.toggle('light-mode');
    
    const isLight = body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    
    // Update button text based on mode
    btn.textContent = isLight ? 'DARK_MODE' : 'LIGHT_MODE';
}

// 3. APPLY THEME IMMEDIATELY (To prevent "flashing")
(function applyTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        // We wait for the DOM to be ready just to update the button text
        document.addEventListener('DOMContentLoaded', () => {
            const btn = document.querySelector('.theme-toggle');
            if(btn) btn.textContent = 'DARK_MODE';
        });
    }
})();