/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Instrumentación del Servidor — Validación de Entorno en el Arranque
 * ARCHIVO: src/instrumentation.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Hook de instrumentación de Next.js 15 (estable por defecto en la versión 15:
 * no requiere ninguna bandera en next.config). Su única responsabilidad es
 * cumplir el §6.3 de SAFE_Arquitectura_Backend_2026.md: el servidor DEBE
 * FALLAR EN EL ARRANQUE con un entorno inválido, no en la primera petición.
 * Sin este hook, una instalación con DATABASE_URL, JWT_SECRET o GMAIL_USER
 * ausentes arrancaría "sana" y reventaría con 500 genéricos en cada ruta;
 * aquí se valida `process.env` UNA sola vez al iniciar el runtime Node.js y,
 * si el diagnóstico de `@/lib/env` detecta problemas, se imprime el mensaje
 * completo (que lista en español cada variable inválida SIN revelar valores)
 * y se termina el proceso con código 1: arranque fallido inmediato, sin
 * servidores a medias atendiendo tráfico que no puede funcionar.
 *
 * GUARDAS DE EJECUCIÓN:
 * - Solo con NEXT_RUNTIME === "nodejs": el runtime edge no dispone de
 *   process.exit ni del cliente Prisma (allí el entorno se sigue validando en
 *   la primera llamada a getEnv() de cada handler).
 * - Se omite en fase de compilación (NEXT_PHASE === "phase-production-build"):
 *   `next build` no necesita secretos reales y no debe abortarse por no
 *   tenerlos; la validación real ocurre al arrancar `next start` / `next dev`.
 *
 * ENTRADAS: process.env del proceso servidor.
 * SALIDAS: ninguna en éxito; console.error + process.exit(1) en fallo.
 * DEPENDENCIAS: @/lib/env (validateEnv, importado de forma dinámica para no
 * cargar zod ni el esquema en runtimes que no lo necesitan).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * - Cero secretos impresos: el diagnóstico de env.ts solo nombra variables.
 * - Comentarios canónicos en Español.
 * ==============================================================================
 */

/**
 * Punto de entrada del hook de instrumentación. Next.js lo invoca UNA vez por
 * proceso servidor al arrancar, antes de servir tráfico. No se exporta nada
 * más desde este archivo (ni onRequestError ni helpers): su contrato es
 * exclusivamente el registro del arranque.
 */
export async function register(): Promise<void> {
  // Runtime Node.js únicamente: en edge no existe process.exit y la validación
  // perezosa de getEnv() sigue protegiendo cada handler.
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  // Durante `next build` no hay secretos disponibles (CI, máquinas de
  // compilación) y el proceso NO debe abortarse: se valida al arrancar.
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }

  try {
    // Importación dinámica dentro del try: si el propio módulo falla al cargar
    // (dependencia ausente, zod roto), también se considera arranque inválido.
    const { validateEnv } = await import("@/lib/env");
    validateEnv();
  } catch (error) {
    // validateEnv lanza un Error cuyo message ya lista, en español, cada
    // variable ausente o inválida SIN incluir valores sensibles.
    console.error(error instanceof Error ? error.message : String(error));
    console.error(
      "[SAFE] Arranque abortado: corrija las variables de entorno listadas y vuelva a iniciar el servidor.",
    );
    // Fallo inmediato y ruidoso: jamás un servidor a medias en producción.
    process.exit(1);
  }
}
