import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json(
    { success: true, message: "Sesión cerrada exitosamente" },
    { status: 200 }
  );

  // Limpiar todas las cookies de autenticación
  response.cookies.delete('auth_token');
  response.cookies.delete('user_role');
  response.cookies.delete('refreshToken');
  response.cookies.delete('token'); // por compatibilidad
  // Nota: NO borramos onboarding_completed para que persista entre sesiones

  return response;
}
