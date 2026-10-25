/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Utilidades HTTP — Respuestas Estandarizadas y Traducción de Errores
 * ARCHIVO: src/lib/api-response.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Protocolo canónico de respuestas JSON para TODOS los route handlers de la
 * API de Next.js en SAFE. Congela el envoltorio de éxito { success: true,
 * data: T } y el de error { success: false, error: { code, message, details } }
 * según docs/BACKEND_CONTRACTS.md §2 y §6. Provee la excepción operativa
 * AppError con mapa de estados HTTP por defecto, constructores tipados de
 * NextResponse con "Cache-Control: no-store", analizadores de cuerpo JSON y
 * de query string validados con Zod, y el despachador unificado handleApiError
 * que traduce errores de Zod, Prisma y del sistema a mensajes humanos en
 * Español SIN filtrar trazas, stack traces ni secretos al cliente. Cada
 * error se registra con logEvent (warn para 4xx; error para 5xx con meta
 * ampliada { context, code, detail, stack } solo en el servidor — H-12).
 *
 * DEPENDENCIAS: next/server, zod v3, @prisma/client (clases protegidas con
 * instanceof guardado) y @/lib/logger para el registro sanitizado.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * - Cabecera y comentarios en Español.
 * - Validación estricta con Zod en todas las API routes.
 * ==============================================================================
 */

import { NextResponse } from "next/server";
import { ZodError, type ZodIssue, type ZodType } from "zod";
import { Prisma } from "@prisma/client";
import { logEvent } from "@/lib/logger";

/**
 * Códigos canónicos de error de la API de SAFE (contrato §2, congelado).
 */
export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMIT"
  | "SERVER_ERROR";

/**
 * Envoltorio congelado de respuesta exitosa: { success: true, data }.
 */
export interface ApiResponseSuccess<T> {
  success: true;
  data: T;
}

/**
 * Envoltorio congelado de respuesta fallida: { success: false, error }.
 * `details` es opcional y nunca debe contener trazas ni información sensible.
 */
export interface ApiResponseError {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
}

/**
 * Mapa semántico de estado HTTP por defecto para cada código de error API.
 * VALIDATION_ERROR→400, UNAUTHORIZED→401, FORBIDDEN→403, NOT_FOUND→404,
 * RATE_LIMIT→429, SERVER_ERROR→500.
 */
const DEFAULT_STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMIT: 429,
  SERVER_ERROR: 500,
};

/**
 * Mensaje humano genérico de indisponibilidad (errores Prisma no tipados y
 * fallos de inicialización de la base de datos). Nunca se revela el detalle
 * interno al cliente.
 */
const GENERIC_UNAVAILABLE_MESSAGE =
  "El servicio no está disponible en este momento.";

/**
 * Mensaje humano genérico para cualquier excepción inesperada del sistema.
 * Regla de seguridad: jamás se traslada error.message crudo a la respuesta.
 */
const GENERIC_SERVER_MESSAGE =
  "No fue posible completar la operación. Intente nuevamente en unos momentos.";

/**
 * Número de líneas del stack trace que se conservan en el registro interno de
 * los errores 5xx (corrección H-12). Suficiente para localizar el origen del
 * fallo en producción sin volcar trazas completas en la consola del servidor.
 */
const STACK_TRACE_LOG_LINES = 5;

/**
 * Excepción operativa de SAFE: transporta el código de error API, el estado
 * HTTP semántico (explícito o derivado del mapa por defecto) y detalles
 * auditables opcionales que el cliente podrá recibir en `error.details`.
 */
export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: ApiErrorCode,
    message: string,
    status?: number,
    details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status ?? DEFAULT_STATUS_BY_CODE[code];
    this.details = details;
  }
}

/**
 * Reduce los issues de un ZodError a la forma mínima { path, message },
 * apta para respuesta al cliente sin exponer objetos internos de Zod.
 * @param issues Lista de incidencias producidas por safeParse/parse.
 * @returns Arreglo plano de { path: string; message: string }.
 */
function reduceZodIssues(
  issues: ZodIssue[],
): Array<{ path: string; message: string }> {
  return issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

/**
 * Verificación protegida (instanceof guardado) de PrismaClientKnownRequestError:
 * si el cliente generado de @prisma/client aún no expone la clase, devuelve
 * false sin lanzar excepciones.
 * @param error Valor capturado en un bloque catch.
 */
function isPrismaKnownRequestError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  const ctor = Prisma?.PrismaClientKnownRequestError;
  return typeof ctor === "function" && error instanceof ctor;
}

