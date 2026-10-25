/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Vistas Oficiales — VISTA 7B: Política de Privacidad y Habeas Data
 * ARCHIVO: src/app/privacy/page.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Página legal oficial de Privacidad y Tratamiento de Datos Médicos Sensibles.
 * Expone el tratamiento confidencial de la información clínica (grupo sanguíneo,
 * alergias, patologías y medicamentos), el consentimiento de geolocalización
 * satelital del Modo Ruta, la política de fotografías de rostro en la nube y los
 * derechos de acceso, rectificación y cancelación (Habeas Data / GDPR) que el
 * motociclista titular puede ejercer desde su panel de control.
 * Todo el cuerpo legal proviene EXCLUSIVAMENTE del diccionario bilingüe tipado
 * (claves legal.privacy*): cero texto jurídico hardcodeado en el componente y
 * cero datos de contacto inventados. La barra de navegación (IncidentNavbar) y
 * el pie institucional (IncidentFooter) ya los aporta el layout raíz, por lo
 * que esta vista NO los duplica.
 *
 * ENTRADAS: Diccionario activo según idioma (useLocale → t.legal.*, t.common.*).
 * SALIDAS: Vista pública /privacy renderizada en Español o Inglés al instante.
 * DEPENDENCIAS: next/link, @/hooks/useLocale, @/components/ui/IncidentCard,
 *               @/components/ui/IncidentHairline.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas (objetivo ~170).
 * - Marco legal canónico exigido por la skill safe-legal-and-terms.
 * - Cero textos hardcodeados (100% t) y cero jerga técnica.
 * - Diseño 'Incident — Technical broadsheet on concrete': hoja de papel blanca
 *   con hairlines capilares entre cláusulas, tipografía serif editorial Times,
 *   microetiquetas Arial 13px y botones neutros con borde negro de 1px.
 * - Bilingüismo instantáneo vía useLocale (re-renderiza al conmutar ES/EN).
 * ==============================================================================
 */

"use client";

import React from "react";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { IncidentCard } from "@/components/ui/IncidentCard";
import { IncidentHairline } from "@/components/ui/IncidentHairline";

/**
 * Vista pública de la Política de Privacidad y Protección de Datos Médicos.
 * Renderiza las cuatro cláusulas del diccionario activo sobre una única hoja
 * editorial (card-paper) separadas por líneas capilares, con encabezado serif
 * y navegación cruzada al pie hacia la portada y los Términos del Servicio.
 */
export default function PrivacyPage() {
  // Diccionario tipado activo según el idioma seleccionado por el visitante.
  // Al conmutar ES/EN desde la barra de navegación, el componente re-renderiza
  // de inmediato y todo el cuerpo legal cambia de idioma sin recargar la página.
  const { t } = useLocale();

  /**
   * Arreglo dinámico con las cuatro cláusulas de privacidad. Se construye en su
   * totalidad desde las claves legal.privacySection* del diccionario tipado
   * (fuente única de la verdad legal), lo que permite renderizarlas con una
   * sola plantilla editorial y garantiza cero texto hardcodeado en el JSX.
   */
  const privacySections: Array<{ title: string; body: string }> = [
    {
      // Cláusula 1: tratamiento exclusivo de datos sensibles de salud.
      title: t.legal.privacySection1Title,
      body: t.legal.privacySection1Body,
    },
    {
      // Cláusula 2: geolocalización satelital y consentimiento del Modo Ruta.
      title: t.legal.privacySection2Title,
      body: t.legal.privacySection2Body,
    },
    {
      // Cláusula 3: fotografías de perfil procesadas en la nube.
      title: t.legal.privacySection3Title,
      body: t.legal.privacySection3Body,
    },
    {
      // Cláusula 4: derechos de acceso, rectificación y cancelación (Habeas Data).
      title: t.legal.privacySection4Title,
      body: t.legal.privacySection4Body,
    },
  ];

  return (
    <div className="safe-mobile-container py-8 sm:py-12 flex flex-col gap-8">
      {/* ==================================================================== */}
      {/* Encabezado Broadsheet Legal: titular serif grande, entradilla y fecha */}
      {/* de vigencia en microetiqueta Arial, cerrados por hairline de tinta.   */}
      {/* ==================================================================== */}
      <section className="flex flex-col gap-2 border-b border-ink pb-4">
        <h1 className="font-serif text-heading font-bold text-ink leading-tight">
          {t.legal.privacyTitle}
        </h1>
        <p className="font-serif text-body text-carbon">
          {t.legal.privacySubtitle}
        </p>
        {/* Metadato de última actualización en micro Arial 13px */}
        <span className="font-sans text-micro text-carbon mt-1">
          {t.legal.lastUpdated}
        </span>
      </section>

      {/* ==================================================================== */}
      {/* Hoja editorial única (card-paper: papel blanco, borde capilar negro,  */}
      {/* radio 12px y sombra ultraligera) con las cuatro cláusulas separadas   */}
      {/* por hairlines sutiles, al estilo de un boletín técnico impreso.       */}
      {/* ==================================================================== */}
      <IncidentCard padding="lg">
        {privacySections.map((section, index) => (
          <React.Fragment key={section.title}>
            {/* Hairline divisorio entre cláusulas (nunca antes de la primera) */}
            {index > 0 && <IncidentHairline variant="subtle" margin="lg" />}
            <section>
              {/* Título de cláusula: serif bold 24px (token heading-sm) */}
              <h2 className="font-serif text-heading-sm font-bold text-ink mb-2">
                {section.title}
              </h2>
              {/* Cuerpo de lectura cómoda: serif 16px con interlineado relajado */}
              <p className="font-serif text-body text-carbon leading-relaxed">
                {section.body}
              </p>
            </section>
          </React.Fragment>
        ))}
      </IncidentCard>

      <IncidentHairline variant="subtle" />

      {/* ==================================================================== */}
      {/* Navegación al pie: retorno a la portada y enlace cruzado a Términos.  */}
      {/* Botones neutros canónicos (concreto + borde negro 1px, radio 4px)     */}
      {/* con área táctil mínima garantizada de 44px vía .btn-neutral.          */}
      {/* ==================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="btn-neutral">
          {t.common.backToHome}
        </Link>
        <Link href="/terms" className="btn-neutral">
          {t.common.termsLink}
        </Link>
      </div>
    </div>
  );
}
