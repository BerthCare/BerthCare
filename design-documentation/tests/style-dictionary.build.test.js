const { execSync } = require('node:child_process');
const { existsSync, statSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert');
const { before, after, test } = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const buildRoot = path.join(projectRoot, 'assets/style-dictionary/build');

const expectedOutputs = [
  { label: 'iOS Swift', filePath: path.join(buildRoot, 'ios/DesignTokens.swift') },
  { label: 'Android colors', filePath: path.join(buildRoot, 'android/colors.xml') },
  { label: 'Android dimens', filePath: path.join(buildRoot, 'android/dimens.xml') },
  { label: 'Web CSS variables', filePath: path.join(buildRoot, 'web/variables.css') },
  { label: 'React Native tokens', filePath: path.join(buildRoot, 'react-native/tokens.js') }
];

const run = (command) => execSync(command, { cwd: projectRoot, stdio: 'pipe' });

before(() => {
  run('npm run tokens:clean');
  run('npm run tokens:build');
});

after(() => {
  run('npm run tokens:clean');
});

test('Style Dictionary build produces platform outputs', () => {
  expectedOutputs.forEach(({ label, filePath }) => {
    assert.ok(existsSync(filePath), `Expected ${label} output at ${filePath}`);
    const { size } = statSync(filePath);
    assert.ok(size > 0, `Expected ${label} output to be non-empty at ${filePath}`);
  });
});
