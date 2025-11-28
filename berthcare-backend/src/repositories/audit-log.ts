import type { PrismaClient } from '../generated/prisma/client.js';
import { Prisma, AuditLog } from '../generated/prisma/client.js';
import { BaseRepository } from './base.js';
import { prisma } from '../models/index.js';

type CreateData = Prisma.AuditLogCreateInput;
type UpdateData = Prisma.AuditLogUpdateInput;
type FindFilter = Prisma.AuditLogWhereInput;

export class AuditLogRepository
  implements BaseRepository<AuditLog, CreateData, UpdateData, FindFilter>
{
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateData): Promise<AuditLog> {
    return this.prisma.auditLog.create({ data });
  }

  async findById(id: string): Promise<AuditLog | null> {
    return this.prisma.auditLog.findUnique({ where: { id } });
  }

  async findMany(filter: FindFilter = {}): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({ where: filter });
  }

  async update(id: string, data: UpdateData): Promise<AuditLog> {
    return this.prisma.auditLog.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.auditLog.delete({ where: { id } });
  }
}

export const auditLogRepository = new AuditLogRepository(prisma);
