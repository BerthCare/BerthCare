import { PrismaClient } from '../generated/prisma/client';

// Note: Prisma 7.x requires adapter configuration for database connections
// This will be configured when database setup is implemented
export const prisma = new PrismaClient({} as any);
