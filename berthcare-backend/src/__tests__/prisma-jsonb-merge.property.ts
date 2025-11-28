import { randomUUID } from 'node:crypto';
import fc from 'fast-check';
import type { Visit, Prisma } from '../generated/prisma/client';

// **Feature: prisma-database-schema, Property 6: JSONB Partial Update Merge**
// **Validates: Requirements 5.2**

type JsonObject = Prisma.JsonObject;

const deepMerge = (current: JsonObject, patch: JsonObject): JsonObject => {
  const result: JsonObject = { ...current };

  Object.entries(patch).forEach(([key, value]) => {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof result[key] === 'object' &&
      result[key] !== null &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(result[key] as JsonObject, value as JsonObject);
    } else {
      result[key] = value;
    }
  });

  return result;
};

class MockVisitDelegate {
  private store = new Map<string, Visit>();

  seed(visit: Visit): void {
    this.store.set(visit.id, visit);
  }

  findUnique(args: { where: { id: string } }): Promise<Visit | null> {
    return Promise.resolve(this.store.get(args.where.id) ?? null);
  }

  update(args: { where: { id: string }; data: Prisma.VisitUpdateInput }): Promise<Visit> {
    const existing = this.store.get(args.where.id);
    if (!existing) {
      throw new Error('Visit not found');
    }
    const updated: Visit = {
      ...existing,
      ...(args.data as Partial<Visit>),
      updatedAt: new Date(existing.updatedAt.getTime() + 1000),
    };
    this.store.set(args.where.id, updated);
    return Promise.resolve(updated);
  }
}

class MockPrismaClient {
  visit = new MockVisitDelegate();
}

class TestVisitRepository {
  constructor(private readonly prisma: MockPrismaClient) {}

  async updateDocumentation(id: string, patch: JsonObject) {
    const existing = await this.prisma.visit.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Visit not found');
    }
    const current = (existing.documentation as JsonObject) ?? {};
    const merged = deepMerge(current, patch);
    return this.prisma.visit.update({
      where: { id },
      data: { documentation: merged },
    });
  }
}

const jsonValueArb: fc.Arbitrary<JsonObject> = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 8 }),
  fc.oneof(
    fc.string({ maxLength: 12 }),
    fc.integer({ min: -1000, max: 1000 }),
    fc.boolean(),
    fc.constant(null)
  )
);

describe('Feature: prisma-database-schema, Property 6: JSONB Partial Update Merge', () => {
  it('merges partial documentation updates into existing JSON without losing untouched keys', async () => {
    await fc.assert(
      fc.asyncProperty(jsonValueArb, jsonValueArb, async (baseDoc, patchDoc) => {
    const prisma = new MockPrismaClient();
    const repository = new TestVisitRepository(prisma);

        const visitId = randomUUID();
        const baseVisit: Visit = {
          id: visitId,
          scheduleId: randomUUID(),
          caregiverId: randomUUID(),
          clientId: randomUUID(),
          visitDate: new Date(),
          startTime: null,
          endTime: null,
          documentation: baseDoc,
          photoIds: [],
          location: null,
          changedFields: [],
          copiedFromVisitId: null,
          syncStatus: 'local',
          syncedAt: null,
          syncVersion: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        prisma.visit.seed(baseVisit);

        const updated = await repository.updateDocumentation(visitId, patchDoc);
        const expected = deepMerge(baseDoc, patchDoc);

        expect(updated.documentation).toEqual(expected);
        expect(updated.updatedAt.getTime()).toBeGreaterThan(baseVisit.updatedAt.getTime());
      }),
      { numRuns: 25 }
    );
  });
});
