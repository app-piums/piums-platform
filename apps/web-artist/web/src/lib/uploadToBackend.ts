/**
 * Sube archivos grandes (video) DIRECTO al backend, sin pasar por el BFF de Next.
 *
 * Motivo: en Vercel las funciones serverless cortan el body en ~4.5MB, así que el
 * proxy BFF no puede recibir videos. El backend (gateway → artists-service) ya
 * expone las rutas multipart con auth y acepta hasta 100MB por el ingress. El
 * navegador postea ahí directo con el JWT como Bearer (la cookie httpOnly es
 * host-only y no viaja cross-origin; por eso NO se usa credentials).
 */

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || "https://backend.piums.io";

async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem("token");
  if (stored) return stored;
  // Fallback: el token vive en la cookie httpOnly; el BFF lo expone.
  try {
    const res = await fetch("/api/chat/token", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      return data?.token ?? null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * POST multipart directo al backend. `gatewayPath` es la ruta pública del gateway
 * (p.ej. "/api/artists/dashboard/me/story-video"). Devuelve el Response tal cual.
 */
export async function uploadToBackend(
  gatewayPath: string,
  formData: FormData
): Promise<Response> {
  const token = await getAuthToken();
  return fetch(`${BACKEND_BASE}${gatewayPath}`, {
    method: "POST",
    body: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
