// **Feature: backend-ci-pipeline, Property 1: Workflow Trigger Configuration**
// **Validates: Requirements 1.1, 1.3**

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
  'backend-ci.yml'
);

const normalizeNewlines = (content: string) => content.replace(/\r\n/g, '\n');

describe('Feature: backend-ci-pipeline, Property 1: Workflow Trigger Configuration', () => {
  const workflowContent = normalizeNewlines(readFileSync(workflowPath, 'utf8'));

  it('enables pull_request triggers scoped to backend changes only', () => {
    const expectedPatterns = [
      /\non:\s*\n\s{2}pull_request:/,
      /pull_request:[\s\S]*paths:\s*\n\s*- ['"]berthcare-backend\/\*\*['"]/,
      /pull_request:[\s\S]*paths:[\s\S]*- ['"]\.github\/workflows\/backend-ci\.yml['"]/,
      /defaults:\s*\n\s{2}run:\s*\n\s{4}working-directory:\s*berthcare-backend/,
    ];

    fc.assert(
      fc.property(
        fc.shuffledSubarray(expectedPatterns, {
          minLength: 1,
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
