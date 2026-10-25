/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Landing Page — Modal Ficha Médica de Demostración
 * ARCHIVO: src/components/landing/DemoMedicalModal.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Modal accesible de demostración que despliega una vista previa fiel de la
 * interfaz médica optimizada para socorristas y paramédicos al escanear un casco.
 * 
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas (módulo < 150 líneas).
 * - Cero texto hardcodeado (consumo de t vía useLocale).
 * - Accesibilidad: tecla Escape, foco accesible y backdrop click.
 * ==============================================================================
 */

"use client";

import React, { useEffect } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";

interface DemoMedicalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoMedicalModal({ isOpen, onClose }: DemoMedicalModalProps) {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  // Cerrar con tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="modal-demo"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-demo-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-brand-navy-dark/65 backdrop-blur-sm animate-fadeInDown"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          triggerHaptic("light");
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-lg p-6 sm:p-8 bg-brand-white border border-brand-border-subtle rounded-xl shadow-2xl transition-transform animate-fadeInUp">
        {/* Encabezado del Modal */}
        <div className="flex items-start justify-between pb-4 mb-5 border-b border-brand-separator">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-brand-navy-dark shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-pulse" />
            </div>
            <div>
              <h3
                id="modal-demo-title"
                className="font-serif text-lg font-bold leading-tight text-brand-navy-dark"
              >
                {t.landing.demoModalTitle}
              </h3>
              <span className="font-sans text-[10px] text-brand-text-muted uppercase tracking-wider font-semibold">
                {t.landing.demoModalId}
              </span>
            </div>
          </div>
          <button
            type="button"
            aria-label={t.common.cancel}
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="p-1.5 text-brand-text-muted hover:text-brand-navy-dark rounded-md hover:bg-brand-bg-subtle transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Resumen de Datos Vitales */}
        <div className="space-y-4 font-sans">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-brand-bg-alt border border-brand-border-subtle rounded-lg hover:border-brand-border-strong transition-colors">
              <span className="text-[11px] font-semibold text-brand-text-muted uppercase block">
                {t.landing.demoBloodTypeLabel}
              </span>
              <span className="font-serif text-2xl font-bold text-brand-accent">
                {t.landing.demoBloodTypeValue}
              </span>
            </div>
            <div className="p-3.5 bg-brand-bg-alt border border-brand-border-subtle rounded-lg hover:border-brand-border-strong transition-colors">
              <span className="text-[11px] font-semibold text-brand-text-muted uppercase block">
                {t.landing.demoOrganDonorLabel}
              </span>
              <span className="font-sans text-base font-bold text-brand-navy-dark">
                {t.landing.demoOrganDonorValue}
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-brand-white border border-brand-border-subtle rounded-lg">
            <span className="text-[11px] font-bold text-brand-accent uppercase tracking-wider block mb-1">
              {t.landing.demoAllergiesLabel}
            </span>
            <p className="text-sm font-medium text-brand-navy-dark">
              {t.landing.demoAllergiesValue}
            </p>
          </div>

          <div className="p-3.5 bg-brand-white border border-brand-border-subtle rounded-lg">
            <span className="text-[11px] font-bold text-brand-text-desc uppercase tracking-wider block mb-1">
              {t.landing.demoContactsLabel}
            </span>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-brand-bg-subtle">
                <span className="font-medium text-brand-navy-dark">
                  {t.landing.demoContact1Name}
                </span>
                <a
                  href={`tel:${t.landing.demoContact1Phone.replace(/\s+/g, "")}`}
                  className="text-brand-nav-blue font-semibold hover:underline transition-colors"
                >
                  {t.landing.demoContact1Phone}
                </a>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-brand-navy-dark">
                  {t.landing.demoContact2Name}
                </span>
                <a
                  href={`tel:${t.landing.demoContact2Phone.replace(/\s+/g, "")}`}
                  className="text-brand-nav-blue font-semibold hover:underline transition-colors"
                >
                  {t.landing.demoContact2Phone}
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 text-xs text-brand-text-desc bg-brand-nav-active border border-brand-border-subtle rounded-lg">
            <svg className="w-4 h-4 text-brand-nav-blue mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{t.landing.demoNotice}</span>
          </div>
        </div>

        {/* Botón de Cierre */}
        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-brand-navy-dark rounded-md hover:bg-brand-navy-secondary active:scale-95 transition-all shadow-sm"
          >
            {t.landing.demoClose}
          </button>
        </div>
      </div>
    </div>
  );
}
