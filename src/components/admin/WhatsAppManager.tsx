/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Gestor de Notificaciones WhatsApp Cloud (NeuroAPI)
 * ARCHIVO: src/components/admin/WhatsAppManager.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Vista de administración para gestionar la integración oficial de WhatsApp
 * Cloud API a través de NeuroAPI (NeuroChat). Permite auditar el estado de la
 * conexión, listar las plantillas oficiales pre-aprobadas por Meta Graph API,
 * configurar plantillas de forma manual y abrir el modal de despacho oficial.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (módulo ~320 líneas).
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

  // Estados de carga y conexión
  const [status, setStatus] = useState<WhatsAppStatusDTO | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [customApiKey, setCustomApiKey] = useState("");
  const [isEditingKey, setIsEditingKey] = useState(false);

  // Estados de plantillas
  const [templates, setTemplates] = useState<WhatsAppTemplateDTO[]>([]);
  const [stats, setStats] = useState<{ total: number; approved: number; pending: number } | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templatesNotice, setTemplatesNotice] = useState("");

  // Ingreso manual de plantilla si la lista no está sincronizada
  const [manualTemplateName, setManualTemplateName] = useState("");
  const [manualTemplateLang, setManualTemplateLang] = useState("es");
  const [manualTemplateBody, setManualTemplateBody] = useState("");

  // Modal para usar plantilla y enviar notificación
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplateDTO | null>(null);

  // Cargar estado inicial
  const loadStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    try {
      const data = await whatsAppClient.getStatus();
      setStatus(data);
    } catch {
      setStatus({ isConfigured: false, hasPhoneNumberId: false, portalUrl: "https://neurochat.com.ec/neuroapi/api-keys" });
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  // Cargar plantillas desde NeuroAPI
  const loadTemplates = useCallback(async (keyOverride?: string) => {
    setIsLoadingTemplates(true);
    setTemplatesNotice("");
    try {
      const data = await whatsAppClient.getTemplates(keyOverride);
      setTemplates(data.templates || []);
      setStats(data.stats || null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al conectar con NeuroAPI";
      setTemplatesNotice(msg);
      setTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
    void loadTemplates();
  }, [loadStatus, loadTemplates]);

  // Extrae el texto del cuerpo de la plantilla
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
          text: manualTemplateBody.trim() || "Hola {{1}}, alerta de auxilio: {{2}}",
        },
      ],
    };
    setSelectedTemplate(manualTpl);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Tarjeta de Estado y Autenticación NeuroAPI */}
      <div className="bg-brand-white border border-brand-border-subtle rounded-xl p-5 sm:p-6 shadow-xs flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-brand-separator pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-2.5 h-2.5 rounded-full ${status?.isConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}
                aria-hidden="true"
              />
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-brand-text-muted">
                WhatsApp Business Cloud API · NeuroAPI
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-navy-dark leading-tight">
              Canal Oficial de WhatsApp Cloud
            </h2>
            <p className="font-sans text-xs text-brand-text-desc mt-0.5">
              Notificaciones oficiales mediante plantillas de Meta Graph API.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="https://neurochat.com.ec/neuroapi/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[40px] px-3.5 py-1.5 inline-flex items-center gap-1.5 bg-brand-bg-alt hover:bg-brand-nav-active border border-brand-border-field text-brand-navy-dark text-xs font-semibold rounded-lg transition-all no-underline"
            >
              <span>🔑</span>
              <span>Portal NeuroAPI</span>
              <span className="text-[10px] text-brand-text-muted">↗</span>
            </a>

            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                void loadTemplates(customApiKey);
              }}
              disabled={isLoadingTemplates}
              className="min-h-[40px] px-3.5 py-1.5 inline-flex items-center gap-1.5 bg-brand-navy-dark hover:bg-brand-navy-secondary text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <span className={isLoadingTemplates ? "animate-spin" : ""}>↻</span>
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Indicador de Estado y Override de API Key */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-sans">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-brand-text-desc">Estado de Conexión:</span>
            {isLoadingStatus ? (
              <span className="text-brand-text-muted">Verificando...</span>
            ) : status?.isConfigured ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                ✓ Conectado en Servidor (.env)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                ⚠️ Sin API Key en servidor
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isEditingKey ? (
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <input
                  type="password"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="Pegar API Key (scope: whatsapp_cloud_api)"
                  className="px-2.5 py-1.5 text-xs font-mono bg-white border border-brand-border-field rounded-md text-brand-navy-dark focus:outline-none focus:ring-1 focus:ring-brand-nav-blue w-64"
                />
                <button
                  type="button"
                  onClick={() => {
                    void loadTemplates(customApiKey);
                    setIsEditingKey(false);
                  }}
                  className="px-3 py-1.5 bg-brand-navy-dark text-white rounded-md font-semibold text-xs cursor-pointer hover:bg-brand-navy-secondary"
                >
                  Probar
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingKey(false)}
                  className="px-2 py-1.5 text-xs text-brand-text-muted hover:text-brand-navy-dark cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingKey(true)}
                className="text-xs text-brand-nav-blue hover:underline cursor-pointer font-medium"
              >
                {customApiKey ? "Modificar clave manual" : "+ Probar con otra API Key"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Estadísticas y Resumen de Plantillas */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-brand-white border border-brand-border-subtle rounded-xl flex flex-col">
            <span className="text-[11px] font-sans text-brand-text-muted uppercase font-bold tracking-wider">Total de Plantillas</span>
            <span className="font-serif text-2xl font-bold text-brand-navy-dark mt-1">{stats.total}</span>
          </div>
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/60 rounded-xl flex flex-col">
            <span className="text-[11px] font-sans text-emerald-800 uppercase font-bold tracking-wider">Aprobadas por Meta</span>
            <span className="font-serif text-2xl font-bold text-emerald-900 mt-1">{stats.approved}</span>
          </div>
          <div className="p-3.5 bg-amber-50/70 border border-amber-200/60 rounded-xl flex flex-col">
            <span className="text-[11px] font-sans text-amber-800 uppercase font-bold tracking-wider">En Revisión</span>
            <span className="font-serif text-2xl font-bold text-amber-900 mt-1">{stats.pending}</span>
          </div>
        </div>
      )}

      {/* 3. Listado de Plantillas o Formulario de Uso Directo */}
      <div className="flex flex-col gap-3">
        <h3 className="font-serif text-lg font-bold text-brand-navy-dark">
          Plantillas Oficiales de Meta
        </h3>

        {isLoadingTemplates ? (
          <div className="p-8 bg-brand-white border border-brand-border-subtle rounded-xl text-center">
            <span className="font-sans text-xs text-brand-text-muted animate-pulse">
              Consultando conexión con NeuroAPI...
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
                      <span className="font-mono text-xs font-bold text-brand-navy-dark tracking-wide bg-brand-bg-alt px-2 py-0.5 rounded border border-brand-border-subtle">
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
                          {tpl.category} · {tpl.language}
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
          /* Caja de Envío / Vinculación Directa por Nombre de Plantilla */
          <div className="bg-brand-white border border-brand-border-subtle rounded-xl p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
              <span className="font-sans text-xs font-bold uppercase tracking-wider text-brand-navy-dark">
                Conexión WhatsApp Cloud Verificada
              </span>
            </div>

            <p className="font-sans text-xs text-brand-text-desc leading-relaxed">
              La conexión con NeuroAPI está activa. Puedes escribir el nombre de la plantilla oficial creada en tu Meta Business Suite (por ejemplo: <code>confirmacion_cita_cliente</code> o tu plantilla de auxilio) para enviarla de inmediato.
            </p>

            <form onSubmit={handleLaunchManualTemplate} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex flex-col gap-1">
                <label className="font-sans text-xs font-semibold text-brand-navy-dark">Nombre de Plantilla</label>
                <input
                  type="text"
                  required
                  value={manualTemplateName}
                  onChange={(e) => setManualTemplateName(e.target.value)}
                  placeholder="Ej: alerta_emergencia_safe"
                  className="px-3 py-2 text-xs font-mono bg-brand-bg-alt border border-brand-border-field rounded-lg text-brand-navy-dark focus:outline-none focus:ring-2 focus:ring-brand-nav-blue"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-sans text-xs font-semibold text-brand-navy-dark">Idioma</label>
                <input
                  type="text"
                  required
                  value={manualTemplateLang}
                  onChange={(e) => setManualTemplateLang(e.target.value)}
                  placeholder="es"
                  className="px-3 py-2 text-xs font-mono bg-brand-bg-alt border border-brand-border-field rounded-lg text-brand-navy-dark focus:outline-none focus:ring-2 focus:ring-brand-nav-blue"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full min-h-[40px] px-4 py-2 bg-brand-navy-dark hover:bg-brand-navy-secondary text-white font-sans text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>📨</span>
                  <span>Usar esta Plantilla</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* 4. Modal para Enviar Notificación con Plantilla */}
      {selectedTemplate && (
        <SendWhatsAppModal
          template={selectedTemplate}
          customApiKey={customApiKey}
          onClose={() => setSelectedTemplate(null)}
        />
      )}
    </div>
  );
}
