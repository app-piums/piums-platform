import { NextRequest, NextResponse } from "next/server";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:4001";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, email, password, pais, codigoPais, telefono } = body;

    // Validación básica
    if (!nombre || !email || !password || !pais || !telefono) {
      return NextResponse.json(
        { message: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Llamar al auth-service con todos los campos
    const response = await fetch(`${AUTH_SERVICE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nombre,
        email,
        password,
        pais,
        codigoPais,
        telefono,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { 
          message: data.message || "Error al registrar usuario",
          errors: data.errors || []
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error en registro:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
