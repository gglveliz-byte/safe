/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Autenticación — Endpoint de Registro Ágil de Motociclistas
 * ARCHIVO: src/app/api/auth/register/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint público para el registro de cuenta de nuevos motociclistas
 * (POST /api/auth/register). Diseñado para la Fase 1 del Onboarding: registra
 * las credenciales del piloto (correo, nombre, celular, país y contraseña) sin
 * exigir el PIN del kit físico ni datos clínicos complejos en este paso inicial.
 *
 * Persiste la cuenta en PostgreSQL mediante transacción atómica (User + MedicalProfile
 * base con Habeas Data), aplica protección contra fuerza bruta por IP, y devuelve
 * confirmación 201 Created para que el usuario proceda a iniciar sesión en /login.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (módulo < 140 líneas).
 * - Cero datos hardcodeados o mocks de demostración.
 * - Runtime Node.js explícito y caché deshabilitada.
 * - Cabeceras y comentarios canónicos en Español.
 * ==============================================================================
 */

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { getClientIp } from "@/lib/request";
import { hmacSha256 } from "@/lib/crypto";
import {
  AppError,
  handleApiError,
  parseJsonBody,
  successResponse,
} from "@/lib/api-response";
import { RegisterRiderSchema } from "@/lib/schemas/auth.schema";
import { sendWelcomeEmail } from "@/services/mail.service";
import {
  RATE_LIMITS,
  enforceNotBlocked,
} from "@/services/ratelimit.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const ip = getClientIp(request);

    // 1. Control de tasa por IP para mitigar creación masiva de cuentas
    await enforceNotBlocked("loginIp", ip, RATE_LIMITS.loginIp);

    // 2. Validación estricta del cuerpo con Zod
    const input = await parseJsonBody(request, RegisterRiderSchema);

    // 3. Comprobación de unicidad de correo electrónico
    const existingUser = await db.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Este correo electrónico ya se encuentra registrado en SAFE.",
        409,
      );
    }

    // 4. Hash seguro de la contraseña con bcrypt coste 12
    const passwordHash = await bcrypt.hash(input.password, 12);
    const env = getEnv();

    // 5. Transacción atómica: User + MedicalProfile inicial
    const user = await db.$transaction(async (tx) => {
      return tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          role: "RIDER",
          isActive: true,
          medicalProfile: {
            create: {
              fullName: input.fullName,
              nationalId: "", // Se completa en el dashboard
              photoUrl: "", // Se completa en el dashboard
              bloodType: "DESCONOCIDO", // Se declara en el dashboard
              riderPhone: input.riderPhone,
              country: input.country ?? null,
              beneficiaryType: "SELF",
              isOrganDonor: false,
              emergencyContacts: [],
              locale: input.locale ?? "es",
              consentAcceptedAt: new Date(),
              consentVersion: env.TERMS_VERSION,
              consentIpHash: hmacSha256(ip),
            },
          },
        },
        select: {
          id: true,
          email: true,
        },
      });
    });

    // 6. Despacho asíncrono y resiliente del correo de bienvenida SAFE 2026
    const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    sendWelcomeEmail({
      email: user.email,
      fullName: input.fullName,
      deviceCode: input.deviceCode,
      loginUrl: `${appUrl}/login`,
      locale: input.locale === "en" ? "en" : "es",
    }).catch((err) => {
      console.error("[SAFE Auth] Error no bloqueante al enviar correo de bienvenida:", err);
    });

    return successResponse(
      {
        success: true,
        message: "Cuenta registrada exitosamente.",
        email: user.email,
        deviceCode: input.deviceCode ?? null,
      },
      201,
    );
  } catch (error) {
    return handleApiError(error, "auth.register");
  }
}
