import { NextRequest, NextResponse } from "next/server";

const ARTISTS_SERVICE_URL = process.env.ARTISTS_SERVICE_URL || "http://artists-service:4003";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; oid: string }> }) {
  const { id, oid } = await params;
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  const body = await req.json();
  const endpoint = body.close ? "close" : oid;
  const res = await fetch(`${ARTISTS_SERVICE_URL}/bands/${id}/openings/${oid}/${endpoint}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
