import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:4001";
const ARTISTS_SERVICE_URL = process.env.ARTISTS_SERVICE_URL || "http://localhost:4003";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    // Verificar token directamente con auth-service
    const response = await fetch(`${AUTH_SERVICE_URL}/auth/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ message: "Token inválido" }, { status: 401 });
    }

    const data = await response.json();

    const user: Record<string, unknown> = {
      id: data.id || data.userId,
      nombre: data.nombre,
      email: data.email,
      role: data.role,
      avatar: data.avatar,
      ciudad: data.ciudad ?? null,
      birthDate: data.birthDate ?? null,
      documentType: data.documentType ?? null,
      documentNumber: data.documentNumber ?? null,
      documentFrontUrl: data.documentFrontUrl ?? null,
      documentBackUrl: data.documentBackUrl ?? null,
      documentSelfieUrl: data.documentSelfieUrl ?? null,
    };

    // Enriquecer con artist profile ID (igual que hace el gateway)
    if (data.role === 'artista' || data.role === 'ambos') {
      try {
        const profileRes = await fetch(`${ARTISTS_SERVICE_URL}/artists/dashboard/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.artist?.id) {
            user.authId = user.id;
            if (data.role === 'ambos') {
              // Dual-role: mantener auth ID como id principal, agregar artistId aparte
              user.artistId = profileData.artist.id;
            } else {
              // Artista puro: reemplazar id con artist profile ID
              user.id = profileData.artist.id;
            }
          }
        }
      } catch {
        // Si falla el fetch del perfil, continuar con datos básicos
      }
    }

    return NextResponse.json({ user });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error verificando usuario:", message);
    return NextResponse.json(
      { message: "Error al verificar autenticación" },
      { status: 500 }
    );
  }
}
