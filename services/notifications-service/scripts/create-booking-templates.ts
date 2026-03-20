/**
 * Script para crear templates de notificaciones de booking
 * Ejecutar con: pnpm tsx scripts/create-booking-templates.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const templates = [
  {
    key: 'booking_created_client',
    name: 'Reserva Creada - Cliente',
    description: 'Notificación enviada al cliente cuando crea una reserva',
    type: 'BOOKING_CREATED',
    title: 'Reserva Creada',
    message: 'Hola {{clientName}}, tu reserva para {{serviceName}} el {{bookingDate}} ha sido creada.',
    emailSubject: 'Confirmación de Reserva',
    variables: ['clientName', 'serviceName', 'bookingDate'],
    priority: 'high',
    category: 'booking',
  },
  {
    key: 'booking_created_artist',
    name: 'Reserva Creada - Artista',
    description: 'Notificación enviada al artista cuando recibe una nueva reserva',
    type: 'BOOKING_CREATED',
    title: 'Nueva Reserva',
    message: 'Hola {{artistName}}, tienes una nueva reserva de {{clientName}} para {{serviceName}}.',
    emailSubject: 'Nueva Reserva',
    variables: ['artistName', 'clientName', 'serviceName'],
    priority: 'high',
    category: 'booking',
  },
  {
    key: 'booking_confirmed',
    name: 'Reserva Confirmada',
    description: 'Notificación enviada al cliente cuando el artista confirma la reserva',
    type: 'BOOKING_CONFIRMED',
    title: 'Reserva Confirmada',
    message: 'Tu reserva con {{artistName}} ha sido confirmada.',
    emailSubject: 'Reserva Confirmada',
    variables: ['artistName'],
    priority: 'high',
    category: 'booking',
  },
  {
    key: 'booking_rejected',
    name: 'Reserva Rechazada',
    description: 'Notificación enviada al cliente cuando el artista rechaza la reserva',
    type: 'BOOKING_REJECTED',
    title: 'Reserva Rechazada',
    message: 'Lo sentimos, tu reserva ha sido rechazada.',
    emailSubject: 'Reserva No Disponible',
    variables: ['artistName', 'reason'],
    priority: 'high',
    category: 'booking',
  },
  {
    key: 'booking_cancelled',
    name: 'Reserva Cancelada',
    description: 'Notificación enviada cuando se cancela una reserva',
    type: 'BOOKING_CANCELLED',
    title: 'Reserva Cancelada',
    message: 'La reserva ha sido cancelada.',
    emailSubject: 'Reserva Cancelada',
    variables: ['reason'],
    priority: 'normal',
    category: 'booking',
  },
  {
    key: 'booking_reminder_24h',
    name: 'Recordatorio 24 Horas',
    description: 'Recordatorio enviado 24 horas antes de la cita',
    type: 'BOOKING_REMINDER_24H',
    title: 'Recordatorio: Tu cita es mañana',
    message: 'Tu cita con {{artistName}} es mañana.',
    emailSubject: 'Recordatorio: Tu cita es mañana',
    variables: ['artistName', 'serviceName'],
    priority: 'normal',
    category: 'booking',
  },
  {
    key: 'booking_reminder_2h',
    name: 'Recordatorio 2 Horas',
    description: 'Recordatorio enviado 2 horas antes de la cita',
    type: 'BOOKING_REMINDER_2H',
    title: 'Recordatorio: Tu cita es en 2 horas',
    message: 'Tu cita con {{artistName}} es en 2 horas.',
    emailSubject: 'Tu cita es en 2 horas',
    variables: ['artistName', 'location'],
    priority: 'high',
    category: 'booking',
  },
  {
    key: 'booking_completed',
    name: 'Reserva Completada',
    description: 'Notificación enviada cuando se completa la cita',
    type: 'BOOKING_COMPLETED',
    title: 'Gracias por tu visita',
    message: 'Esperamos que hayas disfrutado tu experiencia.',
    emailSubject: 'Gracias por tu visita',
    variables: ['artistName'],
    priority: 'normal',
    category: 'booking',
  },
];

async function seedTemplates() {
  console.log('🌱 Seeding booking notification templates...\n');

  for (const template of templates) {
    try {
      const result = await prisma.notificationTemplate.upsert({
        where: { key: template.key },
        update: template,
        create: template,
      });

      console.log(`✅ ${result.name} (${result.key})`);
    } catch (error: any) {
      console.error(`❌ Error creating ${template.key}:`, error.message);
    }
  }

  console.log('\n✨ Templates seeded successfully!\n');
}

seedTemplates()
  .catch((error) => {
    console.error('Error seeding templates:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
