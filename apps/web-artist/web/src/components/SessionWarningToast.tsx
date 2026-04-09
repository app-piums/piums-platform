"use client";

import { useAuth } from "@/contexts/AuthContext";

export function SessionWarningToast() {
  const { sessionWarning, sessionExpiresAt, extendSession, logout } = useAuth();

  if (!sessionWarning) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-lg max-w-sm">
      <svg
        className="mt-0.5 h-5 w-5 shrink-0 text-amber-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
        />
      </svg>
      <div className="flex-1">
        <p className="text-sm font-semibold text-amber-800">Tu sesión está por expirar</p>
        {sessionExpiresAt && (
          <p className="mt-0.5 text-xs text-amber-600">
            Expira a las {sessionExpiresAt.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
        <div className="mt-2.5 flex gap-2">
          <button
            onClick={extendSession}
            className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
          >
            Continuar sesión
          </button>
          <button
            onClick={logout}
            className="rounded-lg px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
