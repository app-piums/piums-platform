import { NextRequest, NextResponse } from 'next/server';

const ARTISTS_SERVICE_URL = process.env.ARTISTS_SERVICE_URL || 'http://artists-service:4003';
const STORY_ENDPOINT = `${ARTISTS_SERVICE_URL}/artists/dashboard/me/story-video`;

// GET /api/story-video — estado actual del video presentación del artista autenticado
export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  try {
    const res = await fetch(`${ARTISTS_SERVICE_URL}/artists/dashboard/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return NextResponse.json({ message: 'Artista no encontrado' }, { status: res.status });
    const data = await res.json();
    const a = data?.artist ?? data;
    return NextResponse.json({
      storyVideo: a?.storyVideo ?? null,
      storyVideoPosterUrl: a?.storyVideoPosterUrl ?? null,
      storyVideoDurationMs: a?.storyVideoDurationMs ?? null,
    });
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}

// POST /api/story-video — sube (o reemplaza) el video presentación (multipart, campo `video`)
export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  try {
    const incoming = await request.formData();
    const file = incoming.get('video') as File | null;
    if (!file) return NextResponse.json({ message: 'No se encontró el video' }, { status: 400 });

    // Reserializar como Blob para que Node fetch mande Content-Length correcto
    // (adjuntar un File crudo puede omitirlo y romper busboy en el backend).
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type || 'video/mp4' });

    const outgoing = new FormData();
    outgoing.append('video', blob, file.name || 'story.mp4');

    const res = await fetch(STORY_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: outgoing,
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('[story-video] Backend returned non-JSON:', res.status, text.slice(0, 200));
      return NextResponse.json(
        { message: `Error del servidor (${res.status})` },
        { status: res.status >= 400 ? res.status : 500 }
      );
    }
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error('[story-video] Proxy error:', err?.message ?? err);
    return NextResponse.json({ message: 'Error interno', detail: err?.message }, { status: 500 });
  }
}

// DELETE /api/story-video — elimina el video presentación
export async function DELETE(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  try {
    const res = await fetch(STORY_ENDPOINT, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const text = await res.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = { message: text }; }
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error('[story-video] Proxy error:', err?.message ?? err);
    return NextResponse.json({ message: 'Error interno', detail: err?.message }, { status: 500 });
  }
}
