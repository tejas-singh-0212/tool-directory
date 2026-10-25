const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

// Read script.js content
const scriptContent = fs.readFileSync('./script.js', 'utf8');

// Load script.js in a VM context
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

const sortToolsByName = sandbox.sortToolsByName;

if (typeof sortToolsByName !== 'function') {
    console.error('Could not find sortToolsByName function in script.js');
    process.exit(1);
}

console.log('Running sortToolsByName unit tests...');

let passed = 0;
let failed = 0;

function runTest(description, testFn) {
    try {
        testFn();
        passed++;
    } catch (err) {
        console.error(`✖ ${description}: ${err.message}`);
        failed++;
    }
}

// Helper to convert objects from VM realm to outer process realm
function toOuterRealm(val) {
    return JSON.parse(JSON.stringify(val));
}

// 1. Standard alphabetical sorting (case-insensitive)
runTest('sorts tools alphabetically ignoring case', () => {
    const input = [
        { name: 'Zebra Tool' },
        { name: 'apple app' },
        { name: 'Banana Helper' }
    ];
    const sorted = sortToolsByName(input);
    const sortedNames = Array.from(sorted).map(t => t.name);
    assert.deepStrictEqual(sortedNames, ['apple app', 'Banana Helper', 'Zebra Tool']);
});

// 2. Immutability check
runTest('does not mutate the original array', () => {
    const input = [
        { name: 'Zebra' },
        { name: 'Apple' }
    ];
    const inputCopy = [
        { name: 'Zebra' },
        { name: 'Apple' }
    ];
    const sorted = sortToolsByName(input);

    assert.notStrictEqual(sorted, input, 'Result array should be a new array instance');
    assert.deepStrictEqual(toOuterRealm(input), inputCopy, 'Original array should remain unchanged');
});

// 3. Empty array
runTest('handles an empty array correctly', () => {
    const sorted = sortToolsByName([]);
    assert.deepStrictEqual(toOuterRealm(sorted), []);
});

// 4. Single element array
runTest('handles a single-element array', () => {
    const input = [{ name: 'Solo Tool' }];
    const sorted = sortToolsByName(input);
    assert.deepStrictEqual(toOuterRealm(sorted), [{ name: 'Solo Tool' }]);
});

// 5. Missing, null, undefined, or empty name properties
runTest('handles tools with missing, null, undefined, or empty name properties', () => {
    const input = [
        { name: 'Beta Tool' },
        { name: null },
        { name: '' },
        { name: 'Alpha Tool' },
        {} // missing name
    ];
    const sorted = sortToolsByName(input);
    const sortedNames = Array.from(sorted).map(t => (t.name === undefined || t.name === null ? '' : t.name));

    // Empty/null/missing names map to '' and come before 'Alpha Tool' and 'Beta Tool'
    assert.strictEqual(sortedNames[3], 'Alpha Tool');
    assert.strictEqual(sortedNames[4], 'Beta Tool');
    assert.strictEqual(sorted.length, 5);
});

// 6. Tools with special characters and numbers
runTest('handles tools with numbers and special characters in name', () => {
    const input = [
        { name: 'Beta Tool' },
        { name: '3D CAD' },
        { name: 'AI Chat' }
    ];
    const sorted = sortToolsByName(input);
    const sortedNames = Array.from(sorted).map(t => t.name);
    assert.deepStrictEqual(sortedNames, ['3D CAD', 'AI Chat', 'Beta Tool']);
});

console.log(`Tests completed. Passed: ${passed}, Failed: ${failed}`);

if (failed > 0) {
    process.exit(1);
}
