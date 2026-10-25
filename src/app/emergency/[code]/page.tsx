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
import { MedicalBadge } from "@/components/medical/MedicalBadge";
import { EmergencyActionPanel } from "@/components/medical/EmergencyActionPanel";
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
      <div className="safe-mobile-container py-6 sm:py-10 flex flex-col gap-6">
        <IncidentAlertBanner type="emergency" title={t.emergency.title} message={t.common.errorGeneric} />
        <a href="/" className="btn-neutral w-full no-underline">{t.common.backToHome}</a>
      </div>
    );
  }

  // Cabecera editorial compartida por los estados de carga y de error
  const headerBanner = (
    <IncidentAlertBanner type="emergency" title={t.emergency.title} message={t.emergency.bannerWarning} />
  );

  // Enlace directo a Google Maps: sólo si el despacho devolvió una URL real
  const mapsAction = alertResult?.googleMapsUrl ? (
    <a href={alertResult.googleMapsUrl} target="_blank" rel="noopener noreferrer"
      onClick={() => triggerHaptic("light")} className="btn-neutral w-full no-underline font-bold">
      {t.emergency.openInGoogleMaps} ↗
    </a>
  ) : undefined;

  // Botón de reintento del despacho dentro del banner de fallo. BRECHA DE
  // DICCIONARIO (reportada): no existe clave propia de "reenviar alerta"; se
  // emplea t.nav.emergencyDemo como rótulo temporal junto al ↻.
  const alertRetryAction = (
    <button type="button" onClick={handleAlertRetry} className="btn-neutral w-full font-bold">
      <span aria-hidden="true">↻</span>
      <span>{t.nav.emergencyDemo}</span>
    </button>
  );

  // Banner de estado del despacho: cuatro desenlaces reales, cero afirmaciones
  // fabricadas. BRECHA DE DICCIONARIO (reportada): falta emergency.throttledNotice;
  // en la ventana de protección se reutiliza bannerWarning (un escaneo previo ya
  // despachó el aviso) y NUNCA alertSentNotice (afirmaría un envío nuevo).
  let alertBanner: React.ReactNode = null;
  if (alertResult?.wasThrottled) {
    alertBanner = <IncidentAlertBanner type="warning" message={t.emergency.bannerWarning} action={mapsAction} />;
  } else if (alertResult && alertResult.emailsSentCount > 0) {
    // Entregas reales a familiares: único caso que afirma el aviso recibido
    alertBanner = (
      <IncidentAlertBanner type="info" title={t.emergency.dispatchedAlert}
        message={t.emergency.alertSentNotice} action={mapsAction} />
    );
  } else if (alertResult) {
    // Despacho aceptado con cero correos entregados: no se afirma haber avisado
    alertBanner = <IncidentAlertBanner type="warning" message={t.emergency.bannerWarning} action={mapsAction} />;
  } else if (alertFailed) {
    alertBanner = <IncidentAlertBanner type="emergency" message={alertMessage ?? t.common.errorGeneric} action={alertRetryAction} />;
  }

  // Coordenadas del siniestro: sexagesimal real del despacho + origen del
  // escaneo. Visible incluso si la ficha falló (el flujo de alerta es propio).
  const coordinatesSection = alertResult ? (
    <div className="card-paper flex flex-col gap-3">
      <span className="font-sans text-micro font-bold uppercase tracking-widest text-carbon">{t.emergency.lastGpsLocation}</span>
      <span className="font-serif text-heading-sm sm:text-heading font-bold text-ink break-words">{alertResult.dmsFormatted}</span>
      <span className="font-sans text-micro text-carbon">{t.emergency.scanSourceLabel}{" "}
        <strong className="uppercase tracking-widest text-ink">{scanSource}</strong></span>
      {mapsAction}
    </div>
  ) : null;

  // RAMA 2 — Carga: skeleton broadsheet con bloques pulsantes sobre papel.
  // El despacho corre en paralelo: su estado real se muestra si llega antes.
  if (status === "loading") {
    return (
      <div className="safe-mobile-container py-6 sm:py-10 flex flex-col gap-6">
        {headerBanner}
        <div className="flex items-center gap-2 p-3 bg-paper border border-ink rounded-[8px]">
          <span className="font-sans text-micro font-bold uppercase tracking-widest bg-ink text-paper px-2 py-0.5 rounded-[4px]">{code}</span>
          <span className="font-sans text-micro font-bold uppercase text-alert-red">{t.common.emergencyBadge}</span>
        </div>
        {alertBanner}
        <div className="card-paper flex flex-col gap-4" aria-hidden="true">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-[8px] bg-mist animate-pulse flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-4 w-2/3 bg-mist rounded-[4px] animate-pulse" />
              <div className="h-3 w-1/2 bg-fog rounded-[4px] animate-pulse" />
              <div className="h-3 w-1/3 bg-fog rounded-[4px] animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-24 bg-mist rounded-[8px] animate-pulse" />
            <div className="h-24 bg-mist rounded-[8px] animate-pulse" />
          </div>
          <div className="h-20 bg-fog rounded-[8px] animate-pulse" />
          <div className="h-20 bg-fog rounded-[8px] animate-pulse" />
        </div>
      </div>
    );
  }

  // RAMA 3 — Error humano de la ficha: mensaje real del backend + reintento +
  // inicio. El flujo de alerta SIGUE su curso: el banner de estado del despacho
  // y las coordenadas del siniestro se muestran igual (el backend tiene su
  // propio respaldo de posición). Sin datos de ficha no hay acciones de llamada.
  if (status === "error" || !profile) {
    return (
      <div className="safe-mobile-container py-6 sm:py-10 flex flex-col gap-6">
        {headerBanner}
        <IncidentAlertBanner type="emergency" message={humanMessage ?? t.common.errorGeneric} />
        <div className="card-paper flex flex-col sm:flex-row gap-3">
          <button type="button" onClick={handleRetry} className="btn-neutral flex-1 font-bold">
            <span aria-hidden="true">↻</span>
            <span>{t.nav.emergencyDemo}</span>
          </button>
          <a href="/" className="btn-neutral flex-1 no-underline font-bold">{t.common.backToHome}</a>
        </div>
        {alertBanner}
        {coordinatesSection}
      </div>
    );
  }

  // Metadato micro con la fecha REAL de actualización del registro (la fecha es
  // dato, no copy). BRECHA DE DICCIONARIO (reportada): falta
  // emergency.recordUpdatedLabel; se exhibe sólo la fecha formateada según el
  // idioma activo, sin la clave estática t.legal.lastUpdated concatenada.
  const updatedAtDate = new Date(profile.updatedAt);
  const updatedAtLabel = Number.isNaN(updatedAtDate.getTime())
    ? profile.updatedAt
    : new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", { dateStyle: "long" }).format(updatedAtDate);

  const medical = profile.profile;

  // RAMA 4 — Ficha médica real de alto contraste solar
  return (
    <div className="safe-mobile-container py-6 sm:py-10 flex flex-col gap-6">
      {headerBanner}

      {/* Identificador del casco y estado de la captura satelital */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-paper border border-ink rounded-[8px]">
        <div className="flex items-center gap-2">
          <span className="font-sans text-micro font-bold uppercase tracking-widest bg-ink text-paper px-2 py-0.5 rounded-[4px]">{code}</span>
          <span className="font-sans text-micro font-bold uppercase text-alert-red">{t.common.emergencyBadge}</span>
        </div>
        <div className="font-sans text-micro font-semibold flex items-center gap-2">
          {gpsStatus === "acquiring" && (
            <span className="text-carbon flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-signal-orange animate-ping" />{t.emergency.gpsAcquiring}
            </span>
          )}
          {gpsStatus === "ready" && (
            <span className="text-ink flex items-center gap-1 font-bold">
              <span className="w-2 h-2 rounded-full bg-ink" />{t.emergency.gpsReady}
            </span>
          )}
          {gpsStatus === "denied" && <span className="text-ember">⚠️ {t.emergency.gpsDenied}</span>}
        </div>
      </div>

      {/* Estado real del despacho y coordenadas del siniestro */}
      {alertBanner}
      {coordinatesSection}

      {/* Ficha Médica de Alto Contraste Solar (sólo datos reales del registro) */}
      <IncidentCard padding="md" variant="emergency" className="flex flex-col gap-6">
        {/* Cabecera con fotografía de reconocimiento y nombre del piloto */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-4 border-b border-ink">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[8px] border-2 border-ink overflow-hidden bg-concrete flex-shrink-0 flex items-center justify-center">
            {medical.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={medical.photoUrl} alt={t.activate.photoLabel} className="w-full h-full object-cover" />
            ) : (
              <span className="text-heading" aria-hidden="true">👤</span>
            )}
          </div>
          <div className="flex flex-col text-center sm:text-left flex-1">
            <span className="font-sans text-micro uppercase tracking-wider text-carbon font-bold">{t.emergency.subtitle}</span>
            <h2 className="font-serif text-heading-sm sm:text-heading font-bold text-ink leading-tight mt-0.5">{medical.fullName}</h2>
            <span className="font-sans text-micro text-carbon mt-1">
              {t.emergency.nationalId}: <strong className="text-ink">{medical.nationalIdMasked}</strong>
            </span>
            <span className="font-sans text-micro text-carbon mt-0.5">
              {t.emergency.insurance}: <strong className="text-ink">{medical.insuranceInfo ?? t.emergency.noInsurance}</strong>
            </span>
            <span className="font-sans text-micro text-carbon mt-2">{updatedAtLabel}</span>
          </div>
        </div>

        {/* Grupo sanguíneo y alergias severas (insignias críticas solares) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MedicalBadge label={t.emergency.bloodType} value={medical.bloodType} isCritical={true} />
          <MedicalBadge label={t.emergency.allergies} value={medical.allergies ?? t.emergency.noAllergies}
            isWarning={medical.allergies !== null} />
        </div>

        {/* Patologías y medicamentos prescritos (null → frase del diccionario) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-4 bg-concrete border border-ink rounded-[8px]">
            <span className="font-sans text-micro uppercase font-bold text-carbon block mb-1">{t.emergency.conditions}</span>
            <p className="font-serif text-body font-bold text-ink leading-snug">{medical.chronicConditions ?? t.emergency.noConditions}</p>
          </div>
          <div className="p-4 bg-concrete border border-ink rounded-[8px]">
            <span className="font-sans text-micro uppercase font-bold text-carbon block mb-1">{t.emergency.medications}</span>
            <p className="font-serif text-body font-bold text-ink leading-snug">{medical.medications ?? t.emergency.noMedications}</p>
          </div>
        </div>
      </IncidentCard>

      {/* Panel de acciones críticas con props congeladas (llamadas reales) */}
      <EmergencyActionPanel
        riderName={medical.fullName}
        bloodType={medical.bloodType}
        googleMapsUrl={alertResult?.googleMapsUrl ?? null}
        emergencyNumber={medical.emergencyNumber ?? null}
        contacts={medical.emergencyContacts}
      />

      {/* Contactos de aviso inmediato reales (sólo teléfono, sin correos) */}
      <IncidentCard padding="md" className="flex flex-col gap-3">
        <h3 className="font-serif font-bold text-heading-sm text-ink pb-2 border-b border-mist">{t.emergency.emergencyContacts}</h3>
        {medical.emergencyContacts.length === 0 ? (
          <p className="font-serif text-body text-carbon">{t.emergency.noContacts}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {medical.emergencyContacts.map((contact) => (
              <div key={contact.id} className={`flex items-center justify-between gap-3 p-3 rounded-[8px] ${contact.isPrimary ? "bg-paper border-2 border-ink" : "bg-concrete border border-mist"}`}>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    {contact.isPrimary && <span className="w-2 h-2 rounded-full bg-signal-orange flex-shrink-0" aria-hidden="true" />}
                    <strong className="font-serif text-body text-ink truncate">{contact.name}</strong>
                  </div>
                  <span className="font-sans text-micro text-carbon">{contact.relation}</span>
                </div>
                <a href={`tel:${contact.phone}`} onClick={() => triggerHaptic("light")}
                  className="btn-neutral min-h-[44px] text-micro font-bold no-underline flex-shrink-0">
                  📞 {contact.phone}
                </a>
              </div>
            ))}
          </div>
        )}
      </IncidentCard>

      {/* Cláusula legal del Buen Samaritano y aviso de contraste solar */}
      <div className="p-4 bg-paper border border-mist rounded-[8px] text-center">
        <p className="font-sans text-micro text-carbon leading-relaxed">⚖️ {t.emergency.emergencyWarningText}</p>
        <p className="font-sans text-micro text-carbon mt-1">{t.emergency.solarContrastNotice}</p>
      </div>
    </div>
  );
}
