import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/chat/token
 * Devuelve el token JWT guardado en la cookie auth_token para autorizar sockets del chat.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }

  return NextResponse.json({ token });
}
