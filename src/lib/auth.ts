/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Autenticación — Sesiones, Bcrypt y Control de Acceso (Node.js)
 * ARCHIVO: src/lib/auth.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Núcleo de autenticación para el runtime Node.js de la plataforma SAFE.
 * Proporciona funciones para hash y verificación de contraseñas de usuarios
 * y PINs de activación mediante Bcrypt, resolución de sesión activa desde
 * cookies HttpOnly o cabeceras de petición, obtención del usuario persistido
 * en PostgreSQL vía Prisma, y guardianes de ruta estrictos (requireRider y
 * requireAdmin) que lanzan excepciones AppError (UNAUTHORIZED o FORBIDDEN)
 * ante anomalías de permisos.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o demos.
 * - Cabeceras y comentarios canónicos en Español.
 * - Uso exclusivo de cookies HttpOnly seguras con jose y Bcrypt.
 * ==============================================================================
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { safeEqual } from "@/lib/crypto";
import { AppError } from "@/lib/api-response";
import {
  SESSION_COOKIE,
  type SessionPayload,
  type SessionRole,
  verifyToken,
  buildSessionCookie,
  buildClearedSessionCookie,
  signToken,
} from "@/lib/auth-token";

export { signToken, verifyToken, type SessionPayload, type SessionRole };

/**
 * Datos del usuario autenticado devueltos por la base de datos PostgreSQL.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: SessionRole;
  isActive: boolean;
  liveRideActive: boolean;
  lastKnownLat: number | null;
  lastKnownLng: number | null;
  lastGpsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Genera el hash seguro de una contraseña con un factor de costo 12.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verifica una contraseña en texto plano contra el hash almacenado en base de datos.
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Genera el hash del PIN de activación de 6 dígitos con un factor de costo 10.
 */
export async function hashActivationPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

/**
 * Verifica un PIN de activación de 6 dígitos contra su hash.
 */
export async function verifyActivationPin(
  pin: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

/**
 * Extrae el valor de la cookie de sesión desde un objeto Request o desde cookies().
 */
async function extractTokenFromRequestOrCookies(
  request?: Request,
): Promise<string | null> {
  if (request) {
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${SESSION_COOKIE}=`));
      if (match) {
        return match.substring(SESSION_COOKIE.length + 1);
      }
    }
  }

  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE);
    return sessionCookie?.value ?? null;
  } catch {
    return null;
  }
}

/**
 * Obtiene y valida el payload de la sesión activa del usuario.
 * Retorna `null` si no hay token, si expiró o si la firma es inválida.
 */
export async function getSession(
  request?: Request,
): Promise<SessionPayload | null> {
  const token = await extractTokenFromRequestOrCookies(request);
  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Obtiene el registro completo del usuario autenticado desde PostgreSQL.
 */
export async function getSessionUser(
  request?: Request,
): Promise<AuthenticatedUser | null> {
  const session = await getSession(request);
  if (!session) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      liveRideActive: true,
      lastKnownLat: true,
      lastKnownLng: true,
      lastGpsAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    ...user,
    role: user.role as SessionRole,
  };
}

/**
 * Exige que la petición provenga de un motociclista con sesión activa y rol
 * RIDER explícito. Lanza AppError("UNAUTHORIZED") si no hay sesión o la cuenta
 * no existe, y AppError("FORBIDDEN") si el usuario NO es motociclista (por
 * ejemplo una sesión ADMIN, que jamás debe escribir telemetría GPS del piloto
 * ni editar fichas médicas ajenas — hallazgo #2).
 */
export async function requireRider(
  request?: Request,
): Promise<{ user: AuthenticatedUser; session: SessionPayload }> {
  const session = await getSession(request);
  if (!session) {
    throw new AppError(
      "UNAUTHORIZED",
      "Debe iniciar sesión para acceder a este recurso.",
      401,
    );
  }

  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      liveRideActive: true,
      lastKnownLat: true,
      lastKnownLng: true,
      lastGpsAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError(
      "UNAUTHORIZED",
      "La cuenta asociada a la sesión no existe en el sistema.",
      401,
    );
  }

  // Verificar si la cuenta ha sido desactivada por la administración
  if (user.isActive === false) {
    throw new AppError(
      "FORBIDDEN",
      "Su cuenta de motociclista se encuentra desactivada temporalmente.",
      403,
    );
  }

  // Hallazgo #2 (CRÍTICO): exigir el rol RIDER de forma explícita. Sin esta
  // guarda, una sesión ADMIN superaba el check y podía corromper la telemetría
  // GPS del motociclista (heartbeat) o su ficha médica (perfil), mezclando
  // identidades en el ledger médico en tiempo real.
  if (user.role !== "RIDER") {
    throw new AppError(
      "FORBIDDEN",
      "Esta operación requiere una sesión de conductor.",
      403,
    );
  }

  return {
    user: {
      ...user,
      role: user.role as SessionRole,
    },
    session,
  };
}

/**
 * Exige privilegios de administrador para la petición.
 * Acepta la clave maestra `x-admin-key` (tiempo constante contra ADMIN_MASTER_KEY)
 * o una cookie con rol ADMIN.
 */
export async function requireAdmin(
  request?: Request,
): Promise<{ session: SessionPayload | null; isMasterKey: boolean }> {
  if (request) {
    const adminKeyHeader =
      request.headers.get("x-admin-key") ||
      request.headers.get("X-Admin-Key") ||
      request.headers.get("x-admin-master-key");

    if (adminKeyHeader) {
      const expectedKey = getEnv().ADMIN_MASTER_KEY;
      if (safeEqual(adminKeyHeader.trim(), expectedKey)) {
        return { session: null, isMasterKey: true };
      }
    }
  }

  const session = await getSession(request);
  if (session && session.role === "ADMIN") {
    return { session, isMasterKey: false };
  }

  if (!session) {
    throw new AppError(
      "UNAUTHORIZED",
      "Debe iniciar sesión como administrador para acceder a este recurso.",
      401,
    );
  }

  throw new AppError(
    "FORBIDDEN",
    "Acceso denegado: se requieren credenciales administrativas autorizadas.",
    403,
  );
}

/**
 * Aplica la cookie HttpOnly de sesión a una respuesta NextResponse.
 */
export function applySessionCookie(response: NextResponse, token: string): void {
  const cookieDesc = buildSessionCookie(token);
  response.cookies.set(cookieDesc.name, cookieDesc.value, cookieDesc.options);
}

/**
 * Aplica la cookie de revocación inmediata (expirada) a una respuesta NextResponse.
 */
export function clearSessionCookie(response: NextResponse): void {
  const clearedCookie = buildClearedSessionCookie();
  response.cookies.set(
    clearedCookie.name,
    clearedCookie.value,
    clearedCookie.options,
  );
}
