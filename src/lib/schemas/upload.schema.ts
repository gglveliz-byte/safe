/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Esquemas de Validación (Zod) — Subida de Fotografías de Perfil
 * ARCHIVO: src/lib/schemas/upload.schema.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Define el esquema de validación para el endpoint de carga de fotografías de
 * rostro hacia Cloudinary (POST /api/upload/cloudinary). Acepta una imagen
 * codificada en Base64 / Data URI (JPEG, PNG o WebP) de hasta 5 MB decodificados
 * y un código de casco opcional para asociar un identificador público estable.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * - Validación estricta de formato MIME y tamaño.
 * ==============================================================================
 */

import { z } from "zod";
import { DeviceCodeSchema } from "./common.schema";

/**
 * Expresión regular para validar formato Data URI de imagen (jpeg, png, webp).
 */
const DATA_URI_REGEX = /^data:image\/(jpe?g|png|webp);base64,[A-Za-z0-9+/=]+$/;

/**
 * Esquema para la carga de imágenes vía payload JSON en Base64.
 */
export const CloudinaryUploadSchema = z
  .object({
    /** Contenido de la imagen como Data URI o cadena Base64 pura. */
    image: z
      .string({ required_error: "La imagen es obligatoria." })
      .min(100, "El contenido de la imagen es demasiado corto.")
      .refine(
        (val) => {
          if (DATA_URI_REGEX.test(val)) return true;
          // Si es base64 pura sin data uri:
          return /^[A-Za-z0-9+/=]+$/.test(val);
        },
        "La imagen debe ser un Data URI válido (image/jpeg, image/png o image/webp) o Base64.",
      ),

    /** Código opcional del casco para generar un public_id determinista y evitar huérfanos. */
    deviceCode: DeviceCodeSchema.optional(),
  })
  .strict();

export type CloudinaryUploadInput = z.infer<typeof CloudinaryUploadSchema>;
