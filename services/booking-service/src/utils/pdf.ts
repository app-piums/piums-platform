import PDFDocument from 'pdfkit';
import { Booking } from '@prisma/client';

interface PDFBookingData extends Booking {
  artistName?: string;
  artistCategory?: string;
  clientName?: string;
  serviceName?: string;
}

/**
 * Genera un PDF con los detalles de la reserva
 */
export function generateBookingPDF(booking: PDFBookingData): PDFKit.PDFDocument {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
  });

  // Colores
  const primaryColor = '#667eea';
  const secondaryColor = '#764ba2';
  const textColor = '#333333';
  const lightColor = '#666666';

  // Header con gradiente simulado
  doc
    .fillColor(primaryColor)
    .rect(0, 0, doc.page.width, 150)
    .fill();

  // Logo/Título
  doc
    .fontSize(32)
    .fillColor('white')
    .font('Helvetica-Bold')
    .text('PIUMS PLATFORM', 50, 40);

  doc
    .fontSize(20)
    .font('Helvetica')
    .text('Confirmación de Reserva', 50, 80);

  // Success Icon (simulado con texto)
  doc
    .fontSize(50)
    .text('✓', doc.page.width - 100, 50, { align: 'right' });

  // Código de Reserva
  doc
    .fontSize(12)
    .fillColor(textColor)
    .font('Helvetica')
    .text('Código de Reserva:', 50, 180, { align: 'center' });

  doc
    .fontSize(24)
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .text(booking.code || `PIU-${booking.id.slice(0, 8).toUpperCase()}`, 50, 200, { align: 'center' });

  // Línea separadora
  doc
    .moveTo(50, 250)
    .lineTo(doc.page.width - 50, 250)
    .strokeColor('#e0e0e0')
    .stroke();

  // Información del Cliente y Artista
  let yPos = 280;

  // Cliente
  doc
    .fontSize(14)
    .fillColor(textColor)
    .font('Helvetica-Bold')
    .text('Cliente:', 50, yPos);

  doc
    .fontSize(12)
    .font('Helvetica')
    .fillColor(lightColor)
    .text(booking.clientName || 'N/A', 150, yPos);

  yPos += 30;

  // Artista
  doc
    .fontSize(14)
    .fillColor(textColor)
    .font('Helvetica-Bold')
    .text('Artista:', 50, yPos);

  doc
    .fontSize(12)
    .font('Helvetica')
    .fillColor(lightColor)
    .text(booking.artistName || 'N/A', 150, yPos);

  doc
    .fontSize(10)
    .fillColor('#999999')
    .text(booking.artistCategory || '', 150, yPos + 15);

  yPos += 50;

  // Box con detalles del servicio
  doc
    .roundedRect(50, yPos, doc.page.width - 100, 180, 5)
    .fillAndStroke('#f8f9fa', '#e0e0e0');

  yPos += 20;

  // Servicio
  doc
    .fontSize(11)
    .fillColor(lightColor)
    .font('Helvetica-Bold')
    .text('SERVICIO', 70, yPos);

  doc
    .fontSize(13)
    .fillColor(textColor)
    .font('Helvetica')
    .text(booking.serviceName || 'N/A', 70, yPos + 18);

  yPos += 50;

  // Fecha y Hora
  doc
    .fontSize(11)
    .fillColor(lightColor)
    .font('Helvetica-Bold')
    .text('FECHA Y HORA', 70, yPos);

  const dateStr = booking.scheduledDate.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = booking.scheduledDate.toLocaleTimeString('es-MX', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  doc
    .fontSize(13)
    .fillColor(textColor)
    .font('Helvetica')
    .text(`${dateStr} a las ${timeStr}`, 70, yPos + 18);

  yPos += 50;

  // Duración y Ubicación
  const hours = Math.floor(booking.durationMinutes / 60);
  const minutes = booking.durationMinutes % 60;
  const durationStr = hours > 0 
    ? `${hours} hora${hours > 1 ? 's' : ''}${minutes > 0 ? ` y ${minutes} min` : ''}`
    : `${minutes} minutos`;

  doc
    .fontSize(11)
    .fillColor(lightColor)
    .font('Helvetica-Bold')
    .text('DURACIÓN', 70, yPos)
    .text('UBICACIÓN', 300, yPos);

  doc
    .fontSize(13)
    .fillColor(textColor)
    .font('Helvetica')
    .text(durationStr, 70, yPos + 18)
    .text(booking.location || 'N/A', 300, yPos + 18, { width: 200 });

  yPos += 80;

  // Línea separadora
  doc
    .moveTo(50, yPos)
    .lineTo(doc.page.width - 50, yPos)
    .strokeColor('#e0e0e0')
    .stroke();

  yPos += 30;

  // Resumen de Precios
  doc
    .fontSize(14)
    .fillColor(textColor)
    .font('Helvetica-Bold')
    .text('Resumen de Pago', 50, yPos);

  yPos += 30;

  // Precio del servicio
  doc
    .fontSize(12)
    .fillColor(lightColor)
    .font('Helvetica')
    .text('Precio del servicio:', 50, yPos);

  doc
    .fillColor(textColor)
    .text(
      `$${(booking.servicePrice / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${booking.currency}`,
      doc.page.width - 200,
      yPos,
      { align: 'right' }
    );

  yPos += 25;

  // Extras (si hay)
  if (booking.addonsPrice > 0) {
    doc
      .fontSize(12)
      .fillColor(lightColor)
      .font('Helvetica')
      .text('Extras:', 50, yPos);

    doc
      .fillColor(textColor)
      .text(
        `$${(booking.addonsPrice / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${booking.currency}`,
        doc.page.width - 200,
        yPos,
        { align: 'right' }
      );

    yPos += 25;
  }

  // Línea antes del total
  doc
    .moveTo(50, yPos)
    .lineTo(doc.page.width - 50, yPos)
    .strokeColor('#e0e0e0')
    .lineWidth(2)
    .stroke();

  yPos += 15;

  // Total
  doc
    .fontSize(16)
    .fillColor(textColor)
    .font('Helvetica-Bold')
    .text('TOTAL:', 50, yPos);

  doc
    .fontSize(20)
    .fillColor(primaryColor)
    .text(
      `$${(booking.totalPrice / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${booking.currency}`,
      doc.page.width - 200,
      yPos,
      { align: 'right' }
    );

  yPos += 40;

  // Depósito (si aplica)
  if (booking.depositRequired && booking.depositAmount) {
    doc
      .roundedRect(50, yPos, doc.page.width - 100, 40, 5)
      .fillAndStroke('#fff9e6', '#ffd966');

    doc
      .fontSize(11)
      .fillColor('#92400e')
      .font('Helvetica')
      .text(
        `⚠️ Se requiere un depósito de $${(booking.depositAmount / 100).toLocaleString('es-MX')} ${booking.currency}`,
        70,
        yPos + 12,
        { width: doc.page.width - 140 }
      );

    yPos += 60;
  }

  // Estado de la reserva
  yPos += 20;

  doc
    .fontSize(12)
    .fillColor(lightColor)
    .font('Helvetica-Bold')
    .text('Estado de la Reserva:', 50, yPos);

  const statusColors: Record<string, string> = {
    PENDING: '#f59e0b',
    CONFIRMED: '#10b981',
    IN_PROGRESS: '#3b82f6',
    COMPLETED: '#059669',
    CANCELLED_CLIENT: '#ef4444',
    CANCELLED_ARTIST: '#ef4444',
    NO_SHOW: '#991b1b',
  };

  doc
    .fontSize(12)
    .fillColor(statusColors[booking.status] || '#666666')
    .font('Helvetica-Bold')
    .text(booking.status.replace(/_/g, ' '), 200, yPos);

  // Notas del cliente (si hay)
  if (booking.clientNotes) {
    yPos += 40;

    doc
      .fontSize(12)
      .fillColor(lightColor)
      .font('Helvetica-Bold')
      .text('Notas:', 50, yPos);

    yPos += 20;

    doc
      .fontSize(10)
      .fillColor(textColor)
      .font('Helvetica')
      .text(booking.clientNotes, 50, yPos, {
        width: doc.page.width - 100,
        align: 'justify',
      });
  }

  // Footer
  const footerY = doc.page.height - 80;

  doc
    .moveTo(50, footerY)
    .lineTo(doc.page.width - 50, footerY)
    .strokeColor('#e0e0e0')
    .stroke();

  doc
    .fontSize(8)
    .fillColor('#999999')
    .font('Helvetica')
    .text('© 2026 Piums Platform. Todos los derechos reservados.', 50, footerY + 15, {
      align: 'center',
      width: doc.page.width - 100,
    });

  doc
    .fontSize(8)
    .text(`Documento generado el ${new Date().toLocaleString('es-MX')}`, 50, footerY + 30, {
      align: 'center',
      width: doc.page.width - 100,
    });

  doc
    .fontSize(8)
    .text(`ID de Reserva: ${booking.id}`, 50, footerY + 45, {
      align: 'center',
      width: doc.page.width - 100,
    });

  return doc;
}