/**
 * Verificación protegida de PrismaClientInitializationError (base de datos
 * inaccesible o credenciales ausentes).
 * @param error Valor capturado en un bloque catch.
 */
function isPrismaInitializationError(
  error: unknown,
): error is Prisma.PrismaClientInitializationError {
  const ctor = Prisma?.PrismaClientInitializationError;
  return typeof ctor === "function" && error instanceof ctor;
}

/**
 * Aplica el encabezado obligatorio "Cache-Control: no-store" a cualquier
 * HeadersInit recibido, conservando el resto de cabeceras del llamador.
 * @param headers Cabeceras opcionales (Record, array o Headers).
 * @returns Instancia Headers lista para NextResponse.
 */
function buildNoStoreHeaders(headers?: HeadersInit): Headers {
  const merged = new Headers(headers);
  merged.set("Cache-Control", "no-store");
  return merged;
}

/**
 * Genera una respuesta NextResponse exitosa con el formato congelado
 * { success: true, data } y "Cache-Control: no-store".
 * @param data Payload tipado a retornar al cliente.
 * @param status Estado HTTP (por defecto 200; 201 en creaciones).
 * @param headers Cabeceras adicionales opcionales.
 * @returns NextResponse con JSON de éxito.
 */
export function successResponse<T>(
  data: T,
  status = 200,
  headers?: HeadersInit,
): NextResponse {
  return NextResponse.json(
    { success: true, data } satisfies ApiResponseSuccess<T>,
    { status, headers: buildNoStoreHeaders(headers) },
  );
}

/**
 * Genera una respuesta NextResponse de error con el formato congelado
 * { success: false, error: { code, message, details } }. La propiedad
 * `details` se OMITE cuando es undefined. El estado se deriva del mapa
 * por defecto del código si el llamador no lo explicita. Incluye
 * "Cache-Control: no-store".
 * @param code Código canónico de error API.
 * @param message Mensaje humano en Español para el cliente.
 * @param status Estado HTTP opcional (override del mapa por defecto).
 * @param details Detalle estructurado opcional y no sensible.
 * @returns NextResponse con JSON de error.
 */
export function errorResponse(
  code: ApiErrorCode,
  message: string,
  status?: number,
  details?: unknown,
): NextResponse {
  const body: ApiResponseError = {
    success: false,
    error: details === undefined ? { code, message } : { code, message, details },
  };
  return NextResponse.json(body, {
    status: status ?? DEFAULT_STATUS_BY_CODE[code],
    headers: buildNoStoreHeaders(),
  });
}

/**
 * Traducción unificada y segura de cualquier excepción capturada en los
 * bloques catch de los route handlers a una respuesta { success: false }.
 * Reglas (contrato §6):
 * - AppError → conserva su código, estado y detalles.
 * - ZodError → 400 VALIDATION_ERROR con issues reducidos a { path, message }.
 * - Prisma P2002 → 400 (dato único duplicado), P2025 → 404 (no existe),
 *   P2003 → 400 (relación inválida); conocidos genéricos e inicialización
 *   fallida → 500 con mensaje de indisponibilidad.
 * - Cualquier otro Error (o valor lanzado) → 500 SERVER_ERROR con literal
 *   humano en Español; NUNCA se traslada error.message crudo ni stack.
 * Registro (corrección H-12): logEvent con warn para 4xx (meta { context,
 * code }) y error para 5xx con meta ampliada { context, code, detail, stack }
 * — el diagnóstico completo (mensaje interno y primeras 5 líneas del stack)
 * queda SOLO en los logs del servidor; la respuesta al cliente no cambia.
 * @param error Valor desconocido capturado en catch.
 * @param context Etiqueta de auditoría del endpoint (p. ej. "POST /api/auth/login").
 * @returns NextResponse con el envoltorio congelado de error.
 */
