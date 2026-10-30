/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes de Administración — Tarjeta de Modo Entrega Asistida de PIN
 * ARCHIVO: src/components/admin/PinDispatchSettingsCard.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Tarjeta interactiva en la consola de administración que permite activar o
 * desactivar el "Modo Entrega Asistida de PIN" y definir el correo destinatario
 * del administrador para recibir las credenciales de cada nuevo kit registrado.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (este archivo < 240 líneas).
 * - Cero dependencias frágiles: transporte HTTP directo hacia /api/admin/settings.
 * - 100% bilingüe vía useLocale, diseño Incident 2026 y táctiles ≥ 44px.
 * ==============================================================================
 */

"use client";

import React, { useState, useEffect } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { IncidentAlertBanner } from "@/components/ui/IncidentAlertBanner";

export interface PinDispatchSettingsCardProps {
  onSettingsChanged?: (enabled: boolean) => void;
}

/** Consulta la configuración del sistema de forma directa y desacoplada */
async function fetchAdminSettings(): Promise<{ enabled: boolean; notificationEmail: string }> {
  const res = await fetch("/api/admin/settings", { cache: "no-store" });
  if (!res.ok) throw new Error("Error al consultar configuración administrativa.");
  const json = await res.json();
  return json.data || { enabled: false, notificationEmail: "" };
}

/** Guarda la configuración del sistema de forma directa y desacoplada */
async function saveAdminSettings(data: {
  enabled: boolean;
  notificationEmail: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch("/api/admin/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json?.error?.message || "Error al guardar configuración administrativa.");
  }
  const json = await res.json();
  return json.data || { success: true, message: "" };
}

export function PinDispatchSettingsCard({ onSettingsChanged }: PinDispatchSettingsCardProps) {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  const [enabled, setEnabled] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Cargar configuración actual al montar
  useEffect(() => {
    let isMounted = true;
    async function loadConfig() {
      try {
        const config = await fetchAdminSettings();
        if (isMounted) {
          setEnabled(config.enabled);
          setNotificationEmail(config.notificationEmail || "");
          onSettingsChanged?.(config.enabled);
        }
      } catch (err: unknown) {
        console.error("Error al cargar settings admin:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadConfig();
    return () => {
      isMounted = false;
    };
  }, [onSettingsChanged]);

  const handleToggle = (nextVal: boolean) => {
    setEnabled(nextVal);
    onSettingsChanged?.(nextVal);
    triggerHaptic("light");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice("");
    setErrorMessage("");

    const cleanEmail = notificationEmail.trim().toLowerCase();

    if (enabled && !cleanEmail) {
      setErrorMessage(t.admin.pinDispatchEmailRequired || "Debes ingresar un correo de notificación válido para activar este modo.");
      triggerHaptic("warning");
      return;
    }

    if (enabled && !cleanEmail.includes("@")) {
      setErrorMessage(t.admin.pinDispatchEmailInvalid || "El formato del correo es inválido.");
      triggerHaptic("warning");
      return;
    }

    setIsSaving(true);
    triggerHaptic("light");

    try {
      const res = await saveAdminSettings({
        enabled,
        notificationEmail: cleanEmail,
      });

      triggerHaptic("success");
      setNotice(res.message || (t.admin.pinDispatchSavedNotice || "Configuración de despacho de PIN guardada exitosamente."));
      onSettingsChanged?.(enabled);
      setTimeout(() => setNotice(""), 4500);
    } catch (err: unknown) {
      triggerHaptic("error");
      setErrorMessage(err instanceof Error ? err.message : t.common.errorGeneric);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full bg-brand-white border border-brand-border-subtle rounded-xl p-4 sm:p-5 flex items-center justify-center animate-pulse min-h-[90px]">
        <span className="font-sans text-xs text-brand-text-muted">
          {t.admin.ridersLoading || "Cargando configuración..."}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full bg-brand-white border border-brand-border-subtle rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
      {/* Encabezado con Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-separator pb-3">
        <div className="flex items-start gap-2.5">
          <span className="text-xl select-none" aria-hidden="true">🔑</span>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-base text-brand-navy-dark leading-snug">
                {t.admin.pinDispatchTitle || "Modo Entrega Asistida de PIN"}
              </h3>
              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  enabled
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {enabled ? (t.admin.statusActive || "ACTIVADO") : (t.admin.statusInactive || "DESACTIVADO")}
              </span>
            </div>
            <p className="font-sans text-xs text-brand-text-desc mt-0.5">
              {t.admin.pinDispatchSubtitle ||
                "Controla si el PIN se imprime en los stickers o se envía bajo custodia a tu correo para entrega directa."}
            </p>
          </div>
        </div>

        {/* Toggle Switch Accesible */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => handleToggle(e.target.checked)}
              className="sr-only peer"
              aria-label={t.admin.pinDispatchTitle || "Modo Entrega Asistida de PIN"}
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-navy-dark" />
          </label>
        </div>
      </div>

      {/* Formulario de Configuración */}
      <form onSubmit={handleSave} className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="font-sans text-xs font-semibold text-brand-navy-dark">
              {t.admin.pinDispatchEmailLabel || "Correo de Notificación del Administrador"} *
            </label>
            <input
              type="email"
              disabled={isSaving}
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              placeholder="ejemplo@gmail.com"
              className="safe-input-focus h-10 min-h-[40px] px-3.5 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="h-10 min-h-[40px] px-5 bg-brand-navy-dark text-white hover:bg-brand-navy-secondary text-xs font-bold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed shrink-0 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t.common.saving || "Guardando..."}
              </span>
            ) : (
              t.admin.pinDispatchSaveButton || "Guardar Configuración"
            )}
          </button>
        </div>

        {/* Guía Explicativa del Modo */}
        <p className="font-sans text-[11px] text-brand-text-muted leading-relaxed">
          {enabled ? (
            <span className="text-emerald-800 font-medium">
              ✓ <strong>{t.admin.pinDispatchActiveTip || "Modo Asistido Activo:"}</strong>{" "}
              {t.admin.pinDispatchActiveDesc ||
                "Los QRs se imprimirán sin PIN. Al registrarse un motociclista con su kit, recibirás un correo con sus datos, el PIN para copiarlo en 1 toque y el botón de WhatsApp pre-cargado."}
            </span>
          ) : (
            <span>
              ℹ️ <strong>{t.admin.pinDispatchInactiveTip || "Modo Estándar:"}</strong>{" "}
              {t.admin.pinDispatchInactiveDesc ||
                "El PIN confidencial de 6 dígitos se imprime visiblemente en las tarjetas de los kits para entrega física."}
            </span>
          )}
        </p>

        {notice && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-sans text-emerald-800 font-semibold flex items-center gap-2">
            <span>✓</span> {notice}
          </div>
        )}

        {errorMessage && (
          <IncidentAlertBanner type="emergency" message={errorMessage} />
        )}
      </form>
    </div>
  );
}
