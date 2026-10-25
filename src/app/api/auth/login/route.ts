/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Autenticación — Endpoint de Inicio de Sesión
 * ARCHIVO: src/app/api/auth/login/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint seguro para el inicio de sesión de motociclistas y administradores
 * (POST /api/auth/login). Valida las credenciales contra la base de datos
 * PostgreSQL mediante Bcrypt, aplica protección estricta contra ataques de
 * fuerza bruta (ventanas deslizantes por correo y por IP) mediante el servicio
 * RateLimitBucket, y emite una cookie de sesión HttpOnly segura firmada con jose.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o demos.
 * - Runtime Node.js explícito y caché deshabilitada.
 * - Cabeceras y comentarios canónicos en Español.
 * ==============================================================================
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  handleApiError,
  parseJsonBody,
  successResponse,
  AppError,
} from "@/lib/api-response";
import { getRequestContext } from "@/lib/request";
import { LoginSchema } from "@/lib/schemas/auth.schema";
import {
  verifyPassword,
  applySessionCookie,
  signToken,
  type SessionRole,
} from "@/lib/auth";
import {
  RATE_LIMITS,
  enforceNotBlocked,
  recordRateLimitFailure,
  clearRateLimit,
} from "@/services/ratelimit.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  const context = getRequestContext(request);

  try {
    // 1. Validar cuerpo de la petición con Zod
    const input = await parseJsonBody(request, LoginSchema);

    // 2. Control anti-fuerza bruta: verificar si la IP o el correo están bloqueados
    await enforceNotBlocked("loginIp", context.ip, RATE_LIMITS.loginIp);
    await enforceNotBlocked("login", input.email, RATE_LIMITS.login);

    // 3. Buscar usuario en PostgreSQL
    const user = await db.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
      },
    });

    if (!user) {
      // Registrar fallo por IP y por correo para activar penalización
      await recordRateLimitFailure("loginIp", context.ip, RATE_LIMITS.loginIp);
      await recordRateLimitFailure("login", input.email, RATE_LIMITS.login);

      throw new AppError(
        "UNAUTHORIZED",
        "Credenciales de acceso incorrectas. Verifique su correo y contraseña.",
        401,
      );
    }

    // 4. Verificar contraseña con Bcrypt
    const isPasswordValid = await verifyPassword(
      input.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      await recordRateLimitFailure("loginIp", context.ip, RATE_LIMITS.loginIp);
      await recordRateLimitFailure("login", input.email, RATE_LIMITS.login);

      throw new AppError(
        "UNAUTHORIZED",
        "Credenciales de acceso incorrectas. Verifique su correo y contraseña.",
        401,
      );
    }

    // 5. Limpiar historial de intentos fallidos al tener éxito
    await clearRateLimit("login", input.email);

    // 6. Generar JWT firmado con jose HS256
    const role = user.role as SessionRole;
    const token = await signToken({
      sub: user.id,
      email: user.email,
      role,
    });

    // 7. Determinar redirección según privilegios
    const redirect = role === "ADMIN" ? "/admin" : "/dashboard";

    const response = successResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          role,
        },
        redirect,
      },
      200,
    );

    // 8. Inyectar cookie HttpOnly en la respuesta
    applySessionCookie(response, token);

    return response;
  } catch (error) {
    return handleApiError(error, "POST /api/auth/login");
  }
}
