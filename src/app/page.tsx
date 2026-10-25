/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Vistas Oficiales — VISTA 1: Landing Page Informativa Editorial
 * ARCHIVO: src/app/page.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Portada institucional broadsheet de la plataforma. Presenta la baliza editorial,
 * el titular principal, un mini-formulario REAL de acceso a la activación del kit
 * (el motociclista escribe el folio físico impreso en su paquete y navega a
 * `/activate/[folio]`; jamás se navega a folios inventados), la explicación del
 * escaneo del casco en carretera (antena de contacto / código visual → ficha
 * médica + aviso a familiares) y la cita de la Hora Dorada. Todo el copy
 * proviene del diccionario bilingüe tipado. Cero estadísticas fabricadas
 * (Ley 2): la sección how-it-works concentra el peso editorial de la portada.
 *
 * ENTRADAS: diccionario bilingüe vía useLocale; folio físico capturado al usuario.
 * SALIDAS: navegación real a la ruta de activación `/activate/[folio]`.
 * DEPENDENCIAS: useLocale, useHaptic, IncidentCard, IncidentHairline, next/navigation.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas (objetivo landing < 350).
 * - Cero textos hardcodeados (100% t vía useLocale).
 * - Cero folios o enlaces de demostración (Ley 2).
 * - Cero gradientes; fondo concreto #efefef heredado del body.
 * - Objetivos táctiles mínimos de 44x44px y háptica en cada interacción.
 * ==============================================================================
 */

"use client";

