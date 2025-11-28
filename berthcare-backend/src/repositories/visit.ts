import { PrismaClient, Prisma, Visit } from '../generated/prisma/client.js';
import { BaseRepository } from './base.repository.js';

type CreateData = Prisma.VisitCreateInput;
type UpdateData = Prisma.VisitUpdateInput;
type FindFilter = Prisma.VisitWhereInput;

export class VisitRepository
  implements BaseRepository<Visit, CreateData, UpdateData, FindFilter>
{
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateData): Promise<Visit> {
    return this.prisma.visit.create({ data });
  }

  async findById(id: string): Promise<Visit | null> {
    return this.prisma.visit.findUnique({ where: { id } });
  }

  async findMany(filter: FindFilter = {}): Promise<Visit[]> {
    return this.prisma.visit.findMany({ where: filter });
  }

  async findLastByClient(clientId: string): Promise<Visit | null> {
    return this.prisma.visit.findFirst({
      where: { clientId },
      orderBy: { visitDate: 'desc' },
    });
  }

  async update(id: string, data: UpdateData): Promise<Visit> {
    return this.prisma.visit.update({ where: { id }, data });
  }

  async updateDocumentation(id: string, patch: Prisma.JsonObject): Promise<Visit> {
    const existing = await this.prisma.visit.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Visit not found');
    }

    const current = (existing.documentation as Prisma.JsonObject) ?? {};
    const merged = mergeJsonObjects(current, patch);

    return this.prisma.visit.update({
      where: { id },
      data: { documentation: merged },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.visit.update({
      where: { id },
      data: { syncStatus: 'conflict' },
    });
  }
}

function mergeJsonObjects(current: Prisma.JsonObject, patch: Prisma.JsonObject): Prisma.JsonObject {
  const result: Prisma.JsonObject = { ...current };

  Object.entries(patch).forEach(([key, value]) => {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof result[key] === 'object' &&
      result[key] !== null &&
      !Array.isArray(result[key])
    ) {
      result[key] = mergeJsonObjects(result[key] as Prisma.JsonObject, value as Prisma.JsonObject);
    } else {
      result[key] = value;
    }
  });

  return result;
}

const prisma = new PrismaClient();

export const visitRepository = new VisitRepository(prisma);
