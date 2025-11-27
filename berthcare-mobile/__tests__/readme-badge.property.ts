// **Feature: mobile-ci-pipeline, Property 3: README Badge Link Validity**
// **Validates: Requirements 9.1, 9.4**

import { readFileSync } from 'node:fs';
import path from 'node:path';
import fc from 'fast-check';

const readmePath = path.resolve(__dirname, '..', 'README.md');
const repoSlug = 'BerthCare/BerthCare';
const workflowPath = 'berthcare-mobile/.github/workflows/ci.yml';

const normalizeNewlines = (content: string) => content.replace(/\r\n/g, '\n');
const escapeForRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

describe('Feature: mobile-ci-pipeline, Property 3: README Badge Link Validity', () => {
  const readmeContent = normalizeNewlines(readFileSync(readmePath, 'utf8'));

  it('contains a workflow status badge that links to the mobile CI workflow runs', () => {
    const badgeRegex = new RegExp(
      `\\[!\\[[^\\]]*\\]\\(https://github\\.com/(?<repo>[\\w.-]+/[\\w.-]+)/actions/workflows/(?<workflowPath>${escapeForRegex(
        workflowPath
      )})/badge\\.svg(?:\\?[^)]*)?\\)\\]\\(https://github\\.com/\\k<repo>/actions/workflows/\\k<workflowPath>(?:\\?[^)]*)?\\)`
    );

    fc.assert(
      fc.property(fc.constantFrom(repoSlug), fc.constantFrom(workflowPath), () => {
        const match = badgeRegex.exec(readmeContent);
        expect(match).not.toBeNull();
        if (!match?.groups) {
          throw new Error('Badge not found with expected link/image structure');
        }

        expect(match.groups.repo).toBe(repoSlug);
        expect(match.groups.workflowPath).toBe(workflowPath);
      }),
      { numRuns: 50 }
    );
  });
});
