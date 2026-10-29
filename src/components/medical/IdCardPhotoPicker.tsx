/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes Médicos — Selector y Subida de Credencial Oficial (Cédula/DNI)
 * ARCHIVO: src/components/medical/IdCardPhotoPicker.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Componente dual para la captura y subida real de las fotografías de la
 * credencial de identidad (anverso y reverso) del motociclista hacia Cloudinary.
 * Preserva el encuadre rectangular del documento (crop: limit, sin recorte facial)
 * para garantizar la legibilidad de códigos de barras, hologramas y numeración.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero textos hardcodeados: 100% diccionario tipado `t` vía useLocale.
 * - Táctiles ≥ 44x44px y respuesta háptica nativa.
 * - Cero mocks: conexión directa con POST /api/upload/cloudinary.
 * ==============================================================================
 */

"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";

const ALLOWED_MIME_TYPES: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const UPLOAD_ENDPOINT = "/api/upload/cloudinary";

export interface IdCardPhotoPickerProps {
  frontUrl?: string | null;
  frontPublicId?: string | null;
  backUrl?: string | null;
  backPublicId?: string | null;
  deviceCode?: string;
  disabled?: boolean;
  onFrontChange: (url: string | null, publicId?: string | null) => void;
  onBackChange: (url: string | null, publicId?: string | null) => void;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string" && reader.result.length > 0) {
        resolve(reader.result);
      } else {
        reject(new Error("FileReader no produjo un Data URI válido."));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("Error leyendo archivo."));
    reader.readAsDataURL(file);
  });
}

interface SingleCardSlotProps {
  label: string;
  url?: string | null;
  side: "id_front" | "id_back";
  isUploading: boolean;
  disabled?: boolean;
  uploadButtonText: string;
  changeButtonText: string;
  removeButtonText: string;
  onSelectFile: (file: File, side: "id_front" | "id_back") => void;
  onRemove: (side: "id_front" | "id_back") => void;
}

function SingleCardSlot({
  label,
  url,
  side,
  isUploading,
  disabled,
  uploadButtonText,
  changeButtonText,
  removeButtonText,
  onSelectFile,
  onRemove,
}: SingleCardSlotProps) {
  const { triggerHaptic } = useHaptic();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleTrigger = () => {
    triggerHaptic("light");
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectFile(file, side);
    }
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-2 p-3.5 bg-brand-bg-alt border border-brand-border-field rounded-xl">
      <div className="flex items-center justify-between">
        <span className="font-sans text-xs font-bold text-brand-navy-dark">
          {label}
        </span>
        {url && !disabled && !isUploading && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic("warning");
              onRemove(side);
            }}
            className="text-[11px] font-sans text-brand-accent hover:underline cursor-pointer"
          >
            {removeButtonText}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
        aria-label={label}
      />

      {url ? (
        <div className="relative w-full h-36 rounded-lg overflow-hidden border border-brand-border-field bg-brand-white flex items-center justify-center">
          <Image
            src={url}
            alt={label}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, 300px"
            className="object-contain p-1"
          />
          {isUploading && (
            <div className="absolute inset-0 bg-brand-navy-dark/60 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-brand-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={disabled || isUploading ? undefined : handleTrigger}
          className={`w-full h-36 rounded-lg border-2 border-dashed border-brand-border-field bg-brand-white flex flex-col items-center justify-center gap-2 p-3 text-center transition-colors ${
            disabled || isUploading
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer hover:border-brand-nav-blue hover:bg-brand-nav-active/20"
          }`}
        >
          {isUploading ? (
            <div className="w-6 h-6 border-2 border-brand-navy-dark border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-brand-nav-active text-brand-nav-blue flex items-center justify-center text-lg">
                🪪
              </div>
              <span className="font-sans text-xs font-semibold text-brand-navy-dark">
                {uploadButtonText}
              </span>
            </>
          )}
        </div>
      )}

      {url && (
        <button
          type="button"
          onClick={handleTrigger}
          disabled={disabled || isUploading}
          className="safe-input-focus h-9 min-h-[36px] px-3 bg-brand-white hover:bg-brand-bg-alt border border-brand-border-field rounded-lg font-sans text-xs font-medium text-brand-navy-dark transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          📷 {changeButtonText}
        </button>
      )}
    </div>
  );
}

export function IdCardPhotoPicker({
  frontUrl,
  backUrl,
  deviceCode,
  disabled = false,
  onFrontChange,
  onBackChange,
}: IdCardPhotoPickerProps) {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();
  const [uploadingSide, setUploadingSide] = useState<"id_front" | "id_back" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUploadFile = async (file: File, side: "id_front" | "id_back") => {
    setErrorMessage(null);

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setErrorMessage(t.idCard.helpText);
      triggerHaptic("error");
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setErrorMessage(t.idCard.helpText);
      triggerHaptic("error");
      return;
    }

    setUploadingSide(side);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const res = await fetch(UPLOAD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: dataUrl,
          deviceCode,
          docType: side,
          assetType: side,
        }),
      });

      const payload = await res.json();
      if (!res.ok || !payload?.data?.photoUrl) {
        throw new Error(payload?.error?.message || t.idCard.uploadError);
      }

      triggerHaptic("success");
      if (side === "id_front") {
        onFrontChange(payload.data.photoUrl, payload.data.photoPublicId);
      } else {
        onBackChange(payload.data.photoUrl, payload.data.photoPublicId);
      }
    } catch (err: unknown) {
      triggerHaptic("error");
      const msg = err instanceof Error ? err.message : t.idCard.uploadError;
      setErrorMessage(msg);
    } finally {
      setUploadingSide(null);
    }
  };

  const handleRemove = (side: "id_front" | "id_back") => {
    if (side === "id_front") {
      onFrontChange(null, null);
    } else {
      onBackChange(null, null);
    }
  };

  return (
    <div className="flex flex-col gap-3 pt-2">
      <div className="flex flex-col gap-0.5">
        <label className="font-sans text-xs font-semibold text-brand-navy-dark flex items-center gap-1.5">
          <span>🪪</span>
          <span>{t.idCard.sectionTitle}</span>
        </label>
        <p className="font-sans text-xs text-brand-text-desc">
          {t.idCard.sectionSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <SingleCardSlot
          label={t.idCard.frontLabel}
          url={frontUrl}
          side="id_front"
          isUploading={uploadingSide === "id_front"}
          disabled={disabled}
          uploadButtonText={t.idCard.uploadFront}
          changeButtonText={t.idCard.changePhoto}
          removeButtonText={t.idCard.removePhoto}
          onSelectFile={handleUploadFile}
          onRemove={handleRemove}
        />

        <SingleCardSlot
          label={t.idCard.backLabel}
          url={backUrl}
          side="id_back"
          isUploading={uploadingSide === "id_back"}
          disabled={disabled}
          uploadButtonText={t.idCard.uploadBack}
          changeButtonText={t.idCard.changePhoto}
          removeButtonText={t.idCard.removePhoto}
          onSelectFile={handleUploadFile}
          onRemove={handleRemove}
        />
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="p-3 bg-rose-50 border border-brand-accent/30 rounded-lg text-xs font-sans text-brand-accent font-medium text-center"
        >
          ⚠️ {errorMessage}
        </div>
      )}

      <p className="font-sans text-[11px] text-brand-text-muted">
        ℹ️ {t.idCard.helpText}
      </p>
    </div>
  );
}
