import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const response = NextResponse.json(
    { success: true, message: "Sesión cerrada exitosamente" },
    { status: 200 }
  );

  // Limpiar cookies de autenticación
  response.cookies.delete('auth_token');
  response.cookies.delete('user_role');
  response.cookies.delete('refreshToken');

  return response;
}
