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

    // 🔒 Guardar tokens en httpOnly cookies (seguro contra XSS)
    // También devolvemos el token en el body para que el SDK pueda usarlo directamente
    const nextResponse = NextResponse.json(
      { success: true, user: data.user, token: data.token, message: "Sesión iniciada" },
      { status: 200 }
    );

    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.HTTPS_ENABLED === 'true',
      sameSite: "strict" as const,
      path: "/",
    };

    // Token de acceso (1 hora)
    nextResponse.cookies.set("auth_token", data.token, {
      ...cookieOptions,
      maxAge: 3600,
    });

    // Rol del usuario
    nextResponse.cookies.set("user_role", data.user?.role ?? "cliente", {
      ...cookieOptions,
      maxAge: 3600,
    });

    // Refresh token (7 días)
    if (data.refreshToken) {
      nextResponse.cookies.set("refreshToken", data.refreshToken, {
        ...cookieOptions,
        maxAge: 604800,
      });
    }

    // Email login = usuario existente (el registro siempre va directo a /onboarding).
    // Setear onboarding como completado server-side para que el proxy no redirija.
    nextResponse.cookies.set("onboarding_completed", "true", {
      httpOnly: false, // debe ser legible por JS del cliente también
      secure: process.env.HTTPS_ENABLED === 'true',
      sameSite: "strict" as const,
      maxAge: 31536000, // 1 año
      path: "/",
    });

    return nextResponse;
  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
