import type { PrismaClient } from '../generated/prisma/client.js';
import { Prisma, Client } from '../generated/prisma/client.js';
import { BaseRepository } from './base.js';
import { prisma } from '../models/index.js';

type CreateData = Prisma.ClientCreateInput;
type UpdateData = Prisma.ClientUpdateInput;
type FindFilter = Prisma.ClientWhereInput;

export class ClientRepository implements BaseRepository<
  Client,
  CreateData,
  UpdateData,
  FindFilter
> {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateData): Promise<Client> {
    return this.prisma.client.create({ data });
  }

  async findById(id: string): Promise<Client | null> {
    return this.prisma.client.findUnique({ where: { id } });
  }

  async findMany(filter: FindFilter = {}): Promise<Client[]> {
    return this.prisma.client.findMany({ where: filter });
  }

  async update(id: string, data: UpdateData): Promise<Client> {
    return this.prisma.client.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.client.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

export const clientRepository = new ClientRepository(prisma);
