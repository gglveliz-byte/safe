/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes Médicos — Panel de Acciones Críticas de Rescate
 * ARCHIVO: src/components/medical/EmergencyActionPanel.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Botonera de auxilio inmediato de la ficha pública de emergencia, pensada para
 * el testigo o paramédico bajo luz solar directa y con guantes de rescate.
 * Cuatro acciones reales, en este orden:
 *   1. LLAMAR: al número de auxilio declarado en el perfil o, en su defecto,
 *      al contacto principal/primero. El botón MUESTRA EL NÚMERO REAL que se
 *      va a marcar (jamás afirma "911" si el destino es otro): la etiqueta
 *      del diccionario viaja como aria-label y micro-línea secundaria. Sin
 *      destino real se deshabilita con explicación (cero números fabricados).
 *   2. WHATSAPP: mensaje precargado al móvil del contacto principal con el
 *      nombre del conductor y el enlace satelital de Google Maps.
 *   3. MAPS: apertura directa de la ubicación satelital del siniestro.
 *   4. COPIAR ENLACE: copia la ficha de rescate actual al portapapeles con
 *      confirmación visual de 3 segundos y háptica de éxito.
 * Solo consume datos reales del backend (GET /api/emergency/[code]).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas (objetivo < 450).
 * - Objetivos táctiles ≥ 44px y separación entre botones críticos ≥ 12px.
 * - Iconos SVG inline de trazo grueso legibles a 1 metro bajo sol directa.
 * - Retroalimentación háptica ligera en cada pulsación (useHaptic).
 * - Cero texto hardcodeado: 100% diccionario bilingüe vía useLocale.
 * ==============================================================================
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import type { PublicEmergencyContactDTO } from "./medical-contact.types";

/** Props CONGELADOS consumidos por la vista pública de emergencia (Frontend 1). */
export interface EmergencyActionPanelProps {
  /** Nombre completo del conductor accidentado (leído de la base de datos). */
  riderName: string;
  /** Grupo sanguíneo declarado, exhibido en la cabecera clínica del panel. */
  bloodType: string;
  /** Enlace satelital oficial de Google Maps; puede aún no existir. */
  googleMapsUrl?: string | null;
  /** Número de auxilio registrado por el conductor en su perfil (dato real). */
  emergencyNumber?: string | null;
  /** Contactos de aviso inmediato de la ficha pública (sin correo expuesto). */
  contacts: PublicEmergencyContactDTO[];
}

/**
 * Panel de acciones críticas de rescate.
 * Todas las decisiones de habilitación dependen de datos reales: si no hay
 * número de auxilio, contactos ni ubicación, los botones se deshabilitan con
 * un título explicativo en el idioma activo en lugar de inventar destinos.
 */
