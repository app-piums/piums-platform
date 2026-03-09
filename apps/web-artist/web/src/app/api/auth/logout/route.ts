import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const response = NextResponse.json(
    { success: true, message: "Sesión cerrada exitosamente" },
    { status: 200 }
  );

  // Limpiar cookies de autenticación
  response.cookies.delete('token');
  response.cookies.delete('refreshToken');

  return response;
}
