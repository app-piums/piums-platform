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
      body: JSON.stringify({ email, password, role: 'cliente' }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Error al iniciar sesión" },
        { status: response.status }
      );
    }

    // 🔒 Guardar tokens en httpOnly cookies (seguro contra XSS)
    // También devolvemos el token en el body para que el SDK pueda usarlo directamente.
    // refreshToken va en el body ADEMÁS de la cookie: las apps móviles (iOS/Android)
    // hacen login por esta misma ruta y guardan tokens en Keychain/Keystore — sin él,
    // no pueden refrescar y la sesión muere a los 15 minutos con pérdidas silenciosas.
    const nextResponse = NextResponse.json(
      {
        success: true,
        user: data.user,
        token: data.token,
        refreshToken: data.refreshToken,
        message: "Sesión iniciada",
      },
      { status: 200 }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.HTTPS_ENABLED === 'true',
      sameSite: "strict" as const,
      path: "/",
    };

    // Token de acceso (7 días — matches JWT expiry)
    nextResponse.cookies.set("auth_token", data.token, {
      ...cookieOptions,
      maxAge: 604800,
    });

    // Rol del usuario
    nextResponse.cookies.set("user_role", data.user?.role ?? "cliente", {
      ...cookieOptions,
      maxAge: 604800,
    });

    // Refresh token (7 días)
    if (data.refreshToken) {
      nextResponse.cookies.set("refreshToken", data.refreshToken, {
        ...cookieOptions,
        maxAge: 604800,
      });
    }

    // Antes esto forzaba onboarding_completed=true asumiendo "email login =
    // usuario existente = ya hizo onboarding". Falso: los usuarios de email
    // JAMAS veian el onboarding de intereses. Ahora la cookie no se toca aqui:
    // el proxy manda a /onboarding a quien no la tenga, y esa pagina se
    // auto-completa en silencio si la cuenta ya tiene intereses en el backend.

    return nextResponse;
  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
