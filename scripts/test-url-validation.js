const assert = require('assert');
const fs = require('fs');

// Read script.js content
const scriptContent = fs.readFileSync('./script.js', 'utf8');

// Extract function definition or evaluate it
// We can use Function or eval or extract isSafeUrl
const isSafeUrlMatch = scriptContent.match(/function isSafeUrl\([\s\S]*?\n\}/);
if (!isSafeUrlMatch) {
    console.error('Could not find isSafeUrl function in script.js');
    process.exit(1);
}

const isSafeUrl = new Function(`${isSafeUrlMatch[0]}; return isSafeUrl;`)();

// Test cases
const validUrls = [
    'http://example.com',
    'https://example.com',
    'HTTP://EXAMPLE.COM',
    'HTTPS://EXAMPLE.COM/path?query=1#hash',
    '  https://example.com  '
];

const invalidUrls = [
    'javascript:alert(1)',
    'JAVASCRIPT:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    'ftp://example.com',
    '//example.com',
    'example.com',
    '',
    null,
    undefined,
    123
];

console.log('Running URL validation tests...');

let passed = 0;
let failed = 0;

validUrls.forEach(url => {
    try {
        assert.strictEqual(isSafeUrl(url), true, `Expected URL to be safe: ${url}`);
        passed++;
    } catch (err) {
        console.error(err.message);
        failed++;
    }
});

invalidUrls.forEach(url => {
    try {
        assert.strictEqual(isSafeUrl(url), false, `Expected URL to be unsafe: ${url}`);
        passed++;
    } catch (err) {
        console.error(err.message);
        failed++;
    }
});

console.log(`Tests completed. Passed: ${passed}, Failed: ${failed}`);

if (failed > 0) {
    process.exit(1);
}
