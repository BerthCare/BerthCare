// **Feature: backend-dev-deployment, Property 7: Performance Optimizations**
// **Validates: Requirements 6.2, 6.3, 6.4**

import { readFileSync } from 'node:fs';
import path from 'node:path';

const workflowPath = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  '.github',
  'workflows',
  'backend-deploy-dev.yml'
);

const normalizeNewlines = (content: string) => content.replace(/\r\n/g, '\n');

const extractJobsSection = (content: string) => {
  const match = content.match(/jobs:\n([\s\S]*)/);
  expect(match).not.toBeNull();
  if (!match || !match[1]) {
    throw new Error('jobs section missing from workflow');
  }
  return match[1];
};

const extractJobBlock = (jobsSection: string, jobId: string) => {
  if (!/^[a-zA-Z0-9_-]+$/.test(jobId)) {
    throw new Error(`Invalid jobId: ${jobId}`);
  }
  const jobRegex = new RegExp(
    `^ {2}${jobId}:\\n([\\s\\S]*?)(?=^ {2}(?! )[a-zA-Z0-9_-]+:|(?![\\s\\S]))`,
    'm'
  );
  const match = jobsSection.match(jobRegex);
  expect(match).not.toBeNull();
  if (!match || !match[1]) {
    throw new Error(`Job ${jobId} not found`);
  }
  return match[1];
};

describe('Feature: backend-dev-deployment, Property 7: Performance Optimizations', () => {
  const workflowContent = normalizeNewlines(readFileSync(workflowPath, 'utf8'));

  it('enables build cache, timeboxes jobs, and allows build to run independently', () => {
    const jobsSection = extractJobsSection(workflowContent);

    const buildJob = extractJobBlock(jobsSection, 'build-and-push');
    const deployJob = extractJobBlock(jobsSection, 'deploy');

    const buildExpectations = [
      /timeout-minutes:\s*25/,
      /--cache-from\s+type=gha/,
      /--cache-to\s+type=gha,mode=max/,
    ];

    buildExpectations.forEach((pattern) => {
      expect(pattern.test(buildJob)).toBe(true);
    });

    expect(/^\s{4}needs:/m.test(buildJob)).toBe(false);
    expect(/timeout-minutes:\s*20/.test(deployJob)).toBe(true);
  });
});
