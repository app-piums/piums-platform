import { NextRequest, NextResponse } from "next/server";

const ARTISTS_SERVICE_URL = process.env.ARTISTS_SERVICE_URL || "http://artists-service:4003";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const formData = await req.formData();
  const res = await fetch(`${ARTISTS_SERVICE_URL}/bands/${id}/avatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
