import { NextRequest, NextResponse } from "next/server";

const ARTISTS_SERVICE_URL = process.env.ARTISTS_SERVICE_URL || "http://artists-service:4003";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ artists: [] }, { status: 200 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const limit = searchParams.get("limit") || "8";

  if (!q.trim()) return NextResponse.json({ artists: [] }, { status: 200 });

  try {
    const url = new URL(`${ARTISTS_SERVICE_URL}/artists/search`);
    url.searchParams.set("q", q);
    url.searchParams.set("limit", limit);
    url.searchParams.set("category", "MUSICO");

    const res = await fetch(url.toString(), {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return NextResponse.json({ artists: [] }, { status: 200 });

    const data = await res.json();
    const artists = (data.artists ?? data.data ?? []).map((a: {
      id: string;
      nombre?: string;
      artistName?: string;
      avatar?: string;
      city?: string;
      specialties?: string[];
    }) => ({
      id: a.id,
      nombre: a.artistName || a.nombre || "Artista",
      city: a.city ?? null,
      avatar: a.avatar ?? null,
      specialties: a.specialties ?? [],
    }));

    return NextResponse.json({ artists }, { status: 200 });
  } catch {
    return NextResponse.json({ artists: [] }, { status: 200 });
  }
}
