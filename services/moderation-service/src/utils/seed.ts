/**
 * Seed del blacklist inicial.
 * Importa la lista existente de profanity.ts del chat-service
 * y la clasifica por categoría y severidad según las guías de TikTok/Meta.
 *
 * Ejecutar con: pnpm seed (desde services/moderation-service/)
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Definición de palabras con categoría y severidad ─────────────────────────

type WordEntry = {
  word: string;
  category:
    | "PROFANITY"
    | "HATE_SPEECH"
    | "SEXUAL"
    | "VIOLENCE"
    | "THREAT"
    | "SPAM"
    | "DISCRIMINATION";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  variations?: boolean;
  partialMatch?: boolean;
  reason?: string;
};

const INITIAL_WORDS: WordEntry[] = [
  // ── Groserías generales — LOW ─────────────────────────────────────────────
  { word: "puta",          category: "PROFANITY", severity: "LOW" },
  { word: "puto",          category: "PROFANITY", severity: "LOW" },
  { word: "putas",         category: "PROFANITY", severity: "LOW" },
  { word: "putos",         category: "PROFANITY", severity: "LOW" },
  { word: "pendejo",       category: "PROFANITY", severity: "LOW" },
  { word: "pendeja",       category: "PROFANITY", severity: "LOW" },
  { word: "pendejos",      category: "PROFANITY", severity: "LOW" },
  { word: "pendejada",     category: "PROFANITY", severity: "LOW" },
  { word: "cabrón",        category: "PROFANITY", severity: "LOW" },
  { word: "cabrona",       category: "PROFANITY", severity: "LOW" },
  { word: "cabrones",      category: "PROFANITY", severity: "LOW" },
  { word: "cabron",        category: "PROFANITY", severity: "LOW" },
  { word: "joder",         category: "PROFANITY", severity: "LOW" },
  { word: "jodido",        category: "PROFANITY", severity: "LOW" },
  { word: "jodida",        category: "PROFANITY", severity: "LOW" },
  { word: "mierda",        category: "PROFANITY", severity: "LOW" },
  { word: "mierdas",       category: "PROFANITY", severity: "LOW" },
  { word: "verga",         category: "PROFANITY", severity: "LOW" },
  { word: "chingada",      category: "PROFANITY", severity: "LOW" },
  { word: "chingado",      category: "PROFANITY", severity: "LOW" },
  { word: "chíngate",      category: "PROFANITY", severity: "LOW" },
  { word: "culero",        category: "PROFANITY", severity: "LOW" },
  { word: "culera",        category: "PROFANITY", severity: "LOW" },
  { word: "culo",          category: "PROFANITY", severity: "LOW" },
  { word: "mamón",         category: "PROFANITY", severity: "LOW" },
  { word: "mamona",        category: "PROFANITY", severity: "LOW" },
  { word: "pinche",        category: "PROFANITY", severity: "LOW" },
  { word: "pinches",       category: "PROFANITY", severity: "LOW" },
  { word: "güey",          category: "PROFANITY", severity: "LOW" },
  { word: "wey",           category: "PROFANITY", severity: "LOW" },
  { word: "baboso",        category: "PROFANITY", severity: "LOW" },
  { word: "babosa",        category: "PROFANITY", severity: "LOW" },
  { word: "imbécil",       category: "PROFANITY", severity: "LOW" },
  { word: "imbecil",       category: "PROFANITY", severity: "LOW" },
  { word: "idiota",        category: "PROFANITY", severity: "LOW" },
  { word: "estúpido",      category: "PROFANITY", severity: "LOW" },
  { word: "estupido",      category: "PROFANITY", severity: "LOW" },
  { word: "estúpida",      category: "PROFANITY", severity: "LOW" },
  { word: "estupida",      category: "PROFANITY", severity: "LOW" },
  { word: "tarado",        category: "PROFANITY", severity: "LOW" },
  { word: "tarada",        category: "PROFANITY", severity: "LOW" },
  { word: "inútil",        category: "PROFANITY", severity: "LOW" },
  { word: "coño",          category: "PROFANITY", severity: "LOW" },
  { word: "zorra",         category: "PROFANITY", severity: "LOW" },
  { word: "zorras",        category: "PROFANITY", severity: "LOW" },
  { word: "perra",         category: "PROFANITY", severity: "LOW" },
  { word: "cipote",        category: "PROFANITY", severity: "LOW" },
  { word: "maje",          category: "PROFANITY", severity: "LOW" },

  // ── Acoso / contenido sexual — MEDIUM ─────────────────────────────────────
  { word: "coger",         category: "SEXUAL", severity: "MEDIUM" },
  { word: "follar",        category: "SEXUAL", severity: "MEDIUM" },
  { word: "tetas",         category: "SEXUAL", severity: "MEDIUM" },
  { word: "tetona",        category: "SEXUAL", severity: "MEDIUM" },
  { word: "nalgas",        category: "SEXUAL", severity: "MEDIUM" },
  { word: "desnuda",       category: "SEXUAL", severity: "MEDIUM" },
  { word: "desnudo",       category: "SEXUAL", severity: "MEDIUM" },
  { word: "pornografía",   category: "SEXUAL", severity: "MEDIUM" },
  { word: "porno",         category: "SEXUAL", severity: "MEDIUM" },
  { word: "masturbarse",   category: "SEXUAL", severity: "MEDIUM" },
  { word: "eyacular",      category: "SEXUAL", severity: "MEDIUM" },
  { word: "chupamela",     category: "SEXUAL", severity: "MEDIUM" },
  { word: "sexting",       category: "SEXUAL", severity: "MEDIUM" },
  { word: "prostituta",    category: "SEXUAL", severity: "MEDIUM", reason: "Propuesta de servicios sexuales en plataforma de artistas" },
  { word: "prostitución",  category: "SEXUAL", severity: "MEDIUM" },

  // ── Discriminación / slurs — HIGH ─────────────────────────────────────────
  { word: "maricón",       category: "DISCRIMINATION", severity: "HIGH" },
  { word: "maricones",     category: "DISCRIMINATION", severity: "HIGH" },
  { word: "maricon",       category: "DISCRIMINATION", severity: "HIGH" },
  { word: "joto",          category: "DISCRIMINATION", severity: "HIGH" },
  { word: "jotos",         category: "DISCRIMINATION", severity: "HIGH" },
  { word: "tortillera",    category: "DISCRIMINATION", severity: "HIGH" },
  { word: "negra de mierda", category: "HATE_SPEECH",  severity: "HIGH", partialMatch: true },
  { word: "india",         category: "HATE_SPEECH",    severity: "HIGH", reason: "Insulto étnico en contexto guatemalteco" },
  { word: "indio",         category: "HATE_SPEECH",    severity: "HIGH", reason: "Insulto étnico en contexto guatemalteco" },
  { word: "cholo",         category: "HATE_SPEECH",    severity: "HIGH" },
  { word: "sudaca",        category: "HATE_SPEECH",    severity: "HIGH" },
  { word: "retrasado",     category: "DISCRIMINATION", severity: "HIGH" },
  { word: "retrasada",     category: "DISCRIMINATION", severity: "HIGH" },
  { word: "mongolo",       category: "DISCRIMINATION", severity: "HIGH" },
  { word: "mongola",       category: "DISCRIMINATION", severity: "HIGH" },

  // ── Amenazas directas — CRITICAL ─────────────────────────────────────────
  { word: "te voy a matar", category: "THREAT", severity: "CRITICAL", partialMatch: true, variations: false },
  { word: "te mato",       category: "THREAT", severity: "CRITICAL", partialMatch: true, variations: false },
  { word: "te voy a golpear", category: "VIOLENCE", severity: "CRITICAL", partialMatch: true, variations: false },
  { word: "te voy a violar",  category: "VIOLENCE", severity: "CRITICAL", partialMatch: true, variations: false },
  { word: "te violo",      category: "VIOLENCE", severity: "CRITICAL", partialMatch: true, variations: false },
  { word: "sé dónde vives", category: "THREAT", severity: "CRITICAL", partialMatch: true, variations: false },
  { word: "te voy a encontrar", category: "THREAT", severity: "CRITICAL", partialMatch: true, variations: false },
  { word: "hijoputa",      category: "PROFANITY", severity: "MEDIUM" },
  { word: "hijo de puta",  category: "PROFANITY", severity: "MEDIUM", partialMatch: true },
  { word: "hija de puta",  category: "PROFANITY", severity: "MEDIUM", partialMatch: true },
];

// ── Script de seed ────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Iniciando seed de blacklist...");

  let created = 0;
  let skipped = 0;

  for (const entry of INITIAL_WORDS) {
    try {
      await prisma.blacklistWord.upsert({
        where: { word: entry.word.toLowerCase() },
        update: {},
        create: {
          word: entry.word.toLowerCase(),
          language: "es",
          category: entry.category,
          severity: entry.severity,
          variations: entry.variations ?? true,
          partialMatch: entry.partialMatch ?? false,
          reason: entry.reason ?? "Seed inicial — migrado desde chat-service profanity list",
          createdBy: "seed",
          active: true,
        },
      });
      created++;
    } catch (e) {
      console.warn(`⚠️  Error con palabra "${entry.word}":`, e);
      skipped++;
    }
  }

  console.log(`✅ Seed completado: ${created} palabras creadas/actualizadas, ${skipped} omitidas`);
  console.log(`📊 Total en blacklist: ${await prisma.blacklistWord.count()}`);
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
