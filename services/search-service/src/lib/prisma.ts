import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: (() => {
          const url = process.env.DATABASE_URL || '';
          try {
            const parsed = new URL(url);
            if (!parsed.searchParams.has('connection_limit')) {
              parsed.searchParams.set('connection_limit', process.env.DB_POOL_SIZE || '10');
            }
            if (!parsed.searchParams.has('pool_timeout')) {
              parsed.searchParams.set('pool_timeout', '10');
            }
            return parsed.toString();
          } catch {
            return url;
          }
        })(),
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
