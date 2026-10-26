/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes Médicos — Selector y Subida Real de Foto de Rostro
 * ARCHIVO: src/components/medical/CloudinaryPhotoPicker.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Componente de captura fotográfica facial con subida REAL al endpoint certificado
 * POST /api/upload/cloudinary (contrato §9 de docs/BACKEND_CONTRACTS.md).
 * Flujo completo: selección desde cámara o galería (selector nativo del sistema,
 * sin atributo capture: hallazgo #17) → validación local de
 * MIME (jpeg/png/webp) y tamaño (máx. 5 MB, espejo de cloudinary.service.ts §8)
 * → lectura FileReader a Data URI → POST JSON { image, deviceCode? } → entrega
 * hacia el padre de la URL HTTPS real de Cloudinary y su photoPublicId.
 * NUNCA propaga el Data URI crudo: el esquema ActivateDeviceSchema exige que
 * photoUrl sea una URL http/https válida.
 *
 * ENTRADAS: currentPhotoUrl?, deviceCode?, disabled?, onPhotoSelected, onUploadError?
 * SALIDAS: onPhotoSelected(photoUrl real, { photoPublicId }) · onUploadError(message|null)
 *
 * DEPENDENCIAS: useLocale (diccionario bilingüe), useHaptic (vibración nativa),
 * clases canónicas .btn-neutral y .banner-emergency de globals.css (paleta Incident).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 450 líneas físicas.
 * - Cero textos hardcodeados: todo mensaje proviene del diccionario tipado o
 *   del message humano devuelto por el backend.
 * - Objetivos táctiles ≥ 44x44px y retroalimentación háptica en cada interacción.
 * ==============================================================================
 */

"use client";

import { useRef, useState, useId, type ChangeEvent } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";

/** Tipos MIME aceptados por el servicio Cloudinary certificado (jpeg/png/webp). */
const ALLOWED_MIME_TYPES: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

/** Límite local de tamaño en bytes (5 MB), espejo exacto de MAX_DECODED_BYTES del backend. */
const MAX_FILE_BYTES = 5 * 1024 * 1024;

/** Ruta relativa del endpoint público de subida (BACKEND_CONTRACTS §9). */
const UPLOAD_ENDPOINT = "/api/upload/cloudinary";

/**
 * Props congelados del selector fotográfico. Compatibles hacia atrás con los
 * consumidores existentes (dashboard y activación), que invocan onPhotoSelected
 * con un solo argumento.
 */
export interface CloudinaryPhotoPickerProps {
  /** URL https ya alojada en Cloudinary que se previsualiza al montar. */
  currentPhotoUrl?: string;
  /** Folio del casco (ej. SAFE-0001) para generar un public_id determinista. */
  deviceCode?: string;
  /** Bloquea los controles mientras el padre persiste el formulario. */
  disabled?: boolean;
  /** Emite la URL REAL de Cloudinary y su identificador público tras subir. */
  onPhotoSelected: (photoUrl: string, meta?: { photoPublicId: string }) => void;
  /** Reporta el message humano del backend, o null cuando el fallo es local/de red. */
  onUploadError?: (message: string | null) => void;
}

/**
 * Lee un archivo de imagen y lo codifica como Data URI base64
 * (formato exigido por CloudinaryUploadSchema del backend).
 */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string" && reader.result.length > 0) {
        resolve(reader.result);
        return;
      }
      reject(new Error("FileReader no produjo un Data URI válido."));
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("No fue posible leer el archivo de imagen."));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Estrecha la respuesta HTTP 201 del endpoint: { success: true, data: { photoUrl, photoPublicId, ... } }.
 * Retorna null si el payload no cumple el contrato congelado.
 */
function extractUploadSuccess(
  payload: unknown,
): { photoUrl: string; photoPublicId: string } | null {
  if (typeof payload !== "object" || payload === null) return null;
  const envelope = payload as { success?: unknown; data?: unknown };
  if (envelope.success !== true) return null;
  if (typeof envelope.data !== "object" || envelope.data === null) return null;
  const data = envelope.data as { photoUrl?: unknown; photoPublicId?: unknown };
  if (typeof data.photoUrl !== "string" || data.photoUrl.length === 0) return null;
  if (typeof data.photoPublicId !== "string" || data.photoPublicId.length === 0) return null;
  return { photoUrl: data.photoUrl, photoPublicId: data.photoPublicId };
}

/**
 * Estrecha el payload de fallo: { success: false, error: { code, message } }.
 * Retorna el message humano del backend o null si no viene mensaje utilizable.
 */
function extractUploadErrorMessage(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  const envelope = payload as { success?: unknown; error?: unknown };
  if (envelope.success !== false) return null;
  if (typeof envelope.error !== "object" || envelope.error === null) return null;
  const error = envelope.error as { message?: unknown };
  if (typeof error.message !== "string" || error.message.trim().length === 0) return null;
  return error.message;
}

/**
 * Selector de fotografía facial con subida real a Cloudinary vía el endpoint
 * certificado del backend. Diseñado para la activación del kit y la edición
 * de la ficha médica en el panel del motociclista.
 */
