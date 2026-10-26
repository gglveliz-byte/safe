/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Emergencia — Despacho de Alerta Médica por Escaneo de Casco
 * ARCHIVO: src/app/api/emergency/alert/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint POST que dispara el despacho de auxilio médico cuando un casco NFC
 * o QR es escaneado en la vía. Valida el folio del dispositivo, evalúa la
 * ventana de cooldown anti-spam (3 minutos o desplazamiento >150 m), convierte
 * las coordenadas GPS a formato DMS y URL oficial de Google Maps, y despacha
 * correos bilingües a los contactos de emergencia del perfil médico mediante
 * SMTP de Gmail.
 *
 * FLUJO OPERATIVO:
 * 1. Extracción de IP del cliente (proxy inverso resuelto).
 * 2. Rate limit por IP con consumo REAL de cuota (consumeThrottle:
 *    10 peticiones/minuto, 60s de bloqueo) antes de parsear el body.
 * 3. Validación estricta del payload con Zod (EmergencyAlertSchema).
 * 4. Búsqueda del dispositivo con perfil médico y usuario asociado.
 * 5. Validación de estado ACTIVE y existencia de perfil médico.
 * 6. Determinación de coordenadas: GPS del escáner o fallback del Modo Ruta.
 * 7. Conversión DMS y URL de Google Maps (siempre, también con throttle).
 * 8. Transacción atómica con candado consultivo por dispositivo
 *    (pg_advisory_xact_lock): re-lectura del cooldown bajo el candado,
 *    decisión pura, creación de la alerta y actualización del dispositivo
 *    sólo si despacha (wasThrottled=false).
 * 9. Fuera de la transacción (tras el commit): envío de correos en el
 *    idioma del perfil (MedicalProfile.locale) y registro de entregas.
 *
 * PROTECCIÓN DE IDENTIDAD (PII):
 * - La IP del escáner se persiste hasheada con HMAC-SHA256, nunca en texto plano.
 * - Los correos de contactos NO se exponen en respuestas, sólo se usan para despacho.
 *
 * ANTI-ABUSO:
 * - Cooldown de 3 minutos por dispositivo (safe-security-and-compliance §1).
 * - Excepción: desplazamiento >150 m (traslado en ambulancia) despacha de inmediato.
 * - Rate limit por IP con consumo de cuota por petición (consumeThrottle).
 * - Candado consultivo de PostgreSQL: dos escaneos simultáneos del mismo
 *   casco se serializan y sólo uno despacha correos (anti-TOCTOU).
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
  AppError,
  handleApiError,
  parseJsonBody,
  successResponse,
} from "@/lib/api-response";
import { getClientIp } from "@/lib/request";
import { logEvent } from "@/lib/logger";
import { EmergencyAlertSchema } from "@/lib/schemas/emergency.schema";
import {
  EMERGENCY_ALERT_IP_POLICY,
  consumeThrottle,
} from "@/services/throttle.service";
import { evaluateCooldown } from "@/services/cooldown.service";
import { buildGoogleMapsDirectData } from "@/services/gps-maps.service";
import { sendEmergencyAlertEmail } from "@/services/mail.service";
import { hmacSha256 } from "@/lib/crypto";

/**
 * Configuración del runtime: Node.js para acceso a criptografía (hmacSha256)
 * y SMTP (nodemailer). Fuerza ejecución dinámica en cada petición (sin caché).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Forma mínima de los contactos de emergencia para el despacho de correos
 * (lectura defensiva del JSONB, hallazgo H-16). NO se reutiliza el esquema
 * estricto de activación: el registro auditor jamás puede estallar con un
 * TypeError en plena emergencia. Si el safeParse falla se registra el error
 * y se despacha con lista vacía (cero correos en lugar de un 500).
 */
const MailContactsSchema = z.array(
  z.object({
    name: z.string(),
    email: z.string(),
    relation: z.string().optional(),
  }),
);

