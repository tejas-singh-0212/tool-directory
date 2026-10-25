const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

// Read script.js content
const scriptContent = fs.readFileSync('./script.js', 'utf8');

// Load script.js in a VM context to avoid fragile regex matching
const sandbox = {
    document: {
        body: { classList: { add: () => {} } },
        addEventListener: () => {},
        querySelector: () => null,
        getElementById: () => null
    },
    localStorage: {
        getItem: () => null,
        setItem: () => {}
    },
    window: {},
    console,
    fetch: () => Promise.resolve({ ok: false }),
    setTimeout: () => {},
    clearTimeout: () => {}
};

vm.createContext(sandbox);
vm.runInContext(scriptContent, sandbox);

const getToolCategory = sandbox.getToolCategory;

if (typeof getToolCategory !== 'function') {
    console.error('Could not find getToolCategory function in script.js');
    process.exit(1);
}

// Test cases definition
const testCases = [
    {
        description: 'returns normal category name',
        tool: { name: 'Test Tool', category: 'Developer Tools' },
        expected: 'Developer Tools'
    },
    {
        description: 'trims whitespace around category',
        tool: { name: 'Test Tool', category: '  AI Agents  ' },
        expected: 'AI Agents'
    },
    {
        description: 'returns Uncategorized for empty string category',
        tool: { name: 'Test Tool', category: '' },
        expected: 'Uncategorized'
    },
    {
        description: 'returns Uncategorized for whitespace-only category',
        tool: { name: 'Test Tool', category: '   ' },
        expected: 'Uncategorized'
    },
    {
        description: 'returns Uncategorized when category property is missing',
        tool: { name: 'Test Tool' },
        expected: 'Uncategorized'
    },
    {
        description: 'returns Uncategorized when category is null',
        tool: { name: 'Test Tool', category: null },
        expected: 'Uncategorized'
    },
    {
        description: 'returns Uncategorized when category is undefined',
        tool: { name: 'Test Tool', category: undefined },
        expected: 'Uncategorized'
    }
];

console.log('Running getToolCategory tests...');

let passed = 0;
let failed = 0;

testCases.forEach(({ description, tool, expected }) => {
    try {
        const actual = getToolCategory(tool);
        assert.strictEqual(actual, expected, `Failed case: ${description}. Expected "${expected}", got "${actual}"`);
        passed++;
    } catch (err) {
        console.error(`✖ ${err.message}`);
        failed++;
    }
});

console.log(`Tests completed. Passed: ${passed}, Failed: ${failed}`);

if (failed > 0) {
    process.exit(1);
}
