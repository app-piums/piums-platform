import { NextRequest, NextResponse } from 'next/server';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:4001';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ message: 'ID token requerido' }, { status: 400 });
    }

    // Forward the Firebase ID token to auth-service for verification + PIUMS JWT issuance
    const authRes = await fetch(`${AUTH_SERVICE_URL}/auth/firebase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, role: 'artista' }),
    });

    const data = await authRes.json();

    if (!authRes.ok) {
      return NextResponse.json(
        { message: data.message || 'Error de autenticación con Google' },
        { status: authRes.status }
      );
    }

    const response = NextResponse.json(data);

    // Set httpOnly cookies same as regular login
    response.cookies.set('auth_token', data.token, {
      httpOnly: true,
      secure: process.env.HTTPS_ENABLED === 'true',
      sameSite: 'strict',
      maxAge: 3600,
      path: '/',
    });

    response.cookies.set('user_role', data.user?.role ?? 'artista', {
      httpOnly: true,
      secure: process.env.HTTPS_ENABLED === 'true',
      sameSite: 'strict',
      maxAge: 3600,
      path: '/',
    });

    if (data.refreshToken) {
      response.cookies.set('refreshToken', data.refreshToken, {
        httpOnly: true,
        secure: process.env.HTTPS_ENABLED === 'true',
        sameSite: 'strict',
        maxAge: 604800,
        path: '/',
      });
    }

    // Reset onboarding so middleware checks profile before allowing dashboard
    response.cookies.set('onboarding_completed', 'false', {
      httpOnly: false,
      secure: process.env.HTTPS_ENABLED === 'true',
      sameSite: 'strict',
      maxAge: 86400,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Firebase Google auth error:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
