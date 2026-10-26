/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Emergencia — Consulta Pública de Ficha Médica Protegida por Casco
 * ARCHIVO: src/app/api/emergency/[code]/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint público (GET /api/emergency/[code]) que devuelve la ficha médica
 * del motociclista asociado al folio del casco escaneado. Cualquier transeúnte,
 * paramédico o rescatista puede consultar los datos clínicos vitales (grupo
 * sanguíneo, alergias, medicamentos, contactos de emergencia) sin iniciar
 * sesión, para auxiliar al conductor en la vía.
 *
 * PROTECCIÓN DE IDENTIDAD (PII):
 * - La cédula NUNCA se expone completa: se ofusca con maskNationalId() para
 *   evitar el robo de identidad ante escaneos callejeros no autorizados
 *   (safe-security-and-compliance §5).
 * - Los contactos de emergencia NO exponen correo electrónico en esta vista:
 *   sólo se entrega el teléfono para llamada/WhatsApp directa del rescatista,
 *   mientras que los correos se reservan para el despacho SMTP de alertas.
 *
 * ANTI-ABUSO:
 * - Rate limit por IP con consumo real de cuota por petición (consumeThrottle,
 *   PUBLIC_EMERGENCY_IP_POLICY: 30 lecturas/minuto, 5 min de bloqueo) para
 *   frenar el raspado masivo de fichas médicas sin afectar al transeúnte
 *   legítimo que auxilia al conductor.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * - Runtime Node.js explícito y caché deshabilitada.
 * - Comentarios canónicos en Español.
 * ==============================================================================
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  handleApiError,
  successResponse,
  AppError,
} from "@/lib/api-response";
import { getClientIp } from "@/lib/request";
import { logEvent } from "@/lib/logger";
import { DeviceCodeParamSchema } from "@/lib/schemas/common.schema";
import {
  consumeThrottle,
  PUBLIC_EMERGENCY_IP_POLICY,
} from "@/services/throttle.service";
import { maskNationalId } from "@/services/pii-mask.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Forma mínima de los contactos de emergencia de la ficha pública (lectura
 * defensiva del JSONB, hallazgo H-16). Si el dato persistido no cumple la
 * forma, se registra el error y la ficha se entrega con lista vacía de
 * contactos: los datos clínicos (sangre, alergias, medicamentos) siguen
 * visibles y jamás se estrella la consulta en plena emergencia.
 */
const PublicContactsSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    relation: z.string(),
    phone: z.string(),
    isPrimary: z.boolean().optional(),
  }),
);

