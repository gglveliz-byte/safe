/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Telemetría — Heartbeat de Posición GPS en Vivo para Modo Ruta
 * ARCHIVO: src/app/api/gps/heartbeat/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint de telemetría de ruta (POST /api/gps/heartbeat) que recibe la
 * posición GPS capturada periódicamente por el dispositivo móvil del motociclista
 * cada 15 a 30 segundos mientras viaja en carretera.
 *
 * Exige autenticación estricta con rol RIDER vía cookie HttpOnly, valida las
 * coordenadas mediante HeartbeatSchema y persiste la última posición conocida
 * en User.lastKnownLat, User.lastKnownLng, User.lastGpsAt y User.liveRideActive
 * para servir como respaldo en caso de impacto donde el sensor no responda.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o simulados.
 * - Runtime Node.js explícito y caché deshabilitada.
 * - Comentarios canónicos en Español.
 * ==============================================================================
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError, parseJsonBody, successResponse } from "@/lib/api-response";
import { requireRider } from "@/lib/auth";
import { HeartbeatSchema } from "@/lib/schemas/profile.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 1. Exigir autenticación del motociclista
    const { user } = await requireRider(request);

    // 2. Validar coordenadas con Zod
    const input = await parseJsonBody(request, HeartbeatSchema);

    const now = new Date();
    const liveRideActive = input.active !== undefined ? input.active : true;

    // 3. Persistir telemetría en base de datos
    await db.user.update({
      where: { id: user.id },
      data: {
        lastKnownLat: input.lat,
        lastKnownLng: input.lng,
        lastGpsAt: now,
        liveRideActive,
      },
    });

    return successResponse(
      {
        recordedAt: now.toISOString(),
        liveRideActive,
      },
      200,
    );
  } catch (error) {
    return handleApiError(error, "POST /api/gps/heartbeat");
  }
}
