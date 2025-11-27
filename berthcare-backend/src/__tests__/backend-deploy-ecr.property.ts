// **Feature: backend-dev-deployment, Property 4: ECR Authentication and Push**
// **Validates: Requirements 3.1, 3.2**

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

describe('Feature: backend-dev-deployment, Property 4: ECR Authentication and Push', () => {
  const workflowContent = normalizeNewlines(readFileSync(workflowPath, 'utf8'));

  it('authenticates to ECR in ca-central-1 and pushes the image', () => {
    const expectedPatterns = [
      /configure-aws-credentials@v4[\s\S]*aws-region:\s*ca-central-1/,
      /aws-actions\/amazon-ecr-login@v2/,
      /docker buildx build[\s\S]*--push/,
      /docker buildx build[\s\S]*\$ECR_REGISTRY\/\$IMAGE_NAME:\$IMAGE_TAG/,
      /IMAGE_TAG:\s*\${{\s*github\.sha\s*}}/,
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
