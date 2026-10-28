/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Modal de Envío de Notificación WhatsApp por Plantilla
 * ARCHIVO: src/components/admin/SendWhatsAppModal.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Modal interactivo para preparar y despachar notificaciones WhatsApp oficiales
 * mediante plantillas de Meta Graph API (NeuroAPI). Extrae y asocia dinámicamente
 * las variables {{1}}, {{2}} del cuerpo, formatea el teléfono a estándar E.164
 * (con autocompletado inteligente de prefijo Ecuador 593) y previsualiza el mensaje.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * ==============================================================================
 */

"use client";

import React, { useState, useMemo } from "react";
import { useHaptic } from "@/hooks/useHaptic";
import {
  whatsAppClient,
  type WhatsAppTemplateDTO,
  type WhatsAppTemplateComponentDTO,
} from "@/lib/whatsapp-client";

export interface SendWhatsAppModalProps {
  template: WhatsAppTemplateDTO;
  customApiKey?: string;
  onClose: () => void;
  onSuccess?: (messageId: string) => void;
}

export function SendWhatsAppModal({
  template,
  customApiKey,
  onClose,
  onSuccess,
}: SendWhatsAppModalProps) {
  const { triggerHaptic } = useHaptic();

  const [recipientPhone, setRecipientPhone] = useState("");
  const [varValues, setVarValues] = useState<Record<number, string>>({});
  const [extraParamsCount, setExtraParamsCount] = useState<number>(0);
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const bodyComponent = useMemo((): WhatsAppTemplateComponentDTO | undefined => {
    return template.components.find((c) => c.type === "BODY");
  }, [template]);

  // Detección automática de variables en el texto de Meta
  const detectedVariables = useMemo(() => {
    const text = bodyComponent?.text || "";
    const matches = text.matchAll(/\{\{(\d+)\}\}/g);
    const indexes: number[] = [];
    for (const match of matches) {
      const idx = parseInt(match[1], 10);
      if (!indexes.includes(idx)) indexes.push(idx);
    }
    return indexes.sort((a, b) => a - b);
  }, [bodyComponent]);

  // Lista consolidada de variables (detectadas + extras si se añadieron)
  const allVariableIndexes = useMemo(() => {
    const base = [...detectedVariables];
    const maxIdx = base.length > 0 ? Math.max(...base) : 0;
    for (let i = 1; i <= extraParamsCount; i++) {
      base.push(maxIdx + i);
    }
    return base;
  }, [detectedVariables, extraParamsCount]);

  // Previsualización en vivo del formato internacional E.164
  const phonePreview = useMemo(() => {
    const digits = recipientPhone.replace(/\D/g, "");
    if (!digits) return null;
    if (digits.length === 10 && digits.startsWith("09")) {
      return {
        formatted: `593${digits.slice(1)}`,
        isEcuadorLocal: true,
      };
    }
    return {
      formatted: digits,
      isEcuadorLocal: false,
    };
  }, [recipientPhone]);

  // Previsualización en vivo del texto con las variables sustituidas
  const livePreview = useMemo(() => {
    let text = bodyComponent?.text || `(Plantilla oficial: ${template.name})`;
    allVariableIndexes.forEach((vIdx) => {
      const val = varValues[vIdx]?.trim();
      const replacement = val ? `[${val}]` : `{{${vIdx}}}`;
      text = text.replace(new RegExp(`\\{\\{${vIdx}\\}\\}`, "g"), replacement);
    });
    return text;
  }, [bodyComponent, template.name, allVariableIndexes, varValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (!phonePreview?.formatted || phonePreview.formatted.length < 8) {
      setErrorMessage("Por favor ingresa un número de teléfono válido con código de país.");
      return;
    }

    setIsSending(true);
    triggerHaptic("light");

    try {
      const orderedParams: string[] = allVariableIndexes.map((vIdx) => (varValues[vIdx] || "").trim());

      const result = await whatsAppClient.sendNotification({
        to: phonePreview.formatted,
        templateName: template.name,
        languageCode: template.language || "es",
        bodyParameters: orderedParams,
        customKey: customApiKey?.trim() || undefined,
      });

      triggerHaptic("success");
      const msgId = result.messageId || "wamid.OK";
      setSuccessMessage(`¡Mensaje entregado a WhatsApp con éxito! ID de Meta: ${msgId}`);
      onSuccess?.(msgId);
    } catch (err: unknown) {
      triggerHaptic("error");
      const msg = err instanceof Error ? err.message : "Error al despachar el mensaje por WhatsApp";
      setErrorMessage(msg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-brand-navy-dark/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-lg bg-brand-white rounded-2xl shadow-2xl border border-brand-border-subtle p-5 sm:p-6 flex flex-col gap-4 my-auto animate-fadeInUp">
        {/* Cabecera del Modal */}
        <div className="flex items-start justify-between gap-2 border-b border-brand-separator pb-3">
          <div>
            <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-brand-accent">
              Despacho Oficial · WhatsApp Cloud API
            </span>
            <h3 className="font-serif text-lg font-bold text-brand-navy-dark">
              Enviar Notificación
            </h3>
            <p className="font-mono text-xs text-brand-text-muted mt-0.5">
              Plantilla: <strong className="text-brand-navy-dark">{template.name}</strong> ({template.language})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-brand-text-muted hover:text-brand-navy-dark text-lg px-2 py-1 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Teléfono Destinatario */}
          <div className="flex flex-col gap-1">
            <label className="font-sans text-xs font-semibold text-brand-navy-dark">
              Teléfono Destinatario
            </label>
            <input
              type="tel"
              required
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="Ej: 593987654321 o 0987654321"
              className="px-3 py-2 text-xs font-mono bg-white border border-brand-border-field rounded-lg text-brand-navy-dark focus:outline-none focus:ring-2 focus:ring-brand-nav-blue"
            />
            {phonePreview && (
              <span className="font-sans text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md mt-0.5 inline-flex items-center gap-1 font-medium">
                ✓ Se enviará a: <strong>+{phonePreview.formatted}</strong>
                {phonePreview.isEcuadorLocal && " (prefijo Ecuador +593 auto-aplicado)"}
              </span>
            )}
          </div>

          {/* Variables de la plantilla */}
          <div className="flex flex-col gap-2 pt-2 border-t border-brand-separator">
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs font-semibold text-brand-navy-dark">
                Variables de la Plantilla ({allVariableIndexes.length})
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setExtraParamsCount((prev) => prev + 1)}
                  className="px-2 py-0.5 text-[11px] font-sans font-semibold text-brand-nav-blue hover:bg-brand-nav-active rounded border border-brand-nav-blue/30 cursor-pointer"
                >
                  + Parámetro
                </button>
                {extraParamsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setExtraParamsCount((prev) => Math.max(0, prev - 1))}
                    className="px-2 py-0.5 text-[11px] font-sans font-semibold text-brand-text-muted hover:text-brand-accent rounded cursor-pointer"
                  >
                    - Quitar
                  </button>
                )}
              </div>
            </div>

            {allVariableIndexes.length > 0 ? (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                {allVariableIndexes.map((vIdx) => (
                  <div key={vIdx} className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-accent w-12 shrink-0">
                      {`{{${vIdx}}}`}:
                    </span>
                    <input
                      type="text"
                      required
                      value={varValues[vIdx] || ""}
                      onChange={(e) => setVarValues((prev) => ({ ...prev, [vIdx]: e.target.value }))}
                      placeholder={`Valor para variable {{${vIdx}}}`}
                      className="flex-1 px-3 py-1.5 text-xs font-sans bg-white border border-brand-border-field rounded-lg text-brand-navy-dark focus:outline-none focus:ring-2 focus:ring-brand-nav-blue"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-sans text-xs text-brand-text-desc italic bg-brand-bg-alt p-2 rounded-lg">
                Esta plantilla no requiere variables en el cuerpo. Se despachará directamente.
              </p>
            )}
          </div>

          {/* Vista previa en tiempo real */}
          <div className="flex flex-col gap-1 pt-2 border-t border-brand-separator">
            <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-brand-text-muted">
              Vista Previa del Mensaje
            </span>
            <div className="p-3 bg-brand-bg-alt rounded-lg text-xs font-sans text-brand-navy-dark whitespace-pre-wrap border border-brand-border-subtle leading-relaxed">
              {livePreview}
            </div>
          </div>

          {/* Mensajes de Éxito o Error */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 font-sans">
              ✓ {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-brand-accent/30 rounded-lg text-xs text-brand-accent font-sans">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-separator">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[42px] px-4 py-2 bg-brand-white border border-brand-border-field text-brand-text-desc hover:text-brand-navy-dark text-xs font-semibold rounded-lg cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={isSending || !recipientPhone.trim()}
              className="min-h-[42px] px-5 py-2 bg-brand-navy-dark hover:bg-brand-navy-secondary text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isSending ? "Enviando con NeuroAPI..." : "🚀 Despachar Notificación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
