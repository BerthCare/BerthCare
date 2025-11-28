// **Feature: backend-ci-pipeline, Property 4: Performance Optimizations**
// **Validates: Requirements 8.2, 8.3, 8.4**

import { readFileSync } from 'node:fs';
import path from 'node:path';

const workflowPath = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  '.github',
  'workflows',
  'backend-ci.yml'
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

describe('Feature: backend-ci-pipeline, Property 4: Performance Optimizations', () => {
  const workflowContent = normalizeNewlines(readFileSync(workflowPath, 'utf8'));

  it('ensures jobs are cached, timeboxed, and independent for parallelism', () => {
    const jobsSection = extractJobsSection(workflowContent);

    const performanceExpectations: {
      id: string;
      timeoutPattern: RegExp;
      cachePatterns: RegExp[];
    }[] = [
      {
        id: 'lint',
        timeoutPattern: /timeout-minutes:\s*10/,
        cachePatterns: [
          /cache:\s*npm/,
          /cache-dependency-path:\s*berthcare-backend\/package-lock\.json/,
        ],
      },
      {
        id: 'typecheck',
        timeoutPattern: /timeout-minutes:\s*10/,
        cachePatterns: [
          /cache:\s*npm/,
          /cache-dependency-path:\s*berthcare-backend\/package-lock\.json/,
        ],
      },
      {
        id: 'unit-tests',
        timeoutPattern: /timeout-minutes:\s*10/,
        cachePatterns: [
          /cache:\s*npm/,
          /cache-dependency-path:\s*berthcare-backend\/package-lock\.json/,
        ],
      },
      {
        id: 'prisma-validate',
        timeoutPattern: /timeout-minutes:\s*10/,
        cachePatterns: [
          /cache:\s*npm/,
          /cache-dependency-path:\s*berthcare-backend\/package-lock\.json/,
        ],
      },
      {
        id: 'integration-tests',
        timeoutPattern: /timeout-minutes:\s*15/,
        cachePatterns: [
          /cache:\s*npm/,
          /cache-dependency-path:\s*berthcare-backend\/package-lock\.json/,
        ],
      },
    ];

    performanceExpectations.forEach(({ id, timeoutPattern, cachePatterns }) => {
      const jobBlock = extractJobBlock(jobsSection, id);
      expect(timeoutPattern.test(jobBlock)).toBe(true);

      cachePatterns.forEach((cachePattern: RegExp) => {
        expect(cachePattern.test(jobBlock)).toBe(true);
      });

      expect(/^\s{4}needs:/m.test(jobBlock)).toBe(false);
    });
  });
});
