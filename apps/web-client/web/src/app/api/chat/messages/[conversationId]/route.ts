import { NextRequest, NextResponse } from "next/server";

const CHAT_SERVICE_URL =
  process.env.CHAT_SERVICE_URL || "http://localhost:4007";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  const { conversationId } = await params;

  try {
    const response = await fetch(
      `${CHAT_SERVICE_URL}/api/messages/${conversationId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: err.message || "Error al cargar mensajes" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying to chat-service:", error);
    return NextResponse.json(
      { message: "Error al conectar con el servicio de chat" },
      { status: 503 }
    );
  }
}
