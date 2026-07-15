import { NextRequest, NextResponse } from 'next/server';

const ARTISTS_SERVICE_URL = process.env.ARTISTS_SERVICE_URL || 'http://artists-service:4003';
const PORTFOLIO_VIDEO_ENDPOINT = `${ARTISTS_SERVICE_URL}/artists/dashboard/me/portfolio-video`;

// POST /api/portafolio/video — sube un video al portafolio (multipart, campo `video`).
// A diferencia de las fotos (subir → url → POST item), esto es de un solo paso: solo
// el servidor conoce la duración/publicId/poster, así que devuelve el item ya creado.
export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  try {
    const incoming = await request.formData();
    const file = incoming.get('video') as File | null;
    if (!file) return NextResponse.json({ message: 'No se encontró el video' }, { status: 400 });

    const title = incoming.get('title');

    // Reserializar como Blob para que Node fetch mande Content-Length correcto
    // (adjuntar un File crudo puede omitirlo y romper busboy en el backend).
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type || 'video/mp4' });

    const outgoing = new FormData();
    outgoing.append('video', blob, file.name || 'portfolio.mp4');
    if (typeof title === 'string' && title.trim()) outgoing.append('title', title.trim());

    const res = await fetch(PORTFOLIO_VIDEO_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: outgoing,
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      // Un 413 del reverse-proxy llega como HTML, no JSON.
      console.error('[portafolio/video] Backend returned non-JSON:', res.status, text.slice(0, 200));
      return NextResponse.json(
        {
          message:
            res.status === 413
              ? 'El video es demasiado grande.'
              : `Error del servidor (${res.status})`,
        },
        { status: res.status >= 400 ? res.status : 500 }
      );
    }
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error('[portafolio/video] Proxy error:', err?.message ?? err);
    return NextResponse.json({ message: 'Error interno', detail: err?.message }, { status: 500 });
  }
}
