/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Persistencia — Singleton de Prisma Client (PostgreSQL)
 * ARCHIVO: src/lib/db.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Único punto de acceso a la base de datos de SAFE. Next.js en desarrollo
 * recarga módulos en caliente (HMR/Fast Refresh) y cada recarga crearía un
 * nuevo PrismaClient con su propio pool de conexiones hasta agotar PostgreSQL.
 * Por eso el cliente se guarda en `globalThis._prismaGlobal`: la instancia
 * sobrevive a las recargas y el proceso mantiene SIEMPRE un solo pool.
 *
 * Este archivo es único e irrepetible porque el modelo de datos SAFE es de
 * relación 1:1 casco↔usuario: un `Device` (casco/kit NFC-QR) se reclama por
 * un único `User` y comparte su `MedicalProfile` en cascada. Toda consulta
 * de activación, emergencia o GPS debe pasar por este mismo cliente para
 * que transacciones y bloqueos de folio vean idéntico estado de la base.
 *
 * NOTA: NO se llama a getEnv() aquí. Prisma lee DATABASE_URL directamente
 * desde process.env en su generador interno, lo que mantiene este módulo
 * seguro para cualquier runtime sin forzar la validación del entorno.
 *
 * ENTRADAS: process.env.NODE_ENV (nivel de bitácora).
 * SALIDAS: db (PrismaClient singleton exportado, contrato §4).
 * DEPENDENCIAS: @prisma/client (generado por `prisma generate`).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas (objetivo interno de este archivo: 90).
 * - Cero datos hardcodeados, cero mocks: todo se lee de PostgreSQL.
 * - Cabecera y comentarios canónicas en Español.
 * ==============================================================================
 */

import { PrismaClient } from "@prisma/client";

/**
 * Extensión tipada del espacio global de Node para conservar el cliente
 * entre recargas en caliente del servidor de desarrollo de Next.js.
 */
const globalForPrisma = globalThis as unknown as {
  _prismaGlobal?: PrismaClient;
};

/**
 * Construye el PrismaClient con bitácora por niveles y formatadores propios:
 * - Desarrollo: `query` en stdout de Prisma + eventos `warn` y `error`.
 * - Producción/test: únicamente eventos `warn` y `error` (cero ruido).
 * Los eventos de advertencia y error se formatean en Español con la marca
 * `[SAFE][DB]` sobre `console`, sin filtrar credenciales de la URL de conexión.
 */
function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", { emit: "event", level: "warn" }, { emit: "event", level: "error" }]
        : [{ emit: "event", level: "warn" }, { emit: "event", level: "error" }],
  });

  // Callback de advertencias: datos válidos pero sospechosos (índices,
  // adaptadores obsoletos, configuraciones deprecadas de Prisma).
  client.$on("warn", (event) => {
    console.warn(`[SAFE][DB] Advertencia de base de datos — ${event.target}: ${event.message}`);
  });

  // Callback de errores: fallos de conexión, consultas rotas o panic del
  // motor Rust de Prisma. Se registra en consola de errores para el monitor.
  client.$on("error", (event) => {
    console.error(`[SAFE][DB] Error de base de datos — ${event.target}: ${event.message}`);
  });

  return client;
}

/**
 * Singleton oficial del cliente de base de datos para todo el backend SAFE
 * (firma congelada: `export const db: PrismaClient`, docs/BACKEND_CONTRACTS.md §4).
 * Reutiliza la instancia global si ya existe; si no, crea una nueva con sus
 * callbacks de bitácora en Español.
 */
export const db: PrismaClient = globalForPrisma._prismaGlobal ?? createPrismaClient();

// Fuera de producción se publica la instancia en globalThis para que la
// próxima recarga en caliente la reutilice y no fugue conexiones PostgreSQL.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma._prismaGlobal = db;
}
