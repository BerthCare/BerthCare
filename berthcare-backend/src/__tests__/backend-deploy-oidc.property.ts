// **Feature: backend-dev-deployment, Property 9: OIDC Authentication**
// **Validates: Requirements 8.1**

import { readFileSync } from 'node:fs';
import path from 'node:path';

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

describe('Feature: backend-dev-deployment, Property 9: OIDC Authentication', () => {
  const workflowContent = normalizeNewlines(readFileSync(workflowPath, 'utf8'));

  it('enables id-token permission and configures aws-actions with role assumption', () => {
    const expectedPatterns = [
      /permissions:\s*\n\s*id-token:\s*write\s*\n\s*contents:\s*read/,
      /configure-aws-credentials@v4[\s\S]*role-to-assume:\s*arn:aws:iam::\${{\s*secrets\.AWS_ACCOUNT_ID\s*}}:role\/github-actions-deploy-dev/,
      /configure-aws-credentials@v4[\s\S]*aws-region:\s*ca-central-1/,
    ];

    expectedPatterns.forEach((pattern) => {
      expect(pattern.test(workflowContent)).toBe(true);
    });
  });
});
