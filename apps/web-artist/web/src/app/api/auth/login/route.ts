import { NextRequest, NextResponse } from "next/server";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:4001";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validación básica
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Llamar directamente al auth-service
    const response = await fetch(`${AUTH_SERVICE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Error al iniciar sesión" },
        { status: response.status }
      );
    }

    // Crear respuesta con cookies
    const responseWithCookies = NextResponse.json(data);

    // Establecer cookie de autenticación
    responseWithCookies.cookies.set('auth_token', data.token, {
      httpOnly: true,
      secure: process.env.HTTPS_ENABLED === 'true',
      sameSite: 'strict',
      maxAge: 3600, // 1 hora
      path: '/',
    });

    // Establecer cookie de rol de usuario
    if (data.user?.role) {
      responseWithCookies.cookies.set('user_role', data.user.role, {
        httpOnly: true,
        secure: process.env.HTTPS_ENABLED === 'true',
        sameSite: 'strict',
        maxAge: 3600, // 1 hora
        path: '/',
      });
    }

    // Establecer refresh token
    if (data.refreshToken) {
      responseWithCookies.cookies.set('refreshToken', data.refreshToken, {
        httpOnly: true,
        secure: process.env.HTTPS_ENABLED === 'true',
        sameSite: 'strict',
        maxAge: 604800, // 7 días
        path: '/',
      });
    }

    return responseWithCookies;
  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