export function CloudinaryPhotoPicker({
  currentPhotoUrl,
  deviceCode,
  disabled = false,
  onPhotoSelected,
  onUploadError,
}: CloudinaryPhotoPickerProps) {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const helpTextId = useId();

  // URL interna tras una subida exitosa (respaldo si el padre aún no la refleja)
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  // Estado de tránsito: bloquea controles y muestra el spinner CSS
  const [isUploading, setIsUploading] = useState<boolean>(false);
  // Mensaje visible del banner de error (backend humano o genérico del diccionario)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // La previsualización prioriza la URL del padre y respalda con la recién subida
  const displayPhotoUrl = currentPhotoUrl || uploadedPhotoUrl;
  const isControlDisabled = disabled || isUploading;

  /**
   * Dispara el selector de archivos nativo con retroalimentación háptica
   * ligera. Sin atributo `capture`: el sistema ofrece cámara O galería
   * (hallazgo #17: el plan exige ambas fuentes y `accept` ya las sugiere).
   */
  const handleTriggerClick = () => {
    triggerHaptic("light");
    fileInputRef.current?.click();
  };

  /**
   * Valida MIME/tamaño en el cliente, codifica a Data URI y consume
   * POST /api/upload/cloudinary con el contrato JSON primario { image, deviceCode? }.
   */
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Limpieza inmediata del value para permitir reintentos con el mismo archivo
    event.target.value = "";
    if (!file || isUploading) return;

    // Validación previa a la subida: MIME permitido y tamaño ≤ 5 MB (regla §8)
    if (!ALLOWED_MIME_TYPES.includes(file.type) || file.size > MAX_FILE_BYTES) {
      triggerHaptic("error");
      // No existe clave específica de error de subida en el diccionario (REPORTADO)
      setErrorMessage(t.common.errorGeneric);
      onUploadError?.(null);
      return;
    }

    // Inicio de intento: limpia errores propios y del padre
    setErrorMessage(null);
    onUploadError?.(null);
    setIsUploading(true);

    try {
      const imageDataUrl = await readFileAsDataUrl(file);

      // Cuerpo JSON primario del contrato; deviceCode se omite si no fue provisto
      const requestBody: { image: string; deviceCode?: string } = {
        image: imageDataUrl,
      };
      if (deviceCode) {
        requestBody.deviceCode = deviceCode;
      }

      const response = await fetch(UPLOAD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const payload: unknown = await response.json().catch(() => null);
      const uploaded = extractUploadSuccess(payload);

      if (response.ok && uploaded) {
        // Éxito (201): previsualizar SOLO la URL https real de Cloudinary
        setUploadedPhotoUrl(uploaded.photoUrl);
        triggerHaptic("success");
        onPhotoSelected(uploaded.photoUrl, {
          photoPublicId: uploaded.photoPublicId,
        });
        return;
      }

      // Fallo con respuesta estructurada: mostrar el message humano del backend
      const backendMessage = extractUploadErrorMessage(payload);
      triggerHaptic("error");
      setErrorMessage(backendMessage ?? t.common.errorGeneric);
      onUploadError?.(backendMessage);
    } catch {
      // Fallo de red o excepción inesperada: mensaje genérico del diccionario
      triggerHaptic("error");
      setErrorMessage(t.common.errorGeneric);
      onUploadError?.(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 p-5 sm:p-6 bg-brand-white border border-brand-border-subtle rounded-xl shadow-sm">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* Previsualización cuadrada facial (96px móvil / 112px escritorio) */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl border border-brand-border-subtle bg-brand-bg-alt overflow-hidden flex-shrink-0 flex items-center justify-center shadow-xs">
          {displayPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayPhotoUrl}
              alt={t.activate.photoLabel}
              className="w-full h-full object-cover"
            />
          ) : (
            <span aria-hidden="true" className="text-3xl select-none">
              👤
            </span>
          )}

          {/* Velo de tránsito con spinner CSS animado */}
          {isUploading && (
            <div className="absolute inset-0 bg-brand-white/80 flex items-center justify-center">
              <span
                aria-hidden="true"
                className="w-6 h-6 rounded-full border-2 border-brand-navy-dark border-t-transparent animate-spin"
              />
            </div>
          )}
        </div>

        {/* Etiqueta, ayuda contextual y control de captura */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1">
          <label className="font-serif font-bold text-base sm:text-lg text-brand-navy-dark">
            {t.activate.photoLabel}
          </label>
          <p id={helpTextId} className="font-sans text-xs text-brand-text-muted mt-1 mb-3">
            {t.activate.photoUploadHelp}
          </p>

          {/* Input oculto: solo JPEG/PNG/WebP; el sistema ofrece cámara o galería */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={isControlDisabled}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />

          {/* Botón neutro canónico (min-height 44px garantizado por .btn-neutral) */}
          <button
            type="button"
            className="btn-neutral min-h-[44px] px-4 py-2 font-semibold text-xs rounded-lg"
            onClick={handleTriggerClick}
            disabled={isControlDisabled}
            aria-describedby={helpTextId}
          >
            {displayPhotoUrl
              ? t.activate.photoChangeButton
              : t.activate.photoLabel}
          </button>

          {/* Indicador de subida en curso con texto vivo para lectores de pantalla */}
          {isUploading && (
            <p
              role="status"
              className="flex items-center gap-2 mt-3 font-sans text-micro font-bold text-ink"
            >
              <span
                aria-hidden="true"
                className="w-4 h-4 rounded-full border-2 border-ink border-t-mist animate-spin"
              />
              {t.common.saving}
            </p>
          )}
        </div>
      </div>

      {/* Banner crítico de emergencia con el mensaje humano del fallo */}
      {errorMessage && (
        <div className="banner-emergency w-full" role="alert">
          <p className="flex items-start gap-2 font-serif text-body font-bold text-ink">
            <span aria-hidden="true" className="text-alert-red flex-shrink-0">
              ▲
            </span>
            {errorMessage}
          </p>
        </div>
      )}
    </div>
  );
}
