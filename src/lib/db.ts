import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Cliente Prisma con adapter Postgres (Prisma 7). Se instancia solo si hay
// DATABASE_URL configurada; en caso contrario `prisma` es null y los route
// handlers degradan con elegancia (no persisten, pero no fallan en dev).
//
// Vercel serverless: pool limitado a 3 conexiones por instancia con idle
// timeout agresivo para evitar acumulación de conexiones fantasma en Supabase.
const url = process.env.DATABASE_URL;

function createClient(): PrismaClient | null {
  if (!url) return null;
  // Supabase pooler uses a self-signed cert. The CA certificate is provided
  // via SUPABASE_SSL_CERT env var (PEM-encoded, stored in Vercel env).
  // Vercel stores multi-line env vars with escaped \n; normalize to real newlines.
  // This avoids disabling TLS verification while keeping secrets out of repo.
  const rawCa = process.env.SUPABASE_SSL_CERT;
  const ca = rawCa ? rawCa.replaceAll("\\n", "\n") : undefined;
  const adapter = new PrismaPg({
    connectionString: url.replace(/(\?|&)sslmode=\w+/, "$1").replace(/^(\?)&/, "$1"),
    ssl: { ca },
    max: 3,
    idleTimeoutMillis: 15_000,
    connectionTimeoutMillis: 8_000,
  });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient | null };

export const prisma: PrismaClient | null = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
