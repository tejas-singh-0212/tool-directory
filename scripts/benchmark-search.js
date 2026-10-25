const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Read tools.json
const toolsPath = path.join(__dirname, '..', 'tools.json');
const allTools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));

function getToolCategory(tool) {
    const category = (tool.category || '').trim();
    return category || 'Uncategorized';
}

function getFilteredTools(allTools, searchTerm, currentCategory = 'all') {
    const term = searchTerm.trim().toUpperCase();

    return allTools.filter((tool) => {
        const category = getToolCategory(tool);
        const matchesCategory = currentCategory === 'all' || category === currentCategory;
        const haystack = `${tool.name || ''} ${tool.purpose || ''} ${tool.url || ''} ${category}`.toUpperCase();
        const matchesSearch = !term || haystack.includes(term);
        return matchesCategory && matchesSearch;
    });
}

// Simulate typing a search query "javascript code editor" character by character
const searchQuery = "javascript code editor";
const keystrokeIntervalMs = 50; // typing fast (50ms between keystrokes)
const debounceDelayMs = 250;

console.log(`Simulating typing "${searchQuery}" (${searchQuery.length} characters) at ${keystrokeIntervalMs}ms per keystroke...\n`);

// 1. Without Debounce (Current implementation)
let undebouncedExecutions = 0;
let totalUndebouncedTime = 0;

for (let i = 1; i <= searchQuery.length; i++) {
    const currentInput = searchQuery.substring(0, i);
    const start = performance.now();
    const results = getFilteredTools(allTools, currentInput);
    const end = performance.now();
    totalUndebouncedTime += (end - start);
    undebouncedExecutions++;
}

console.log(`--- WITHOUT DEBOUNCE ---`);
console.log(`Total function calls: ${undebouncedExecutions}`);
console.log(`Total filtering time: ${totalUndebouncedTime.toFixed(4)} ms`);
console.log(`Average time per keystroke: ${(totalUndebouncedTime / undebouncedExecutions).toFixed(4)} ms\n`);

// 2. With Debounce (Simulated user typing stream)
// During fast typing (50ms interval < 250ms debounce), timers get cancelled/reset.
// Only the final keystroke fires the search execution after the delay.
let debouncedExecutions = 0;
let totalDebouncedTime = 0;

// In a debounced event stream, only 1 search operation happens after the user stops typing
const finalInput = searchQuery;
const startDebounced = performance.now();
const resultsDebounced = getFilteredTools(allTools, finalInput);
const endDebounced = performance.now();
totalDebouncedTime = (endDebounced - startDebounced);
debouncedExecutions = 1;

console.log(`--- WITH DEBOUNCE (${debounceDelayMs}ms delay) ---`);
console.log(`Total function calls: ${debouncedExecutions}`);
console.log(`Total filtering time: ${totalDebouncedTime.toFixed(4)} ms`);
console.log(`Reduction in search executions: ${((1 - debouncedExecutions / undebouncedExecutions) * 100).toFixed(1)}%`);
console.log(`Filtering CPU time savings: ${((1 - totalDebouncedTime / totalUndebouncedTime) * 100).toFixed(1)}%`);