/**
 * Despacha una alerta de emergencia médica tras el escaneo de un casco NFC/QR.
 * Valida el dispositivo, evalúa el cooldown anti-spam, convierte coordenadas
 * a DMS y URL de Google Maps, y envía correos bilingües a los contactos de
 * emergencia del perfil médico. La IP del escáner se persiste hasheada (HMAC).
 *
 * @param request Petición HTTP con el payload de alerta (code, scanSource, lat/lng opcionales).
 * @returns NextResponse con el folio de alerta, DMS, URL de Maps, conteo de correos y estado de throttle.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 1. Extracción de la IP real del cliente (resolviendo proxies inversos).
    const ip = getClientIp(request);

    // 2. Rate limit por IP con consumo real de cuota (hallazgo H-01): cada
    //    petición descuenta una unidad y, al superar el umbral, la IP queda
    //    bloqueada con 429. Va ANTES de parsear el body para frenar el spam
    //    temprano y proteger la cuota SMTP de Gmail.
    await consumeThrottle("emergency-alert-ip", ip, EMERGENCY_ALERT_IP_POLICY);

    // 3. Validación estricta del payload con Zod (EmergencyAlertSchema).
    const input = await parseJsonBody(request, EmergencyAlertSchema);

    // 4. Búsqueda del dispositivo con su perfil médico y usuario asociado.
    const device = await db.device.findUnique({
      where: { code: input.code },
      select: {
        id: true,
        code: true,
        status: true,
        userId: true,
        lastAlertAt: true,
        lastAlertLat: true,
        lastAlertLng: true,
        user: {
          select: {
            id: true,
            lastKnownLat: true,
            lastKnownLng: true,
            medicalProfile: {
              select: {
                fullName: true,
                bloodType: true,
                allergies: true,
                chronicConditions: true,
                medications: true,
                emergencyContacts: true,
                locale: true,
              },
            },
          },
        },
      },
    });

    // 5. Casco inexistente o no activo → 404 (no se revela si existe pero está inactivo).
    if (!device || device.status !== "ACTIVE") {
      throw new AppError("NOT_FOUND", "El casco no está activo.", 404);
    }

    // 6. Casco sin usuario o sin perfil médico registrado → 400.
    if (!device.userId || !device.user?.medicalProfile) {
      throw new AppError("VALIDATION_ERROR", "El casco no tiene perfil médico.", 400);
    }

    // 7. Determinación de coordenadas: GPS del escáner, fallback del Modo Ruta o PENDING_GPS.
    let lat: number;
    let lng: number;
    let locationOrigin: "SCANNER_DEVICE_GPS" | "RIDER_FALLBACK_GPS" | "PENDING_GPS";

    if (input.latitude !== undefined && input.longitude !== undefined) {
      // Coordenadas aportadas por el escáner (teléfono del rescatista).
      lat = input.latitude;
      lng = input.longitude;
      locationOrigin = "SCANNER_DEVICE_GPS";
    } else if (device.user.lastKnownLat !== null && device.user.lastKnownLng !== null) {
      // Fallback: última posición conocida del rider (Modo Ruta activo).
      lat = device.user.lastKnownLat;
      lng = device.user.lastKnownLng;
      locationOrigin = "RIDER_FALLBACK_GPS";
    } else {
      // Resiliencia de emergencia: NUNCA se aborta con 400. Se marca PENDING_GPS
      // y se despacha de inmediato el aviso médico a los familiares notificando
      // que el casco fue escaneado en carretera y las coordenadas están pendientes.
      lat = 0;
      lng = 0;
      locationOrigin = "PENDING_GPS";
    }

    // 8. Conversión de coordenadas decimales a DMS y URL oficial de Google Maps.
    // Si la ubicación está pendiente, se prepara información descriptiva sin falsear ubicación.
    const mapsData =
      locationOrigin === "PENDING_GPS"
        ? {
            dmsFormatted: "Ubicación satelital pendiente (reintentando)",
            googleMapsUrl: "",
            whatsappShareUrl: "",
            whatsappText: `*ALERTA MÉDICA:* El casco de *${device.user.medicalProfile.fullName}* fue escaneado en carretera. Coordenadas pendientes de adquisición.`,
          }
        : buildGoogleMapsDirectData(lat, lng, device.user.medicalProfile.fullName);

    // 9. Despacho atómico anti-TOCTOU (hallazgo H-10): un candado consultivo
    //    por dispositivo serializa los escaneos simultáneos del mismo casco.
    //    Bajo el candado se re-lee el estado del cooldown, se decide con la
    //    función pura evaluateCooldown, se crea la alerta y — sólo si
    //    despacha — se actualiza la referencia de última alerta del dispositivo.
    const { alert, shouldDispatch } = await db.$transaction(async (tx) => {
      // 9a. Candado consultivo a nivel de transacción (se libera con el commit).
      // Se utiliza $executeRaw porque pg_advisory_xact_lock devuelve tipo 'void' en PostgreSQL.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${device.id}))`;

      // 9b. Re-lectura del estado de cooldown YA bajo la protección del candado.
      const freshDevice = await tx.device.findUnique({
        where: { id: device.id },
        select: { lastAlertAt: true, lastAlertLat: true, lastAlertLng: true },
      });

      if (!freshDevice) {
        // Carrera extrema: el dispositivo se eliminó entre la validación y el candado.
        throw new AppError("NOT_FOUND", "El casco no está activo.", 404);
      }

      // 9c. Decisión pura del cooldown con los valores frescos leídos.
      const decision = evaluateCooldown({
        lastAlertAt: freshDevice.lastAlertAt,
        lastLatitude: freshDevice.lastAlertLat,
        lastLongitude: freshDevice.lastAlertLng,
        nextLatitude: lat,
        nextLongitude: lng,
      });

      // 9d. Registro de la alerta (auditor inmutable) con DMS y URL reales
      //     en ambas ramas: despachada (wasThrottled=false) o suprimida (true).
      const createdAlert = await tx.emergencyAlert.create({
        data: {
          deviceId: device.id,
          scanSource: input.scanSource,
          latitude: lat,
          longitude: lng,
          accuracyMeters: input.accuracy ?? null,
          dmsFormatted: mapsData.dmsFormatted,
          googleMapsUrl: mapsData.googleMapsUrl,
          locationOrigin,
          emailsSentCount: 0,
          wasThrottled: !decision.shouldDispatch,
          scannerIp: hmacSha256(ip),
        },
      });

      // 9e. Sólo el despacho real mueve la referencia del cooldown; la alerta
      //     suprimida no reinicia la ventana del último aviso real (contrato §8).
      if (decision.shouldDispatch) {
        await tx.device.update({
          where: { id: device.id },
          data: {
            lastAlertAt: createdAlert.createdAt,
            lastAlertLat: lat,
            lastAlertLng: lng,
          },
        });
      }

      return { alert: createdAlert, shouldDispatch: decision.shouldDispatch };
    });

    // 10. Rama THROTTLED: la alerta quedó registrada con la posición real
    //     pero sin envío de correos (la familia no recibe avisos duplicados).
    if (!shouldDispatch) {
      return successResponse({
        alertId: alert.id,
        createdAt: alert.createdAt.toISOString(),
        dmsFormatted: mapsData.dmsFormatted,
        googleMapsUrl: mapsData.googleMapsUrl,
        locationOrigin,
        emailsSentCount: 0,
        wasThrottled: true,
      });
    }

    // 11. Rama DESPACHADA (fuera de la transacción, tras el commit):
    // 11a. Lectura defensiva del JSONB de contactos (hallazgo H-16): safeParse
    //      con la forma mínima de despacho. Si el dato persistido está corrupto
    //      se registra el error y se despacha con lista vacía
    //      (sendEmergencyAlertEmail responde sentCount=0 sin lanzar).
    const contactsResult = MailContactsSchema.safeParse(
      device.user.medicalProfile.emergencyContacts,
    );

    if (!contactsResult.success) {
      logEvent("error", "Contactos de emergencia JSONB inválidos: alerta sin destinatarios", {
        alertId: alert.id,
      });
    }

    const mailContacts = contactsResult.success ? contactsResult.data : [];

    // 11b. Idioma del correo según el locale persistido del perfil médico
    //      (hallazgo H-07): "en" → inglés; cualquier otro valor o null → español.
    const profileLocale = device.user.medicalProfile.locale;

    const mailResult = await sendEmergencyAlertEmail(
      mailContacts.map((c) => ({ name: c.name, email: c.email, relation: c.relation })),
      {
        riderName: device.user.medicalProfile.fullName,
        bloodType: device.user.medicalProfile.bloodType,
        allergies: device.user.medicalProfile.allergies,
        chronicConditions: device.user.medicalProfile.chronicConditions,
        medications: device.user.medicalProfile.medications,
        dmsFormatted: mapsData.dmsFormatted,
        googleMapsUrl: mapsData.googleMapsUrl,
        scannedAt: alert.createdAt,
        alertId: alert.id,
      },
      profileLocale === "en" ? "en" : "es",
    );

    // 11c. Actualización del conteo de correos enviados y registro de entregas.
    await db.emergencyAlert.update({
      where: { id: alert.id },
      data: {
        emailsSentCount: mailResult.sentCount,
        emailDelivery: mailResult.deliveries,
      },
    });

    // 11d. Respuesta exitosa con el folio de alerta y datos de despacho.
    return successResponse({
      alertId: alert.id,
      createdAt: alert.createdAt.toISOString(),
      dmsFormatted: mapsData.dmsFormatted,
      googleMapsUrl: mapsData.googleMapsUrl,
      locationOrigin,
      emailsSentCount: mailResult.sentCount,
      wasThrottled: false,
    });
  } catch (error) {
    // 12. Traducción unificada de errores (AppError, Zod, Prisma, genéricos).
    return handleApiError(error, "alerta-emergencia");
  }
}
