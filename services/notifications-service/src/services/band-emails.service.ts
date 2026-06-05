import { emailProvider } from '../providers/email.provider';
import { logger } from '../utils/logger';

const ARTIST_APP_URL = process.env.ARTIST_APP_URL || 'https://artist.piums.io';

export async function sendBandInvitationEmail(data: {
  invitedArtistEmail: string;
  invitedArtistName: string;
  bandName: string;
  inviterName: string;
  role?: string;
  inviteMessage?: string;
}) {
  try {
    const bandUrl = `${ARTIST_APP_URL}/artist/my-band`;
    const roleBlock = data.role
      ? `<div class="detail-row"><div class="detail-label">Instrumento / Rol</div><div class="detail-value">${data.role}</div></div>`
      : '';
    const msgBlock = data.inviteMessage
      ? `<div class="notes-box"><p>Mensaje de ${data.inviterName}:</p><div>${data.inviteMessage}</div></div>`
      : '';

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitación a banda</title>
  <style>
    body { margin:0; padding:0; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; background:#f4f4f4; color:#333; }
    .container { max-width:600px; margin:0 auto; background:#fff; }
    .header { background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%); padding:40px 30px; text-align:center; }
    .header h1 { color:#fff; margin:0; font-size:28px; font-weight:600; }
    .content { padding:40px 30px; }
    .band-badge { text-align:center; margin-bottom:24px; }
    .band-badge .icon { font-size:56px; line-height:1; }
    .band-name { text-align:center; font-size:22px; font-weight:700; color:#d97706; margin:0 0 24px; }
    .greeting { font-size:16px; line-height:1.7; color:#555; margin-bottom:28px; }
    .details-box { background:#f8f9fa; border-radius:8px; padding:24px; margin-bottom:24px; }
    .detail-row { margin-bottom:14px; }
    .detail-row:last-child { margin-bottom:0; }
    .detail-label { font-weight:600; color:#333; font-size:13px; margin-bottom:4px; }
    .detail-value { color:#666; font-size:15px; }
    .notes-box { background:#fffbeb; border-left:4px solid #f59e0b; padding:14px 18px; border-radius:4px; margin-bottom:24px; }
    .notes-box p { margin:0 0 6px; font-weight:600; color:#92400e; font-size:13px; }
    .notes-box div { color:#78350f; font-size:14px; line-height:1.6; }
    .cta { text-align:center; margin:32px 0 16px; }
    .btn { display:inline-block; background:linear-gradient(135deg,#f59e0b,#d97706); color:#fff !important; text-decoration:none; padding:14px 36px; border-radius:8px; font-weight:700; font-size:16px; }
    .footer { background:#f8f9fa; padding:28px 30px; text-align:center; color:#888; font-size:12px; line-height:1.6; }
    .footer a { color:#d97706; text-decoration:none; }
    @media (max-width:600px) { .content { padding:28px 18px; } .header h1 { font-size:22px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Te invitaron a una banda</h1></div>
    <div class="content">
      <div class="band-badge"><div class="icon">🎸</div></div>
      <div class="band-name">${data.bandName}</div>
      <p class="greeting">
        Hola <strong>${data.invitedArtistName}</strong>,<br><br>
        <strong>${data.inviterName}</strong> te ha invitado a unirte a la banda
        <strong>${data.bandName}</strong> en Piums. Abre la app para ver los detalles
        y aceptar o rechazar la invitación.
      </p>
      <div class="details-box">
        <div class="detail-row">
          <div class="detail-label">Banda</div>
          <div class="detail-value">${data.bandName}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Invitado por</div>
          <div class="detail-value">${data.inviterName}</div>
        </div>
        ${roleBlock}
      </div>
      ${msgBlock}
      <div class="cta">
        <a href="${bandUrl}" class="btn">Ver invitación en Piums</a>
      </div>
      <p style="font-size:13px;color:#999;text-align:center;margin-top:20px;">
        Si no conoces a ${data.inviterName} o no esperabas esta invitación, puedes ignorar este correo.
      </p>
    </div>
    <div class="footer">
      &copy; 2026 Piums Platform. Todos los derechos reservados.<br>
      <a href="${bandUrl}">Abrir Piums</a> &bull; <a href="mailto:soporte@piums.io">Soporte</a>
    </div>
  </div>
</body>
</html>`;

    await emailProvider.sendEmail({
      to: data.invitedArtistEmail,
      subject: `${data.inviterName} te invitó a unirte a ${data.bandName}`,
      html,
    });

    logger.info('Band invitation email sent', 'BAND_EMAIL', {
      to: data.invitedArtistEmail,
      bandName: data.bandName,
    });
  } catch (error) {
    logger.error('Failed to send band invitation email', 'BAND_EMAIL', error);
    throw error;
  }
}
