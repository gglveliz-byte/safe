/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Activación de Kit — Endpoint Público de Alta de Motociclista
 * ARCHIVO: src/app/api/devices/activate/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint público `POST /api/devices/activate` que consuma el flujo completo
 * de alta de un motociclista sobre un casco SAFE virgen (Device UNCLAIMED).
 * Valida el folio y el PIN confidencial de 6 dígitos contra PostgreSQL, crea
 * la cuenta del Rider con su MedicalProfile en una transacción atómica,
 * registra el consentimiento legal (Habeas Data / GDPR) con la IP hasheada
 * mediante HMAC-SHA256 (jamás la IP cruda), emite cookie de sesión JWT
 * HttpOnly y redirige al dashboard.
 *
 * SEGURIDAD:
 * - Rate limit estricto del PIN por `code:ip` (5 intentos / 15 min / bloqueo
 *   15 min) mediante `throttle.service.ts` (skill safe-security-and-compliance §2).
 * - Verificación del PIN con bcrypt (coste 10 almacenado en Device).
 * - Contraseña de la cuenta con bcrypt coste 12.
 * - Consentimiento con `consentAcceptedAt`, `consentVersion` (TERMS_VERSION)
 *   y `consentIpHash` = hmacSha256(ip).
 *
 * CONTRATO: docs/BACKEND_CONTRACTS.md §9 (POST /api/devices/activate).
 *
 * ENTRADAS: JSON body validado por ActivateDeviceSchema (Zod strict).
 * SALIDAS: 201 con { redirect, deviceCode, user } + cookie safe_session,
 *          o error canónico (400/403/404/429/500) con mensaje humano en Español.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o demos.
 * - Runtime Node.js explícito y caché deshabilitada.
 * - Cabeceras y comentarios canónicos en Español.
 * ==============================================================================
 */

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { getClientIp } from "@/lib/request";
import { logEvent } from "@/lib/logger";
import { hmacSha256 } from "@/lib/crypto";
import { signToken, buildSessionCookie } from "@/lib/auth-token";
import {
  AppError,
  errorResponse,
  handleApiError,
  parseJsonBody,
  successResponse,
} from "@/lib/api-response";
import { ActivateDeviceSchema } from "@/lib/schemas/activate.schema";
import {
  clearThrottle,
  ensureThrottleAllowed,
  pinPolicy,
  registerThrottleFailure,
} from "@/services/throttle.service";

