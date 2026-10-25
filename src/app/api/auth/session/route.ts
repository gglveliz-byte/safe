/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Autenticación — Endpoint de Verificación de Sesión Activa
 * ARCHIVO: src/app/api/auth/session/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint ligero para consultar el estado de autenticación de la sesión
 * (GET /api/auth/session). Verifica la firma de la cookie HttpOnly mediante jose
 * y consulta el usuario en PostgreSQL, entregando el estado booleano
 * `{ authenticated: boolean, user?: { id, email, role } }`.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Runtime Node.js explícito y caché deshabilitada.
 * - Comentarios canónicos en Español.
 * ==============================================================================
 */

import { NextResponse } from "next/server";
import { handleApiError, successResponse } from "@/lib/api-response";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const user = await getSessionUser(request);

    if (!user) {
      return successResponse({ authenticated: false }, 200);
    }

    return successResponse(
      {
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
      200,
    );
  } catch (error) {
    return handleApiError(error, "GET /api/auth/session");
  }
}
