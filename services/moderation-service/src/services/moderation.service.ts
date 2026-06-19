import crypto from "crypto";
import prisma from "../lib/prisma";
import { ModerationAction, Severity, ContentType } from "../types/prisma-enums";
import { normalizeText, normalizeWord, escapeRegex } from "../utils/normalizer";
import {
  getBlacklistFromCache,
  setBlacklistInCache,
  invalidateBlacklistCache,
  CachedBlacklistEntry,
} from "./cache.service";
import { logger } from "../utils/logger";
import { AppError } from "../middleware/errorHandler";

// ── Tipos públicos ────────────────────────────────────────────────────────────

export interface CheckContentInput {
  userId: string;
  contentType: ContentType;
  content: string;
  service: string; // nombre del microservicio que llama
}

export interface ModerationResult {
  action: ModerationAction;
  severity: Severity | null;
  matchedWords: string[];
  /** Texto con palabras LOW reemplazadas con *** (solo cuando action = CENSOR) */
  censored?: string;
  /** true cuando el contenido debe estar visible solo para su autor */
  shadowBanned: boolean;
  logId: string;
}

// ── Carga de blacklist ────────────────────────────────────────────────────────

async function loadActiveBlacklist(): Promise<CachedBlacklistEntry[]> {
  const cached = await getBlacklistFromCache();
  if (cached) return cached;

  const words = await prisma.blacklistWord.findMany({
    where: { active: true },
    select: {
      id: true,
      word: true,
      language: true,
      category: true,
      severity: true,
      active: true,
      variations: true,
      partialMatch: true,
    },
  });

  await setBlacklistInCache(words);
  return words;
}

// ── Motor de detección ────────────────────────────────────────────────────────

interface Match {
  word: string;
  severity: Severity;
}

/**
 * Devuelve todos los matches encontrados en `content` contra el blacklist.
 */
function detectMatches(
  normalizedContent: string,
  blacklist: CachedBlacklistEntry[]
): Match[] {
  const matches: Match[] = [];

  for (const entry of blacklist) {
    const normalizedWord = normalizeWord(entry.word);
    const escapedWord = escapeRegex(normalizedWord);

    // Patrón: con bordes de palabra o sin ellos según partialMatch
    const pattern = entry.partialMatch
      ? escapedWord
      : `(?:^|[^a-z0-9áéíóúüñ])${escapedWord}(?=[^a-z0-9áéíóúüñ]|$)`;

    // Si variations está activado, normalizeText ya aplicó leet speak + colapso de repetidos
    // Por lo que la comparación se hace sobre el texto normalizado
    const regex = new RegExp(pattern, "i");

    if (regex.test(normalizedContent)) {
      matches.push({ word: entry.word, severity: entry.severity as Severity });
    }
  }

  return matches;
}

/**
 * Calcula la severidad máxima de una lista de matches.
 */
function maxSeverity(matches: Match[]): Severity {
  const order: Severity[] = [Severity.LOW, Severity.MEDIUM, Severity.HIGH, Severity.CRITICAL];
  let max: Severity = Severity.LOW;
  for (const m of matches) {
    if (order.indexOf(m.severity) > order.indexOf(max)) {
      max = m.severity;
    }
  }
  return max;
}

/**
 * Reemplaza todas las palabras LOW con *** en el texto original.
 */
function censorContent(content: string, blacklist: CachedBlacklistEntry[]): string {
  let result = content;
  const lowWords = blacklist.filter((e) => e.severity === "LOW" && e.active);

  for (const entry of lowWords) {
    const normalizedWord = normalizeWord(entry.word);
    const pattern = entry.partialMatch
      ? escapeRegex(normalizedWord)
      : `(?:^|(?<=[^a-záéíóúüñ]))${escapeRegex(normalizedWord)}(?=[^a-záéíóúüñ]|$)`;
    try {
      result = result.replace(new RegExp(pattern, "gi"), "***");
    } catch {
      // Regex inválido — skip
    }
  }
  return result;
}

// ── Acción según severidad ────────────────────────────────────────────────────

function severityToAction(severity: Severity): ModerationAction {
  switch (severity) {
    case Severity.LOW:      return ModerationAction.CENSOR;
    case Severity.MEDIUM:   return ModerationAction.REJECT;
    case Severity.HIGH:     return ModerationAction.STRIKE;
    case Severity.CRITICAL: return ModerationAction.MANUAL_REVIEW;
  }
}

// ── Función principal ─────────────────────────────────────────────────────────

