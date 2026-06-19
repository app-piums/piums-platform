import prisma from "../lib/prisma";
import { cloudinaryProvider } from "../providers/cloudinary.provider";
import { logger } from "../utils/logger";

const RETENTION_DAYS = 90;

export async function runPurgeJob(): Promise<void> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

  const stale = await prisma.user.findMany({
    where: {
      deletedAt: { not: null, lt: cutoff },
      // Skip already-anonymized rows
      email: { not: { endsWith: '@purged.invalid' } },
    },
    select: { id: true, authId: true, avatar: true, email: true },
    take: 200,
  });

  if (stale.length === 0) {
    logger.info('Purge job: no stale soft-deleted users found', 'PURGE_SERVICE');
    return;
  }

  logger.info(`Purge job: processing ${stale.length} stale users`, 'PURGE_SERVICE');

  for (const user of stale) {
    try {
      // Delete remaining Cloudinary assets if any
      if (user.avatar) {
        await cloudinaryProvider.deleteAvatar(user.avatar).catch(() => {});
      }

      // Anonymize all PII columns — keep the row for referential integrity
      await prisma.user.update({
        where: { id: user.id },
        data: {
          email: `deleted_${user.id}@purged.invalid`,
          nombre: 'Usuario Eliminado',
          avatar: null,
          bio: null,
          telefono: null,
        },
      });

      logger.info('Purge job: user anonymized', 'PURGE_SERVICE', { userId: user.id });
    } catch (err: any) {
      logger.error('Purge job: error anonymizing user', 'PURGE_SERVICE', {
        userId: user.id,
        error: err.message,
      });
    }
  }
}
