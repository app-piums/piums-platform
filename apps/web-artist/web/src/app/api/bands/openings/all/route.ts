import { NextRequest, NextResponse } from "next/server";

const ARTISTS_SERVICE_URL = process.env.ARTISTS_SERVICE_URL || "http://artists-service:4003";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const url = q
    ? `${ARTISTS_SERVICE_URL}/bands/openings/all?q=${encodeURIComponent(q)}`
    : `${ARTISTS_SERVICE_URL}/bands/openings/all`;
  const res = await fetch(url);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
