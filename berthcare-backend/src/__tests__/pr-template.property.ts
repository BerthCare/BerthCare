// **Feature: branch-protection-pr-templates, Property 1: PR Template Contains All Required Sections**
// **Validates: Requirements 4.2, 4.3, 4.4, 4.5**

import { readFileSync } from 'node:fs';
import path from 'node:path';
import fc from 'fast-check';

const requiredSections = [
  '## Description',
  '## Links to Specs',
  '## Test Plan',
  '## Screenshots',
] as const;
const templatePath = path.resolve(__dirname, '..', '..', '.github', 'PULL_REQUEST_TEMPLATE.md');

describe('Feature: branch-protection-pr-templates, Property 1: PR Template Contains All Required Sections', () => {
  it('includes all required section headings', () => {
    const templateContent = readFileSync(templatePath, 'utf8').replace(/\r\n/g, '\n');

    fc.assert(
      fc.property(
        fc.shuffledSubarray([...requiredSections], {
          minLength: requiredSections.length,
          maxLength: requiredSections.length,
        }),
        (sections) => {
          sections.forEach((section) => {
            const headingRegex = new RegExp(`^${section}\\s*$`, 'm');
            expect(headingRegex.test(templateContent)).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
