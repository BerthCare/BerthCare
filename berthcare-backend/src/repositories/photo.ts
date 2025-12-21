import { PrismaClient, Prisma, Photo } from '../generated/prisma/client';
import { BaseRepository } from './base';
import { prisma } from '../models';

type CreateData = Prisma.PhotoCreateInput;
type UpdateData = Prisma.PhotoUpdateInput;
type FindFilter = Prisma.PhotoWhereInput;

export class PhotoRepository implements BaseRepository<Photo, CreateData, UpdateData, FindFilter> {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: CreateData): Promise<Photo> {
    return this.prisma.photo.create({ data });
  }

  findById(id: string): Promise<Photo | null> {
    return this.prisma.photo.findFirst({ where: { id, deletedAt: null } });
  }

  findMany(filter: FindFilter = {}): Promise<Photo[]> {
    return this.prisma.photo.findMany({ where: { deletedAt: null, ...filter } });
  }

  update(id: string, data: UpdateData): Promise<Photo> {
    return this.prisma.photo.update({ where: { id }, data });
  }

  softDelete(id: string): Promise<void> {
    return this.prisma.photo
      .update({
        where: { id },
        data: { deletedAt: new Date() },
      })
      .then(() => undefined);
  }
}

export const photoRepository = new PhotoRepository(prisma);
