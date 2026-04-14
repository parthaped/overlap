import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

declare global {
  var __prisma: PrismaClient | undefined;
}

function isNeonConnectionString(url: string | undefined) {
  if (!url) {
    return false;
  }
  return /\.neon\.tech\b|neon\.database\.|neon\.local\b/i.test(url);
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  const log: ("query" | "warn" | "error")[] =
    process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"];

  if (url && isNeonConnectionString(url)) {
    /** WebSockets are required for Neon's serverless driver on Node (e.g. Vercel). */
    neonConfig.webSocketConstructor = ws;
    const adapter = new PrismaNeon({ connectionString: url });
    return new PrismaClient({ adapter, log });
  }

  return new PrismaClient({ log });
}

export const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
