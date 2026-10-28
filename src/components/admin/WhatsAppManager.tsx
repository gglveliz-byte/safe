/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Conexión y Plantillas de WhatsApp para Notificaciones
 * ARCHIVO: src/components/admin/WhatsAppManager.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Vista de administración para gestionar la conexión de WhatsApp Cloud API y
 * el listado de plantillas oficiales para el envío de notificaciones de auxilio.
 * Incluye botón directo para consultar plantillas y botón para vincular el
 * número telefónico oficial mediante Meta Embedded Signup (Coexistencia).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * - Objetivos táctiles mínimos de 44x44px y háptica en interacciones.
 * ==============================================================================
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useHaptic } from "@/hooks/useHaptic";
import {
  whatsAppClient,
  type WhatsAppStatusDTO,
  type WhatsAppTemplateDTO,
  type WhatsAppTemplateComponentDTO,
} from "@/lib/whatsapp-client";
import { SendWhatsAppModal } from "@/components/admin/SendWhatsAppModal";

export function WhatsAppManager() {
  const { triggerHaptic } = useHaptic();

  // Estados de conexión y carga
  const [status, setStatus] = useState<WhatsAppStatusDTO | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  // Estados de plantillas
  const [templates, setTemplates] = useState<WhatsAppTemplateDTO[]>([]);
  const [stats, setStats] = useState<{ total: number; approved: number; pending: number } | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templatesNotice, setTemplatesNotice] = useState("");

  // Disparo manual si aún no se listan plantillas desde Meta
  const [manualTemplateName, setManualTemplateName] = useState("");
  const [manualTemplateLang, setManualTemplateLang] = useState("es");

  // Modal para usar plantilla y enviar notificación
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplateDTO | null>(null);

  // Cargar estado inicial del servidor
  const loadStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    try {
      const data = await whatsAppClient.getStatus();
      setStatus(data);
    } catch {
      setStatus({ isConfigured: false, hasPhoneNumberId: false, portalUrl: "" });
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  // Consultar plantillas oficiales desde Meta / NeuroAPI
  const handleConsultarPlantillas = useCallback(async () => {
    setIsLoadingTemplates(true);
    setTemplatesNotice("");
    triggerHaptic("light");
    try {
      const data = await whatsAppClient.getTemplates();
      setTemplates(data.templates || []);
      setStats(data.stats || null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al consultar plantillas de WhatsApp";
      setTemplatesNotice(msg);
      setTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [triggerHaptic]);

  // Iniciar flujo de conexión Meta Embedded Signup (Coexistencia)
  const handleConectarWhatsApp = async () => {
    setIsConnecting(true);
    triggerHaptic("light");
    try {
      const returnUrl = typeof window !== "undefined" ? window.location.href : "";
      const session = await whatsAppClient.getConnectSession(returnUrl);
      if (session.url) {
        window.open(session.url, "_blank", "noopener,noreferrer,width=600,height=750");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo iniciar la conexión con Meta.";
      alert(msg);
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    void loadStatus();
    void handleConsultarPlantillas();
  }, [loadStatus, handleConsultarPlantillas]);

  const getBodyComponent = (template: WhatsAppTemplateDTO): WhatsAppTemplateComponentDTO | undefined => {
    return template.components.find((c) => c.type === "BODY");
  };

  const handleLaunchManualTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTemplateName.trim()) return;

    triggerHaptic("light");
    const manualTpl: WhatsAppTemplateDTO = {
      name: manualTemplateName.trim(),
      language: manualTemplateLang.trim() || "es",
      status: "APPROVED",
      category: "UTILITY",
      components: [
        {
          type: "BODY",
          text: "Hola {{1}}, alerta de auxilio: {{2}}",
        },
      ],
    };
    setSelectedTemplate(manualTpl);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Barra de Conexión a WhatsApp para Notificaciones */}
      <div className="bg-brand-white border border-brand-border-subtle rounded-xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`w-2.5 h-2.5 rounded-full ${status?.isConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}
              aria-hidden="true"
            />
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-navy-dark leading-tight">
              Conexión a WhatsApp para Notificaciones
            </h2>
          </div>
          <p className="font-sans text-xs text-brand-text-desc">
            {isLoadingStatus
              ? "Verificando conexión..."
              : status?.isConfigured
                ? "Servicio activo y autenticado para envío de alertas por WhatsApp."
                : "Se requiere configurar la API Key de WhatsApp en las variables del servidor."}
          </p>
        </div>

        {/* Botones de acción principales */}
        <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
          <button
            type="button"
            onClick={handleConectarWhatsApp}
            disabled={isConnecting}
            className="min-h-[44px] px-4 py-2 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="Conecta tu WhatsApp Business de tu teléfono para convivir con la Cloud API (Modo Coexistencia)"
          >
            <span>📲</span>
            <span>{isConnecting ? "Abriendo Meta..." : "Conectar WhatsApp (Coexistencia)"}</span>
          </button>

          <button
            type="button"
            onClick={handleConsultarPlantillas}
            disabled={isLoadingTemplates}
            className="min-h-[44px] px-4 py-2 inline-flex items-center justify-center gap-2 bg-brand-navy-dark hover:bg-brand-navy-secondary text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <span className={isLoadingTemplates ? "animate-spin" : ""}>🔄</span>
            <span>{isLoadingTemplates ? "Consultando..." : "Consultar Plantillas"}</span>
          </button>
        </div>
      </div>

      {/* 2. Estadísticas de Plantillas (si existen) */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-brand-white border border-brand-border-subtle rounded-xl flex flex-col">
            <span className="text-[11px] font-sans text-brand-text-muted uppercase font-bold tracking-wider">
              Total de Plantillas
            </span>
            <span className="font-serif text-2xl font-bold text-brand-navy-dark mt-1">{stats.total}</span>
          </div>
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/60 rounded-xl flex flex-col">
            <span className="text-[11px] font-sans text-emerald-800 uppercase font-bold tracking-wider">
              Aprobadas por Meta
            </span>
            <span className="font-serif text-2xl font-bold text-emerald-900 mt-1">{stats.approved}</span>
          </div>
          <div className="p-3.5 bg-amber-50/70 border border-amber-200/60 rounded-xl flex flex-col">
            <span className="text-[11px] font-sans text-amber-800 uppercase font-bold tracking-wider">
              En Revisión
            </span>
            <span className="font-serif text-2xl font-bold text-amber-900 mt-1">{stats.pending}</span>
          </div>
        </div>
      )}

      {/* 3. Listado de Plantillas Existentes o Estado de Espera */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-brand-navy-dark">
            Plantillas Disponibles en WhatsApp
          </h3>
          {templates.length > 0 && (
            <span className="font-sans text-xs text-brand-text-muted">
              {templates.length} plantilla(s) lista(s) para enviar
            </span>
          )}
        </div>

        {isLoadingTemplates ? (
          <div className="p-10 bg-brand-white border border-brand-border-subtle rounded-xl text-center flex flex-col items-center justify-center gap-3">
            <span className="animate-spin text-2xl">🔄</span>
            <span className="font-sans text-xs text-brand-text-muted font-medium">
              Consultando plantillas oficiales en Meta Graph API...
            </span>
          </div>
        ) : templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => {
              const bodyComp = getBodyComponent(tpl);
              const varCount = bodyComp?.text ? (bodyComp.text.match(/\{\{\d+\}\}/g) || []).length : 0;
              return (
                <div
                  key={`${tpl.name}-${tpl.language}`}
                  className="bg-brand-white border border-brand-border-subtle rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-xs hover:border-brand-border-strong transition-all"
                >
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-brand-navy-dark tracking-wide bg-brand-bg-alt px-2.5 py-1 rounded border border-brand-border-subtle">
                        {tpl.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-sans text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                            tpl.status === "APPROVED"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : "bg-amber-50 border-amber-200 text-amber-800"
                          }`}
                        >
                          {tpl.status === "APPROVED" ? "✓ APROBADA" : tpl.status}
                        </span>
                        <span className="font-sans text-[10px] font-semibold px-2 py-0.5 rounded-md bg-brand-nav-active border border-brand-nav-blue/20 text-brand-navy-dark uppercase">
                          {tpl.language}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-brand-bg-alt/70 border border-brand-border-subtle/80 rounded-lg text-xs font-sans text-brand-navy-dark whitespace-pre-wrap leading-relaxed">
                      {bodyComp?.text || "(Sin texto en el cuerpo)"}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-brand-separator flex items-center justify-between gap-2">
                    <span className="text-[11px] font-sans text-brand-text-muted">
                      Variables dinámicas: {varCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic("light");
                        setSelectedTemplate(tpl);
                      }}
                      className="min-h-[38px] px-3.5 py-1.5 inline-flex items-center gap-1.5 bg-brand-navy-dark hover:bg-brand-navy-secondary text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
                    >
                      <span>📨</span>
                      <span>Usar esta Plantilla</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Estado cuando no hay plantillas sincronizadas o falta vincular número */
          <div className="bg-brand-white border border-brand-border-subtle rounded-xl p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <h4 className="font-serif text-base font-bold text-brand-navy-dark">
                  Sin plantillas disponibles en Meta
                </h4>
                <p className="font-sans text-xs text-brand-text-desc mt-1 leading-relaxed">
                  Para que las plantillas aparezcan en este listado:
                  <br />
                  1. Conecta tu WhatsApp pulsando el botón <strong>&quot;Conectar WhatsApp (Coexistencia)&quot;</strong> arriba.
                  <br />
                  2. En Meta Business Suite o NeuroChat crea y aprueba tus plantillas de mensajes (ej: <code>alerta_accidente</code>).
                  <br />
                  3. Pulsa el botón <strong>&quot;Consultar Plantillas&quot;</strong>.
                </p>
              </div>
            </div>

            {/* Alternativa: Probar plantilla directa si ya está aprobada en Meta */}
            <div className="pt-3 border-t border-brand-separator">
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-brand-text-muted block mb-2">
                O usar plantilla por nombre directo
              </span>
              <form onSubmit={handleLaunchManualTemplate} className="flex flex-col sm:flex-row items-end gap-2.5">
                <div className="flex-1 w-full">
                  <input
                    type="text"
                    required
                    value={manualTemplateName}
                    onChange={(e) => setManualTemplateName(e.target.value)}
                    placeholder="Nombre exacto en Meta (ej: alerta_accidente)"
                    className="w-full px-3 py-2 text-xs font-mono bg-brand-bg-alt border border-brand-border-field rounded-lg text-brand-navy-dark focus:outline-none focus:ring-2 focus:ring-brand-nav-blue"
                  />
                </div>
                <div className="w-24">
                  <input
                    type="text"
                    required
                    value={manualTemplateLang}
                    onChange={(e) => setManualTemplateLang(e.target.value)}
                    placeholder="es"
                    className="w-full px-3 py-2 text-xs font-mono bg-brand-bg-alt border border-brand-border-field rounded-lg text-brand-navy-dark text-center focus:outline-none focus:ring-2 focus:ring-brand-nav-blue"
                  />
                </div>
                <button
                  type="submit"
                  className="min-h-[38px] px-4 py-2 bg-brand-navy-dark hover:bg-brand-navy-secondary text-white font-sans text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer whitespace-nowrap"
                >
                  Usar esta Plantilla
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* 4. Modal para Enviar Notificación con Plantilla */}
      {selectedTemplate && (
        <SendWhatsAppModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
        />
      )}
    </div>
  );
}
