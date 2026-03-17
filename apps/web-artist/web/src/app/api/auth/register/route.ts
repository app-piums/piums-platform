import { NextRequest, NextResponse } from "next/server";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:4001";
const FETCH_TIMEOUT = 10000; // 10 segundos

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, email, password } = body;

    // Validación básica
    if (!nombre || !email || !password) {
      return NextResponse.json(
        { message: "Nombre, email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // 🔒 Configurar timeout para el fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    try {
      // Llamar al endpoint específico de artistas (rol fijo server-side)
      const response = await fetch(`${AUTH_SERVICE_URL}/auth/register/artist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombre, email, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        // 🔒 Manejar error 409 (email duplicado) específicamente
        if (response.status === 409) {
          return NextResponse.json(
            { message: "Este correo electrónico ya está registrado" },
            { status: 409 }
          );
        }
  let responseWithCookies;
  try {
    const body = await request.json();
    const { nombre, email, password } = body;

    // Validación básica
    if (!nombre || !email || !password) {
      return NextResponse.json(
        { message: "Nombre, email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // 🔒 Configurar timeout para el fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    let fetchError;
    let response;
    let data;
    try {
      response = await fetch(`${AUTH_SERVICE_URL}/auth/register/artist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombre, email, password }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      data = await response.json();
    } catch (err) {
      fetchError = err;
      clearTimeout(timeoutId);
    }

    if (fetchError) {
      // Manejar timeout específicamente
      const errorName = typeof fetchError === 'object' && fetchError && 'name' in fetchError ? (fetchError as any).name : '';
      if (errorName === 'AbortError') {
        return NextResponse.json(
          { message: "La solicitud tardó demasiado. Por favor intenta nuevamente." },
          { status: 504 }
        );
      }
      // Error genérico
      return NextResponse.json(
        { message: "Error interno del servidor" },
        { status: 500 }
      );
    }

    if (!response || !response.ok) {
      // 🔒 Manejar error 409 (email duplicado) específicamente
      if (response && response.status === 409) {
        return NextResponse.json(
          { message: "Este correo electrónico ya está registrado" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { 
          message: data?.message || "Error al registrar usuario",
          errors: data?.errors || []
        },
        { status: response ? response.status : 500 }
      );
    }

    // 🔒 Guardar tokens en httpOnly cookies (seguro contra XSS)
    responseWithCookies = NextResponse.json(
      { 
        success: true,
        user: data.user,
        message: "Cuenta creada exitosamente"
      },
      { status: 201 }
    );

    // Token de acceso (1 hora)
    responseWithCookies.cookies.set('auth_token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600, // 1 hora
      path: '/',
    });
    return responseWithCookies;
  } catch (error: any) {
    // 🔒 No loguear password - solo el mensaje de error
    console.error("Error en registro:", error.message || "Error desconocido");
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
        return NextResponse.json(
          { 
            message: data.message || "Error al registrar usuario",
            errors: data.errors || []
          },
          { status: response.status }
        );
      }

      // 🔒 Guardar tokens en httpOnly cookies (seguro contra XSS)
      const responseWithCookies = NextResponse.json(
        { 
          success: true,
          user: data.user,
          message: "Cuenta creada exitosamente"
        },
        { status: 201 }
      );

      // Token de acceso (1 hora)
      responseWithCookies.cookies.set('auth_token', data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600, // 1 hora
        path: '/',
      });

      return responseWithCookies;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Manejar timeout específicamente
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { message: "La solicitud tardó demasiado. Por favor intenta nuevamente." },
          { status: 504 }
        );
      }
      
      throw fetchError;
    }
  } catch (error: any) {
    // 🔒 No loguear password - solo el mensaje de error
    console.error("Error en registro:", error.message || "Error desconocido");
    
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
