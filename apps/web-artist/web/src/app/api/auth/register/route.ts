import { NextRequest, NextResponse } from "next/server";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:4001";
const FETCH_TIMEOUT = 10000;

type RegisterBody = {
  nombre: string;
  email: string;
  password: string;
  role?: string;
};

type RegisterResponse = {
  user?: {
    id?: string;
    nombre?: string;
    email?: string;
    [key: string]: unknown;
  };
  token?: string;
  refreshToken?: string;
  message?: string;
  errors?: unknown;
};

type ServiceRole = "artist" | "client";

const isRegisterBody = (value: unknown): value is RegisterBody => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.nombre === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.password === "string"
  );
};

const resolveRole = (value: unknown): ServiceRole => {
  if (typeof value !== "string") {
    return "artist";
  }

  const normalized = value.toLowerCase();
  if (normalized === "client" || normalized === "cliente") {
    return "client";
  }
  return "artist";
};

const isAbortError = (error: unknown): boolean =>
  error instanceof Error && error.name === "AbortError";

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Error desconocido";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    if (!isRegisterBody(rawBody)) {
      return NextResponse.json(
        { message: "Nombre, email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    const role = resolveRole(rawBody.role);
    const cookieRole = role === "client" ? "cliente" : "artista";
    const successMessage =
      role === "client"
        ? "Cuenta creada exitosamente"
        : "Cuenta de artista creada exitosamente";

    const payload = {
      nombre: rawBody.nombre,
      email: rawBody.email,
      password: rawBody.password,
    } satisfies RegisterBody;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    let response: Response | null = null;
    let data: RegisterResponse | null = null;

    try {
      response = await fetch(`${AUTH_SERVICE_URL}/auth/register/${role}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      data = (await response.json()) as RegisterResponse;
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);

      if (isAbortError(fetchError)) {
        return NextResponse.json(
          { message: "La solicitud tardó demasiado. Por favor intenta nuevamente." },
          { status: 504 }
        );
      }

      console.error("Error registrando usuario:", getErrorMessage(fetchError));
      return NextResponse.json(
        { message: "Error interno del servidor" },
        { status: 500 }
      );
    }

    clearTimeout(timeoutId);

    if (!response || !data) {
      return NextResponse.json(
        { message: "No se pudo procesar la respuesta del servicio de autenticación" },
        { status: 502 }
      );
    }

    if (!response.ok) {
      if (response.status === 409) {
        return NextResponse.json(
          { message: "Este correo electrónico ya está registrado" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          message: data.message || "Error al registrar usuario",
          errors: data.errors || [],
        },
        { status: response.status }
      );
    }

    const result = NextResponse.json(
      {
        success: true,
        user: data.user,
        message: successMessage,
      },
      { status: 201 }
    );

    if (data.token) {
      result.cookies.set("auth_token", data.token, { ...COOKIE_OPTIONS, maxAge: 3600 });
      result.cookies.set("user_role", cookieRole, { ...COOKIE_OPTIONS, maxAge: 3600 });
    }

    if (data.refreshToken) {
      result.cookies.set("refreshToken", data.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 604800,
      });
    }

    return result;
  } catch (error: unknown) {
    console.error("Error en registro:", getErrorMessage(error));
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
