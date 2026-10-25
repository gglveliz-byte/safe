/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Media — Endpoint de Subida y Procesamiento de Fotografías
 * ARCHIVO: src/app/api/upload/cloudinary/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint para la subida de fotografías de rostro de los motociclistas
 * (POST /api/upload/cloudinary). Acepta cargas vía JSON en formato Base64/Data URI
 * o multipart/form-data, protege el endpoint contra abusos de cuota mediante
 * RateLimitBucket por IP (consumida AL INICIO de la petición, hallazgo #9b, para
 * que los intentos fallidos también descuenten cuota) y despacha la imagen a
 * Cloudinary aplicando el recorte facial optimizado de 600x600 px en WebP.
 *
 * VALIDACIÓN (hallazgo #8): la rama multipart ya NO elude Zod — el MIME y el
 * tamaño del blob se validan con un mini-esquema local ANTES de leerlo a memoria
 * y el folio opcional del formData se somete al DeviceCodeSchema canónico.
 *
 * FOLIO / PUBLIC_ID ESTABLE (hallazgo #1, BLOCKER corregido): la vía canónica es
 * que el cliente (CloudinaryPhotoPicker.tsx) envíe el `deviceCode` del casco, con
 * el cual cloudinary.service construye el public_id determinista `rider_<folio>`
 * que evita huérfanos. Solo como CASO EXCEPCIONAL (el flujo de activación aún no
 * conoce el folio cuando el piloto elige la foto) se genera un código temporal
 * con randomToken(16); la implementación anterior usaba randomToken(6), que
 * LANZABA Error (crypto.ts exige un mínimo de 8 bytes) y hacía que TODA petición
 * respondiera 500, rompiendo el flujo completo de activación.
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
import {
  handleApiError,
  parseJsonBody,
  successResponse,
  AppError,
} from "@/lib/api-response";
import { getRequestContext } from "@/lib/request";
import { CloudinaryUploadSchema } from "@/lib/schemas/upload.schema";
import { DeviceCodeSchema } from "@/lib/schemas/common.schema";
import { uploadRiderPhotoToCloudinary } from "@/services/cloudinary.service";
import {
  RATE_LIMITS,
  enforceNotBlocked,
  consumeRateLimit,
} from "@/services/ratelimit.service";
import { randomToken } from "@/lib/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tipos MIME admitidos (jpeg/png/webp): espejo exacto del validador local de
 * CloudinaryPhotoPicker.tsx y de `allowed_formats` en cloudinary.service.ts.
 */
const ALLOWED_MIME_TYPES: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

/**
 * Tamaño máximo del blob en bytes (5 MB): espejo de MAX_DECODED_BYTES de
 * cloudinary.service.ts. Se comprueba ANTES de convertir a Base64 para no
 * desperdiciar memoria ni CPU con imágenes gigantescas (hallazgo #8).
 */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Entropía del folio temporal del caso excepcional (sin deviceCode del cliente).
 * 16 bytes → ~22 caracteres base64url; muy por encima del mínimo legal de 8.
 */
const TEMPORARY_CODE_BYTES = 16;

/**
 * Mini-esquema Zod local de la rama multipart (hallazgo #8): valida el MIME
 * declarado contra la lista permitida y el tamaño del blob ANTES de leerlo.
 * El ZodError lanzado por `.parse` lo traduce handleApiError a un
 * 400 VALIDATION_ERROR con mensaje humano en español.
 */
const MultipartImageSchema = z.object({
  /** Tipo MIME declarado por el navegador para el archivo adjunto. */
  type: z
    .string({ invalid_type_error: "El archivo debe declarar un tipo MIME." })
    .refine(
      (mime) => ALLOWED_MIME_TYPES.includes(mime),
      "El formato de la imagen no está permitido. Usa JPEG, PNG o WebP.",
    ),
  /** Peso real del blob en bytes, disponible sin leer el contenido. */
  size: z
    .number({ invalid_type_error: "El archivo debe reportar su tamaño." })
    .int()
    .positive("El archivo de imagen está vacío.")
    .max(
      MAX_UPLOAD_BYTES,
      "La imagen supera el límite máximo permitido de 5 megabytes (5 MB).",
    ),
});

/**
 * Genera el folio temporal del CASO EXCEPCIONAL (hallazgo #1): el cliente sube
 * la fotografía antes de que el flujo de activación conozca el folio del casco.
 * Rompe el public_id estable (la foto no podrá reemplazarse por folio), por eso
 * la vía canónica sigue siendo el `deviceCode` que SÍ envía
 * CloudinaryPhotoPicker.tsx cuando el padre lo provee. Sustituye al extinto
 * `TEMP-${randomToken(6)}` que lanzaba Error y tumbaba el endpoint con 500.
 */
function generateTemporaryDeviceCode(): string {
  return randomToken(TEMPORARY_CODE_BYTES).toUpperCase();
}

export async function POST(request: Request): Promise<NextResponse> {
  const context = getRequestContext(request);

  try {
    // 1. Control de tasa de subidas por IP para proteger la cuota de Cloudinary.
    //    El scope canónico kebab-case sale de la política (hallazgo #3 del
    //    servicio de rate limit), nunca de un literal suelto.
    await enforceNotBlocked(
      RATE_LIMITS.uploadIp.scope,
      context.ip,
      RATE_LIMITS.uploadIp,
    );

    // 2. Hallazgo #9b: la cuota se consume AL INICIO de la petición, antes de
    //    parsear el cuerpo, para que los intentos fallidos (JSON inválido,
    //    imagen fuera de norma, error del servidor) también descuenten y no
    //    exista una vía gratuita de spam contra Cloudinary.
    await consumeRateLimit(
      RATE_LIMITS.uploadIp.scope,
      context.ip,
      RATE_LIMITS.uploadIp,
    );

    const contentType = request.headers.get("content-type") || "";

    let imageData = "";
    let deviceCode = "";

    // 3. Procesar según el Content-Type (JSON o multipart/form-data)
    if (contentType.includes("application/json")) {
      // Rama JSON: CloudinaryUploadSchema ya valida el Data URI/Base64 y
      // normaliza el deviceCode opcional con DeviceCodeSchema (mayúsculas).
      const input = await parseJsonBody(request, CloudinaryUploadSchema);
      imageData = input.image;
      // Vía canónica: el picker envía el folio. Vía excepcional: temporal.
      deviceCode = input.deviceCode ?? generateTemporaryDeviceCode();
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      const formCode = formData.get("deviceCode");

      if (!file || !(file instanceof Blob)) {
        throw new AppError(
          "VALIDATION_ERROR",
          "Debe adjuntar un archivo de imagen en el campo 'file'.",
          400,
        );
      }

      // Hallazgo #8: MIME y tamaño validados con Zod ANTES de leer el blob
      // a memoria (file.size está disponible sin consumir el cuerpo).
      MultipartImageSchema.parse({ type: file.type, size: file.size });

      // Hallazgos #1/#8: si el formData trae folio, debe cumplir el
      // DeviceCodeSchema canónico (ZodError → 400 con mensaje humano); si no
      // lo trae, se genera el código temporal del caso excepcional documentado.
      deviceCode =
        typeof formCode === "string" && formCode.trim().length > 0
          ? DeviceCodeSchema.parse(formCode)
          : generateTemporaryDeviceCode();

      // Convertir el Blob ya validado a Base64 Data URI. El MIME proviene de
      // la lista permitida (validación previa), sin indulgencias por defecto.
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      imageData = `data:${file.type};base64,${buffer.toString("base64")}`;
    } else {
      throw new AppError(
        "VALIDATION_ERROR",
        "Formato de contenido no soportado. Envíe application/json o multipart/form-data.",
        415,
      );
    }

    // 4. Subir y procesar la fotografía en Cloudinary (public_id determinista
    //    rider_<folio> cuando el deviceCode es real; recorte facial 600x600).
    const result = await uploadRiderPhotoToCloudinary(imageData, deviceCode);

    return successResponse(
      {
        photoUrl: result.photoUrl,
        photoPublicId: result.photoPublicId,
        width: result.width,
        height: result.height,
        format: result.format,
      },
      201,
    );
  } catch (error) {
    return handleApiError(error, "POST /api/upload/cloudinary");
  }
}
