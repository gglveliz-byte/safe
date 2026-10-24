/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes Médicos — Selector y Optimización de Foto de Rostro
 * ARCHIVO: src/components/medical/CloudinaryPhotoPicker.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Componente para captura de fotografía facial del motociclista. Permite previsualizar
 * la imagen recortada centrada en el rostro para que los paramédicos y socorristas
 * reconozcan de inmediato al piloto accidentado si este se encuentra inconsciente.
 * 
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Soporte nativo para cámara frontal del móvil vía input capture.
 * ==============================================================================
 */

"use client";

import React, { useRef } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { IncidentButton } from "@/components/ui/IncidentButton";

export interface CloudinaryPhotoPickerProps {
  currentPhotoUrl?: string;
  onPhotoSelected: (base64OrUrl: string) => void;
  disabled?: boolean;
}

export function CloudinaryPhotoPicker({
  currentPhotoUrl,
  onPhotoSelected,
  disabled = false,
}: CloudinaryPhotoPickerProps) {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Procesamiento de imagen seleccionada por el usuario
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerHaptic("light");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onPhotoSelected(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTriggerClick = () => {
    triggerHaptic("light");
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 bg-paper border border-ink rounded-[8px]">
      {/* Contenedor de Previsualización Facial (100x100px) */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[8px] border-2 border-ink bg-concrete overflow-hidden flex-shrink-0 flex items-center justify-center">
        {currentPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentPhotoUrl}
            alt="Rostro del conductor"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-carbon text-center p-2">
            <span className="text-2xl mb-1">👤</span>
            <span className="font-sans text-[10px] uppercase font-bold leading-none">
              Sin Foto
            </span>
          </div>
        )}
      </div>

      {/* Instrucciones y Botón de Captura */}
      <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1">
        <label className="font-serif font-bold text-body text-ink">
          {t.activate.photoLabel}
        </label>
        <p className="font-sans text-micro text-carbon mt-1 mb-3">
          {t.activate.photoUploadHelp}
        </p>

        {/* Input invisible para cámara/galería */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
          aria-hidden="true"
        />

        <IncidentButton
          type="button"
          variant="neutral"
          size="sm"
          onClick={handleTriggerClick}
          disabled={disabled}
        >
          {currentPhotoUrl
            ? t.activate.photoChangeButton
            : `📷 ${t.activate.photoLabel}`}
        </IncidentButton>
      </div>
    </div>
  );
}
