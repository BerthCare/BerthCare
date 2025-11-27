// **Feature: backend-dev-deployment, Property 8: Notification Configuration**
// **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

import { readFileSync } from 'node:fs';
import path from 'node:path';
import fc from 'fast-check';

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

describe('Feature: backend-dev-deployment, Property 8: Notification Configuration', () => {
  const workflowContent = normalizeNewlines(readFileSync(workflowPath, 'utf8'));

  it('sends Slack notification on all outcomes with commit, author, and run link', () => {
    const expectedPatterns = [
      /notify:\s*\n/,
      /if:\s*always\(\)/,
      /slackapi\/slack-github-action@v1\.26\.0/,
      /SLACK_WEBHOOK_URL/,
      /Status:\s*\*\${{\s*job\.status\s*}}\*/,
      /Commit:\s*`\${{\s*github\.sha\s*}}`/,
      /Author:\s*\${{\s*github\.actor\s*}}/,
      /actions\/runs\/\${{\s*github\.run_id\s*}}/,
    ];

    fc.assert(
      fc.property(
        fc.shuffledSubarray(expectedPatterns, {
          minLength: expectedPatterns.length,
          maxLength: expectedPatterns.length,
        }),
        (patterns) => {
          patterns.forEach((pattern) => {
            expect(pattern.test(workflowContent)).toBe(true);
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});
