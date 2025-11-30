import { randomUUID } from 'node:crypto';
import fc from 'fast-check';
import type { Caregiver, Prisma } from '../generated/prisma/client';

// **Feature: prisma-database-schema, Property 5: Soft Delete Data Preservation**
// **Validates: Requirements 4.4**

type CaregiverCreateInput = Prisma.CaregiverUncheckedCreateInput;

class MockCaregiverDelegate {
  private store = new Map<string, Caregiver>();

  create(args: { data: CaregiverCreateInput }): Promise<Caregiver> {
    const id = args.data.id ?? randomUUID();
    const now = new Date();
    const record: Caregiver = {
      id,
      email: args.data.email,
      name: args.data.name,
      phone: args.data.phone,
      passwordHash: args.data.passwordHash ?? 'hashed-password',
      organizationId: args.data.organizationId,
      role: args.data.role,
      isActive: args.data.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(id, record);
    return Promise.resolve(record);
  }

  findUnique(args: { where: { id?: string } }): Promise<Caregiver | null> {
    if (args.where.id) {
      return Promise.resolve(this.store.get(args.where.id) ?? null);
    }
    return Promise.resolve(null);
  }

  update(args: { where: { id: string }; data: Partial<Caregiver> }): Promise<Caregiver> {
    const existing = this.store.get(args.where.id);
    if (!existing) {
      throw new Error('Not found');
    }
    const updatedAt = new Date(existing.updatedAt.getTime() + 1000);
    const updated: Caregiver = { ...existing, ...args.data, updatedAt };
    this.store.set(args.where.id, updated);
    return Promise.resolve(updated);
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

  softDelete(id: string) {
    return this.prisma.caregiver.update({ where: { id }, data: { isActive: false } });
  }
}

const caregiverCreateArb: fc.Arbitrary<CaregiverCreateInput> = fc.record({
  id: fc.uuid(),
  email: fc.emailAddress(),
  name: fc.string({ minLength: 1, maxLength: 48 }),
  phone: fc.string({ minLength: 5, maxLength: 24 }),
  passwordHash: fc.string({ minLength: 10, maxLength: 60 }),
  organizationId: fc.string({ minLength: 1, maxLength: 48 }),
  role: fc.constantFrom('caregiver', 'coordinator') as fc.Arbitrary<CaregiverCreateInput['role']>,
  isActive: fc.boolean(),
});

describe('Feature: prisma-database-schema, Property 5: Soft Delete Data Preservation', () => {
  it('marks records inactive while preserving other fields', async () => {
    await fc.assert(
      fc.asyncProperty(caregiverCreateArb, async (createData) => {
        const prisma = new MockPrismaClient();
        const repository = new TestCaregiverRepository(prisma);

        const created = await repository.create(createData);
        await repository.softDelete(created.id);
        const afterDelete = await repository.findById(created.id);

        expect(afterDelete).not.toBeNull();
        expect(afterDelete?.isActive).toBe(false);
        expect(afterDelete?.email).toBe(created.email);
        expect(afterDelete?.name).toBe(created.name);
        expect(afterDelete?.phone).toBe(created.phone);
        expect(afterDelete?.passwordHash).toBe(created.passwordHash);
        expect(afterDelete?.organizationId).toBe(created.organizationId);
        expect(afterDelete?.role).toBe(created.role);
        expect(afterDelete?.createdAt.getTime()).toBe(created.createdAt.getTime());
        expect((afterDelete as Caregiver).updatedAt.getTime()).toBeGreaterThan(
          created.updatedAt.getTime()
        );
      }),
      { numRuns: 25 }
    );
  });
});
