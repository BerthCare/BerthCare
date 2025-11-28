import { Prisma, Photo } from '../generated/prisma/client.js';
import { BaseRepository } from './base.repository.js';
import { prisma } from '../models/index.js';

type CreateData = Prisma.PhotoCreateInput;
type UpdateData = Prisma.PhotoUpdateInput;
type FindFilter = Prisma.PhotoWhereInput;

export class PhotoRepository
  implements BaseRepository<Photo, CreateData, UpdateData, FindFilter>
{
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateData): Promise<Photo> {
    return this.prisma.photo.create({ data });
  }

  async findById(id: string): Promise<Photo | null> {
    return this.prisma.photo.findFirst({ where: { id, deletedAt: null } });
  }

  async findMany(filter: FindFilter = {}): Promise<Photo[]> {
    return this.prisma.photo.findMany({ where: { deletedAt: null, ...filter } });
  }

  async update(id: string, data: UpdateData): Promise<Photo> {
    return this.prisma.photo.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.photo.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const photoRepository = new PhotoRepository(prisma);
