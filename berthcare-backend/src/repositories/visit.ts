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

  async updateDocumentation(id: string, documentation: Prisma.JsonValue): Promise<Visit> {
    return this.prisma.visit.update({ where: { id }, data: { documentation } });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.visit.update({
      where: { id },
      data: { syncStatus: 'conflict' },
    });
  }
}

const prisma = new PrismaClient();

export const visitRepository = new VisitRepository(prisma);
