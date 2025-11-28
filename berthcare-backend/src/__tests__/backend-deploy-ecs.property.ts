// **Feature: backend-dev-deployment, Property 5: ECS Deployment Steps**
// **Validates: Requirements 4.1, 4.2**

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

describe('Feature: backend-dev-deployment, Property 5: ECS Deployment Steps', () => {
  const workflowContent = normalizeNewlines(readFileSync(workflowPath, 'utf8'));

  it('updates the ECS task definition and waits for service stability', () => {
    const expectedPatterns = [
      /ecs describe-task-definition/,
      /ecs register-task-definition/,
      /ecs update-service/,
      /ecs wait services-stable/,
      /task-definition\.json/,
      /CONTAINER_NAME/,
      /healthCheck/,
      /curl -f http:\/\/localhost:\$\{PORT:-3000\}\/health/,
    ];

    expectedPatterns.forEach((pattern) => {
      expect(pattern.test(workflowContent)).toBe(true);
    });
  });
});