/**
 * Configuración canónica del route handler: runtime Node.js (Prisma, bcrypt y
 * crypto requieren módulos nativos) y fuerza dinámica para deshabilitar cualquier
 * caché de ruta estática de Next.js.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Handler público de activación de un casco SAFE.
 *
 * Flujo completo:
 *   1. Extrae la IP del cliente (proxy-aware) para el rate limit y el consentimiento.
 *   2. Valida el body contra ActivateDeviceSchema (Zod strict).
 *   3. Aplica el guard anti-fuerza-bruta del PIN por `code:ip`.
 *   4. Busca el Device por folio y exige estado activable: UNCLAIMED virgen
 *      o ACTIVE sin cuenta vinculada (chip "zombi" liberado por SetNull).
 *   5. Verifica el PIN con bcrypt contra `activationPinHash`.
 *   6. Verifica que el correo no esté ya registrado.
 *   7. Hashea la contraseña con bcrypt coste 12.
 *   8. Transacción atómica: User + MedicalProfile (con locale) + Device(ACTIVE)
 *      vía updateMany condicional anti-carrera; la limpieza de intentos de PIN
 *      ocurre DESPUÉS del commit y es tolerante a fallos.
 *   9. Firma JWT HS256, construye cookie HttpOnly y responde 201 con Set-Cookie.
 *
 * @param request Petición estándar de Runtime con body JSON.
 * @returns NextResponse 201 con payload de redirección o error canónico.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 1. IP del cliente para rate limit y huella de consentimiento (HMAC).
    const ip = getClientIp(request);

    // 2. Validación estricta del body contra el esquema Zod de activación.
    const input = await parseJsonBody(request, ActivateDeviceSchema);

    // 3. Guard anti-fuerza-bruta del PIN: 5 intentos / 15 min / bloqueo 15 min.
    //    Lanza AppError("RATE_LIMIT", 429) si el bucket está bloqueado.
    await ensureThrottleAllowed("pin", `${input.code}:${ip}`, pinPolicy());

    // 4. Búsqueda del dispositivo por folio único. Estado activable (hallazgo
    //    H-04): UNCLAIMED virgen de fábrica, o ACTIVE sin userId (chip
    //    "zombi" cuya cuenta fue borrada y la relación SetNull liberó el
    //    hardware para re-activación). ACTIVE con rider o DISABLED → 404.
    const device = await db.device.findUnique({
      where: { code: input.code },
      select: {
        id: true,
        code: true,
        status: true,
        userId: true,
        activationPinHash: true,
      },
    });

    if (
      !device ||
      !(
        device.status === "UNCLAIMED" ||
        (device.status === "ACTIVE" && device.userId === null)
      )
    ) {
      throw new AppError(
        "NOT_FOUND",
        "El casco no está disponible para activación.",
        404,
      );
    }

    // 5. Verificación criptográfica del PIN con bcrypt (coste 10 en el hash
    //    almacenado). Si falla, se registra el intento fallido para el guard.
    const pinValid = await bcrypt.compare(input.activationPin, device.activationPinHash);

    if (!pinValid) {
      await registerThrottleFailure("pin", `${input.code}:${ip}`, pinPolicy());
      return errorResponse(
        "FORBIDDEN",
        "El PIN de activación es incorrecto.",
        403,
      );
    }

    // 6. El correo debe ser libre: un Device solo puede activarse una vez, pero
    //    la cuenta del Rider también exige email único (User.email @unique).
    const existingUser = await db.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new AppError(
        "VALIDATION_ERROR",
        "El correo ya está registrado.",
        400,
      );
    }

    // 7. Hash seguro de la contraseña con bcrypt coste 12 (contrato §5).
    const passwordHash = await bcrypt.hash(input.password, 12);

    // 8. Transacción atómica: User + MedicalProfile anidado + Device(ACTIVE).
    //    Si cualquier paso falla, Prisma hace rollback completo y el Device
    //    sigue UNCLAIMED para un reintento legítimo.
    const user = await db.$transaction(async (tx) => {
      // 8a. Crear el Rider con su ficha médica en una sola escritura atómica.
      //     El consentimiento legal incluye la versión vigente de los términos
      //     y la huella HMAC de la IP (nunca la IP cruda, por Habeas Data).
      const createdUser = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          role: "RIDER",
          isActive: true,
          medicalProfile: {
            create: {
              fullName: input.fullName,
              nationalId: input.nationalId,
              photoUrl: input.photoUrl,
              photoPublicId: input.photoPublicId ?? null,
              birthDate: input.birthDate ?? null,
              bloodType: input.bloodType,
              allergies: input.allergies ?? null,
              chronicConditions: input.chronicConditions ?? null,
              medications: input.medications ?? null,
              insuranceInfo: input.insuranceInfo ?? null,
              emergencyNumber: input.emergencyNumber ?? null,
              beneficiaryType: input.beneficiaryType ?? "SELF",
              country: input.country ?? null,
              city: input.city ?? null,
              residentialAddress: input.residentialAddress ?? null,
              riderPhone: input.riderPhone ?? null,
              age: input.age ?? null,
              isOrganDonor: input.isOrganDonor ?? false,
              medicalFindings: input.medicalFindings ?? null,
              hasGuardian: input.hasGuardian ?? false,
              rescueNotes: input.rescueNotes ?? null,
              frequentLocation: input.frequentLocation ?? null,
              vehicleInfo: input.vehicleInfo ?? null,
              emergencyContacts: input.emergencyContacts,
              // Idioma preferido para los correos de alerta (hallazgo H-07);
              // el esquema Zod lo entrega como "es" | "en" | undefined.
              locale: input.locale ?? "es",
              consentAcceptedAt: new Date(),
              consentVersion: getEnv().TERMS_VERSION,
              consentIpHash: hmacSha256(ip),
            },
          },
        },
      });

      // 8b. Vinculación atómica del Device al Rider con updateMany
      //     condicional (hallazgo H-02, candado optimista): sólo avanza si el
      //     casco SIGUE libre (userId null) y en estado activable. Si otra
      //     activación concurrente ganó la carrera, count vale 0 y se lanza
      //     404 para forzar el rollback completo: jamás dos Users por un chip.
      //     Cubre además el chip "zombi" (ACTIVE con userId null).
      const claimed = await tx.device.updateMany({
        where: {
          id: device.id,
          userId: null,
          status: { in: ["UNCLAIMED", "ACTIVE"] },
        },
        data: {
          status: "ACTIVE",
          userId: createdUser.id,
          activatedAt: new Date(),
        },
      });

      if (claimed.count !== 1) {
        throw new AppError(
          "NOT_FOUND",
          "El casco no está disponible para activación.",
          404,
        );
      }

      return createdUser;
    });

    // 8c. Limpieza de los intentos de PIN DESPUÉS del commit exitoso
    //     (hallazgo H-08): clearThrottle opera con el cliente global y no
    //     debe correr dentro de la transacción. Su fallo se tolera con un
    //     log de error y jamás aborta la activación ya persistida.
    try {
      await clearThrottle("pin", `${input.code}:${ip}`);
    } catch {
      logEvent("error", "No se pudo limpiar el bucket de intentos de PIN tras activación", {
        deviceCode: input.code,
      });
    }

    // 9. Firma del JWT HS256 con los claims canónicos (sub, email, role).
    const token = await signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // 10. Construcción de la cookie HttpOnly segura y respuesta 201 con
    //     Set-Cookie manual para que el navegador la almacene antes de la
    //     redirección al dashboard.
    const cookie = buildSessionCookie(token);
    const cookieParts = [
      `${cookie.name}=${cookie.value}`,
      `Max-Age=${cookie.options.maxAge}`,
      `Path=${cookie.options.path}`,
      "HttpOnly",
      `SameSite=${cookie.options.sameSite}`,
    ];
    if (cookie.options.secure) {
      cookieParts.push("Secure");
    }
    const setCookieHeader = cookieParts.join("; ");

    return successResponse(
      {
        redirect: "/dashboard",
        deviceCode: input.code,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
      201,
      { "Set-Cookie": setCookieHeader },
    );
  } catch (error) {
    // Traductor unificado de errores: AppError, ZodError, Prisma y genéricos
    // a respuestas canónicas con mensaje humano en Español.
    return handleApiError(error, "activacion-kit");
  }
}
