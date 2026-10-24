/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Autenticación — Firma y Verificación de Sesiones (Edge-Safe)
 * ARCHIVO: src/lib/auth-token.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Núcleo criptográfico de las sesiones de SAFE. Firma y verifica tokens JWT
 * (HS256) con `jose`, único módulo autorizado para ser importado desde el
 * middleware de Edge. Define el nombre canónico de la cookie, el contenido del
 * token y la construcción exacta de las cookies HttpOnly de sesión y de cierre.
 * No conoce Prisma, bcrypt ni el almacén de cookies de Next.js: recibe y
 * devuelve valores puros para poder ejecutarse tanto en Edge como en Node.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Cero datos hardcodeados o demos.
 * - Solo dependencias Edge-safe: `jose` y validación de entorno.
 * ==============================================================================
 */

import { SignJWT, jwtVerify } from "jose";

import { getEnv } from "@/lib/env";

/** Nombre canónico de la cookie de sesión; compartido por Edge y Node. */
export const SESSION_COOKIE = "safe_session" as const;

/** Roles válidos dentro de la plataforma SAFE. */
export type SessionRole = "RIDER" | "ADMIN";

/** Contenido mínimo y verificado que viaja dentro del token de sesión. */
export interface SessionPayload {
  /** Identificador UUID del usuario autenticado. */
  sub: string;
  /** Correo electrónico asociado a la cuenta. */
  email: string;
  /** Rol que determina el alcance de la sesión. */
  role: SessionRole;
}

/** Emisor firmante exigido al verificar un token. */
const JWT_ISSUER = "safe";

/** Audiencia lógica de la aplicación SAFE. */
const JWT_AUDIENCE = "safe-app";

/** Algoritmo simétrico aprobado por el contrato de seguridad. */
const JWT_ALGORITHM = "HS256";

/** Opciones exactas de la cookie de sesión emitida al navegador. */
interface SessionCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
}

/** Descriptor completo de cookie listo para `NextResponse.cookies.set`. */
interface SessionCookieDescriptor {
  name: typeof SESSION_COOKIE;
  value: string;
  options: SessionCookieOptions;
}

/**
 * Deriva la clave simétrica HS256 desde el entorno validado.
 * Se invoca dentro de cada operación para no congelar secretos al importar
 * el módulo (requisito de arranque de Next.js y de entornos Edge).
 */
function getSigningKey(): Uint8Array {
  return new TextEncoder().encode(getEnv().JWT_SECRET);
}

/**
 * Indica si la aplicación corre en producción.
 * En producción la cookie exige `Secure`; en desarrollo local se omite para
 * permitir HTTP sin exponer la sesión fuera del equipo del desarrollador.
 */
function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Devuelve la vigencia de sesión configurada por entorno.
 * El valor por defecto seguro (2592000 segundos) lo resuelve `getEnv()`.
 */
export function sessionTtlSeconds(): number {
  return getEnv().SESSION_TTL_SECONDS;
}

/**
 * Firma un token JWT de sesión con HS256.
 * @param payload Identificador, correo y rol del usuario autenticado.
 * @param ttlSeconds Vigencia opcional en segundos; si es inválida se usa la
 *                   vigencia configurada en el entorno.
 * @returns Token compacto firmado, listo para viajar en la cookie HttpOnly.
 */
export async function signToken(
  payload: SessionPayload,
  ttlSeconds?: number,
): Promise<string> {
  const requestedTtl =
    typeof ttlSeconds === "number" &&
    Number.isFinite(ttlSeconds) &&
    ttlSeconds > 0
      ? Math.floor(ttlSeconds)
      : sessionTtlSeconds();
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + requestedTtl;

  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: JWT_ALGORITHM, typ: "JWT" })
    .setSubject(payload.sub)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt(issuedAt)
    .setExpirationTime(expiresAt)
    .sign(getSigningKey());
}

/**
 * Verifica la firma, emisor, audiencia y vigencia de un token de sesión.
 * Cualquier anomalía (token vacío, firma inválida, expirado, claims ausentes,
 * rol desconocido o entorno incompleto) se resuelve como `null`, nunca como
 * una excepción que pueda filtrar detalles internos.
 */
export async function verifyToken(
  token: string,
): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSigningKey(), {
      algorithms: [JWT_ALGORITHM],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    const subject = payload.sub;
    const email = payload.email;
    const role = payload.role;

    if (typeof subject !== "string" || subject.length === 0) {
      return null;
    }
    if (typeof email !== "string" || email.length === 0) {
      return null;
    }
    if (role !== "RIDER" && role !== "ADMIN") {
      return null;
    }

    return { sub: subject, email, role };
  } catch {
    return null;
  }
}

/**
 * Construye la cookie de sesión exacta del contrato: HttpOnly, Secure solo en
 * producción, SameSite=Lax, Path=/ y Max-Age igual a la vigencia configurada.
 * @param token Token JWT previamente firmado con `signToken`.
 */
export function buildSessionCookie(token: string): SessionCookieDescriptor {
  return {
    name: SESSION_COOKIE,
    value: token,
    options: {
      httpOnly: true,
      secure: isProductionRuntime(),
      sameSite: "lax",
      path: "/",
      maxAge: sessionTtlSeconds(),
    },
  };
}

/**
 * Construye la cookie de cierre inmediato de sesión.
 * Conserva todas las banderas de seguridad y fuerza `Max-Age=0` con valor
 * vacío para que el navegador elimine la credencial anterior.
 */
export function buildClearedSessionCookie(): SessionCookieDescriptor {
  return {
    name: SESSION_COOKIE,
    value: "",
    options: {
      httpOnly: true,
      secure: isProductionRuntime(),
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    },
  };
}
