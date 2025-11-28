import { PrismaClient, Prisma, Schedule, ScheduleStatus } from '../generated/prisma/client.js';
import { BaseRepository } from './base.repository.js';

type CreateData = Prisma.ScheduleCreateInput;
type UpdateData = Prisma.ScheduleUpdateInput;
type FindFilter = Prisma.ScheduleWhereInput;

export class ScheduleRepository
  implements BaseRepository<Schedule, CreateData, UpdateData, FindFilter>
{
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateData): Promise<Schedule> {
    return this.prisma.schedule.create({ data });
  }

  async findById(id: string): Promise<Schedule | null> {
    return this.prisma.schedule.findUnique({ where: { id } });
  }

  async findMany(filter: FindFilter = {}): Promise<Schedule[]> {
    return this.prisma.schedule.findMany({ where: filter });
  }

  async findByDateAndCaregiver(caregiverId: string, scheduledDate: Date): Promise<Schedule[]> {
    return this.prisma.schedule.findMany({
      where: { caregiverId, scheduledDate },
      orderBy: { scheduledTime: 'asc' },
    });
  }

  async update(id: string, data: UpdateData): Promise<Schedule> {
    return this.prisma.schedule.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.schedule.update({
      where: { id },
      data: { status: ScheduleStatus.cancelled },
    });
  }
}

const prisma = new PrismaClient();

export const scheduleRepository = new ScheduleRepository(prisma);
