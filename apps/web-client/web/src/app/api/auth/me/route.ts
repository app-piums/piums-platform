import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:4001";

export async function GET(request: NextRequest) {
  try {
    // La cookie se llama 'auth_token' (consistente con login y register)
    const token = request.cookies.get("auth_token")?.value;
    const userRole = request.cookies.get("user_role")?.value;

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

    return NextResponse.json({
      user: {
        id: data.userId || data.id,
        nombre: data.nombre,
        email: data.email,
        role: userRole || data.role,
        avatar: data.avatar,
        ciudad: data.ciudad ?? null,
        birthDate: data.birthDate ?? null,
        documentType: data.documentType ?? null,
        documentNumber: data.documentNumber ?? null,
        documentFrontUrl: data.documentFrontUrl ?? null,
        documentBackUrl: data.documentBackUrl ?? null,
        documentSelfieUrl: data.documentSelfieUrl ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error("Error verificando usuario:", message);
    return NextResponse.json(
      { message: "Error al verificar autenticación" },
      { status: 500 }
    );
  }
}
