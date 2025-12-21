import type { PrismaClient } from '../generated/prisma/client';
import { Prisma, Caregiver } from '../generated/prisma/client';
import { BaseRepository } from './base';
import { prisma } from '../models';

type CreateData = Prisma.CaregiverCreateInput;
type UpdateData = Prisma.CaregiverUpdateInput;
type FindFilter = Prisma.CaregiverWhereInput;

export class CaregiverRepository implements BaseRepository<
  Caregiver,
  CreateData,
  UpdateData,
  FindFilter
> {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateData): Promise<Caregiver> {
    return this.prisma.caregiver.create({ data });
  }

  async findById(id: string): Promise<Caregiver | null> {
    return this.prisma.caregiver.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<Caregiver | null> {
    return this.prisma.caregiver.findUnique({ where: { email } });
  }

  async findMany(filter: FindFilter = {}): Promise<Caregiver[]> {
    return this.prisma.caregiver.findMany({ where: filter });
  }

  async update(id: string, data: UpdateData): Promise<Caregiver> {
    return this.prisma.caregiver.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.caregiver.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

export const caregiverRepository = new CaregiverRepository(prisma);
