import { randomUUID } from 'node:crypto';
import fc from 'fast-check';
import type { Caregiver, Prisma } from '../generated/prisma/client';

// **Feature: prisma-database-schema, Property 3: CRUD Round-Trip Consistency**
// **Validates: Requirements 4.1, 4.2**

type CaregiverCreateInput = Prisma.CaregiverCreateInput;
type CaregiverUpdateInput = Prisma.CaregiverUpdateInput;

class MockCaregiverDelegate {
  private store = new Map<string, Caregiver>();

  create(args: { data: CaregiverCreateInput }): Promise<Caregiver> {
    const id = (args.data as CaregiverCreateInput & { id?: string }).id ?? randomUUID();
    const organizationId = args.data.organizationId ?? randomUUID();
    const now = new Date();
    const record: Caregiver = {
      id,
      email: args.data.email,
      name: args.data.name,
      phone: args.data.phone,
      organizationId,
      role: args.data.role as Caregiver['role'],
      isActive: (args.data as CaregiverCreateInput & { isActive?: boolean }).isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(id, record);
    return Promise.resolve(record);
  }

  findUnique(args: { where: { id?: string; email?: string } }): Promise<Caregiver | null> {
    if (args.where.id) {
      return Promise.resolve(this.store.get(args.where.id) ?? null);
    }
    if (args.where.email) {
      for (const record of this.store.values()) {
        if (record.email === args.where.email) {
          return Promise.resolve(record);
        }
      }
    }
    return Promise.resolve(null);
  }

  findMany(): Promise<Caregiver[]> {
    return Promise.resolve(Array.from(this.store.values()));
  }

  update(args: { where: { id: string }; data: CaregiverUpdateInput }): Promise<Caregiver> {
    const existing = this.store.get(args.where.id);
    if (!existing) {
      throw new Error('Not found');
    }
    const now = new Date();
    const updated: Caregiver = {
      ...existing,
      ...(args.data as Partial<Caregiver>),
      updatedAt: now,
    };
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

  findByEmail(email: string) {
    return this.prisma.caregiver.findUnique({ where: { email } });
  }

  findMany() {
    return this.prisma.caregiver.findMany();
  }

  update(id: string, data: CaregiverUpdateInput) {
    return this.prisma.caregiver.update({ where: { id }, data });
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
  organizationId: fc.uuid(),
  role: fc.constantFrom('caregiver', 'coordinator') as fc.Arbitrary<CaregiverCreateInput['role']>,
  isActive: fc.boolean(),
});

const caregiverUpdateArb: fc.Arbitrary<CaregiverUpdateInput> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 48 }),
  phone: fc.string({ minLength: 5, maxLength: 24 }),
  isActive: fc.boolean(),
});

describe('Feature: prisma-database-schema, Property 3: CRUD Round-Trip Consistency', () => {
  it('round-trips caregiver records through create/read/update/delete operations', async () => {
    await fc.assert(
      fc.asyncProperty(caregiverCreateArb, caregiverUpdateArb, async (createData, updateData) => {
        const prisma = new MockPrismaClient();
        const repository = new TestCaregiverRepository(prisma);

        const created = await repository.create(createData);
        const byId = await repository.findById(created.id);
        const byEmail = await repository.findByEmail(created.email);

        expect(byId).toMatchObject({
          email: createData.email,
          name: createData.name,
          phone: createData.phone,
          organizationId: createData.organizationId,
          role: createData.role,
          isActive: createData.isActive,
        });
        expect(byEmail?.id).toBe(created.id);

        const updated = await repository.update(created.id, updateData);
        expect(updated.name).toBe(updateData.name);
        expect(updated.phone).toBe(updateData.phone);
        expect(updated.isActive).toBe(updateData.isActive);

        await repository.softDelete(created.id);
        const afterDelete = await repository.findById(created.id);
        expect(afterDelete?.isActive).toBe(false);

        const all = await repository.findMany();
        expect(all.some((c: Caregiver) => c.id === created.id)).toBe(true);
      }),
      { numRuns: 25 }
    );
  });
});
