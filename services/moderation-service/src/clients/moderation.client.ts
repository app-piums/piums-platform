/**
 * Cliente HTTP para comunicarse con moderation-service.
 *
 * Uso en cualquier microservicio:
 *
 *   import { ModerationClient } from './clients/moderation.client';
 *   const mod = new ModerationClient();
 *   const result = await mod.check({
 *     userId, contentType: 'MESSAGE', content, service: 'chat-service'
 *   });
 *   if (result.action === 'REJECT' || result.action === 'STRIKE' || result.action === 'MANUAL_REVIEW') {
 *     throw new AppError(400, result.rejectMessage);
 *   }
 *   const finalContent = result.action === 'CENSOR' ? result.censored! : content;
 */

import jwt from "jsonwebtoken";

const MODERATION_SERVICE_URL =
  process.env.MODERATION_SERVICE_URL || "http://localhost:4011";
const JWT_SECRET =
  process.env.JWT_SECRET || "dev-only-secret-not-for-production";
const REQUEST_TIMEOUT_MS = 5_000;

export type ContentType =
  | "MESSAGE"
  | "REVIEW"
  | "REVIEW_RESPONSE"
  | "USER_BIO"
  | "ARTIST_BIO"
  | "EVENT_DESCRIPTION"
  | "BOOKING_NOTE"
  | "USERNAME";

export type ModerationAction =
  | "ALLOW"
  | "CENSOR"
  | "REJECT"
  | "STRIKE"
  | "MANUAL_REVIEW"
  | "SHADOW_BAN";

export interface ModerationCheckInput {
  userId: string;
  contentType: ContentType;
  content: string;
  /** Nombre del servicio que hace la llamada, ej. "chat-service" */
  service: string;
}

export interface ModerationCheckResult {
  action: ModerationAction;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
  matchedWords: string[];
  /** Texto censurado (solo cuando action === 'CENSOR') */
  censored?: string;
  shadowBanned: boolean;
  logId: string;
  /** Mensaje de error listo para mostrar al usuario */
  rejectMessage: string;
}

function generateServiceToken(): string {
  return jwt.sign(
    { isService: true, service: "internal" },
    JWT_SECRET,
    { expiresIn: "5m" }
  );
}

const REJECT_MESSAGES: Record<string, string> = {
  REJECT:        "El contenido contiene palabras no permitidas en PIUMS.",
  STRIKE:        "El contenido fue rechazado por violar las normas de convivencia de PIUMS. Se ha registrado una advertencia en tu cuenta.",
  MANUAL_REVIEW: "El contenido fue rechazado y ha sido enviado para revisión por el equipo de moderación.",
  SHADOW_BAN:    "Tu mensaje fue recibido.",
};

export class ModerationClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = MODERATION_SERVICE_URL;
  }

  /**
   * Verifica si el contenido cumple las normas de PIUMS.
   *
   * Si moderation-service no está disponible, retorna ALLOW para no bloquear el flujo
   * (fail-open) y registra una advertencia.
   */
  async check(input: ModerationCheckInput): Promise<ModerationCheckResult> {
    try {
      const token = generateServiceToken();

      const response = await fetch(`${this.baseUrl}/api/moderation/check`, {
        method: "POST",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: "Error desconocido" }));
        console.warn(
          JSON.stringify({ level: "WARN", service: input.service, context: "MODERATION_CLIENT",
            message: `moderation-service respondió ${response.status}`, data: err })
        );
        return this.allowFallback();
      }

      const data = await response.json() as ModerationCheckResult & { status: string };
      return {
        ...data,
        rejectMessage: REJECT_MESSAGES[data.action] ?? "Contenido rechazado por las normas de PIUMS.",
      };
    } catch (err) {
      // Timeout, ECONNREFUSED, etc. — no bloquear el flujo del usuario
      console.warn(
        JSON.stringify({ level: "WARN", service: input.service, context: "MODERATION_CLIENT",
          message: "moderation-service no disponible — fallback ALLOW",
          data: { error: (err as Error).message } })
      );
      return this.allowFallback();
    }
  }

  private allowFallback(): ModerationCheckResult {
    return {
      action: "ALLOW",
      severity: null,
      matchedWords: [],
      shadowBanned: false,
      logId: "",
      rejectMessage: "",
    };
  }
}
