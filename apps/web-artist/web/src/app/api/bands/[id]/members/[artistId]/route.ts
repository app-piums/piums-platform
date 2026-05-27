import { NextRequest, NextResponse } from "next/server";

const ARTISTS_SERVICE_URL = process.env.ARTISTS_SERVICE_URL || "http://artists-service:4003";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; artistId: string }> }) {
  const { id, artistId } = await params;
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  const res = await fetch(`${ARTISTS_SERVICE_URL}/bands/${id}/members/${artistId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 204) return new NextResponse(null, { status: 204 });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
