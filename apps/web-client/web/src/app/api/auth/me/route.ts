import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:4001";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.HTTPS_ENABLED === 'true',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 604800,
};

export async function GET(request: NextRequest) {
  try {
    let token = request.cookies.get("auth_token")?.value;
    const userRole = request.cookies.get("user_role")?.value;

    if (!token) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    // Verificar token con auth-service
    let verifyRes = await fetch(`${AUTH_SERVICE_URL}/auth/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    // Si el token expiró, intentar refresh transparente antes de devolver 401
    let refreshedCookies: { token: string; refreshToken: string; role: string } | null = null;
    if (!verifyRes.ok) {
      const storedRefreshToken = request.cookies.get("refreshToken")?.value;
      if (!storedRefreshToken) {
        return NextResponse.json({ message: "Sesión expirada" }, { status: 401 });
      }

      const refreshRes = await fetch(`${AUTH_SERVICE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });

      if (!refreshRes.ok) {
        return NextResponse.json({ message: "Sesión expirada" }, { status: 401 });
      }

      refreshedCookies = await refreshRes.json();
      token = refreshedCookies!.token;

      // Re-verificar con el nuevo token
      verifyRes = await fetch(`${AUTH_SERVICE_URL}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      if (!verifyRes.ok) {
        return NextResponse.json({ message: "Sesión expirada" }, { status: 401 });
      }
    }

    const data = await verifyRes.json();

    // /auth/verify excluye los campos KYC (documentos) por diseño; hay que
    // pedirlos a /auth/me, si no la verificación de identidad aparece siempre
    // como pendiente aunque el usuario ya la haya completado.
    let kyc: Record<string, unknown> = {};
    try {
      const meRes = await fetch(`${AUTH_SERVICE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (meRes.ok) {
        const meData = await meRes.json();
        kyc = meData.user ?? {};
      }
    } catch {
      // Si falla, continuar con los datos de verify (sin KYC)
    }

    const response = NextResponse.json({
      user: {
        id: data.userId || data.id,
        nombre: data.nombre,
        email: data.email,
        role: userRole || data.role,
        avatar: data.avatar,
        ciudad: data.ciudad ?? kyc.ciudad ?? null,
        birthDate: data.birthDate ?? kyc.birthDate ?? null,
        documentType: kyc.documentType ?? null,
        documentNumber: kyc.documentNumber ?? null,
        documentFrontUrl: kyc.documentFrontUrl ?? null,
        documentBackUrl: kyc.documentBackUrl ?? null,
        documentSelfieUrl: kyc.documentSelfieUrl ?? null,
      },
    });

    // Propagar las cookies actualizadas si hubo refresh
    if (refreshedCookies) {
      response.cookies.set('auth_token', refreshedCookies.token, COOKIE_OPTIONS);
      response.cookies.set('user_role', refreshedCookies.role, COOKIE_OPTIONS);
      if (refreshedCookies.refreshToken) {
        response.cookies.set('refreshToken', refreshedCookies.refreshToken, COOKIE_OPTIONS);
      }
    }

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error("Error verificando usuario:", message);
    return NextResponse.json(
      { message: "Error al verificar autenticación" },
      { status: 500 }
    );
  }
}