export async function checkContent(input: CheckContentInput): Promise<ModerationResult> {
  const { userId, contentType, content, service } = input;

  // Hash del contenido para auditoría (preserva privacidad)
  const contentHash = crypto.createHash("sha256").update(content).digest("hex");

  // Cargar blacklist (desde Redis o BD)
  const blacklist = await loadActiveBlacklist();

  // Normalizar texto del usuario
  const normalizedContent = normalizeText(content);

  // Detectar matches
  const matches = detectMatches(normalizedContent, blacklist);

  // Sin matches → ALLOW
  if (matches.length === 0) {
    const log = await prisma.moderationLog.create({
      data: {
        userId,
        contentType,
        contentHash,
        service,
        action: ModerationAction.ALLOW,
        matchedWords: [],
        shadowBanned: false,
      },
    });
    return { action: ModerationAction.ALLOW, severity: null, matchedWords: [], shadowBanned: false, logId: log.id };
  }

  const severity = maxSeverity(matches);
  const action = severityToAction(severity);
  const matchedWords = matches.map((m) => m.word);
  const isShadowBanned = action === ModerationAction.SHADOW_BAN;

  // Guardar log de auditoría
  const log = await prisma.moderationLog.create({
    data: {
      userId,
      contentType,
      contentHash,
      service,
      action,
      matchedWords,
      severity,
      shadowBanned: isShadowBanned,
    },
  });

  // Si es HIGH o CRITICAL → registrar strike
  if (action === ModerationAction.STRIKE || action === ModerationAction.MANUAL_REVIEW) {
    await prisma.accountStrike.create({
      data: {
        userId,
        reason: `Contenido ${contentType} con contenido ${severity}: ${matchedWords.slice(0, 3).join(", ")}`,
        severity,
        contentType,
        logId: log.id,
      },
    });

    // Revisar total de strikes activos del usuario
    const activeStrikes = await prisma.accountStrike.count({
      where: { userId, resolvedAt: null },
    });
    const maxStrikes = parseInt(process.env.MAX_STRIKES_BEFORE_RESTRICTION || "3", 10);
    if (activeStrikes >= maxStrikes) {
      logger.warn(`Usuario ${userId} alcanzó ${activeStrikes} strikes activos`, "MODERATION");
    }
  }

  const result: ModerationResult = {
    action,
    severity,
    matchedWords,
    shadowBanned: isShadowBanned,
    logId: log.id,
  };

  // Para LOW → devolver texto censurado
  if (action === ModerationAction.CENSOR) {
    result.censored = censorContent(content, blacklist);
  }

  logger.info(
    `Moderación: action=${action} severity=${severity} words=[${matchedWords.join(",")}]`,
    "MODERATION",
    { userId, contentType, service }
  );

  return result;
}

// ── Gestión del blacklist (admin) ─────────────────────────────────────────────

export interface CreateWordInput {
  word: string;
  language?: string;
  category: string;
  severity: string;
  variations?: boolean;
  partialMatch?: boolean;
  reason?: string;
  adminId: string;
}

export async function createBlacklistWord(input: CreateWordInput) {
  const existing = await prisma.blacklistWord.findUnique({ where: { word: input.word.toLowerCase() } });
  if (existing) {
    throw new AppError(409, `La palabra "${input.word}" ya existe en el blacklist`);
  }

  const word = await prisma.blacklistWord.create({
    data: {
      word: input.word.toLowerCase(),
      language: input.language || "es",
      category: input.category as never,
      severity: input.severity as never,
      variations: input.variations ?? true,
      partialMatch: input.partialMatch ?? false,
      reason: input.reason,
      createdBy: input.adminId,
    },
  });

  await invalidateBlacklistCache();
  return word;
}

export async function updateBlacklistWord(id: string, updates: Partial<CreateWordInput>, adminId: string) {
  const word = await prisma.blacklistWord.update({
    where: { id },
    data: {
      ...updates,
      word: updates.word?.toLowerCase(),
      updatedBy: adminId,
    },
  });
  await invalidateBlacklistCache();
  return word;
}

export async function deactivateBlacklistWord(id: string, adminId: string) {
  const word = await prisma.blacklistWord.update({
    where: { id },
    data: { active: false, updatedBy: adminId },
  });
  await invalidateBlacklistCache();
  return word;
}

export async function listBlacklistWords(filters: {
  category?: string;
  severity?: string;
  active?: boolean;
  language?: string;
  page?: number;
  limit?: number;
}) {
  const { category, severity, active, language, page = 1, limit = 50 } = filters;
  const skip = (page - 1) * limit;

  const where = {
    ...(category && { category: category as never }),
    ...(severity && { severity: severity as never }),
    ...(active !== undefined && { active }),
    ...(language && { language }),
  };

  const [words, total] = await Promise.all([
    prisma.blacklistWord.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.blacklistWord.count({ where }),
  ]);

  return { words, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getModerationLogs(filters: {
  userId?: string;
  contentType?: string;
  action?: string;
  page?: number;
  limit?: number;
}) {
  const { userId, contentType, action, page = 1, limit = 50 } = filters;
  const skip = (page - 1) * limit;

  const where = {
    ...(userId && { userId }),
    ...(contentType && { contentType: contentType as never }),
    ...(action && { action: action as never }),
  };

  const [logs, total] = await Promise.all([
    prisma.moderationLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { strikes: { select: { id: true, resolvedAt: true } } },
    }),
    prisma.moderationLog.count({ where }),
  ]);

  return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getManualReviewQueue(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const where = { action: ModerationAction.MANUAL_REVIEW, reviewedAt: null };

  const [items, total] = await Promise.all([
    prisma.moderationLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "asc" },
    }),
    prisma.moderationLog.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function resolveManualReview(logId: string, adminId: string, note?: string) {
  return prisma.moderationLog.update({
    where: { id: logId },
    data: { reviewedBy: adminId, reviewedAt: new Date(), reviewNote: note },
  });
}

export async function getUserStrikes(userId: string) {
  const [strikes, total] = await Promise.all([
    prisma.accountStrike.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.accountStrike.count({ where: { userId, resolvedAt: null } }),
  ]);
  return { strikes, activeCount: total };
}

export async function resolveStrike(strikeId: string, adminId: string, note?: string) {
  return prisma.accountStrike.update({
    where: { id: strikeId },
    data: { resolvedAt: new Date(), resolvedBy: adminId, resolveNote: note },
  });
}

export async function testContent(content: string) {
  const blacklist = await loadActiveBlacklist();
  const normalizedContent = normalizeText(content);
  const matches = detectMatches(normalizedContent, blacklist);

  if (matches.length === 0) {
    return { action: ModerationAction.ALLOW, severity: null, matchedWords: [], censored: content };
  }

  const severity = maxSeverity(matches);
  const action = severityToAction(severity);
  const matchedWords = matches.map((m) => m.word);
  const censored = action === ModerationAction.CENSOR ? censorContent(content, blacklist) : undefined;

  return { action, severity, matchedWords, censored };
}
