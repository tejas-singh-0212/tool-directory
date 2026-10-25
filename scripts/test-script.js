const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SCRIPT_PATH = path.join(__dirname, '../script.js');

// Helper to create a standard mock DOM environment for script.js
function createMockEnvironment() {
    const elements = {};
    const bodyClassList = new Set();
    const listeners = {};

    function createMockElement(tagName = 'div', id = '') {
        const classList = new Set();
        const attributes = {};
        const childNodes = [];
        const elementListeners = {};
        let _innerHTML = '';

        const el = {
            tagName: tagName.toUpperCase(),
            id: id,
            textContent: '',
            value: '',
            hidden: false,
            title: '',
            style: {},
            classList: {
                add: (...cls) => cls.forEach(c => classList.add(c)),
                remove: (...cls) => cls.forEach(c => classList.delete(c)),
                toggle: (c, force) => {
                    if (force !== undefined) {
                        if (force) classList.add(c);
                        else classList.delete(c);
                        return force;
                    }
                    if (classList.has(c)) {
                        classList.delete(c);
                        return false;
                    } else {
                        classList.add(c);
                        return true;
                    }
                },
                contains: (c) => classList.has(c)
            },
            setAttribute: (name, val) => { attributes[name] = String(val); },
            getAttribute: (name) => attributes[name] || null,
            appendChild: (child) => { childNodes.push(child); return child; },
            removeChild: (child) => {
                const idx = childNodes.indexOf(child);
                if (idx !== -1) childNodes.splice(idx, 1);
                return child;
            },
            addEventListener: (event, handler) => {
                elementListeners[event] = elementListeners[event] || [];
                elementListeners[event].push(handler);
            },
            dispatchEvent: (event) => {
                const handlers = elementListeners[event.type] || [];
                handlers.forEach(h => h(event));
            },
            click: () => {
                const handlers = elementListeners['click'] || [];
                handlers.forEach(h => h({ type: 'click' }));
            },
            focus: () => { el._focused = true; },
            select: () => { el._selected = true; },
            _childNodes: childNodes,
            _attributes: attributes,
            _classListSet: classList,
            _listeners: elementListeners
        };

        Object.defineProperty(el, 'innerHTML', {
            get: () => _innerHTML,
            set: (html) => {
                _innerHTML = html;
                childNodes.length = 0;
                if (html.includes('<option')) {
                    const valMatch = html.match(/value="([^"]+)"/);
                    const textMatch = html.match(/>([^<]+)</);
                    const opt = createMockElement('option');
                    if (valMatch) opt.value = valMatch[1];
                    if (textMatch) opt.textContent = textMatch[1];
                    childNodes.push(opt);
                }
            }
        });

        if (id) {
            elements[id] = el;
        }
        return el;
    }

    const mockBody = {
        classList: {
            add: (c) => bodyClassList.add(c),
            remove: (c) => bodyClassList.delete(c),
            toggle: (c, force) => {
                if (force !== undefined) {
                    if (force) bodyClassList.add(c);
                    else bodyClassList.delete(c);
                    return force;
                }
                if (bodyClassList.has(c)) {
                    bodyClassList.delete(c);
                    return false;
                } else {
                    bodyClassList.add(c);
                    return true;
                }
            },
            contains: (c) => bodyClassList.has(c)
        },
        appendChild: (child) => child,
        removeChild: (child) => child
    };

    const mockLocalStorage = {
        _store: {},
        getItem(key) {
            if (this._throwOnGet) throw new Error('LocalStorage read error');
            return this._store[key] !== undefined ? this._store[key] : null;
        },
        setItem(key, value) {
            if (this._throwOnSet) throw new Error('LocalStorage write error');
            this._store[key] = String(value);
        }
    };

    const mockDocument = {
        body: mockBody,
        getElementById: (id) => elements[id] || null,
        querySelector: (selector) => elements[selector] || null,
        createElement: (tagName) => createMockElement(tagName),
        addEventListener: (event, handler) => {
            listeners[event] = listeners[event] || [];
            listeners[event].push(handler);
        },
        dispatchEvent: (event) => {
            const handlers = listeners[event.type] || [];
            handlers.forEach(h => h(event));
        },
        execCommand: () => true,
        _elements: elements,
        _listeners: listeners,
        _createMockElement: createMockElement
    };

    // Setup standard elements
    createMockElement('tbody', 'toolTableBody');
    createMockElement('div', 'noResults');
    createMockElement('p', 'noResultsMessage');
    createMockElement('input', 'toolSearch');
    createMockElement('select', 'categoryFilter');
    createMockElement('button', 'clearFilters');
    createMockElement('div', 'toast');

    const counterEl = createMockElement('div', '.tool-counter');
    elements['.tool-counter'] = counterEl;

    const themeToggleEl = createMockElement('button', '.theme-toggle');
    elements['.theme-toggle'] = themeToggleEl;

    const mockWindow = {
        isSecureContext: true
    };

    const mockNavigator = {
        clipboard: {
            writeText: () => Promise.resolve()
        }
    };

    const mockSetTimeout = (fn, delay) => {
        return setTimeout(fn, delay);
    };

    const sandbox = {
        document: mockDocument,
        localStorage: mockLocalStorage,
        window: mockWindow,
        navigator: mockNavigator,
        console: {
            log: () => {},
            warn: () => {},
            error: () => {}
        },
        fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
        setTimeout: mockSetTimeout,
        clearTimeout: clearTimeout,
        Promise: Promise,
        Array: Array,
        Object: Object,
        String: String,
        Error: Error
    };

    vm.createContext(sandbox);

    const scriptContent = fs.readFileSync(SCRIPT_PATH, 'utf8');
    vm.runInContext(scriptContent, sandbox);

    return sandbox;
}

