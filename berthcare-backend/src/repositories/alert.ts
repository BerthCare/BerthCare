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
    return this.prisma.alert.findUnique({ where: { id } });
  }

  async findMany(filter: FindFilter = {}): Promise<Alert[]> {
    return this.prisma.alert.findMany({ where: filter });
  }

  async update(id: string, data: UpdateData): Promise<Alert> {
    return this.prisma.alert.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.alert.delete({ where: { id } });
  }
}

const prisma = new PrismaClient();

export const alertRepository = new AlertRepository(prisma);
