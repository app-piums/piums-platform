import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const reviewTemplates = [
  // REVIEW_RECEIVED - Artist receives a new review (EMAIL)
  {
    key: 'review_received_email',
    name: 'Review Recibido - Email',
    type: 'REVIEW_RECEIVED',
    title: 'Has recibido una nueva reseña',
    message: 'Has recibido una reseña de {{rating}} estrellas de {{clientName}}.',
    emailSubject: '⭐ Has recibido una nueva reseña',
    emailHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">¡Has recibido una nueva reseña!</h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 24px; color: #ffc107;">⭐</span>
            <span style="font-size: 20px; font-weight: bold; margin-left: 10px;">{{rating}}/5</span>
          </div>
          
          {{#if comment}}
          <p style="color: #555; line-height: 1.6; margin: 15px 0;">
            "{{comment}}"
          </p>
          {{/if}}
          
          <p style="color: #888; font-size: 14px; margin-top: 15px;">
            De: {{clientName}}
          </p>
        </div>
        
        <p style="color: #555; line-height: 1.6;">
          Un cliente ha dejado una reseña sobre tu servicio. Las reseñas son muy importantes 
          para construir confianza con nuevos clientes.
        </p>
        
        <p style="color: #555; line-height: 1.6; margin-top: 20px;">
          <strong>💡 Tip:</strong> Responder a las reseñas demuestra que valoras la opinión de 
          tus clientes y puede mejorar tu reputación.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{dashboardUrl}}/reviews" 
             style="background-color: #007bff; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Ver Reseña y Responder
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #888; font-size: 12px; text-align: center;">
            Este es un mensaje automático de Piums Platform. No respondas a este correo.
          </p>
        </div>
      </div>
    `,
    variables: ['rating', 'comment', 'clientName', 'dashboardUrl'],
    category: 'review'
  },
  // REVIEW_RECEIVED - Artist receives a new review (IN_APP/SMS - shared template)
  {
    key: 'review_received_notification',
    name: 'Review Recibido - Notificación',
    type: 'REVIEW_RECEIVED',
    title: 'Nueva reseña recibida',
    message: 'Has recibido una reseña de {{rating}} estrellas de {{clientName}}. {{#if comment}}"{{comment}}"{{/if}}',
    emailSubject: null,
    emailHtml: null,
    variables: ['rating', 'comment', 'clientName'],
    category: 'review'
  },

  // REVIEW_RESPONSE - Client receives artist response (EMAIL)
  {
    key: 'review_response_email',
    name: 'Respuesta a Review - Email',
    type: 'REVIEW_RESPONSE',
    title: 'El artista ha respondido a tu reseña',
    message: '{{artistName}} ha respondido a tu reseña.',
    emailSubject: '💬 El artista ha respondido a tu reseña',
    emailHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">El artista ha respondido a tu reseña</h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <div style="margin-bottom: 20px;">
            <p style="color: #888; font-size: 14px; margin-bottom: 10px;">
              Tu reseña:
            </p>
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <span style="font-size: 20px; color: #ffc107;">⭐</span>
              <span style="font-size: 18px; font-weight: bold; margin-left: 10px;">{{rating}}/5</span>
            </div>
            {{#if comment}}
            <p style="color: #555; line-height: 1.6; font-style: italic;">
              "{{comment}}"
            </p>
            {{/if}}
          </div>
          
          <div style="border-top: 2px solid #007bff; padding-top: 20px; margin-top: 20px;">
            <p style="color: #888; font-size: 14px; margin-bottom: 10px;">
              Respuesta de {{artistName}}:
            </p>
            <p style="color: #333; line-height: 1.6;">
              "{{responseMessage}}"
            </p>
          </div>
        </div>
        
        <p style="color: #555; line-height: 1.6;">
          {{artistName}} ha tomado el tiempo de responder a tu reseña. 
          Esto demuestra su compromiso con la satisfacción del cliente.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{dashboardUrl}}/reviews" 
             style="background-color: #007bff; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Ver Conversación Completa
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #888; font-size: 12px; text-align: center;">
            Este es un mensaje automático de Piums Platform. No respondas a este correo.
          </p>
        </div>
      </div>
    `,
    variables: ['rating', 'comment', 'artistName', 'responseMessage', 'dashboardUrl'],
    category: 'review'
  },
  // REVIEW_RESPONSE - Client receives artist response (IN_APP/SMS - shared template)
  {
    key: 'review_response_notification',
    name: 'Respuesta a Review - Notificación',
    type: 'REVIEW_RESPONSE',
    title: 'Artista respondió a tu reseña',
    message: '{{artistName}} ha respondido a tu reseña: "{{responseMessage}}"',
    emailSubject: null,
    emailHtml: null,
    variables: ['artistName', 'responseMessage', 'dashboardUrl'],
    category: 'review'
  }
];

async function main() {
  console.log('🔄 Creando plantillas de notificaciones para reviews...\n');

  for (const template of reviewTemplates) {
    try {
      // Check if template already exists
      const existing = await prisma.notificationTemplate.findUnique({
        where: {
          key: template.key
        }
      });

      if (existing) {
        // Update existing template
        await prisma.notificationTemplate.update({
          where: { id: existing.id },
          data: {
            name: template.name,
            title: template.title,
            message: template.message,
            emailSubject: template.emailSubject,
            emailHtml: template.emailHtml,
            variables: template.variables,
            category: template.category
          }
        });
        console.log(`✅ Actualizada: ${template.key}`);
      } else {
        // Create new template
        await prisma.notificationTemplate.create({
          data: template
        });
        console.log(`✅ Creada: ${template.key}`);
      }
    } catch (error) {
      console.error(`❌ Error con ${template.key}:`, error);
    }
  }

  console.log('\n✅ Plantillas de reviews creadas exitosamente!');
  console.log('\nPlantillas creadas:');
  console.log('  - review_received_email (REVIEW_RECEIVED - EMAIL)');
  console.log('  - review_received_notification (REVIEW_RECEIVED - IN_APP/SMS)');
  console.log('  - review_response_email (REVIEW_RESPONSE - EMAIL)');
  console.log('  - review_response_notification (REVIEW_RESPONSE - IN_APP/SMS)');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
