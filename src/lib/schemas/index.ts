/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Esquemas de Validación (Zod) — Barril de Re-exportación Principal
 * ARCHIVO: src/lib/schemas/index.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Punto de entrada unificado para todos los esquemas Zod y tipos inferidos
 * de la plataforma SAFE. Permite importar cualquier validador o DTO desde
 * `@/lib/schemas` manteniendo desacoplamiento modular.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Comentarios en Español.
 * ==============================================================================
 */

export * from "./common.schema";
export * from "./activate.schema";
export * from "./emergency.schema";
export * from "./auth.schema";
export * from "./profile.schema";
export * from "./admin.schema";
export * from "./upload.schema";
