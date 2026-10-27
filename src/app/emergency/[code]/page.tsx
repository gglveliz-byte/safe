/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Vistas Oficiales — VISTA 3: Ficha Médica de Emergencia y Rescate Vial
 * ARCHIVO: src/app/emergency/[code]/page.tsx
 * ------------------------------------------------------------------------------
 * Pantalla crítica al escanear un casco activo en carretera (contraste solar
 * máximo). Al montar ejecuta DOS flujos PARALELOS e independientes (el auxilio
 * no tiene punto único de fallo): (A) lectura real de la ficha médica y
 * (B) captura GPS del rescatista + despacho real de la alerta. Si la ficha
 * falla, la alerta sigue su curso: el backend recurre a la última posición
 * conocida del piloto (Modo Ruta). Sin permiso de ubicación se despacha sin
 * coordenadas. Cero folios de respaldo y cero alertas fabricadas (Ley 2).
 *
 * ENTRADAS: params.code (folio) y querystring ?v=nfc|qr del gateway.
 * SALIDAS: ficha real, estado del despacho, coordenadas del siniestro y
 * acciones de llamada (indisponibles sin datos reales de la ficha).
 * DEPENDENCIAS: ./emergency-api (capa tipada), componentes ui/medical del
 * Director Frontend 1 y diccionarios vía useLocale.
 * LEYES: < 450 líneas · cero mocks · cero texto hardcodeado (100% `t`).
 * ==============================================================================
 */

"use client";

import React, { useCallback, useEffect, useRef, useState, use } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { IncidentCard } from "@/components/ui/IncidentCard";
import { IncidentAlertBanner } from "@/components/ui/IncidentAlertBanner";
import { EmergencyActionPanel } from "@/components/medical/EmergencyActionPanel";
import { EmergencyClinicalDetails } from "./EmergencyClinicalDetails";
import { BrandLogo } from "@/components/ui/BrandLogo";
import {
  fetchEmergencyProfile,
  dispatchEmergencyAlert,
  HumanApiError,
  type PublicEmergencyProfileDTO,
  type DispatchAlertResult,
  type ScanSource,
} from "./emergency-api";

/** Props de la ruta dinámica: React 19 entrega params como promesa. */
interface PageProps {
  params: Promise<{ code: string }>;
}

/** Estados de carga de la ficha médica real. */
type LoadStatus = "loading" | "error" | "ready";

/** Detecta el método de lectura del gateway (?v=nfc|qr); sin parámetro válido
 * el origen es "direct" (literales técnicos del contrato: datos, no copy). */
function detectScanSource(): ScanSource {
  try {
    const scanParam = new URLSearchParams(window.location.search).get("v");
    if (scanParam === "nfc" || scanParam === "qr") return scanParam;
  } catch {
    // URL ilegible: el origen directo es el valor seguro por defecto.
  }
  return "direct";
}

