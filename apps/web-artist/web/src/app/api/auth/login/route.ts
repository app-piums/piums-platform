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

    // Llamar directamente al auth-service — force role='artista' so users
    // registered as clients can also log into the artist app (dual-role).
    const response = await fetch(`${AUTH_SERVICE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, role: 'artista' }),
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

    // Para artistas: verificar si ya tienen perfil para no forzarles al onboarding en cada login.
    if (data.user?.role === 'artista') {
      const ARTISTS_SERVICE_URL = process.env.ARTISTS_SERVICE_URL || 'http://artists-service:4003';
      let hasProfile = false;
      try {
        const profileRes = await fetch(`${ARTISTS_SERVICE_URL}/artists/dashboard/me`, {
          headers: { Authorization: `Bearer ${data.token}` },
        });
        hasProfile = profileRes.ok;
      } catch { /* si falla el check, forzar onboarding por seguridad */ }

      responseWithCookies.cookies.set('onboarding_completed', hasProfile ? 'true' : 'false', {
        httpOnly: false,
        secure: process.env.HTTPS_ENABLED === 'true',
        sameSite: 'strict',
        maxAge: hasProfile ? 31536000 : 86400,
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
