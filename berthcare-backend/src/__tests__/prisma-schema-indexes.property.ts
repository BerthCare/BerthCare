import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import fc from 'fast-check';

// **Feature: prisma-database-schema, Property 7: Index Completeness**
// **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

const schemaPath = path.resolve(__dirname, '..', '..', 'prisma', 'schema.prisma');

const indexPatterns = [
  { model: 'Caregiver', pattern: '\\@\\@index\\(\\[email\\]\\)' },
  { model: 'Schedule', pattern: '\\@\\@index\\(\\[caregiverId,\\s*scheduledDate\\]\\)' },
  { model: 'Visit', pattern: '\\@\\@index\\(\\[clientId,\\s*visitDate\\]\\)' },
  { model: 'AuditLog', pattern: '\\@\\@index\\(\\[entityType,\\s*entityId\\]\\)' },
];

const extractModelBlock = (schema: string, modelName: string): string | null => {
  const modelRegex = new RegExp(`model\\s+${modelName}\\s+{([\\s\\S]*?)^}\\s`, 'm');
  const match = schema.match(modelRegex);
  return match?.[1] ?? null;
};

describe('Feature: prisma-database-schema, Property 7: Index Completeness', () => {
  it('defines the required indexes on key models', () => {
    expect(existsSync(schemaPath)).toBe(true);
    const schema = readFileSync(schemaPath, 'utf-8');

    fc.assert(
      fc.property(fc.constantFrom(...indexPatterns), ({ model, pattern }) => {
        const block = extractModelBlock(schema, model);
        expect(block).not.toBeNull();
        expect(new RegExp(pattern, 'm').test(block as string)).toBe(true);
      }),
      { numRuns: indexPatterns.length }
    );
  });
});
