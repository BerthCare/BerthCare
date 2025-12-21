import type { PrismaClient } from '../generated/prisma/client';
import { Prisma, Visit } from '../generated/prisma/client';
import { BaseRepository } from './base';
import { prisma } from '../models';

type CreateData = Prisma.VisitCreateInput;
type UpdateData = Prisma.VisitUpdateInput;
type FindFilter = Prisma.VisitWhereInput;

export class VisitRepository implements BaseRepository<Visit, CreateData, UpdateData, FindFilter> {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateData): Promise<Visit> {
    return this.prisma.visit.create({ data });
  }

  async findById(id: string): Promise<Visit | null> {
    return this.prisma.visit.findFirst({ where: { id, deletedAt: null } });
  }

  async findMany(filter: FindFilter = {}): Promise<Visit[]> {
    return this.prisma.visit.findMany({ where: { deletedAt: null, ...filter } });
  }

  async findLastByClient(clientId: string): Promise<Visit | null> {
    return this.prisma.visit.findFirst({
      where: { clientId, deletedAt: null },
      orderBy: { visitDate: 'desc' },
    });
  }

  async update(id: string, data: UpdateData): Promise<Visit> {
    return this.prisma.visit.update({ where: { id }, data });
  }

  async updateDocumentation(id: string, patch: Prisma.JsonObject): Promise<Visit> {
    const existing = await this.prisma.visit.findFirst({ where: { id, deletedAt: null } });
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
      data: { deletedAt: new Date() },
    });
  }
}

function mergeJsonObjects(current: Prisma.JsonObject, patch: Prisma.JsonObject): Prisma.JsonObject {
  const result: Prisma.JsonObject = { ...current };

  Object.entries(patch).forEach(([key, value]) => {
    const existing = result[key];
    if (isJsonObject(value) && isJsonObject(existing)) {
      result[key] = mergeJsonObjects(existing, value);
    } else {
      result[key] = value;
    }
  });

  return result;
}

const isJsonObject = (value: unknown): value is Prisma.JsonObject =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

export const visitRepository = new VisitRepository(prisma);
