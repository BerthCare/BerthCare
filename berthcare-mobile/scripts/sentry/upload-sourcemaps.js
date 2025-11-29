#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Sentry upload helper for @sentry/cli.
 * Validates required env vars and attempts to upload sourcemaps from build outputs when present.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const releaseFlagIndex = args.indexOf('--release');
const release = releaseFlagIndex >= 0 ? args[releaseFlagIndex + 1] : undefined;

if (!release) {
  console.error('[sentry] Missing --release <release>');
  process.exit(1);
}

const requiredEnv = ['SENTRY_ORG', 'SENTRY_PROJECT', 'SENTRY_AUTH_TOKEN'];
const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`[sentry] Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const run = (cmd) => {
  console.log(`[sentry] ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: process.env });
};

// Validate auth/token
run('npx sentry-cli info');

// Attempt upload if bundle outputs are present; otherwise finalize release to validate pipeline.
const bundleDirs = ['dist', 'build'];
const existingDir = bundleDirs.map((dir) => path.resolve(dir)).find((dir) => fs.existsSync(dir));

if (existingDir) {
  run(
    `npx sentry-cli sourcemaps upload --rewrite --strip-common-prefix --url-prefix app:/// --release ${release} ${existingDir}`
  );
} else {
  console.warn(
    `[sentry] No bundle directory found (looked for ${bundleDirs.join(
      ', '
    )}). Finalizing empty release for validation only.`
  );
  run(`npx sentry-cli releases new --project ${process.env.SENTRY_PROJECT} ${release}`);
  run(`npx sentry-cli releases finalize ${release}`);
}