console.log('Running script.js comprehensive test suite...');

let passed = 0;
let failed = 0;

function runTest(name, testFn) {
    try {
        testFn();
        passed++;
        console.log(`  ✓ ${name}`);
    } catch (err) {
        failed++;
        console.error(`  ✖ ${name}: ${err.message}`);
    }
}

async function runAsyncTest(name, testFn) {
    try {
        await testFn();
        passed++;
        console.log(`  ✓ ${name}`);
    } catch (err) {
        failed++;
        console.error(`  ✖ ${name}: ${err.message}`);
    }
}

async function runAllTests() {
    // 1. Theme persistence tests
    runTest('getStoredTheme & setStoredTheme - normal operation', () => {
        const env = createMockEnvironment();
        env.setStoredTheme('light');
        assert.strictEqual(env.getStoredTheme(), 'light');
    });

    runTest('getStoredTheme & setStoredTheme - handle localStorage exception', () => {
        const env = createMockEnvironment();
        env.localStorage._throwOnGet = true;
        env.localStorage._throwOnSet = true;
        assert.strictEqual(env.getStoredTheme(), null);
        assert.doesNotThrow(() => env.setStoredTheme('dark'));
    });

    // 2. Debounce tests
    await runAsyncTest('debounce - delays execution and cancels previous calls', () => {
        return new Promise((resolve) => {
            const env = createMockEnvironment();
            let count = 0;
            const fn = env.debounce(() => { count++; }, 50);

            fn();
            fn();
            fn();

            assert.strictEqual(count, 0);

            setTimeout(() => {
                assert.strictEqual(count, 1);
                resolve();
            }, 100);
        });
    });

    // 3. sortToolsByName tests
    runTest('sortToolsByName - handles empty, null, and case variations', () => {
        const env = createMockEnvironment();
        const tools = [
            { name: 'Zebra' },
            { name: 'apple' },
            { name: null },
            {}
        ];
        const sorted = env.sortToolsByName(tools);
        assert.strictEqual(sorted[0].name, null);
        assert.strictEqual(sorted[1].name, undefined);
        assert.strictEqual(sorted[2].name, 'apple');
        assert.strictEqual(sorted[3].name, 'Zebra');
    });

    // 4. isSafeUrl tests
    runTest('isSafeUrl - allows valid http/https URLs and rejects unsafe or non-string inputs', () => {
        const env = createMockEnvironment();
        assert.strictEqual(env.isSafeUrl('http://example.com'), true);
        assert.strictEqual(env.isSafeUrl('https://example.com'), true);
        assert.strictEqual(env.isSafeUrl('javascript:alert(1)'), false);
        assert.strictEqual(env.isSafeUrl('  https://test.com  '), true);
        assert.strictEqual(env.isSafeUrl(null), false);
        assert.strictEqual(env.isSafeUrl(123), false);
    });

    // 5. getToolCategory tests
    runTest('getToolCategory - returns trimmed category or Uncategorized fallback', () => {
        const env = createMockEnvironment();
        assert.strictEqual(env.getToolCategory({ category: '  Dev  ' }), 'Dev');
        assert.strictEqual(env.getToolCategory({ category: '' }), 'Uncategorized');
        assert.strictEqual(env.getToolCategory({}), 'Uncategorized');
    });

    // 6. Toast tests
    await runAsyncTest('showToast - displays message and auto-removes after delay', () => {
        return new Promise((resolve) => {
            const env = createMockEnvironment();
            env.showToast('Test Toast', true);

            const toast = env.document.getElementById('toast');
            assert.strictEqual(toast.textContent, 'Test Toast');
            assert.strictEqual(toast.classList.contains('error'), true);
            assert.strictEqual(toast.classList.contains('show'), true);

            setTimeout(() => {
                assert.strictEqual(toast.classList.contains('show'), false);
                assert.strictEqual(toast.classList.contains('error'), false);
                resolve();
            }, 2100);
        });
    });

    // 7. Clipboard copyLink & fallbackCopyText tests
    await runAsyncTest('copyLink - using navigator.clipboard when available', () => {
        return new Promise((resolve) => {
            const env = createMockEnvironment();
            const btn = env.document.createElement('button');
            btn.setAttribute('aria-label', 'Copy link for Tool');

            env.copyLink(btn, 'https://example.com');

            setTimeout(() => {
                assert.strictEqual(btn.getAttribute('aria-label'), 'Link copied');
                assert.strictEqual(btn.title, 'Link copied');

                setTimeout(() => {
                    assert.strictEqual(btn.getAttribute('aria-label'), 'Copy link for Tool');
                    resolve();
                }, 2100);
            }, 20);
        });
    });

    await runAsyncTest('copyLink - fallback to execCommand when clipboard API fails', () => {
        return new Promise((resolve) => {
            const env = createMockEnvironment();
            env.navigator.clipboard.writeText = () => Promise.reject(new Error('Denied'));

            const btn = env.document.createElement('button');

            env.copyLink(btn, 'https://example.com');

            setTimeout(() => {
                assert.strictEqual(btn.getAttribute('aria-label'), 'Link copied');
                resolve();
            }, 50);
        });
    });

    await runAsyncTest('copyLink - handle total clipboard failure gracefully', () => {
        return new Promise((resolve) => {
            const env = createMockEnvironment();
            env.navigator.clipboard.writeText = () => Promise.reject(new Error('Denied'));
            env.document.execCommand = () => { throw new Error('ExecCommand failed'); };

            const btn = env.document.createElement('button');

            env.copyLink(btn, 'https://example.com');

            setTimeout(() => {
                const toast = env.document.getElementById('toast');
                assert.strictEqual(toast.textContent, 'Could not copy link.');
                assert.strictEqual(toast.classList.contains('error'), true);
                resolve();
            }, 50);
        });
    });

    // 8. renderTableRows tests
    await runAsyncTest('renderTableRows - populates table rows with proper safety checks and copy listener', () => {
        const env = createMockEnvironment();
        const tools = [
            { name: 'Safe Tool', url: 'https://example.com', purpose: 'A test tool' },
            { name: 'Unsafe Tool', url: 'javascript:alert(1)', purpose: 'Malicious' }
        ];

        env.renderTableRows(tools);

        const tbody = env.document.getElementById('toolTableBody');
        assert.strictEqual(tbody._childNodes.length, 2);

        // Check safe URL tool
        const row1 = tbody._childNodes[0];
        const link1 = row1._childNodes[0]._childNodes[0];
        assert.strictEqual(link1.textContent, 'Safe Tool');
        assert.strictEqual(link1.href, 'https://example.com');

        // Check unsafe URL fallback to '#'
        const row2 = tbody._childNodes[1];
        const link2 = row2._childNodes[0]._childNodes[0];
        assert.strictEqual(link2.textContent, 'Unsafe Tool');
        assert.strictEqual(link2.href, '#');

        // Test button click triggering copyLink
        const copyBtn1 = row1._childNodes[2]._childNodes[0];
        copyBtn1.click();

        return new Promise((resolve) => {
            setTimeout(() => {
                const toast = env.document.getElementById('toast');
                assert.strictEqual(toast.textContent, 'Link copied to clipboard!');
                resolve();
            }, 50);
        });
    });

    // 9. updateEmptyState tests
    await runAsyncTest('updateEmptyState - shows correct messages for different filtering criteria', async () => {
        const env = createMockEnvironment();
        env.document.dispatchEvent({ type: 'DOMContentLoaded' });

        const noResults = env.document.getElementById('noResults');
        const noResultsMsg = env.document.getElementById('noResultsMessage');
        const searchInput = env.document.getElementById('toolSearch');
        const categoryFilter = env.document.getElementById('categoryFilter');

        // Scenario 1: Search + Category
        searchInput.value = 'query';
        categoryFilter.value = 'AI Tools';
        categoryFilter.dispatchEvent({ type: 'change' });

        env.updateEmptyState(true);
        assert.strictEqual(noResults.hidden, false);
        assert.ok(noResultsMsg.textContent.includes('No tools found for "query" in AI Tools.'));

        // Scenario 2: Search only
        categoryFilter.value = 'all';
        categoryFilter.dispatchEvent({ type: 'change' });

        env.updateEmptyState(true);
        assert.ok(noResultsMsg.textContent.includes('No tools found for "query".'));

        // Scenario 3: Category only
        searchInput.value = '';
        categoryFilter.value = 'AI Tools';
        categoryFilter.dispatchEvent({ type: 'change' });

        env.updateEmptyState(true);
        assert.ok(noResultsMsg.textContent.includes('No tools found in AI Tools.'));

        // Scenario 4: No filter, generic empty state
        categoryFilter.value = 'all';
        categoryFilter.dispatchEvent({ type: 'change' });

        env.updateEmptyState(true);
        assert.strictEqual(noResultsMsg.textContent, 'Try a different search term or category.');

        // Scenario 5: Not empty
        env.updateEmptyState(false);
        assert.strictEqual(noResults.hidden, true);
    });

    // 10. populateCategoryFilter tests
    runTest('populateCategoryFilter - correctly calculates categories and option counts', () => {
        const env = createMockEnvironment();
        const tools = [
            { name: 'Tool 1', category: 'Dev' },
            { name: 'Tool 2', category: 'Dev' },
            { name: 'Tool 3', category: 'Design' },
            { name: 'Tool 4' } // Uncategorized
        ];

        env.populateCategoryFilter(tools);

        const select = env.document.getElementById('categoryFilter');
        assert.strictEqual(select._childNodes.length, 4); // All + Dev + Design + Uncategorized
        assert.strictEqual(select._childNodes[0].textContent, 'All categories (4)');
        assert.strictEqual(select._childNodes[1].textContent, 'Design (1)');
        assert.strictEqual(select._childNodes[2].textContent, 'Dev (2)');
        assert.strictEqual(select._childNodes[3].textContent, 'Uncategorized (1)');
    });

    // 11. getFilteredTools & searchTable tests
    await runAsyncTest('getFilteredTools - filters by category and search keyword', async () => {
        const env = createMockEnvironment();
        const mockData = [
            { name: 'Alpha', category: 'Dev', purpose: 'Code editor', url: 'https://alpha.com' },
            { name: 'Beta', category: 'Design', purpose: 'Figma plugin', url: 'https://beta.com' },
            { name: 'Gamma', category: 'Dev', purpose: 'Testing framework', url: 'https://gamma.com' }
        ];

        env.fetch = () => Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockData)
        });

        env.document.dispatchEvent({ type: 'DOMContentLoaded' });
        await new Promise(r => setTimeout(r, 10));

        // Search category 'Dev'
        const categoryFilter = env.document.getElementById('categoryFilter');
        categoryFilter.value = 'Dev';
        categoryFilter.dispatchEvent({ type: 'change' });

        let filtered = env.getFilteredTools();
        assert.strictEqual(filtered.length, 2);

        // Search category 'Dev' + search keyword 'CODE'
        const searchInput = env.document.getElementById('toolSearch');
        searchInput.value = 'code';

        filtered = env.getFilteredTools();
        assert.strictEqual(filtered.length, 1);
        assert.strictEqual(filtered[0].name, 'Alpha');
    });

    // 12. clearFilters tests
    await runAsyncTest('clearFilters - resets filters, UI, and focuses search input', async () => {
        const env = createMockEnvironment();
        env.document.dispatchEvent({ type: 'DOMContentLoaded' });

        const searchInput = env.document.getElementById('toolSearch');
        const categoryFilter = env.document.getElementById('categoryFilter');
        const clearBtn = env.document.getElementById('clearFilters');

        searchInput.value = 'test';
        categoryFilter.value = 'Dev';
        categoryFilter.dispatchEvent({ type: 'change' });

        env.clearFilters();

        assert.strictEqual(searchInput.value, '');
        assert.strictEqual(categoryFilter.value, 'all');
        assert.strictEqual(clearBtn.hidden, true);
        assert.strictEqual(searchInput._focused, true);
    });

    // 13. updateToolCount tests
    await runAsyncTest('updateToolCount - updates counter text and accessibility attributes', async () => {
        const env = createMockEnvironment();
        const mockData = [{ name: '1' }, { name: '2' }, { name: '3' }];

        env.fetch = () => Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockData)
        });

        env.document.dispatchEvent({ type: 'DOMContentLoaded' });
        await new Promise(r => setTimeout(r, 10));

        const counter = env.document.querySelector('.tool-counter');

        // Without filtering
        env.updateToolCount();
        assert.strictEqual(counter.textContent, 'TOOLS: 3');
        assert.strictEqual(counter.getAttribute('aria-label'), '3 tools in directory');

        // With filtering
        const categoryFilter = env.document.getElementById('categoryFilter');
        categoryFilter.value = 'Dev';
        categoryFilter.dispatchEvent({ type: 'change' });

        env.updateToolCount(1);
        assert.strictEqual(counter.textContent, 'SHOWING: 1 / 3');
        assert.strictEqual(counter.getAttribute('aria-label'), 'Showing 1 of 3 tools');
    });

    // 14. toggleTheme tests
    runTest('toggleTheme - switches light-mode class, updates local storage and toggle button label', () => {
        const env = createMockEnvironment();
        const toggleBtn = env.document.querySelector('.theme-toggle');

        // Initially dark mode
        assert.strictEqual(env.document.body.classList.contains('light-mode'), false);

        // Toggle to light mode
        env.toggleTheme();
        assert.strictEqual(env.document.body.classList.contains('light-mode'), true);
        assert.strictEqual(env.getStoredTheme(), 'light');
        assert.strictEqual(toggleBtn.textContent, 'DARK MODE');

        // Toggle back to dark mode
        env.toggleTheme();
        assert.strictEqual(env.document.body.classList.contains('light-mode'), false);
        assert.strictEqual(env.getStoredTheme(), 'dark');
        assert.strictEqual(toggleBtn.textContent, 'LIGHT MODE');
    });

    // 15. loadTools tests (success and failure)
    await runAsyncTest('loadTools - handles successful fetch and populates state', () => {
        const env = createMockEnvironment();
        const mockData = [
            { name: 'Tool B', category: 'Dev', url: 'https://b.com' },
            { name: 'Tool A', category: 'Dev', url: 'https://a.com' }
        ];

        env.fetch = () => Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockData)
        });

        return env.loadTools().then(() => {
            const tbody = env.document.getElementById('toolTableBody');
            assert.strictEqual(tbody._childNodes.length, 2);
        });
    });

    await runAsyncTest('loadTools - handles fetch HTTP error gracefully', () => {
        const env = createMockEnvironment();
        env.fetch = () => Promise.resolve({
            ok: false,
            status: 404
        });

        return env.loadTools().then(() => {
            const tbody = env.document.getElementById('toolTableBody');
            assert.ok(tbody.innerHTML.includes('Failed to load tools.'));
            const counter = env.document.querySelector('.tool-counter');
            assert.strictEqual(counter.textContent, 'TOOLS: 0');
        });
    });

    await runAsyncTest('loadTools - handles network throw gracefully', () => {
        const env = createMockEnvironment();
        env.fetch = () => Promise.reject(new Error('Network failure'));

        return env.loadTools().then(() => {
            const tbody = env.document.getElementById('toolTableBody');
            assert.ok(tbody.innerHTML.includes('Failed to load tools.'));
        });
    });

    console.log(`\nTest suite completed. Passed: ${passed}, Failed: ${failed}`);
    if (failed > 0) {
        process.exit(1);
    }
}

runAllTests().catch(err => {
    console.error('Unhandled test suite error:', err);
    process.exit(1);
});
