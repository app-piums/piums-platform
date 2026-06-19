import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { chatEmitter } from './chat.service';

export class GroupChatService {
  // ==================== GROUP CONVERSATIONS ====================

  async createOrGetGroup(params: {
    bookingId?: string;
    eventId?: string;
    createdBy: string;
    participantIds: string[];
    name?: string;
  }) {
    const { bookingId, eventId, createdBy, participantIds, name } = params;

    if (!bookingId && !eventId) {
      throw new AppError(400, 'Se requiere bookingId o eventId');
    }

    const where = bookingId ? { bookingId } : { eventId };

    let group = await prisma.groupConversation.findFirst({ where });

    if (group) {
      // Add any missing participants
      for (const userId of participantIds) {
        await prisma.groupParticipant.upsert({
          where: { groupId_userId: { groupId: group.id, userId } },
          create: { groupId: group.id, userId },
          update: {},
        });
      }
      return group;
    }

    group = await prisma.groupConversation.create({
      data: {
        bookingId: bookingId ?? null,
        eventId: eventId ?? null,
        createdBy,
        name: name ?? null,
        status: 'ACTIVE',
        participants: {
          create: [...new Set([createdBy, ...participantIds])].map(userId => ({ userId })),
        },
      },
      include: { participants: true },
    });

    logger.info(`Group conversation created: ${group.id}`, 'GROUP_CHAT');
    return group;
  }

  async addParticipant(groupId: string, userId: string, requesterId: string, skipCheck = false) {
    const group = await prisma.groupConversation.findUnique({
      where: { id: groupId },
      include: { participants: true },
    });

    if (!group) throw new AppError(404, 'Grupo no encontrado');

    if (!skipCheck) {
      const isParticipant = group.participants.some((p: { userId: string }) => p.userId === requesterId);
      if (!isParticipant) throw new AppError(403, 'No tienes acceso a este grupo');
    }

    await prisma.groupParticipant.upsert({
      where: { groupId_userId: { groupId, userId } },
      create: { groupId, userId },
      update: {},
    });

    chatEmitter.emit('group:participant:joined', { groupId, userId });
    return { ok: true };
  }

  async removeParticipant(groupId: string, userId: string, requesterId: string) {
    const group = await prisma.groupConversation.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new AppError(404, 'Grupo no encontrado');

    // Only the creator or the user themselves can remove
    if (requesterId !== group.createdBy && requesterId !== userId) {
      throw new AppError(403, 'No tienes permiso para remover este participante');
    }

    await prisma.groupParticipant.deleteMany({
      where: { groupId, userId },
    });

    chatEmitter.emit('group:participant:left', { groupId, userId });
    return { ok: true };
  }

  async getGroupConversations(userId: string) {
    const participations = await prisma.groupParticipant.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            participants: true,
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { group: { lastMessageAt: 'desc' } },
    });

    return participations.map((p: { group: object; unreadCount: number }) => ({
      ...p.group,
      unreadCount: p.unreadCount,
    }));
  }

  async getGroupConversation(groupId: string, userId: string) {
    const group = await prisma.groupConversation.findUnique({
      where: { id: groupId },
      include: {
        participants: true,
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!group) throw new AppError(404, 'Grupo no encontrado');

    const isParticipant = group.participants.some((p: { userId: string }) => p.userId === userId);
    if (!isParticipant) throw new AppError(403, 'No tienes acceso a este grupo');

    return group;
  }

  async getGroupByReference(params: { bookingId?: string; eventId?: string }) {
    if (params.bookingId) {
      return prisma.groupConversation.findUnique({
        where: { bookingId: params.bookingId },
        include: { participants: true },
      });
    }
    if (params.eventId) {
      return prisma.groupConversation.findUnique({
        where: { eventId: params.eventId },
        include: { participants: true },
      });
    }
    return null;
  }

  async sendGroupMessage(groupId: string, senderId: string, content: string, type = 'TEXT') {
    const group = await prisma.groupConversation.findUnique({
      where: { id: groupId },
      include: { participants: true },
    });

    if (!group) throw new AppError(404, 'Grupo no encontrado');
    if (group.status !== 'ACTIVE') throw new AppError(400, 'El grupo no está activo');

    const isParticipant = group.participants.some((p: { userId: string }) => p.userId === senderId);
    if (!isParticipant) throw new AppError(403, 'No eres participante de este grupo');

    const message = await prisma.groupMessage.create({
      data: { groupId, senderId, content, type: type as any, status: 'SENT' },
    });

    // Update group last message
    await prisma.groupConversation.update({
      where: { id: groupId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: content.slice(0, 100),
      },
    });

    // Increment unread for all other participants
    await prisma.groupParticipant.updateMany({
      where: { groupId, userId: { not: senderId } },
      data: { unreadCount: { increment: 1 } },
    });

    chatEmitter.emit('group:new_message', { groupId, message, senderIds: group.participants.map((p: { userId: string }) => p.userId) });

    return message;
  }

  async markGroupAsRead(groupId: string, userId: string) {
    const group = await prisma.groupConversation.findUnique({ where: { id: groupId } });
    if (!group) throw new AppError(404, 'Grupo no encontrado');

    await prisma.groupParticipant.updateMany({
      where: { groupId, userId },
      data: { unreadCount: 0 },
    });

    return { ok: true };
  }

  async getGroupUnreadCount(userId: string) {
    const result = await prisma.groupParticipant.aggregate({
      where: { userId },
      _sum: { unreadCount: true },
    });
    return result._sum.unreadCount ?? 0;
  }
}
