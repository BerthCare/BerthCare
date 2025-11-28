import { PrismaClient, Prisma, Alert } from '../generated/prisma/client.js';
import { BaseRepository } from './base.repository.js';

type CreateData = Prisma.AlertCreateInput;
type UpdateData = Prisma.AlertUpdateInput;
type FindFilter = Prisma.AlertWhereInput;

export class AlertRepository
  implements BaseRepository<Alert, CreateData, UpdateData, FindFilter>
{
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateData): Promise<Alert> {
    return this.prisma.alert.create({ data });
  }

  async findById(id: string): Promise<Alert | null> {
    return this.prisma.alert.findFirst({ where: { id, deletedAt: null } });
  }

  async findMany(filter: FindFilter = {}): Promise<Alert[]> {
    return this.prisma.alert.findMany({ where: { deletedAt: null, ...filter } });
  }

  async update(id: string, data: UpdateData): Promise<Alert> {
    return this.prisma.alert.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.alert.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

const prisma = new PrismaClient();

export const alertRepository = new AlertRepository(prisma);