import React, { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { IncidentCard } from "@/components/ui/IncidentCard";
import { IncidentHairline } from "@/components/ui/IncidentHairline";

/**
 * Regla local de validación del folio del kit: la MISMA regla que aplica el
 * servicio al recibir el código (recorte, longitud de 4 a 32 caracteres y
 * únicamente letras, números y guiones). El valor se normaliza a mayúsculas
 * al vuelo en el propio campo, igual que la normalización del registro oficial.
 */
const FOLIO_PATTERN = /^[A-Za-z0-9-]{4,32}$/;

export default function HomePage() {
  const { t } = useLocale();
  const router = useRouter();
  const { triggerHaptic } = useHaptic();

  // Folio físico escrito por el usuario (normalizado a mayúsculas al vuelo)
  const [folio, setFolio] = useState<string>("");
  // Marca de error local del mini-formulario de activación
  const [folioError, setFolioError] = useState<boolean>(false);

  /**
   * Captura el folio escrito, lo normaliza a mayúsculas (anti-variaciones del
   * teclado) y recorta la longitud máxima a 32 caracteres, igual que el servicio.
   */
  const handleFolioChange = (event: ChangeEvent<HTMLInputElement>) => {
    const normalized = event.target.value.toUpperCase().slice(0, 32);
    setFolio(normalized);
    if (folioError && FOLIO_PATTERN.test(normalized.trim())) {
      setFolioError(false);
    }
  };

  /**
   * Envío del mini-formulario de activación: valida el folio localmente y,
   * si es válido, navega a la ruta real `/activate/[folio]`. Folio vacío o
   * inválido → mensaje de campo obligatorio y vibración de error.
   * NUNCA se navega a un folio de ejemplo.
   */
  const handleActivateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const candidate = folio.trim();
    if (!candidate || !FOLIO_PATTERN.test(candidate)) {
      triggerHaptic("error");
      setFolioError(true);
      return;
    }
    setFolioError(false);
    triggerHaptic("success");
    router.push(`/activate/${candidate}`);
  };

  return (
    <div className="safe-mobile-container flex flex-col pb-10">
      {/* ══════════════════ HERO EDITORIAL BROADSHEET ══════════════════ */}
      <section className="flex flex-col gap-5 pt-6 sm:pt-10">
        {/* Insignia micro con punto baliza Signal Orange */}
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-signal-orange" aria-hidden="true" />
          <span className="font-sans text-micro font-bold uppercase tracking-widest text-carbon">
            {t.landing.badgeText}
          </span>
        </div>

        {/* Titular y bajada principal (serif editorial) */}
        <h1 className="max-w-3xl font-serif text-heading font-bold tracking-tight text-ink">
          {t.landing.heroHeadline}
        </h1>
        <p className="max-w-2xl font-serif text-body-lg leading-relaxed text-carbon">
          {t.landing.heroSubheadline}
        </p>

        {/* Acceso explicativo: ancla interna a la sección de funcionamiento
            (sin enlaces a códigos falsos de demostración) */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link
            href="#como-funciona"
            onClick={() => triggerHaptic("light")}
            className="btn-neutral text-micro no-underline"
          >
            {t.landing.exploreEmergencyCta}
          </Link>
        </div>
      </section>

      <IncidentHairline variant="solid" />

      {/* ══════════ ACCESO DE ACTIVACIÓN REAL (SIN FOLIOS DE MUESTRA) ══════════ */}
      <section id="activar" className="scroll-mt-28">
        <IncidentCard padding="lg">
          <form onSubmit={handleActivateSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="activate-folio"
                className="font-sans text-micro font-bold uppercase tracking-widest text-ink"
              >
                {t.nav.activateHelmet}
              </label>
              <input
                id="activate-folio"
                name="folio"
                type="text"
                value={folio}
                onChange={handleFolioChange}
                aria-invalid={folioError}
                aria-describedby={folioError ? "activate-folio-error" : undefined}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={32}
                className="w-full min-h-[44px] rounded-[4px] border border-ink bg-paper px-3 py-2 font-sans text-body uppercase text-ink focus:outline-none focus:ring-2 focus:ring-signal-orange"
              />
              {/* Mensaje de validación local: campo vacío o folio inválido */}
              {folioError && (
                <span
                  id="activate-folio-error"
                  role="alert"
                  className="font-sans text-micro text-alert-red"
                >
                  {t.common.requiredField}
                </span>
              )}
            </div>
            <button type="submit" className="btn-neutral self-start text-micro">
              {t.landing.activateCta}
            </button>
          </form>
        </IncidentCard>
      </section>

      <IncidentHairline variant="solid" />

      {/* ══════════ CÓMO FUNCIONA EL ESCANEO DEL CASCO EN CARRETERA ══════════ */}
      <section id="como-funciona" className="flex scroll-mt-28 flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-heading-sm font-bold text-ink sm:text-heading">
            {t.landing.howItWorksTitle}
          </h2>
          <p className="font-serif text-body leading-relaxed text-carbon">
            {t.landing.howItWorksSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Paso 1: chip físico adherido al casco (barra baliza Signal Orange) */}
          <IncidentCard padding="md" className="flex flex-col gap-3">
            <span className="h-1 w-12 bg-signal-orange" aria-hidden="true" />
            <h3 className="font-serif text-body-lg font-bold text-ink">
              {t.landing.step1Title}
            </h3>
            <IncidentHairline variant="subtle" margin="sm" />
            <p className="font-serif text-body leading-relaxed text-carbon">
              {t.landing.step1Desc}
            </p>
          </IncidentCard>

          {/* Paso 2: registro de datos vitales (barra baliza Signal Orange) */}
          <IncidentCard padding="md" className="flex flex-col gap-3">
            <span className="h-1 w-12 bg-signal-orange" aria-hidden="true" />
            <h3 className="font-serif text-body-lg font-bold text-ink">
              {t.landing.step2Title}
            </h3>
            <IncidentHairline variant="subtle" margin="sm" />
            <p className="font-serif text-body leading-relaxed text-carbon">
              {t.landing.step2Desc}
            </p>
          </IncidentCard>

          {/* Paso 3: auxilio inmediato con aviso a familiares (barra baliza) */}
          <IncidentCard padding="md" className="flex flex-col gap-3">
            <span className="h-1 w-12 bg-signal-orange" aria-hidden="true" />
            <h3 className="font-serif text-body-lg font-bold text-ink">
              {t.landing.step3Title}
            </h3>
            <IncidentHairline variant="subtle" margin="sm" />
            <p className="font-serif text-body leading-relaxed text-carbon">
              {t.landing.step3Desc}
            </p>
          </IncidentCard>
        </div>
      </section>

      <IncidentHairline variant="solid" />

      {/* ══════════ CITA EDITORIAL: EL PRINCIPIO DE LA HORA DORADA ══════════ */}
      <section className="border-l-2 border-signal-orange pl-5 sm:pl-6">
        <span className="block font-sans text-micro font-bold uppercase tracking-widest text-ink">
          {t.landing.quoteTitle}
        </span>
        <blockquote className="mt-3 font-serif text-body italic leading-relaxed text-ink sm:text-body-lg">
          {t.landing.quoteBody}
        </blockquote>
        <span className="mt-3 block font-sans text-micro font-semibold text-carbon">
          {t.landing.quoteAuthor}
        </span>
      </section>
    </div>
  );
}
