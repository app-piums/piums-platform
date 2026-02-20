import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:4001";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    // Verificar token con el servicio de autenticación
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify`, {
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

    // Retornar información del usuario
    return NextResponse.json({
      user: {
        id: data.userId,
        nombre: data.nombre,
        email: data.email,
        pais: data.pais,
        telefono: data.telefono,
      },
    });
  } catch (error: any) {
    console.error("Error verificando usuario:", error.message);
    return NextResponse.json(
      { message: "Error al verificar autenticación" },
      { status: 500 }
    );
  }
}
