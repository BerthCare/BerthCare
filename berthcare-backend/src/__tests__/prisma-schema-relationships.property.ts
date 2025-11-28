import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import fc from 'fast-check';

// **Feature: prisma-database-schema, Property 2: Schema Relationship Completeness**
// **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8**

const schemaPath = path.resolve(__dirname, '..', '..', 'prisma', 'schema.prisma');

const relationPatterns: Record<string, string[]> = {
  Caregiver: [
    '^\\s*schedules\\s+Schedule\\[\\]',
    '^\\s*visits\\s+Visit\\[\\]',
    '^\\s*initiatedAlerts\\s+Alert\\[\\]',
    '^\\s*coordinatedAlerts\\s+Alert\\[\\]',
    '^\\s*consents\\s+Consent\\[\\]',
    '^\\s*photos\\s+Photo\\[\\]',
  ],
  Client: [
    '^\\s*schedules\\s+Schedule\\[\\]',
    '^\\s*visits\\s+Visit\\[\\]',
    '^\\s*alerts\\s+Alert\\[\\]',
    '^\\s*consents\\s+Consent\\[\\]',
    '^\\s*photos\\s+Photo\\[\\]',
  ],
  Schedule: [
    '^\\s*caregiver\\s+Caregiver\\s+@relation\\(fields: \\[caregiverId\\], references: \\[id\\]\\)',
    '^\\s*client\\s+Client\\s+@relation\\(fields: \\[clientId\\], references: \\[id\\]\\)',
    '^\\s*visit\\s+Visit\\?',
  ],
  Visit: [
    '^\\s*schedule\\s+Schedule\\s+@relation\\(fields: \\[scheduleId\\], references: \\[id\\]\\)',
    '^\\s*caregiver\\s+Caregiver\\s+@relation\\(fields: \\[caregiverId\\], references: \\[id\\]\\)',
    '^\\s*client\\s+Client\\s+@relation\\(fields: \\[clientId\\], references: \\[id\\]\\)',
    '^\\s*copiedFrom\\s+Visit\\?\\s+@relation\\("VisitCopy", fields: \\[copiedFromVisitId\\], references: \\[id\\]\\)',
    '^\\s*copies\\s+Visit\\[\\]\\s+@relation\\("VisitCopy"\\)',
    '^\\s*photos\\s+Photo\\[\\]',
  ],
  Photo: [
    '^\\s*visit\\s+Visit\\s+@relation\\(fields: \\[visitId\\], references: \\[id\\]\\)',
    '^\\s*caregiver\\s+Caregiver\\s+@relation\\(fields: \\[caregiverId\\], references: \\[id\\]\\)',
    '^\\s*client\\s+Client\\s+@relation\\(fields: \\[clientId\\], references: \\[id\\]\\)',
  ],
  Alert: [
    '^\\s*caregiver\\s+Caregiver\\s+@relation\\("CaregiverInitiatedAlerts", fields: \\[caregiverId\\], references: \\[id\\]\\)',
    '^\\s*coordinator\\s+Caregiver\\s+@relation\\("CaregiverCoordinatedAlerts", fields: \\[coordinatorId\\], references: \\[id\\]\\)',
    '^\\s*client\\s+Client\\s+@relation\\(fields: \\[clientId\\], references: \\[id\\]\\)',
  ],
  Consent: [
    '^\\s*client\\s+Client\\s+@relation\\(fields: \\[clientId\\], references: \\[id\\]\\)',
    '^\\s*caregiver\\s+Caregiver\\?\\s+@relation\\("CaregiverConsents", fields: \\[caregiverId\\], references: \\[id\\]\\)',
  ],
};

const modelNames = Object.keys(relationPatterns);

const extractModelBlock = (schema: string, modelName: string): string | null => {
  const modelRegex = new RegExp(`model\\s+${modelName}\\s+{([\\s\\S]*?)^}\\s`, 'm');
  const match = schema.match(modelRegex);
  return match?.[1] ?? null;
};

describe('Feature: prisma-database-schema, Property 2: Schema Relationship Completeness', () => {
  it('defines required relations with the expected cardinality', () => {
    expect(existsSync(schemaPath)).toBe(true);
    const schema = readFileSync(schemaPath, 'utf-8');

    fc.assert(
      fc.property(fc.constantFrom(...modelNames), (modelName) => {
        const block = extractModelBlock(schema, modelName);
        expect(block).not.toBeNull();

        relationPatterns[modelName].forEach((pattern) => {
          expect(new RegExp(pattern, 'm').test(block as string)).toBe(true);
        });
      }),
      { numRuns: modelNames.length }
    );
  });
});
