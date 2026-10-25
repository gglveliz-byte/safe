/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Autenticación — Endpoint de Cierre de Sesión
 * ARCHIVO: src/app/api/auth/logout/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint para revocación y cierre de sesión de la plataforma (POST /api/auth/logout).
 * Emite una cookie HttpOnly con Max-Age=0 y valor vacío para eliminar la
 * credencial en el navegador del usuario de forma inmediata y definitiva.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Runtime Node.js explícito y caché deshabilitada.
 * - Comentarios canónicos en Español.
 * ==============================================================================
 */

import { NextResponse } from "next/server";
import { handleApiError, successResponse } from "@/lib/api-response";
import { clearSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(): Promise<NextResponse> {
  try {
    const response = successResponse({ loggedOut: true }, 200);
    clearSessionCookie(response);
    return response;
  } catch (error) {
    return handleApiError(error, "POST /api/auth/logout");
  }
}
