/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Perfil Médico — Consulta y Actualización de Ficha Clínica y Contactos
 * ARCHIVO: src/app/api/profile/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint privado para la gestión de la ficha médica y contactos de auxilio
 * del motociclista (GET /api/profile y PUT /api/profile).
 *
 * GET: Devuelve los datos clínicos, fotografía de perfil, estado del Modo Ruta,
 * última posición GPS registrada y el folio de casco vinculado.
 *
 * PUT: Valida de manera estricta los campos modificados mediante ProfileUpdateSchema
 * y actualiza la fila MedicalProfile en PostgreSQL garantizando la persistencia
 * de contactos en formato JSONB.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o contactos simulados.
 * - Runtime Node.js explícito y caché deshabilitada.
 * - Comentarios canónicos en Español.
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
import { requireRider } from "@/lib/auth";
import { ProfileUpdateSchema } from "@/lib/schemas/profile.schema";
import { getAdminPinDispatchConfig } from "@/services/settings.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Consulta la ficha médica completa, contactos de emergencia y dispositivo del motociclista.
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { user } = await requireRider(request);

    const [fullRecord, pinDispatchConfig] = await Promise.all([
      db.user.findUnique({
        where: { id: user.id },
        include: {
          medicalProfile: true,
          device: {
            select: {
              code: true,
              status: true,
              isNfcEncoded: true,
              createdAt: true,
            },
          },
        },
      }),
      getAdminPinDispatchConfig(),
    ]);

    if (!fullRecord) {
      throw new AppError("NOT_FOUND", "Usuario no encontrado.", 404);
    }

    return successResponse(
      {
        user: {
          id: fullRecord.id,
          email: fullRecord.email,
          role: fullRecord.role,
          liveRideActive: fullRecord.liveRideActive,
          lastKnownLat: fullRecord.lastKnownLat,
          lastKnownLng: fullRecord.lastKnownLng,
          lastGpsAt: fullRecord.lastGpsAt ? fullRecord.lastGpsAt.toISOString() : null,
        },
        profile: fullRecord.medicalProfile,
        device: fullRecord.device,
        isPinDispatchMode: pinDispatchConfig.enabled,
      },
      200,
    );
  } catch (error) {
    return handleApiError(error, "GET /api/profile");
  }
}

/**
 * Actualiza la información clínica y/o los contactos de emergencia del motociclista.
 */
export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const { user } = await requireRider(request);
    const input = await parseJsonBody(request, ProfileUpdateSchema);

    // Preparar objeto de mutación para Prisma
    const updateData: Record<string, unknown> = {};

    if (input.fullName !== undefined) updateData.fullName = input.fullName;
    if (input.nationalId !== undefined) updateData.nationalId = input.nationalId;
    if (input.photoUrl !== undefined) updateData.photoUrl = input.photoUrl;
    if (input.photoPublicId !== undefined) updateData.photoPublicId = input.photoPublicId;
    if (input.idCardFrontUrl !== undefined) updateData.idCardFrontUrl = input.idCardFrontUrl || null;
    if (input.idCardFrontPublicId !== undefined) updateData.idCardFrontPublicId = input.idCardFrontPublicId || null;
    if (input.idCardBackUrl !== undefined) updateData.idCardBackUrl = input.idCardBackUrl || null;
    if (input.idCardBackPublicId !== undefined) updateData.idCardBackPublicId = input.idCardBackPublicId || null;
    if (input.birthDate !== undefined) updateData.birthDate = input.birthDate;
    if (input.bloodType !== undefined) updateData.bloodType = input.bloodType;
    if (input.allergies !== undefined) updateData.allergies = input.allergies || null;
    if (input.chronicConditions !== undefined) updateData.chronicConditions = input.chronicConditions || null;
    if (input.medications !== undefined) updateData.medications = input.medications || null;
    if (input.insuranceInfo !== undefined) updateData.insuranceInfo = input.insuranceInfo || null;
    if (input.emergencyNumber !== undefined) updateData.emergencyNumber = input.emergencyNumber || null;
    if (input.beneficiaryType !== undefined) updateData.beneficiaryType = input.beneficiaryType;
    if (input.country !== undefined) updateData.country = input.country || null;
    if (input.city !== undefined) updateData.city = input.city || null;
    if (input.residentialAddress !== undefined) updateData.residentialAddress = input.residentialAddress || null;
    if (input.riderPhone !== undefined) updateData.riderPhone = input.riderPhone || null;
    if (input.age !== undefined) updateData.age = input.age;
    if (input.isOrganDonor !== undefined) updateData.isOrganDonor = input.isOrganDonor;
    if (input.medicalFindings !== undefined) updateData.medicalFindings = input.medicalFindings || null;
    if (input.hasGuardian !== undefined) updateData.hasGuardian = input.hasGuardian;
    if (input.rescueNotes !== undefined) updateData.rescueNotes = input.rescueNotes || null;
    if (input.frequentLocation !== undefined) updateData.frequentLocation = input.frequentLocation || null;
    if (input.vehicleInfo !== undefined) updateData.vehicleInfo = input.vehicleInfo || null;
    if (input.emergencyContacts !== undefined) updateData.emergencyContacts = input.emergencyContacts;

    const updatedProfile = await db.medicalProfile.update({
      where: { userId: user.id },
      data: updateData,
    });

    return successResponse(
      {
        profile: updatedProfile,
        updatedAt: updatedProfile.updatedAt.toISOString(),
      },
      200,
    );
  } catch (error) {
    return handleApiError(error, "PUT /api/profile");
  }
}
