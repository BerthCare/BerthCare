// **Feature: branch-protection-pr-templates, Property 2: PR Template Consistency Across Repositories**
// **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

import { readFileSync } from 'node:fs';
import path from 'node:path';
import fc from 'fast-check';

type TemplateUnderTest = {
  name: string;
  content: string;
};

const requiredSections = [
  '## Description',
  '## Links to Specs',
  '## Test Plan',
  '## Screenshots',
] as const;

const repoTemplates = [
  {
    name: 'backend',
    path: path.resolve(__dirname, '..', '..', '.github', 'PULL_REQUEST_TEMPLATE.md'),
  },
  {
    name: 'mobile',
    path: path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'berthcare-mobile',
      '.github',
      'PULL_REQUEST_TEMPLATE.md'
    ),
  },
  {
    name: 'infrastructure',
    path: path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'berthcare-infrastructure',
      '.github',
      'PULL_REQUEST_TEMPLATE.md'
    ),
  },
] as const;

const loadTemplate = (templatePath: string) =>
  readFileSync(templatePath, 'utf8').replace(/\r\n/g, '\n');

const extractRequiredSections = (content: string) =>
  requiredSections.filter((section) => new RegExp(`^${section}\\s*$`, 'm').test(content));

describe('Feature: branch-protection-pr-templates, Property 2: PR Template Consistency Across Repositories', () => {
  const templates: TemplateUnderTest[] = repoTemplates.map(({ name, path }) => ({
    name,
    content: loadTemplate(path),
  }));

  it('ensures each repository template contains the shared required sections', () => {
    fc.assert(
      fc.property(
        fc.shuffledSubarray(templates, {
          minLength: templates.length,
          maxLength: templates.length,
        }),
        (permutedTemplates) => {
          permutedTemplates.forEach(({ content }) => {
            requiredSections.forEach((section) => {
              const headingRegex = new RegExp(`^${section}\\s*$`, 'm');
              expect(headingRegex.test(content)).toBe(true);
            });

            const extracted = extractRequiredSections(content);
            expect(extracted).toEqual(requiredSections);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
