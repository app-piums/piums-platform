import { NextRequest, NextResponse } from "next/server";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:4001";
const FETCH_TIMEOUT = 10000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, email, password } = body;

    if (!nombre || !email || !password) {
      return NextResponse.json(
        { message: "Nombre, email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    try {
      const response = await fetch(`${AUTH_SERVICE_URL}/auth/register/client`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          return NextResponse.json(
            { message: "Este correo electrónico ya está registrado" },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { message: data.message || "Error al registrar cliente", errors: data.errors || [] },
          { status: response.status }
        );
      }

      const res = NextResponse.json(
        { success: true, user: data.user, message: "Cuenta creada exitosamente" },
        { status: 201 }
      );

      const cookieOpts = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        path: '/',
      };

      res.cookies.set('auth_token', data.token, { ...cookieOpts, maxAge: 3600 });
      res.cookies.set('user_role', 'cliente', { ...cookieOpts, maxAge: 3600 });
      if (data.refreshToken) {
        res.cookies.set('refreshToken', data.refreshToken, { ...cookieOpts, maxAge: 604800 });
      }

      return res;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { message: "La solicitud tardó demasiado. Por favor intenta nuevamente." },
          { status: 504 }
        );
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error("Error en registro de cliente:", error.message);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
