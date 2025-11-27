import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import type { PrismaPg as PrismaPgAdapter } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter: PrismaPgAdapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
