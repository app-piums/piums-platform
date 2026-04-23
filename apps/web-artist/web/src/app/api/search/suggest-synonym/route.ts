import { NextRequest, NextResponse } from 'next/server';

const SEARCH_SERVICE_URL = process.env.SEARCH_SERVICE_URL || 'http://search-service:4009';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { term, synonyms } = body as { term?: string; synonyms?: string[] };

    if (!term || term.trim().length < 2) {
      return NextResponse.json({ ok: false, message: 'term inválido' }, { status: 400 });
    }

    const res = await fetch(`${SEARCH_SERVICE_URL}/search/synonyms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ term: term.trim(), synonyms: synonyms ?? [] }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
