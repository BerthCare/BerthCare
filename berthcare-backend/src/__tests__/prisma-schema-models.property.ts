import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import fc from 'fast-check';

// **Feature: prisma-database-schema, Property 1: Schema Model Completeness**
// **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8**

const schemaPath = path.resolve(__dirname, '..', '..', 'prisma', 'schema.prisma');

const requiredFields: Record<string, string[]> = {
  Caregiver: [
    '^\\s*id\\s+String\\s+@id\\s+@default\\(uuid\\(\\)\\)',
    '^\\s*email\\s+String\\s+.*@unique',
    '^\\s*name\\s+String',
    '^\\s*phone\\s+String',
    '^\\s*organizationId\\s+String',
    '^\\s*role\\s+CaregiverRole',
    '^\\s*isActive\\s+Boolean',
    '^\\s*createdAt\\s+DateTime\\s+.*@default\\(now\\(\\)\\)',
    '^\\s*updatedAt\\s+DateTime\\s+.*@updatedAt',
  ],
  Client: [
    '^\\s*id\\s+String\\s+@id\\s+@default\\(uuid\\(\\)\\)',
    '^\\s*name\\s+String',
    '^\\s*photoUrl\\s+String\\?',
    '^\\s*address\\s+String',
    '^\\s*phone\\s+String\\?',
    '^\\s*emergencyContact\\s+String\\?',
    '^\\s*organizationId\\s+String',
    '^\\s*isActive\\s+Boolean',
    '^\\s*createdAt\\s+DateTime\\s+.*@default\\(now\\(\\)\\)',
    '^\\s*updatedAt\\s+DateTime\\s+.*@updatedAt',
  ],
  Schedule: [
    '^\\s*id\\s+String\\s+@id\\s+@default\\(uuid\\(\\)\\)',
    '^\\s*caregiverId\\s+String',
    '^\\s*clientId\\s+String',
    '^\\s*scheduledDate\\s+DateTime\\s+.*@db\\.Date',
    '^\\s*scheduledTime\\s+DateTime\\s+.*@db\\.Time\\(6\\)',
    '^\\s*durationMinutes\\s+Int',
    '^\\s*status\\s+ScheduleStatus',
    '^\\s*completedAt\\s+DateTime\\?',
    '^\\s*createdAt\\s+DateTime\\s+.*@default\\(now\\(\\)\\)',
    '^\\s*updatedAt\\s+DateTime\\s+.*@updatedAt',
  ],
  Visit: [
    '^\\s*id\\s+String\\s+@id\\s+@default\\(uuid\\(\\)\\)',
    '^\\s*scheduleId\\s+String\\s+.*@unique',
    '^\\s*caregiverId\\s+String',
    '^\\s*clientId\\s+String',
    '^\\s*visitDate\\s+DateTime\\s+.*@db\\.Date',
    '^\\s*startTime\\s+DateTime\\?\\s+.*@db\\.Time\\(6\\)',
    '^\\s*endTime\\s+DateTime\\?\\s+.*@db\\.Time\\(6\\)',
    '^\\s*documentation\\s+Json',
    '^\\s*photoIds\\s+String\\[\\]',
    '^\\s*location\\s+Json\\?',
    '^\\s*changedFields\\s+String\\[\\]',
    '^\\s*copiedFromVisitId\\s+String\\?',
    '^\\s*syncStatus\\s+SyncStatus',
    '^\\s*syncedAt\\s+DateTime\\?',
    '^\\s*syncVersion\\s+Int',
    '^\\s*createdAt\\s+DateTime\\s+.*@default\\(now\\(\\)\\)',
    '^\\s*updatedAt\\s+DateTime\\s+.*@updatedAt',
  ],
  Photo: [
    '^\\s*id\\s+String\\s+@id\\s+@default\\(uuid\\(\\)\\)',
    '^\\s*visitId\\s+String',
    '^\\s*clientId\\s+String',
    '^\\s*caregiverId\\s+String',
    '^\\s*localPath\\s+String\\?',
    '^\\s*s3Key\\s+String\\?',
    '^\\s*mimeType\\s+String',
    '^\\s*sizeBytes\\s+Int',
    '^\\s*compressedSizeBytes\\s+Int',
    '^\\s*width\\s+Int',
    '^\\s*height\\s+Int',
    '^\\s*syncStatus\\s+PhotoSyncStatus',
    '^\\s*uploadedAt\\s+DateTime\\?',
    '^\\s*createdAt\\s+DateTime\\s+.*@default\\(now\\(\\)\\)',
  ],
  Alert: [
    '^\\s*id\\s+String\\s+@id\\s+@default\\(uuid\\(\\)\\)',
    '^\\s*caregiverId\\s+String',
    '^\\s*clientId\\s+String',
    '^\\s*coordinatorId\\s+String',
    '^\\s*initiatedAt\\s+DateTime',
    '^\\s*callDuration\\s+Int\\?',
    '^\\s*note\\s+String\\?',
    '^\\s*location\\s+Json\\?',
    '^\\s*createdAt\\s+DateTime\\s+.*@default\\(now\\(\\)\\)',
  ],
  AuditLog: [
    '^\\s*id\\s+String\\s+@id\\s+@default\\(uuid\\(\\)\\)',
    '^\\s*entityType\\s+String',
    '^\\s*entityId\\s+String',
    '^\\s*action\\s+String',
    '^\\s*actorId\\s+String',
    '^\\s*actorType\\s+ActorType',
    '^\\s*before\\s+Json\\?',
    '^\\s*after\\s+Json\\?',
    '^\\s*ipAddress\\s+String\\?',
    '^\\s*userAgent\\s+String\\?',
    '^\\s*deviceId\\s+String',
    '^\\s*createdAt\\s+DateTime\\s+.*@default\\(now\\(\\)\\)',
  ],
  Consent: [
    '^\\s*id\\s+String\\s+@id\\s+@default\\(uuid\\(\\)\\)',
    '^\\s*clientId\\s+String',
    '^\\s*caregiverId\\s+String\\?',
    '^\\s*consentType\\s+ConsentType',
    '^\\s*granted\\s+Boolean',
    '^\\s*grantedAt\\s+DateTime\\?',
    '^\\s*revokedAt\\s+DateTime\\?',
    '^\\s*signatureUrl\\s+String\\?',
    '^\\s*witnessName\\s+String\\?',
    '^\\s*createdAt\\s+DateTime\\s+.*@default\\(now\\(\\)\\)',
    '^\\s*updatedAt\\s+DateTime\\s+.*@updatedAt',
  ],
};

const modelNames = Object.keys(requiredFields);

const extractModelBlock = (schema: string, modelName: string): string | null => {
  const modelRegex = new RegExp(`model\\s+${modelName}\\s+{([\\s\\S]*?)^}\\s`, 'm');
  const match = schema.match(modelRegex);
  return match?.[1] ?? null;
};

describe('Feature: prisma-database-schema, Property 1: Schema Model Completeness', () => {
  it('includes all required fields for every model in the schema', () => {
    expect(existsSync(schemaPath)).toBe(true);
    const schema = readFileSync(schemaPath, 'utf-8');

    fc.assert(
      fc.property(fc.constantFrom(...modelNames), (modelName) => {
        const block = extractModelBlock(schema, modelName);
        expect(block).not.toBeNull();

        const fields = requiredFields[modelName];
        fields.forEach((pattern) => {
          expect(new RegExp(pattern, 'm').test(block as string)).toBe(true);
        });
      }),
      { numRuns: modelNames.length }
    );
  });
});
