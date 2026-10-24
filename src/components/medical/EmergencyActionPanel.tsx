/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes Médicos — Panel de Acciones Críticas de Rescate
 * ARCHIVO: src/components/medical/EmergencyActionPanel.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Panel de botones de auxilio inmediato para testigos y paramédicos.
 * Incluye llamada directa al 911 (tel:911), aviso satelital por WhatsApp
 * a familiares y llamada directa al contacto principal con espaciado de 12px
 * preventivo contra toques accidentales con guantes de rescate.
 * 
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Objetivos táctiles mínimos de 48px de altura.
 * - Separación mínima de 12px entre botones críticos.
 * ==============================================================================
 */

"use client";

import React, { useState } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import type { EmergencyContact } from "@/lib/api-client";

export interface EmergencyActionPanelProps {
  riderName: string;
  bloodType: string;
  googleMapsUrl?: string;
  primaryContact?: EmergencyContact;
  emergencyCode: string;
}

export function EmergencyActionPanel({
  riderName,
  bloodType,
  googleMapsUrl,
  primaryContact,
  emergencyCode,
}: EmergencyActionPanelProps) {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();
  const [copied, setCopied] = useState(false);

  // Mensaje precargado con ubicación satelital para WhatsApp
  const shareText = `${t.common.appName} - ${t.emergency.title}\n` +
    `Piloto: ${riderName} (${bloodType})\n` +
    `Ficha: ${typeof window !== "undefined" ? window.location.href : `https://safe.app/emergency/${emergencyCode}`}\n` +
    (googleMapsUrl ? `Ubicación GPS: ${googleMapsUrl}` : "");

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  const handleCopyLink = () => {
    triggerHaptic("success");
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3 p-4 bg-paper rounded-[12px] border border-ink shadow-incident">
      <div className="flex items-center justify-between pb-2 border-b border-mist">
        <span className="font-sans text-micro uppercase tracking-wider text-carbon font-bold">
          {t.common.emergencyBadge}
        </span>
        <span className="font-sans text-[11px] text-carbon font-medium">
          {emergencyCode}
        </span>
      </div>

      {/* Botón Primario: Llamada al 911 Directo (Mínimo 50px de altura) */}
      <a
        href="tel:911"
        onClick={() => triggerHaptic("warning")}
        className="w-full min-h-[50px] bg-ink text-paper rounded-[4px] border border-ink font-sans font-bold text-body flex items-center justify-center gap-3 no-underline active:scale-[0.98] transition-transform select-none"
      >
        <span className="w-3 h-3 rounded-full bg-alert-red animate-pulse" />
        <span>{t.common.call911}</span>
      </a>

      {/* Espaciado preventivo de 12px entre botones críticos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Llamada Directa a Familiar de Contacto */}
        {primaryContact && primaryContact.phone ? (
          <a
            href={`tel:${primaryContact.phone}`}
            onClick={() => triggerHaptic("light")}
            className="btn-neutral min-h-[46px] w-full text-micro font-bold no-underline"
          >
            <span>📞</span>
            <span className="truncate">
              {t.common.callContact}: {primaryContact.name}
            </span>
          </a>
        ) : null}

        {/* Notificación de Auxilio por WhatsApp con Enlace Satelital */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => triggerHaptic("light")}
          className="btn-neutral min-h-[46px] w-full text-micro font-bold no-underline"
        >
          <span>💬</span>
          <span>{t.common.shareWhatsApp}</span>
        </a>
      </div>

      {/* Botón Auxiliar: Copiar Enlace Directo de Rescate */}
      <div className="pt-1 flex items-center justify-between gap-3 text-micro font-sans">
        <button
          type="button"
          onClick={handleCopyLink}
          className="text-carbon hover:text-ink underline cursor-pointer bg-transparent border-0 p-0 text-left"
        >
          {copied ? t.common.linkCopied : t.common.copyLink}
        </button>

        {googleMapsUrl && (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => triggerHaptic("light")}
            className="text-ink font-bold underline hover:text-signal-orange"
          >
            {t.emergency.openInGoogleMaps} ↗
          </a>
        )}
      </div>
    </div>
  );
}