export function handleApiError(error: unknown, context: string): NextResponse {
  let code: ApiErrorCode = "SERVER_ERROR";
  let message: string = GENERIC_SERVER_MESSAGE;
  let status: number = 500;
  let details: unknown = undefined;

  if (error instanceof AppError) {
    code = error.code;
    message = error.message;
    status = error.status;
    details = error.details;
  } else if (error instanceof ZodError) {
    code = "VALIDATION_ERROR";
    message =
      error.issues[0]?.message ??
      "Los datos enviados no cumplen el formato requerido.";
    status = 400;
    details = reduceZodIssues(error.issues);
  } else if (isPrismaKnownRequestError(error)) {
    if (error.code === "P2002") {
      code = "VALIDATION_ERROR";
      message = "El registro ya existe con ese dato único.";
      status = 400;
    } else if (error.code === "P2025") {
      code = "NOT_FOUND";
      message = "El registro solicitado no existe.";
      status = 404;
    } else if (error.code === "P2003") {
      code = "VALIDATION_ERROR";
      message = "El registro relacionado no es válido.";
      status = 400;
    } else {
      code = "SERVER_ERROR";
      message = GENERIC_UNAVAILABLE_MESSAGE;
      status = 500;
    }
  } else if (isPrismaInitializationError(error)) {
    code = "SERVER_ERROR";
    message = GENERIC_UNAVAILABLE_MESSAGE;
    status = 500;
  }

  if (status >= 500) {
    // Corrección H-12: los 5xx (errores desconocidos, Prisma initialization,
    // etc.) se registraban solo con { context, code } y en producción era
    // imposible depurarlos. Ahora el log del servidor incluye el mensaje
    // interno y las primeras líneas del stack; la respuesta al cliente sigue
    // siendo el mensaje humano genérico, sin trazas ni detalles internos.
    const detail = error instanceof Error ? error.message : String(error);
    const stack =
      error instanceof Error && typeof error.stack === "string"
        ? error.stack.split("\n").slice(0, STACK_TRACE_LOG_LINES).join("\n")
        : undefined;
    logEvent("error", "api.error", { context, code, detail, stack });
  } else {
    logEvent("warn", "api.error", { context, code });
  }

  return errorResponse(code, message, status, details);
}

/**
 * Lee, parsea y valida el cuerpo JSON de una petición contra un esquema Zod.
 * - Si el cuerpo no es JSON válido → AppError("VALIDATION_ERROR", ..., 400,
 *   { reason: "json" }).
 * - Si el JSON no cumple el esquema → AppError("VALIDATION_ERROR") con los
 *   issues reducidos a { path, message } en `details`.
 * @param request Petición estándar de Runtime.
 * @param schema Esquema Zod tipado de destino.
 * @returns Datos ya validados y transformados por el esquema.
 */
export async function parseJsonBody<T>(
  request: Request,
  schema: ZodType<T, any, any>,
): Promise<T> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    throw new AppError(
      "VALIDATION_ERROR",
      "El cuerpo de la petición no está en un formato válido.",
      400,
      { reason: "json" },
    );
  }

  const result = schema.safeParse(rawBody);
  if (!result.success) {
    const issues = reduceZodIssues(result.error.issues);
    throw new AppError(
      "VALIDATION_ERROR",
      result.error.issues[0]?.message ??
        "Los datos enviados no cumplen el formato requerido.",
      400,
      issues,
    );
  }

  return result.data;
}

/**
 * Extrae los parámetros de búsqueda (searchParams) de una URL a un objeto
 * plano y los valida contra un esquema Zod, con la misma política de errores
 * que parseJsonBody (AppError "VALIDATION_ERROR" con issues { path, message }).
 * Si la URL no es parseable se lanza AppError con { reason: "url" }.
 * @param url URL completa de la petición (request.url).
 * @param schema Esquema Zod tipado de destino para la consulta.
 * @returns Parámetros validados y transformados.
 */
export async function parseQuery<T>(
  url: string,
  schema: ZodType<T, any, any>,
): Promise<T> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new AppError(
      "VALIDATION_ERROR",
      "La dirección de la consulta no tiene un formato válido.",
      400,
      { reason: "url" },
    );
  }

  const queryObject: Record<string, string> = {};
  parsedUrl.searchParams.forEach((value, key) => {
    queryObject[key] = value;
  });

  const result = schema.safeParse(queryObject);
  if (!result.success) {
    const issues = reduceZodIssues(result.error.issues);
    throw new AppError(
      "VALIDATION_ERROR",
      result.error.issues[0]?.message ??
        "Los parámetros de consulta no cumplen el formato requerido.",
      400,
      issues,
    );
  }

  return result.data;
}