export default function EmergencyPage({ params }: PageProps) {
  const resolvedParams = use(params);
  // Folio normalizado desde la URL. Jamás existe folio de respaldo (Ley 2).
  const code = (resolvedParams?.code ?? "").trim().toUpperCase();

  const { locale, t } = useLocale();
  const { triggerHaptic } = useHaptic();

  // Ficha médica: 100% real desde el backend, sin estado inicial de demo
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [profile, setProfile] = useState<PublicEmergencyProfileDTO | null>(null);
  const [humanMessage, setHumanMessage] = useState<string | null>(null);

  // Localización satelital y resultado real del despacho de la alerta
  const [gpsStatus, setGpsStatus] = useState<"acquiring" | "ready" | "denied">("acquiring");
  const [alertResult, setAlertResult] = useState<DispatchAlertResult | null>(null);
  const [alertFailed, setAlertFailed] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  // Origen del escaneo exhibido como microetiqueta (nfc/qr/direct: dato técnico)
  const [scanSource, setScanSource] = useState<ScanSource>("direct");

  // Marca de vigencia del montaje: evita actualizar estado tras navegar fuera
  const cancelledRef = useRef(false);

  /** Despacho real de la alerta, con coordenadas del escáner o sin ellas (el
   * backend recurre a la última posición conocida del piloto en Modo Ruta).
   * Independiente de la lectura de la ficha médica. */
  const sendDispatch = useCallback(
    async (coords: { latitude: number; longitude: number; accuracy?: number } | null) => {
      const source = detectScanSource();
      try {
        const result = await dispatchEmergencyAlert(
          coords
            ? { code, latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy, scanSource: source }
            : { code, scanSource: source },
        );
        if (cancelledRef.current) return;
        setAlertFailed(false);
        setAlertMessage(null);
        setAlertResult(result);
        triggerHaptic(result.wasThrottled ? "light" : "success");
      } catch (error) {
        if (cancelledRef.current) return;
        // Fallo humano real del backend: se muestra tal cual, sin fabricar nada
        setAlertResult(null);
        setAlertFailed(true);
        setAlertMessage(error instanceof HumanApiError ? error.humanMessage : null);
        triggerHaptic("error");
      }
    },
    [code, triggerHaptic],
  );

  /** Captura la posición satelital del rescatista y despacha de inmediato. */
  const captureGpsAndDispatch = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setGpsStatus("denied");
      void sendDispatch(null);
      return;
    }
    setGpsStatus("acquiring");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelledRef.current) return;
        setGpsStatus("ready");
        void sendDispatch({ latitude: position.coords.latitude, longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? undefined });
      },
      () => {
        if (cancelledRef.current) return;
        setGpsStatus("denied");
        void sendDispatch(null);
      },
      // Flujo 2.4 del documento maestro: respaldo a los ~6 segundos (en una
      // emergencia real cada segundo cuenta); se acepta un fix reciente de
      // hasta 30 s para permitir el despacho inmediato.
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 30000 },
    );
  }, [sendDispatch]);

  // Efecto de montaje: háptica + DOS flujos paralelos (ficha por un lado;
  // captura GPS y despacho por otro). La alerta jamás queda encadenada al
  // éxito del GET de la ficha (punto único de fallo erradicado).
  useEffect(() => {
    if (code === "") return;
    cancelledRef.current = false;
    triggerHaptic("warning");
    setScanSource(detectScanSource());

    // Flujo A — Lectura real de la ficha médica
    (async () => {
      try {
        const data = await fetchEmergencyProfile(code);
        if (cancelledRef.current) return;
        setProfile(data);
        setStatus("ready");
      } catch (error) {
        if (cancelledRef.current) return;
        setHumanMessage(error instanceof HumanApiError ? error.humanMessage : null);
        setStatus("error");
        triggerHaptic("error");
      }
    })();

    // Flujo B — Captura satelital + despacho real, en paralelo e independiente
    captureGpsAndDispatch();

    return () => {
      cancelledRef.current = true;
    };
  }, [code, triggerHaptic, captureGpsAndDispatch]);

  // Reintento de la ficha: recarga la vista para reiniciar el flujo completo
  const handleRetry = () => {
    triggerHaptic("light");
    window.location.reload();
  };

  // Reintento del despacho: recaptura GPS y reenvía la alerta sin perder la vista
  const handleAlertRetry = () => {
    triggerHaptic("light");
    setAlertFailed(false);
    setAlertMessage(null);
    captureGpsAndDispatch();
  };

  // RAMA 1 — Folio vacío: error humano con regreso al inicio (sin respaldo)
  if (code === "") {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-6">
        <IncidentAlertBanner type="emergency" title={t.emergency.title} message={t.common.errorGeneric} />
        <a href="/" className="btn-neutral w-full no-underline">{t.common.backToHome}</a>
      </div>
    );
  }

  // Enlace directo a Google Maps: sólo si el despacho devolvió una URL real
  const mapsAction = alertResult?.googleMapsUrl ? (
    <a
      href={alertResult.googleMapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => triggerHaptic("light")}
      className="btn-neutral w-full sm:w-auto no-underline font-bold text-xs"
    >
      {t.emergency.openInGoogleMaps} ↗
    </a>
  ) : undefined;

  // Botón táctil de alta visibilidad para forzar la adquisición satelital y reenvío de alerta
  const gpsTactileRetryButton = (
    <button
      type="button"
      onClick={handleAlertRetry}
      className="w-full py-4 px-4 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-xl font-sans text-sm font-bold tracking-wider uppercase shadow-md border-2 border-white flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform cursor-pointer"
    >
      <span className="text-sm font-extrabold flex items-center gap-2">
        <span aria-hidden="true">🚨</span>
        <span>{t.emergency.gpsPendingTitle}</span>
      </span>
      <span className="text-xs font-bold underline">{t.emergency.gpsRetryButton}</span>
    </button>
  );

  // RAMA 2 — Carga: skeleton broadsheet con bloques pulsantes
  if (status === "loading") {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-6 sm:py-10 flex flex-col gap-6 animate-fadeInUp">
        <IncidentAlertBanner type="emergency" title={t.emergency.title} message={t.emergency.bannerWarning} />
        <div className="flex items-center gap-2 p-3 bg-brand-white border border-brand-border-subtle rounded-xl shadow-xs">
          <span className="font-mono text-xs font-bold uppercase tracking-widest bg-brand-navy-dark text-white px-3 py-1 rounded-md">{code}</span>
          <span className="font-sans text-xs font-bold uppercase text-brand-accent">{t.common.emergencyBadge}</span>
        </div>
        <div className="card-paper flex flex-col gap-4" aria-hidden="true">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-xl bg-slate-100 animate-pulse flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-5 w-2/3 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-slate-100 rounded animate-pulse" />
              <div className="h-3 w-1/3 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          </div>
          <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  // RAMA 3 — Error humano de la ficha
  if (status === "error" || !profile) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-6 sm:py-10 flex flex-col gap-6 animate-fadeInUp">
        <IncidentAlertBanner type="emergency" title={t.emergency.title} message={humanMessage ?? t.common.errorGeneric} />
        <div className="bg-brand-white border border-brand-border-subtle rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
          <button type="button" onClick={handleRetry} className="btn-neutral flex-1 font-bold">
            <span aria-hidden="true">↻</span>
            <span>{t.nav.emergencyDemo}</span>
          </button>
          <a href="/" className="btn-neutral flex-1 no-underline font-bold text-center">{t.common.backToHome}</a>
        </div>
        {alertResult?.locationOrigin === "PENDING_GPS" && gpsTactileRetryButton}
      </div>
    );
  }

  // Metadato micro con la fecha real de actualización del registro
  const updatedAtDate = new Date(profile.updatedAt);
  const updatedAtLabel = Number.isNaN(updatedAtDate.getTime())
    ? profile.updatedAt
    : new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", { dateStyle: "long" }).format(updatedAtDate);

  const medical = profile.profile;

  // RAMA 4 — Ficha médica real de alto contraste solar (SAFE 2026)
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 sm:py-10 flex flex-col gap-6 animate-fadeInUp">
      {/* 1. Barra de Identidad del Casco y Telemetría Satelital */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-brand-white border border-brand-border-subtle rounded-xl shadow-xs">
        <div className="flex items-center gap-2.5">
          <BrandLogo size="xs" />
          <span className="font-mono text-xs font-bold uppercase tracking-widest bg-brand-navy-dark text-white px-3 py-1 rounded-md">
            {code}
          </span>
          <span className="font-sans text-xs font-bold uppercase text-brand-accent tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-accent animate-ping" />
            {t.common.emergencyBadge}
          </span>
        </div>
        <div className="font-sans text-xs font-semibold flex items-center gap-2">
          {gpsStatus === "acquiring" && (
            <span className="text-brand-text-muted flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
              {t.emergency.gpsAcquiring}
            </span>
          )}
          {gpsStatus === "ready" && (
            <span className="text-emerald-700 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              {t.emergency.gpsReady}
            </span>
          )}
          {gpsStatus === "denied" && (
            <span className="text-amber-700 font-semibold flex items-center gap-1">
              ⚠️ {t.emergency.gpsDenied}
            </span>
          )}
        </div>
      </div>

      {/* 2. Banner de Estado del Despacho y Ubicación Satelital */}
      {alertResult?.locationOrigin === "PENDING_GPS" && (
        <div className="flex flex-col gap-3">
          <IncidentAlertBanner
            type="emergency"
            title={t.emergency.gpsPendingTitle}
            message={t.emergency.gpsPendingNotice}
          />
          {gpsTactileRetryButton}
        </div>
      )}

      {alertResult && alertResult.locationOrigin !== "PENDING_GPS" && alertResult.emailsSentCount > 0 && (
        <IncidentAlertBanner
          type="info"
          title={t.emergency.dispatchedAlert}
          message={`${t.emergency.alertSentNotice} (${alertResult.dmsFormatted})`}
          action={mapsAction}
        />
      )}

      {alertResult && alertResult.locationOrigin !== "PENDING_GPS" && alertResult.emailsSentCount === 0 && (
        <IncidentAlertBanner
          type="warning"
          title={t.emergency.title}
          message={`${t.emergency.bannerWarning} (${alertResult.dmsFormatted})`}
          action={mapsAction}
        />
      )}

      {alertFailed && (
        <div className="flex flex-col gap-3">
          <IncidentAlertBanner type="emergency" message={alertMessage ?? t.common.errorGeneric} />
          {gpsTactileRetryButton}
        </div>
      )}

      {/* 3. Ficha Médica de Alto Contraste Solar con Donante, Notas y Ubicación */}
      <EmergencyClinicalDetails medical={medical} updatedAtLabel={updatedAtLabel} />

      {/* 4. Panel de Acciones Críticas (Llamar, WhatsApp, Maps, Copiar Enlace) */}
      <EmergencyActionPanel
        riderName={medical.fullName}
        bloodType={medical.bloodType}
        googleMapsUrl={alertResult?.googleMapsUrl ?? null}
        emergencyNumber={medical.emergencyNumber ?? null}
        contacts={medical.emergencyContacts}
      />

      {/* 5. Contactos de Aviso Inmediato */}
      <IncidentCard padding="md" className="flex flex-col gap-4">
        <h3 className="font-serif font-bold text-xl text-brand-navy-dark pb-3 border-b border-brand-separator">
          {t.emergency.emergencyContacts}
        </h3>
        {medical.emergencyContacts.length === 0 ? (
          <p className="font-sans text-sm text-brand-text-desc">{t.emergency.noContacts}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {medical.emergencyContacts.map((contact) => (
              <div
                key={contact.id}
                className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                  contact.isPrimary
                    ? "bg-brand-white border-brand-accent/40 shadow-xs"
                    : "bg-brand-bg-alt border-brand-border-subtle"
                }`}
              >
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    {contact.isPrimary && (
                      <span className="w-2 h-2 rounded-full bg-brand-accent flex-shrink-0" aria-hidden="true" />
                    )}
                    <strong className="font-sans text-sm font-bold text-brand-navy-dark truncate">
                      {contact.name}
                    </strong>
                  </div>
                  <span className="font-sans text-xs text-brand-text-muted mt-0.5">{contact.relation}</span>
                </div>
                <a
                  href={`tel:${contact.phone}`}
                  onClick={() => triggerHaptic("light")}
                  className="btn-neutral min-h-[44px] text-xs font-bold no-underline flex-shrink-0"
                >
                  📞 {contact.phone}
                </a>
              </div>
            ))}
          </div>
        )}
      </IncidentCard>

      {/* 6. Cláusula Legal del Buen Samaritano */}
      <div className="p-4 bg-brand-bg-alt border border-brand-border-subtle rounded-xl text-center">
        <p className="font-sans text-xs text-brand-text-muted leading-relaxed">
          ⚖️ {t.emergency.emergencyWarningText}
        </p>
        <p className="font-sans text-xs text-brand-text-muted mt-1">
          {t.emergency.solarContrastNotice}
        </p>
      </div>
    </div>
  );
}
