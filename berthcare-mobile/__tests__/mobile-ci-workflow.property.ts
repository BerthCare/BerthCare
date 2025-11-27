// **Feature: mobile-ci-pipeline, Property 2: Workflow Structure Completeness**
// **Validates: Requirements 2.1, 3.1, 4.1, 5.1, 6.1, 8.2, 8.3**

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

describe('Feature: mobile-ci-pipeline, Property 2: Workflow Structure Completeness', () => {
  const workflowContent = normalizeNewlines(readFileSync(workflowPath, 'utf8'));

  it('ensures workflow contains required triggers and build jobs with key steps', () => {
    const workflowLevelMatchers = [
      { description: 'workflow name', regex: /^name:\s*Mobile CI/m },
      { description: 'pull_request trigger', regex: /\non:\s*\n\s{2}pull_request:/ },
      {
        description: 'push to main trigger',
        regex: /\non:\s*[\s\S]*?\n\s{2}push:\s*\n\s{4}branches:\s*\[main\]/,
      },
    ];

    const jobMatchers = [
      {
        id: 'quality-checks',
        patterns: [
          /runs-on:\s*ubuntu-latest/,
          /timeout-minutes:\s*10/,
          /actions\/checkout@v4/,
          /actions\/setup-node@v4/,
          /node-version:\s*20/,
          /cache:\s*npm/,
          /cache-dependency-path:\s*package-lock\.json/,
          /actions\/cache@v4/,
          /key:\s*node-modules-\${{\s*runner\.os\s*}}-\${{\s*hashFiles\('\*\*\/package-lock\.json'\)\s*}}/,
          /restore-keys:\s*\|?\s*\n\s*node-modules-\${{\s*runner\.os\s*}}-/,
          /npm ci/,
          /npm run lint/,
          /npm run type-check/,
          /npm test/,
        ],
      },
      {
        id: 'android-build',
        patterns: [
          /runs-on:\s*ubuntu-latest/,
          /timeout-minutes:\s*15/,
          /EXPO_TOKEN:\s*\$\{\{\s*secrets\.EXPO_TOKEN\s*\}\}/,
          /actions\/checkout@v4/,
          /actions\/setup-node@v4/,
          /node-version:\s*20/,
          /cache:\s*npm/,
          /cache-dependency-path:\s*package-lock\.json/,
          /actions\/cache@v4/,
          /key:\s*node-modules-\${{\s*runner\.os\s*}}-\${{\s*hashFiles\('\*\*\/package-lock\.json'\)\s*}}/,
          /restore-keys:\s*\|?\s*\n\s*node-modules-\${{\s*runner\.os\s*}}-/,
          /npm ci/,
          /npm install -g eas-cli/,
          /eas build --platform android --profile development --non-interactive --no-wait/,
        ],
      },
      {
        id: 'ios-build',
        patterns: [
          /runs-on:\s*macos-latest/,
          /timeout-minutes:\s*20/,
          /EXPO_TOKEN:\s*\$\{\{\s*secrets\.EXPO_TOKEN\s*\}\}/,
          /actions\/checkout@v4/,
          /actions\/setup-node@v4/,
          /node-version:\s*20/,
          /cache:\s*npm/,
          /cache-dependency-path:\s*package-lock\.json/,
          /actions\/cache@v4/,
          /key:\s*node-modules-\${{\s*runner\.os\s*}}-\${{\s*hashFiles\('\*\*\/package-lock\.json'\)\s*}}/,
          /restore-keys:\s*\|?\s*\n\s*node-modules-\${{\s*runner\.os\s*}}-/,
          /npm ci/,
          /npm install -g eas-cli/,
          /eas build --platform ios --profile development --non-interactive --no-wait/,
        ],
      },
    ];

    fc.assert(
      fc.property(
        fc.shuffledSubarray(workflowLevelMatchers, {
          minLength: workflowLevelMatchers.length,
          maxLength: workflowLevelMatchers.length,
        }),
        fc.shuffledSubarray(jobMatchers, {
          minLength: jobMatchers.length,
          maxLength: jobMatchers.length,
        }),
        (selectedWorkflowMatchers, selectedJobMatchers) => {
          selectedWorkflowMatchers.forEach(({ regex }) => {
            expect(regex.test(workflowContent)).toBe(true);
          });

          const jobsSection = extractJobsSection(workflowContent);

          selectedJobMatchers.forEach(({ id, patterns }) => {
            const jobBlock = extractJobBlock(jobsSection, id);
            expect(/^\s{4}needs:/m.test(jobBlock)).toBe(false);
            patterns.forEach((pattern) => {
              expect(pattern.test(jobBlock)).toBe(true);
            });
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
