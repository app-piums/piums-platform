import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessage } from './errors';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000/api';

export function createProxyHandler(basePath: string) {
  const proxyRequest = async (
    request: NextRequest,
    path: string[],
    method: string
  ) => {
    try {
      const pathString = path ? path.join('/') : '';
      const url = new URL(request.url);
      const queryString = url.search;
      
      // Obtener el token de autenticación
      const authToken = request.cookies.get('auth_token')?.value;
      
      // Construir headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      // Copiar otros headers importantes
      const contentType = request.headers.get('content-type');
      if (contentType) {
        headers['Content-Type'] = contentType;
      }
      
      // Preparar opciones de fetch
      const fetchOptions: RequestInit = {
        method,
        headers,
      };
      
      // Agregar body si no es GET o DELETE
      if (method !== 'GET' && method !== 'DELETE') {
        try {
          const body = await request.text();
          if (body) {
            fetchOptions.body = body;
          }
        } catch {
          // No hay body
        }
      }
      
      // Hacer la petición al gateway
      const pathPart = pathString ? `/${pathString}` : '';
      const gatewayUrl = `${GATEWAY_URL}${basePath}${pathPart}${queryString}`;
      const response = await fetch(gatewayUrl, fetchOptions);
      
      const contentTypeHeader = response.headers.get('content-type');
      
      // Si la respuesta es JSON
      if (contentTypeHeader?.includes('application/json')) {
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
      }
      
      // Si es otro tipo de contenido
      const data = await response.text();
      return new NextResponse(data, {
        status: response.status,
        headers: {
          'Content-Type': contentTypeHeader || 'text/plain',
        },
      });
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      console.error(`Error proxying ${basePath}:`, message);
      return NextResponse.json(
        { message: 'Error al procesar la solicitud', error: message },
        { status: 500 }
      );
    }
  };

  return {
    GET: async (request: NextRequest, context: { params: Promise<{ path: string[] }> }) => {
      const params = await context.params;
      return proxyRequest(request, params.path, 'GET');
    },
    POST: async (request: NextRequest, context: { params: Promise<{ path: string[] }> }) => {
      const params = await context.params;
      return proxyRequest(request, params.path, 'POST');
    },
    PUT: async (request: NextRequest, context: { params: Promise<{ path: string[] }> }) => {
      const params = await context.params;
      return proxyRequest(request, params.path, 'PUT');
    },
    PATCH: async (request: NextRequest, context: { params: Promise<{ path: string[] }> }) => {
      const params = await context.params;
      return proxyRequest(request, params.path, 'PATCH');
    },
    DELETE: async (request: NextRequest, context: { params: Promise<{ path: string[] }> }) => {
      const params = await context.params;
      return proxyRequest(request, params.path, 'DELETE');
    },
  };
}