/**
 * Consulta pública de la ficha médica del motociclista vinculado al casco
 * escaneado. Devuelve datos clínicos vitales, fotografía de perfil y contactos
 * de emergencia (sólo teléfono, sin correo) para que el rescatista pueda
 * auxiliar al conductor sin necesidad de iniciar sesión. La cédula se ofusca
 * para proteger la identidad del titular ante escaneos callejeros abusivos.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
): Promise<NextResponse> {
  try {
    // 1. Extracción de la IP real del cliente (resolviendo proxies inversos).
    const ip = getClientIp(request);

    // 2. Rate limit por IP con consumo real de cuota (hallazgo H-01): cada
    //    lectura descuenta una unidad; al superar 30/min la IP se bloquea con 429.
    await consumeThrottle("public-emergency-ip", ip, PUBLIC_EMERGENCY_IP_POLICY);

    // 3. Validación estricta del folio del casco (Zod, normalización a mayúsculas).
    const code = DeviceCodeParamSchema.parse((await params).code);

    // 4. Búsqueda del dispositivo con su perfil médico y usuario asociado.
    const device = await db.device.findUnique({
      where: { code },
      select: {
        code: true,
        status: true,
        user: {
          select: {
            medicalProfile: {
              select: {
                fullName: true,
                nationalId: true,
                birthDate: true,
                bloodType: true,
                allergies: true,
                chronicConditions: true,
                medications: true,
                insuranceInfo: true,
                emergencyNumber: true,
                photoUrl: true,
                beneficiaryType: true,
                country: true,
                city: true,
                residentialAddress: true,
                riderPhone: true,
                age: true,
                isOrganDonor: true,
                medicalFindings: true,
                hasGuardian: true,
                rescueNotes: true,
                frequentLocation: true,
                vehicleInfo: true,
                emergencyContacts: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    // 5. Casco inexistente o no activo → 404 (no se revela si existe pero está inactivo).
    if (!device || device.status !== "ACTIVE") {
      throw new AppError(
        "NOT_FOUND",
        "El casco no está activo o no existe.",
        404,
      );
    }

    // 6. Casco sin usuario o sin perfil médico registrado → 404.
    if (!device.user || !device.user.medicalProfile) {
      throw new AppError(
        "NOT_FOUND",
        "El casco no tiene perfil médico registrado.",
        404,
      );
    }

    // 7. Ofuscación de la cédula: la ficha es pública pero el documento de
    //    identidad se protege para evitar robo de identidad en la vía.
    const nationalIdMasked = maskNationalId(device.user.medicalProfile.nationalId);

    // 8. Extracción de contactos de emergencia con lectura defensiva del
    //    JSONB (hallazgo H-16): safeParse con la forma mínima pública (id,
    //    nombre, parentesco, teléfono y marca de primario). El correo NO se
    //    expone aquí: se reserva para el despacho SMTP de alertas. Si el
    //    dato persistido está corrupto → lista vacía + log de error; la
    //    ficha sigue mostrando los datos clínicos del piloto.
    const contactsResult = PublicContactsSchema.safeParse(
      device.user.medicalProfile.emergencyContacts,
    );

    if (!contactsResult.success) {
      logEvent("error", "Contactos de emergencia JSONB inválidos en ficha pública", {
        deviceCode: device.code,
      });
    }

    const contacts = (contactsResult.success ? contactsResult.data : []).map((c) => ({
      id: c.id,
      name: c.name,
      relation: c.relation,
      phone: c.phone,
      isPrimary: c.isPrimary ?? false,
    }));

    // 9. Respuesta exitosa con la ficha médica protegida.
    return successResponse({
      device: {
        code: device.code,
        status: device.status,
      },
      profile: {
        fullName: device.user.medicalProfile.fullName,
        nationalIdMasked,
        birthDate: device.user.medicalProfile.birthDate,
        bloodType: device.user.medicalProfile.bloodType,
        allergies: device.user.medicalProfile.allergies,
        chronicConditions: device.user.medicalProfile.chronicConditions,
        medications: device.user.medicalProfile.medications,
        insuranceInfo: device.user.medicalProfile.insuranceInfo,
        emergencyNumber: device.user.medicalProfile.emergencyNumber,
        photoUrl: device.user.medicalProfile.photoUrl,
        beneficiaryType: device.user.medicalProfile.beneficiaryType,
        country: device.user.medicalProfile.country,
        city: device.user.medicalProfile.city,
        residentialAddress: device.user.medicalProfile.residentialAddress,
        riderPhone: device.user.medicalProfile.riderPhone,
        age: device.user.medicalProfile.age,
        isOrganDonor: device.user.medicalProfile.isOrganDonor,
        medicalFindings: device.user.medicalProfile.medicalFindings,
        hasGuardian: device.user.medicalProfile.hasGuardian,
        rescueNotes: device.user.medicalProfile.rescueNotes,
        frequentLocation: device.user.medicalProfile.frequentLocation,
        vehicleInfo: device.user.medicalProfile.vehicleInfo,
        emergencyContacts: contacts,
      },
      updatedAt: device.user.medicalProfile.updatedAt.toISOString(),
    });
  } catch (error) {
    // 10. Traducción unificada de errores (AppError, Zod, Prisma, genéricos).
    return handleApiError(error, "consulta-ficha-medica");
  }
}
