// **Feature: mobile-ci-pipeline, Property 1: iOS Build Jobs Require macOS Runner**
// **Validates: Requirements 5.4**

import { readFileSync } from 'node:fs';
import path from 'node:path';
import fc from 'fast-check';

const workflowPath = path.resolve(__dirname, '..', '.github', 'workflows', 'ci.yml');

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

const findIOSJobs = (jobsSection: string) => {
  const ids = Array.from(jobsSection.matchAll(/^ {2}([a-zA-Z0-9_-]+):/gm))
    .map((match) => match[1])
    .filter((id): id is string => Boolean(id));
  const iosIds = ids.filter((id) => id.toLowerCase().includes('ios'));

  return iosIds.map((id) => ({
    id,
    block: extractJobBlock(jobsSection, id),
  }));
};

describe('Feature: mobile-ci-pipeline, Property 1: iOS Build Jobs Require macOS Runner', () => {
  const workflowContent = normalizeNewlines(readFileSync(workflowPath, 'utf8'));

  it('ensures every iOS build job targets a macOS runner', () => {
    const jobsSection = extractJobsSection(workflowContent);
    const iosJobs = findIOSJobs(jobsSection);

    expect(iosJobs.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.shuffledSubarray(iosJobs, { minLength: iosJobs.length, maxLength: iosJobs.length }),
        (selectedJobs) => {
          selectedJobs.forEach(({ block }) => {
            expect(/runs-on:\s*macos-latest/i.test(block)).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
