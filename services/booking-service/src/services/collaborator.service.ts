import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { chatClient } from '../clients/chat.client';
import { notificationsClient } from '../clients/notifications.client';
import { artistsClient } from '../clients/artists.client';

export class CollaboratorService {
  // ==================== INVITE ====================

  async inviteCollaborator(bookingId: string, leadArtistId: string, targetArtistId: string, role?: string, notes?: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { collaborators: true },
    });

    if (!booking) throw new AppError(404, 'Reserva no encontrada');
    if (booking.artistId !== leadArtistId) throw new AppError(403, 'Solo el artista principal puede invitar colaboradores');
    if (!['CONFIRMED', 'ANTICIPO_PAID'].includes(booking.status)) {
      throw new AppError(400, 'Solo puedes invitar colaboradores a reservas confirmadas');
    }
    if (targetArtistId === leadArtistId) {
      throw new AppError(400, 'No puedes invitarte a ti mismo');
    }

    const existing = booking.collaborators.find((c: any) => c.artistId === targetArtistId);
    if (existing && existing.status !== 'REJECTED' && existing.status !== 'CANCELLED') {
      throw new AppError(409, 'Este artista ya fue invitado');
    }

    const collaborator = await prisma.bookingCollaborator.upsert({
      where: { bookingId_artistId: { bookingId, artistId: targetArtistId } },
      create: {
        bookingId,
        artistId: targetArtistId,
        invitedBy: leadArtistId,
        role: role ?? null,
        notes: notes ?? null,
        status: 'INVITED',
        invitedAt: new Date(),
      },
      update: {
        status: 'INVITED',
        invitedBy: leadArtistId,
        role: role ?? null,
        notes: notes ?? null,
        invitedAt: new Date(),
        respondedAt: null,
      },
    });

    // Ensure a group conversation exists for this booking (lead + collaborator)
    const currentCollaboratorIds = booking.collaborators
      .filter((c: any) => c.status === 'ACCEPTED')
      .map((c: any) => c.artistId);

    await chatClient.createOrGetGroupConversation({
      bookingId,
      createdBy: leadArtistId,
      participantIds: [leadArtistId, ...currentCollaboratorIds],
      name: `Coordinación ${booking.code ?? bookingId}`,
    }).catch(err => logger.error('Error creando grupo al invitar', 'COLLABORATOR', err));

    // Notify the invited artist
    const inviteDate = booking.scheduledDate.toLocaleDateString('es-GT', { day: 'numeric', month: 'long' });
    await notificationsClient.sendNotification({
      userId: targetArtistId,
      type: 'COLLABORATION_INVITE',
      channel: 'IN_APP',
      title: 'Invitación de colaboración',
      message: `Te han invitado como ${role ?? 'colaborador'} para la reserva #${booking.code ?? bookingId} el ${inviteDate}.`,
      data: { bookingId, collaboratorId: collaborator.id, role },
      priority: 'normal',
    }).catch(err => logger.error('Error enviando notif de invitación', 'COLLABORATOR', err));

    logger.info(`Collaborator invited: ${targetArtistId} to booking ${bookingId}`, 'COLLABORATOR');
    return collaborator;
  }

  // ==================== RESPOND ====================

  async respondToInvitation(collaboratorId: string, artistId: string, accept: boolean) {
    const collaborator = await prisma.bookingCollaborator.findUnique({
      where: { id: collaboratorId },
      include: { booking: true },
    });

    if (!collaborator) throw new AppError(404, 'Invitación no encontrada');
    if (collaborator.artistId !== artistId) throw new AppError(403, 'No tienes permiso para responder esta invitación');
    if (collaborator.status !== 'INVITED') throw new AppError(400, 'Esta invitación ya fue respondida');

    const newStatus = accept ? 'ACCEPTED' : 'REJECTED';
    const updated = await prisma.bookingCollaborator.update({
      where: { id: collaboratorId },
      data: { status: newStatus, respondedAt: new Date() },
    });

    if (accept) {
      // Add collaborator to the booking's group conversation
      const groupResult = await chatClient.createOrGetGroupConversation({
        bookingId: collaborator.bookingId,
        createdBy: collaborator.invitedBy,
        participantIds: [collaborator.invitedBy, artistId],
        name: `Coordinación ${collaborator.booking.code ?? collaborator.bookingId}`,
      });

      if (groupResult?.group?.id) {
        await chatClient.addParticipantToGroup(groupResult.group.id, artistId)
          .catch(err => logger.error('Error añadiendo colaborador al grupo', 'COLLABORATOR', err));
      }
    }

    // Notify lead artist
    await notificationsClient.sendNotification({
      userId: collaborator.invitedBy,
      type: 'COLLABORATION_RESPONSE',
      channel: 'IN_APP',
      title: accept ? 'Invitación aceptada' : 'Invitación rechazada',
      message: accept
        ? `Un artista aceptó colaborar en la reserva #${collaborator.booking?.code ?? collaborator.bookingId}.`
        : `Un artista rechazó la invitación para la reserva #${collaborator.booking?.code ?? collaborator.bookingId}.`,
      data: { bookingId: collaborator.bookingId, collaboratorId, accepted: accept },
      priority: 'normal',
    }).catch(err => logger.error('Error notificando respuesta', 'COLLABORATOR', err));

    logger.info(`Collaborator ${artistId} ${newStatus} invitation ${collaboratorId}`, 'COLLABORATOR');
    return updated;
  }

  // ==================== CANCEL ====================

  async cancelCollaborator(bookingId: string, leadArtistId: string, targetArtistId: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new AppError(404, 'Reserva no encontrada');
    if (booking.artistId !== leadArtistId) throw new AppError(403, 'Solo el artista principal puede cancelar colaboradores');

    const updated = await prisma.bookingCollaborator.update({
      where: { bookingId_artistId: { bookingId, artistId: targetArtistId } },
      data: { status: 'CANCELLED', respondedAt: new Date() },
    });

    return updated;
  }

  // ==================== GET ====================

  async getBookingCollaborators(bookingId: string, requesterId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { collaborators: true },
    });

    if (!booking) throw new AppError(404, 'Reserva no encontrada');

    const isLead = booking.artistId === requesterId;
    const isClient = booking.clientId === requesterId;
    const isCollaborator = booking.collaborators.some((c: any) => c.artistId === requesterId);

    if (!isLead && !isClient && !isCollaborator) {
      throw new AppError(403, 'Sin acceso');
    }

    // Enrich with artist info
    const enriched = await Promise.all(
      booking.collaborators.map(async (c: any) => {
        const artistInfo = await artistsClient.getArtist(c.artistId).catch(() => null);
        return {
          ...c,
          artistName: (artistInfo as any)?.displayName ?? (artistInfo as any)?.name ?? c.artistId,
          artistAvatar: (artistInfo as any)?.profileImageUrl ?? null,
        };
      })
    );

    return enriched;
  }

  async getMyCollaborations(artistId: string) {
    const collaborators = await prisma.bookingCollaborator.findMany({
      where: { artistId },
      include: {
        booking: {
          select: {
            id: true,
            code: true,
            scheduledDate: true,
            location: true,
            status: true,
            artistId: true,
            clientId: true,
            totalPrice: true,
            currency: true,
          },
        },
      },
      orderBy: { invitedAt: 'desc' },
    });

    return collaborators;
  }
}

export const collaboratorService = new CollaboratorService();
