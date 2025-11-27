// **Feature: backend-dev-deployment, Property 1: Workflow Trigger Configuration**
// **Validates: Requirements 1.1, 1.2, 1.4**

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

describe('Feature: backend-dev-deployment, Property 1: Workflow Trigger Configuration', () => {
  const workflowContent = normalizeNewlines(readFileSync(workflowPath, 'utf8'));

  it('triggers on push to main with backend path filters and supports manual dispatch', () => {
    const expectedPatterns = [
      /\non:\s*\n\s{2}push:/,
      /push:[\s\S]*branches:\s*\[\s*main\s*\]/,
      /push:[\s\S]*paths:\s*\n\s*- ['"]berthcare-backend\/\*\*['"]/,
      /push:[\s\S]*paths:[\s\S]*- ['"]\.github\/workflows\/backend-deploy-dev\.yml['"]/,
      /\n\s{2}workflow_dispatch:/,
      /defaults:\s*\n\s{2}run:\s*\n\s{4}working-directory:\s*berthcare-backend/,
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
