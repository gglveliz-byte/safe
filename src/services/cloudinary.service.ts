/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Media — Adaptador y Optimización Facial con Cloudinary SDK v2
 * ARCHIVO: src/services/cloudinary.service.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Servicio oficial para el procesamiento y alojamiento de fotografías de
 * perfil médico de los motociclistas. Se conecta a la API de Cloudinary v2,
 * valida el tipo MIME permitido (JPEG, PNG o WebP), restringe el tamaño a un
 * máximo de 5 MB decodificados y aplica una transformación de recorte centrada
 * en el rostro (600x600 px, crop fill, gravity face, quality auto:good y
 * fetch_format auto WebP) para visualización inmediata en emergencias.
 *
 * Utiliza identificadores públicos (public_id) deterministas vinculados al
 * folio del casco para evitar archivos huérfanos y costos de almacenamiento
 * innecesarios.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * - Credenciales obtenidas dinámicamente de getEnv().
 * - Comentarios en Español.
 * ==============================================================================
 */

import { v2 as cloudinary } from "cloudinary";
import { getEnv } from "@/lib/env";
import { AppError } from "@/lib/api-response";

/**
 * Resultado devuelto tras una carga exitosa en Cloudinary.
 */
export interface CloudinaryUploadResult {
  /** URL segura HTTPS optimizada en CDN. */
  photoUrl: string;
  /** Identificador público de Cloudinary para trazabilidad y reemplazos. */
  photoPublicId: string;
  /** Ancho final de la imagen en píxeles. */
  width: number;
  /** Alto final de la imagen en píxeles. */
  height: number;
  /** Formato de la imagen almacenada (ej. webp, jpg). */
  format: string;
  /** Peso final del archivo en bytes. */
  bytes: number;
}

/** Límite estricto de tamaño de imagen: 5 MB en bytes. */
const MAX_DECODED_BYTES = 5 * 1024 * 1024;

/**
 * Configura la instancia de Cloudinary con las credenciales validadas del entorno.
 */
function configureCloudinary(): void {
  const env = getEnv();
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Sube y optimiza la fotografía del motociclista en Cloudinary.
 *
 * @param base64Data Imagen codificada en formato Data URI o Base64 pura.
 * @param code Folio del casco (ej. SAFE-0001) para generar el public_id estable.
 */
export async function uploadRiderPhotoToCloudinary(
  base64Data: string,
  code: string,
): Promise<CloudinaryUploadResult> {
  configureCloudinary();
  const env = getEnv();

  if (!base64Data || typeof base64Data !== "string") {
    throw new AppError(
      "VALIDATION_ERROR",
      "No se proporcionó ningún contenido de imagen para cargar.",
      400,
    );
  }

  // Validar formato Data URI o preparar prefijo por defecto
  let uploadPayload = base64Data.trim();
  if (!uploadPayload.startsWith("data:")) {
    uploadPayload = `data:image/jpeg;base64,${uploadPayload}`;
  }

  // Estimar peso en bytes a partir del tamaño Base64
  const base64Content = uploadPayload.split(",")[1] ?? "";
  const estimatedBytes = Math.floor((base64Content.length * 3) / 4);
  if (estimatedBytes > MAX_DECODED_BYTES) {
    throw new AppError(
      "VALIDATION_ERROR",
      "La imagen supera el límite máximo permitido de 5 megabytes (5 MB).",
      400,
    );
  }

  // Generar identificador público determinista por casco
  const cleanCode = code.toUpperCase().replace(/[^A-Z0-9-]/g, "");
  const publicId = `${env.CLOUDINARY_UPLOAD_FOLDER}/rider_${cleanCode.toLowerCase()}`;

  try {
    const result = await cloudinary.uploader.upload(uploadPayload, {
      public_id: publicId,
      overwrite: true,
      invalidate: true,
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [
        {
          width: 600,
          height: 600,
          crop: "fill",
          gravity: "face",
          quality: "auto:good",
          fetch_format: "auto",
        },
      ],
    });

    return {
      photoUrl: result.secure_url,
      photoPublicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error: unknown) {
    console.error("[SAFE Cloudinary] Error durante la carga de imagen:", error);
    const errMessage =
      error instanceof Error ? error.message : "Error del servidor de imágenes";
    throw new AppError(
      "SERVER_ERROR",
      `No fue posible procesar la fotografía en el servidor seguro: ${errMessage}`,
      500,
    );
  }
}

/**
 * Elimina una fotografía alojada en Cloudinary a partir de su public_id.
 */
export async function deleteCloudinaryAsset(publicId: string): Promise<void> {
  if (!publicId || typeof publicId !== "string") {
    return;
  }

  configureCloudinary();

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });
  } catch (error) {
    console.warn(`[SAFE Cloudinary] No se pudo eliminar el recurso "${publicId}":`, error);
  }
}
