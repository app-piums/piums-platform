export interface ReceiptData {
  bookingId: string;
  bookingCode?: string;
  status: string;
  serviceName: string;
  artistName: string;
  clientName: string;
  clientEmail?: string;
  scheduledDate?: string;
  durationMinutes?: number;
  location?: string;
  totalPrice: number;      // in cents
  anticipoAmount?: number; // in cents
  currency?: string;
  notes?: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  confirmed:         { label: 'Confirmada',      color: '#16a34a' },
  completed:         { label: 'Completada',      color: '#2563eb' },
  pending:           { label: 'Pendiente',       color: '#d97706' },
  cancelled:         { label: 'Cancelada',       color: '#dc2626' },
  payment_completed: { label: 'Pago completo',   color: '#16a34a' },
  anticipo_paid:     { label: 'Anticipo pagado', color: '#16a34a' },
  in_progress:       { label: 'En curso',        color: '#2563eb' },
};

function fmt(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(cents / 100);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function generateBookingReceipt(data: ReceiptData, mode: 'print' | 'preview' = 'print') {
  const code = data.bookingCode || data.bookingId.slice(0, 8).toUpperCase();
  const rawStatus = data.status?.toLowerCase();
  const statusInfo = STATUS_LABELS[rawStatus] ?? { label: data.status, color: '#6b7280' };
  const total = fmt(data.totalPrice);
  const anticipo = data.anticipoAmount ? fmt(data.anticipoAmount) : null;
  const base = anticipo ? fmt(data.totalPrice - data.anticipoAmount!) : null;
  const dateStr = data.scheduledDate ? fmtDate(data.scheduledDate) : null;
  const timeStr = data.scheduledDate ? fmtTime(data.scheduledDate) : null;
  const duration = data.durationMinutes
    ? (data.durationMinutes >= 60
        ? `${Math.floor(data.durationMinutes / 60)}h${data.durationMinutes % 60 ? ` ${data.durationMinutes % 60}min` : ''}`
        : `${data.durationMinutes} min`)
    : null;
  const issuedAt = new Date().toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' });

  const IOS_URL     = process.env.NEXT_PUBLIC_ARTIST_APP_IOS     || 'https://apps.apple.com/app/piums-artista';
  const ANDROID_URL = process.env.NEXT_PUBLIC_ARTIST_APP_ANDROID || 'https://play.google.com/store/apps/details?id=io.piums.artista';
  const LOGO_URL    = (typeof window !== 'undefined' ? window.location.origin : 'https://artist.piums.io') + '/logo.png';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Recibo de Reserva — ${code}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; color: #111; }
    .page { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.10); }

    .header { background: linear-gradient(135deg, #FF6B35 0%, #e85d2c 100%); padding: 24px 32px; display: flex; align-items: center; justify-content: space-between; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .receipt-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(255,255,255,.75); }

    .code-strip { background: #1a1a1a; padding: 14px 32px; display: flex; align-items: center; justify-content: space-between; }
    .booking-code { font-size: 17px; font-weight: 700; color: #fff; font-family: 'Courier New', monospace; letter-spacing: 2px; }
    .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 100px; background: rgba(255,255,255,.1); font-size: 12px; font-weight: 600; color: #fff; }
    .status-dot { width: 7px; height: 7px; border-radius: 50%; }

    .section { padding: 20px 32px; border-bottom: 1px solid #f0f0f0; }
    .section:last-of-type { border-bottom: none; }
    .section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #9ca3af; margin-bottom: 12px; }

    .service-name { font-size: 17px; font-weight: 700; color: #111; margin-bottom: 4px; }
    .artist-row { font-size: 14px; color: #6b7280; font-weight: 500; }
    .artist-row strong { color: #FF6B35; }

    .detail-row { display: flex; align-items: flex-start; gap: 10px; padding: 7px 0; font-size: 14px; color: #374151; }
    .detail-icon { width: 18px; flex-shrink: 0; margin-top: 2px; }
    .detail-text { flex: 1; line-height: 1.5; }
    .detail-text strong { display: block; font-weight: 600; color: #111; }
    .detail-text span { color: #6b7280; font-size: 13px; }

    .price-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 14px; color: #374151; }
    .price-row.sub { color: #9ca3af; font-size: 13px; }
    .price-divider { height: 1px; background: #f0f0f0; margin: 8px 0; }
    .price-row.total { font-size: 16px; font-weight: 700; color: #111; padding-top: 10px; }
    .price-row.total .amount { color: #FF6B35; font-size: 18px; }

    .issuer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .issuer-field label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .8px; color: #9ca3af; margin-bottom: 3px; display: block; }
    .issuer-field p { font-size: 14px; font-weight: 500; color: #111; }

    .app-section { background: #fafafa; padding: 20px 32px; text-align: center; }
    .app-section-title { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 14px; }
    .app-badges { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
    .badge { display: inline-flex; align-items: center; gap: 8px; padding: 9px 16px; background: #111; border-radius: 10px; text-decoration: none; color: #fff; }
    .badge:hover { opacity: .85; }
    .badge-text { text-align: left; }
    .badge-text .sub { font-size: 9px; color: rgba(255,255,255,.6); text-transform: uppercase; letter-spacing: .5px; display: block; }
    .badge-text .main { font-size: 13px; font-weight: 600; display: block; line-height: 1.2; }

    .footer { padding: 14px 32px; background: #FF6B35; text-align: center; }
    .footer p { font-size: 11px; color: rgba(255,255,255,.85); line-height: 1.6; }
    .footer strong { color: #fff; font-weight: 600; }

    @media print {
      body { background: #fff; }
      .page { box-shadow: none; border-radius: 0; margin: 0; max-width: 100%; }
    }
    @page { margin: 10mm; }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="brand">
      <img src="${LOGO_URL}" alt="Piums" style="height:44px;width:auto;object-fit:contain;" />
    </div>
    <div class="receipt-label">Recibo de Reserva</div>
  </div>

  <!-- Code strip -->
  <div class="code-strip">
    <div class="booking-code"># ${code}</div>
    <div class="status-badge">
      <span class="status-dot" style="background:${statusInfo.color}"></span>
      ${statusInfo.label}
    </div>
  </div>

  <!-- Service -->
  <div class="section">
    <div class="section-label">Servicio</div>
    <div class="service-name">${data.serviceName}</div>
    <div class="artist-row">Artista: <strong>${data.artistName}</strong></div>
  </div>

  ${dateStr || data.location ? `
  <!-- Event details -->
  <div class="section">
    <div class="section-label">Detalles del Evento</div>
    ${dateStr ? `
    <div class="detail-row">
      <div class="detail-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      <div class="detail-text">
        <strong>${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}</strong>
        <span>${timeStr}${duration ? ` · ${duration}` : ''}</span>
      </div>
    </div>` : ''}
    ${data.location ? `
    <div class="detail-row">
      <div class="detail-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
      <div class="detail-text">
        <strong>${data.location}</strong>
      </div>
    </div>` : ''}
  </div>` : ''}

  <!-- Payment -->
  <div class="section">
    <div class="section-label">Desglose de Pago</div>
    ${base && anticipo ? `
    <div class="price-row sub"><span>Servicio base</span><span>${base}</span></div>
    <div class="price-row sub"><span>Anticipo pagado</span><span>${anticipo}</span></div>
    <div class="price-divider"></div>` : ''}
    <div class="price-row total"><span>Total</span><span class="amount">${total}</span></div>
  </div>

  <!-- Issued to -->
  <div class="section">
    <div class="section-label">Emitido a</div>
    <div class="issuer-grid">
      <div class="issuer-field"><label>Cliente</label><p>${data.clientName}</p></div>
      ${data.clientEmail ? `<div class="issuer-field"><label>Correo</label><p>${data.clientEmail}</p></div>` : ''}
      <div class="issuer-field"><label>Fecha de emisión</label><p>${issuedAt}</p></div>
      <div class="issuer-field"><label>Referencia</label><p style="font-family:monospace;font-size:12px">${data.bookingId}</p></div>
    </div>
  </div>

  <!-- App download -->
  <div class="app-section">
    <p class="app-section-title">Gestiona tus reservas desde la app Piums Artista</p>
    <div class="app-badges">
      <a href="${IOS_URL}" class="badge">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
        <span class="badge-text"><span class="sub">Disponible en</span><span class="main">App Store</span></span>
      </a>
      <a href="${ANDROID_URL}" class="badge">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M3.18 23.76c.3.17.64.19.96.07l11.37-6.57-2.39-2.39-9.94 8.89zm-1.76-20.1C1.16 3.96 1 4.34 1 4.8v14.4c0 .46.16.84.42 1.14l.06.06 8.07-8.07v-.19L1.42 3.6l-.06.06zm17.16 8.67l-2.3-1.33-2.67 2.67 2.67 2.67 2.31-1.33c.66-.38.66-1.01 0-1.68h-.01zm-15.4 9.28L14.55 13l-2.39-2.39L3.18 2.24C2.86 2.12 2.52 2.14 2.22 2.31c-.61.35-.61 1.31 0 1.68l.14.08L14.55 12 2.36 20.43l-.14.08c-.61.37-.61 1.33 0 1.68.3.17.64.19.96.07l-.14-.08.14.08z"/></svg>
        <span class="badge-text"><span class="sub">Disponible en</span><span class="main">Google Play</span></span>
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p><strong>piums.io</strong> — Conectando talento con los momentos que importan.<br/>
    Este documento es un comprobante de reserva, no es una factura fiscal.</p>
  </div>

</div>
${mode === 'print' ? '<script>window.onload = function() { window.print(); };</script>' : ''}
</body>
</html>`;

  const win = window.open('', '_blank', 'width=640,height=900');
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