export function EmergencyActionPanel({
  riderName,
  bloodType,
  googleMapsUrl,
  emergencyNumber,
  contacts,
}: EmergencyActionPanelProps) {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  // Confirmación visual temporal tras copiar el enlace de rescate (3 segundos)
  const [linkCopied, setLinkCopied] = useState(false);
  // El portapapeles solo existe en el navegador con contexto seguro; se verifica al montar
  const [clipboardAvailable, setClipboardAvailable] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setClipboardAvailable(
      typeof navigator !== "undefined" && Boolean(navigator.clipboard),
    );
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  // Contacto principal declarado o, en su defecto, el primero de la lista real
  const primaryContact =
    contacts.find((c) => c.isPrimary) ?? contacts[0] ?? null;

  // Destino de llamada: primero el número de auxilio del perfil; si no existe,
  // el móvil del contacto principal. Sin ninguno, destino nulo (deshabilitado).
  const emergencyNumberClean = (emergencyNumber ?? "").trim();
  const contactPhoneClean = (primaryContact?.phone ?? "").trim();
  const callTarget = emergencyNumberClean || contactPhoneClean || null;
  // La etiqueta distingue la llamada a la central de auxilio de la llamada familiar
  const callLabel = emergencyNumberClean ? t.common.call911 : t.common.callContact;

  // Enlace de WhatsApp: wa.me exige el móvil internacional SOLO con dígitos
  const whatsappPhone = contactPhoneClean.replace(/\D/g, "");
  const whatsappText = `${t.common.shareWhatsApp}: ${riderName} — ${googleMapsUrl ?? ""}`;
  const whatsappUrl = whatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappText)}`
    : null;

  /** Copia la ficha de rescate visible al portapapeles y confirma con háptica de éxito. */
  const handleCopyLink = () => {
    if (!clipboardAvailable) return;
    triggerHaptic("light");
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        triggerHaptic("success");
        setLinkCopied(true);
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
        copyTimerRef.current = setTimeout(() => setLinkCopied(false), 3000);
      })
      .catch(() => {
        // Permiso de portapapeles denegado por el navegador: no se finge éxito
      });
  };

  // Iconos SVG inline de trazo simple: currentColor garantiza contraste tanto
  // sobre el botón de emergencia (tinta invertida) como sobre los botones neutros.
  const PhoneIcon = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
  const ChatIcon = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
  const MapIcon = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
  const LinkIcon = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );

  return (
    <div className="w-full flex flex-col gap-3 p-4 sm:p-5 bg-paper rounded-[12px] border border-ink shadow-incident">
      {/* Cabecera clínica: baliza de auxilio activo y grupo sanguíneo del paciente */}
      <div className="flex items-center justify-between gap-3 pb-1 border-b border-mist">
        <span className="font-sans text-micro uppercase tracking-wider text-carbon font-bold">
          {t.common.emergencyBadge}
        </span>
        <span className="font-sans text-micro uppercase tracking-wider text-carbon font-bold flex items-center gap-2">
          {t.emergency.bloodType}
          <span className="font-serif text-body-lg font-bold text-ink normal-case tracking-normal border-2 border-ink rounded-[4px] px-2 py-0.5 bg-concrete">
            {bloodType}
          </span>
        </span>
      </div>

      {/* 1. LLAMAR: acción primaria de máximo contraste (btn-emergency, mínimo
          48px). El número real a marcar es el texto visible dominante; la clave
          del diccionario (call911 sólo cuando el destino ES el número de
          auxilio del perfil, callContact cuando es un familiar) queda como
          aria-label y micro-línea secundaria: nunca se afirma "911" si el
          destino marcado es otro. */}
      {callTarget ? (
        <a
          href={`tel:${callTarget}`}
          onClick={() => triggerHaptic("light")}
          aria-label={callLabel}
          className="btn-emergency w-full flex-col gap-1 py-2"
        >
          <span className="flex items-center gap-2">
            {PhoneIcon}
            <span className="font-sans text-body-lg font-bold tracking-wide">{callTarget}</span>
          </span>
          <span className="font-sans text-micro uppercase tracking-widest opacity-75">{callLabel}</span>
        </a>
      ) : (
        <button
          type="button"
          disabled
          title={t.emergency.noContacts}
          className="btn-emergency w-full text-body disabled:opacity-45 disabled:cursor-not-allowed"
        >
          {PhoneIcon}
          <span>{callLabel}</span>
        </button>
      )}

      {/* Rejilla de acciones secundarias con separación de 12px (anti-toques accidentales) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 2. WHATSAPP: aviso con nombre del conductor y enlace satelital */}
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => triggerHaptic("light")}
            className="btn-neutral w-full text-micro font-bold no-underline"
          >
            {ChatIcon}
            <span className="truncate">{t.common.shareWhatsApp}</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            title={t.emergency.noContacts}
            className="btn-neutral w-full text-micro font-bold disabled:opacity-45 disabled:cursor-not-allowed"
          >
            {ChatIcon}
            <span className="truncate">{t.common.shareWhatsApp}</span>
          </button>
        )}

        {/* 3. MAPS: ubicación satelital del siniestro en Google Maps */}
        {googleMapsUrl ? (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => triggerHaptic("light")}
            className="btn-neutral w-full text-micro font-bold no-underline"
          >
            {MapIcon}
            <span className="truncate">{t.emergency.openInGoogleMaps}</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            title={t.emergency.gpsDenied}
            className="btn-neutral w-full text-micro font-bold disabled:opacity-45 disabled:cursor-not-allowed"
          >
            {MapIcon}
            <span className="truncate">{t.emergency.openInGoogleMaps}</span>
          </button>
        )}

        {/* 4. COPIAR ENLACE: con confirmación visual de 3 segundos */}
        <button
          type="button"
          onClick={handleCopyLink}
          disabled={!clipboardAvailable}
          className="btn-neutral w-full text-micro font-bold disabled:opacity-45 disabled:cursor-not-allowed"
        >
          {LinkIcon}
          <span className="truncate">
            {linkCopied ? t.common.linkCopied : t.common.copyLink}
          </span>
        </button>
      </div>
    </div>
  );
}
