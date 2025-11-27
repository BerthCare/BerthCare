// **Feature: backend-dev-deployment, Property 3: Image Tagging Configuration**
// **Validates: Requirements 2.3, 2.4**

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

describe('Feature: backend-dev-deployment, Property 3: Image Tagging Configuration', () => {
  const workflowContent = normalizeNewlines(readFileSync(workflowPath, 'utf8'));

  it('tags Docker images with commit SHA and latest', () => {
    const expectedPatterns = [
      /IMAGE_TAG:\s*\${{\s*github\.sha\s*}}/,
      /docker buildx build[\s\S]*-t ["']?\$ECR_REGISTRY\/\$IMAGE_NAME:\$IMAGE_TAG["']?/,
      /docker buildx build[\s\S]*-t ["']?\$ECR_REGISTRY\/\$IMAGE_NAME:latest["']?/,
    ];

    expectedPatterns.forEach((pattern) => {
      expect(pattern.test(workflowContent)).toBe(true);
    });
  });
});
