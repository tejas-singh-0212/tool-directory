/* script.js */
function searchTable() {
    const input = document.getElementById('toolSearch').value.toUpperCase();
    const rows = document.querySelectorAll('#myTable tbody tr');

    rows.forEach(row => {
        const text = row.textContent.toUpperCase();
        row.style.display = text.includes(input) ? "" : "none";
    });
}

function toggleTheme() {
    const body = document.body;
    body.classList.toggle('light-mode');
    const isLight = body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

window.onload = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }
}