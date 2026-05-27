import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('refreshToken')?.value;

  if (refreshToken) {
    try {
      await fetch(`${process.env.GATEWAY_INTERNAL_URL || 'http://gateway:3000'}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Backend unreachable — proceed with cookie deletion regardless
    }
  }

  const response = NextResponse.json(
    { success: true, message: "Sesión cerrada exitosamente" },
    { status: 200 }
  );

  response.cookies.delete('auth_token');
  response.cookies.delete('user_role');
  response.cookies.delete('refreshToken');

  return response;
}
