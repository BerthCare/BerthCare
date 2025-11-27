const { readFileSync, existsSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert');
const { test } = require('node:test');

const tokensPath = path.resolve(__dirname, '..', 'assets/design-tokens.json');

test('Design token source is valid JSON', () => {
  assert.ok(existsSync(tokensPath), `Expected design tokens file at ${tokensPath}`);

  const raw = readFileSync(tokensPath, 'utf8');
  let parsed;

  assert.doesNotThrow(() => {
    parsed = JSON.parse(raw);
  }, 'Design tokens must be valid JSON');

  assert.ok(parsed && typeof parsed === 'object', 'Parsed tokens should be an object');
  assert.ok(Object.keys(parsed).length > 0, 'Design tokens should not be empty');
});
