import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/chat/token
 * Returns the auth token for Socket.io client-side connection.
 * The token is read server-side from the httpOnly cookie and passed
 * to the client as a one-time value for socket authentication.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }
  return NextResponse.json({ token });
}
