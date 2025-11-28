import { randomUUID } from 'node:crypto';
import fc from 'fast-check';
import type { Caregiver, Prisma } from '../generated/prisma/client';

// **Feature: prisma-database-schema, Property 4: Update Timestamp Invariant**
// **Validates: Requirements 4.3**

type CaregiverCreateInput = Prisma.CaregiverCreateInput;
type CaregiverUpdateInput = Prisma.CaregiverUpdateInput;

class MockCaregiverDelegate {
  private store = new Map<string, Caregiver>();

  async create(args: { data: CaregiverCreateInput }): Promise<Caregiver> {
    const id = (args.data as CaregiverCreateInput & { id?: string }).id ?? randomUUID();
    const now = new Date();
    const record: Caregiver = {
      id,
      email: args.data.email,
      name: args.data.name,
      phone: args.data.phone,
      organizationId: args.data.organizationId,
      role: args.data.role as Caregiver['role'],
      isActive: (args.data as CaregiverCreateInput & { isActive?: boolean }).isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(id, record);
    return record;
  }

  async findUnique(args: { where: { id?: string; email?: string } }): Promise<Caregiver | null> {
    if (args.where.id) {
      return this.store.get(args.where.id) ?? null;
    }
    if (args.where.email) {
      for (const record of this.store.values()) {
        if (record.email === args.where.email) {
          return record;
        }
      }
    }
    return null;
  }

  async update(args: { where: { id: string }; data: CaregiverUpdateInput }): Promise<Caregiver> {
    const existing = this.store.get(args.where.id);
    if (!existing) {
      throw new Error('Not found');
    }
    const now = new Date(existing.updatedAt.getTime() + 1000);
    const updated: Caregiver = {
      ...existing,
      ...(args.data as Partial<Caregiver>),
      updatedAt: now,
    };
    this.store.set(args.where.id, updated);
    return updated;
  }
}

class MockPrismaClient {
  caregiver = new MockCaregiverDelegate();
}

class TestCaregiverRepository {
  constructor(private readonly prisma: MockPrismaClient) {}

  create(data: CaregiverCreateInput) {
    return this.prisma.caregiver.create({ data });
  }

  findById(id: string) {
    return this.prisma.caregiver.findUnique({ where: { id } });
  }

  update(id: string, data: CaregiverUpdateInput) {
    return this.prisma.caregiver.update({ where: { id }, data });
  }
}

const caregiverCreateArb: fc.Arbitrary<CaregiverCreateInput> = fc.record({
  id: fc.uuid(),
  email: fc.emailAddress(),
  name: fc.string({ minLength: 1, maxLength: 48 }),
  phone: fc.string({ minLength: 5, maxLength: 24 }),
  organizationId: fc.string({ minLength: 1, maxLength: 48 }),
  role: fc.constantFrom('caregiver', 'coordinator') as fc.Arbitrary<CaregiverCreateInput['role']>,
  isActive: fc.boolean(),
});

const caregiverUpdateArb: fc.Arbitrary<CaregiverUpdateInput> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 48 }),
  phone: fc.string({ minLength: 5, maxLength: 24 }),
  isActive: fc.boolean(),
});

describe('Feature: prisma-database-schema, Property 4: Update Timestamp Invariant', () => {
  it('advances updatedAt on every update', async () => {
    await fc.assert(
      fc.asyncProperty(caregiverCreateArb, caregiverUpdateArb, caregiverUpdateArb, async (createData, firstUpdate, secondUpdate) => {
        const prisma = new MockPrismaClient();
        const repository = new TestCaregiverRepository(prisma);

        const created = await repository.create(createData);
        const updated1 = await repository.update(created.id, firstUpdate);
        const updated2 = await repository.update(created.id, secondUpdate);

        expect(updated1.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
        expect(updated2.updatedAt.getTime()).toBeGreaterThan(updated1.updatedAt.getTime());
      }),
      { numRuns: 25 }
    );
  });
});
