import { PrismaClient, Prisma, Photo } from '../generated/prisma/client.js';
import { BaseRepository } from './base.repository.js';

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
    return this.prisma.photo.findUnique({ where: { id } });
  }

  async findMany(filter: FindFilter = {}): Promise<Photo[]> {
    return this.prisma.photo.findMany({ where: filter });
  }

  async update(id: string, data: UpdateData): Promise<Photo> {
    return this.prisma.photo.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.photo.delete({ where: { id } });
  }
}

const prisma = new PrismaClient();

export const photoRepository = new PhotoRepository(prisma);
