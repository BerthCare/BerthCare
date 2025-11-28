import { PrismaClient, Prisma, Consent } from '../generated/prisma/client.js';
import { BaseRepository } from './base.repository.js';

type CreateData = Prisma.ConsentCreateInput;
type UpdateData = Prisma.ConsentUpdateInput;
type FindFilter = Prisma.ConsentWhereInput;

export class ConsentRepository
  implements BaseRepository<Consent, CreateData, UpdateData, FindFilter>
{
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateData): Promise<Consent> {
    return this.prisma.consent.create({ data });
  }

  async findById(id: string): Promise<Consent | null> {
    return this.prisma.consent.findFirst({ where: { id, deletedAt: null } });
  }

  async findMany(filter: FindFilter = {}): Promise<Consent[]> {
    return this.prisma.consent.findMany({ where: { deletedAt: null, ...filter } });
  }

  async update(id: string, data: UpdateData): Promise<Consent> {
    return this.prisma.consent.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.consent.update({
      where: { id },
      data: { granted: false, revokedAt: new Date(), deletedAt: new Date() },
    });
  }
}

const prisma = new PrismaClient();

export const consentRepository = new ConsentRepository(prisma);
