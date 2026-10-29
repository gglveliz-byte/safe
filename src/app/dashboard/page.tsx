/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Vistas Oficiales — VISTA 5: Panel de Control del Motociclista
 * ARCHIVO: src/app/dashboard/page.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Panel privado del piloto conectado al backend real en Neon PostgreSQL.
 * Integra el 'Modo Ruta' (pantalla encendida vía Screen WakeLock API y latido
 * GPS cada 20s contra POST /api/gps/heartbeat) y la edición de la ficha médica
 * (PUT /api/profile). Es un área cerrada con sesión iniciada: no comparte el
 * navbar público ni el pie legal (ver src/app/dashboard/layout.tsx).
 *
 * CORRECCIONES DE PRODUCCIÓN APLICADAS (auditoría 2026-10-25):
 * - P-1 (CRÍTICO): erradicado el grupo sanguíneo fabricado "O+". El formulario
 *   arranca SIN declarar y obliga a elegir una opción real del catálogo
 *   (incluye DESCONOCIDO). Nunca se persiste un dato clínico inventado.
 * - P-2 (CRÍTICO): los contactos ya no reciben ids artesanales "cnt_...".
 *   `ensureContactUuid` conserva el UUID real o genera uno válido, porque
 *   EmergencyContactSchema rechaza cualquier otro formato y el guardado
 *   devolvía 400 permanente.
 * - P-3 (CRÍTICO): erradicado el parentesco inventado "Familiar"; si la ficha
 *   no declara relación, se envía vacía y el backend responde con su mensaje.
 * - P-4: un fallo de red NO expulsa al piloto a /login. Solo 401/403 (sesión
 *   inválida o caducada) redirigen; el resto muestra aviso humano y reintento.
 * - P-5: sin chip vinculado el panel lo dice y enlaza la activación real.
 *
 * PARTIÓN C-19 conservada: orquestador delgado que delega en
 * `DashboardSkeleton`, `MedicalRecordForm`, `LiveRideCard` y `NoChipNotice`.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (objetivo de partición < 400).
 * - Cero datos hardcodeados o mocks de demostración.
 * - Bilingüismo obligatorio: cero texto en duro en el JSX.
 * ==============================================================================
 */

"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { useWakeLock } from "@/hooks/useWakeLock";
import {
  apiClient,
  HttpApiError,
  ensureContactUuid,
  type MedicalProfileData,
  type EmergencyContact,
  type DashboardResponse,
} from "@/lib/api-client";
import { IncidentButton } from "@/components/ui/IncidentButton";
import { IncidentHairline } from "@/components/ui/IncidentHairline";
import { LiveRideCard } from "@/components/dashboard/LiveRideCard";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { MedicalRecordForm } from "@/components/dashboard/MedicalRecordForm";
import { ClaimDeviceCard } from "@/components/dashboard/ClaimDeviceCard";

/**
 * Calcula la distancia Haversine en metros entre dos coordenadas decimales.
 * Utilizado para el umbral de movimiento (>15m) en telemetría de Modo Ruta.
 */
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const claimCode = searchParams?.get("claim") || "";
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  // Estado del usuario y dispositivo vinculado
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);

  // Estado del Modo Ruta en Carretera
  const [isLiveRideActive, setIsLiveRideActive] = useState(false);
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [lastHeartbeatTime, setLastHeartbeatTime] = useState<string | null>(null);

  // Referencia a la última posición transmitida y marca temporal para optimizar batería y red
  const lastSentPositionRef = useRef<{ lat: number; lng: number; time: number } | null>(null);

  // Activación de Screen WakeLock para mantener la pantalla despierta en el manillar
  const { isLocked: isScreenLocked } = useWakeLock(isLiveRideActive);

  // P-1: ficha clínica SIN valores fabricados. bloodType arranca vacío: el
  // piloto debe declararlo (o elegir DESCONOCIDO) antes de guardar.
  const [profile, setProfile] = useState<MedicalProfileData>({
    fullName: "",
    nationalId: "",
    birthDate: null,
    bloodType: "",
    allergies: "",
    chronicConditions: "",
    conditions: "",
    medications: "",
    insuranceInfo: "",
    insurance: "",
    emergencyNumber: "",
    photoUrl: "",
    contacts: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loadError, setLoadError] = useState("");

  // Ref viva del diccionario: los textos de respaldo no re-disparan efectos.
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  // Carga inicial de datos desde PostgreSQL (reutilizable por el botón reintentar)
  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const data = await apiClient.getDashboard();

      setDashboardData(data);
      setIsLiveRideActive(Boolean(data.user.liveRideActive));

      // I4: `!= null` acepta la coordenada legítima 0 (ecuador/Greenwich).
      if (data.user.lastKnownLat != null && data.user.lastKnownLng != null) {
        setLastCoords({
          lat: data.user.lastKnownLat,
          lng: data.user.lastKnownLng,
        });
      }

      if (data.profile) {
        const rawContacts = Array.isArray(data.profile.emergencyContacts)
          ? data.profile.emergencyContacts
          : [];

        // P-2 y P-3: UUID válido garantizado y parentesco REAL (o vacío).
        const formattedContacts: EmergencyContact[] = rawContacts.map((c) => {
          const relation = (c.relation || c.relationship || "").trim();
          return {
            id: ensureContactUuid(c.id),
            name: c.name || "",
            relation,
            relationship: relation,
            phone: c.phone || "",
            email: c.email || "",
            isPrimary: c.isPrimary ?? false,
          };
        });

        setProfile({
          fullName: data.profile.fullName || "",
          nationalId: data.profile.nationalId || "",
          birthDate: data.profile.birthDate || null,
          bloodType: data.profile.bloodType || "",
          allergies: data.profile.allergies || "",
          chronicConditions: data.profile.chronicConditions || "",
          conditions: data.profile.chronicConditions || "",
          medications: data.profile.medications || "",
          insuranceInfo: data.profile.insuranceInfo || "",
          insurance: data.profile.insuranceInfo || "",
          emergencyNumber: data.profile.emergencyNumber || "",
          photoUrl: data.profile.photoUrl || "",
          photoPublicId: data.profile.photoPublicId || null,
          idCardFrontUrl: data.profile.idCardFrontUrl || null,
          idCardFrontPublicId: data.profile.idCardFrontPublicId || null,
          idCardBackUrl: data.profile.idCardBackUrl || null,
          idCardBackPublicId: data.profile.idCardBackPublicId || null,
          country: data.profile.country || "EC",
          city: data.profile.city || "",
          residentialAddress: data.profile.residentialAddress || "",
          isOrganDonor: Boolean(data.profile.isOrganDonor),
          rescueNotes: data.profile.rescueNotes || "",
          frequentLocation: data.profile.frequentLocation || "",
          vehicleInfo: data.profile.vehicleInfo || "",
          contacts: formattedContacts,
        });
      }
    } catch (err: unknown) {
      // P-4: únicamente una sesión inválida o caducada regresa al ingreso.
      if (err instanceof HttpApiError && (err.status === 401 || err.status === 403)) {
        router.replace("/login");
        return;
      }
      const humanMessage =
        err instanceof HttpApiError && err.status > 0
          ? err.message
          : tRef.current.dashboard.loadError;
      setLoadError(humanMessage);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  // Función atómica para capturar y emitir posición GPS a /api/gps/heartbeat
  const sendCurrentPosition = useCallback(
    (isActiveStatus: boolean, force = false) => {
      if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const now = Date.now();

          setLastCoords({ lat, lng });

          // Optimización de batería y servidor: sólo emitir si se movió > 15m o pasaron > 60s o es forzado
          if (!force && lastSentPositionRef.current && isActiveStatus) {
            const distance = calculateDistanceMeters(
              lastSentPositionRef.current.lat,
              lastSentPositionRef.current.lng,
              lat,
              lng,
            );
            const elapsedMs = now - lastSentPositionRef.current.time;
            if (distance < 15 && elapsedMs < 60000) {
              return; // Posición estacionaria: evita consumo de batería y saturación de red
            }
          }

          lastSentPositionRef.current = { lat, lng, time: now };
          const result = await apiClient.sendGpsHeartbeat(
            lat,
            lng,
            isActiveStatus,
          );
          if (result.success && result.recordedAt) {
            setLastHeartbeatTime(result.recordedAt);
          }
        },
        () => {
          // Tolerar falta de señal o error transitorio
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 },
      );
    },
    [],
  );

  // Intervalo de captura satelital durante Modo Ruta (cada 20 segundos)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLiveRideActive) {
      sendCurrentPosition(true, true);
      heartbeatIntervalRef.current = setInterval(() => {
        sendCurrentPosition(true, false);
      }, 20000); // 20s (dentro del rango requerido de 15 a 30s)
    } else {
      lastSentPositionRef.current = null;
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    }

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [isLiveRideActive, sendCurrentPosition]);

  // Conmutador del Modo Ruta
  const toggleLiveRide = () => {
    const nextState = !isLiveRideActive;
    setIsLiveRideActive(nextState);
    triggerHaptic(nextState ? "success" : "light");

    if (!nextState) {
      // C-12 (CRITICAL): el cierre del viaje SIEMPRE se notifica al servidor.
      // Prioridad de coordenada de cierre: 1) último fix de la sesión;
      // 2) última posición persistida; 3) coordenada neutra (0,0), porque lo
      // determinante para apagar el estado fantasma es active=false.
      const closingCoords =
        lastCoords ??
        (dashboardData?.user.lastKnownLat != null &&
        dashboardData?.user.lastKnownLng != null
          ? {
              lat: dashboardData.user.lastKnownLat,
              lng: dashboardData.user.lastKnownLng,
            }
          : null);

      try {
        if (closingCoords) {
          apiClient.sendGpsHeartbeat(closingCoords.lat, closingCoords.lng, false);
        } else {
          apiClient.sendGpsHeartbeat(0, 0, false);
        }
      } catch {
        // El cliente HTTP ya tolera fallos de red; el reintento ocurre al
        // recargar el panel (liveRideActive se sincroniza desde la BD).
      }
    }
  };

  // Guardar modificaciones médicas en PostgreSQL
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setNoticeMessage("");
    setErrorMessage("");

    // P-1: prohibido guardar una ficha sin grupo sanguíneo declarado.
    if (!profile.bloodType.trim()) {
      triggerHaptic("error");
      setErrorMessage(t.dashboard.bloodTypeRequired);
      return;
    }

    setIsSaving(true);
    triggerHaptic("light");

    try {
      await apiClient.updateProfile(profile);
      triggerHaptic("success");
      setNoticeMessage(t.dashboard.updateSuccess);
      setTimeout(() => setNoticeMessage(""), 4000);
    } catch (err: unknown) {
      triggerHaptic("error");
      // Mensaje humano del backend; si fue la red, el texto del diccionario.
      const msg =
        err instanceof HttpApiError && err.status > 0
          ? err.message
          : t.dashboard.updateError;
      setErrorMessage(msg || t.dashboard.updateError);
    } finally {
      setIsSaving(false);
    }
  };

  // C-10: skeleton delegado al módulo co-ubicado (cero textos hardcodeados)
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // P-4: la ficha no se pudo cargar por un problema de red o del servicio.
  if (loadError) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-6 animate-fadeInUp">
        <div
          role="alert"
          className="p-4 bg-red-50 border border-brand-accent/30 rounded-xl text-xs text-brand-accent font-sans text-center font-bold"
        >
          ⚠️ {loadError}
        </div>
        <IncidentButton
          type="button"
          variant="emergency"
          size="lg"
          onClick={() => void loadDashboard()}
          className="w-full sm:w-auto self-center min-w-[220px]"
        >
          ↻ {t.dashboard.retryButton}
        </IncidentButton>
      </div>
    );
  }

  // C-11: sin dispositivo vinculado se muestra guión neutro (cero folios fabricados)
  const device = dashboardData?.device ?? null;
  const helmetFolio = device?.code ?? "—";

  // M-20: etiqueta de estado según el status REAL del dispositivo.
  const deviceStatusLabel =
    device?.status === "ACTIVE"
      ? t.common.statusActive
      : device?.status === "UNCLAIMED"
        ? t.common.statusUnclaimed
        : device?.status === "DISABLED"
          ? t.admin.statusDisabled
          : "";

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-8 animate-fadeInUp">
      {/* Encabezado del Panel (el cierre de sesión vive en la barra privada) */}
      <div className="flex flex-col gap-2 border-b border-brand-separator pb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-pulse" />
          {/* M-4: folio en sans serif con tracking amplio (legibilidad de códigos) */}
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-brand-text-muted">
            {helmetFolio}
            {deviceStatusLabel ? ` · ${deviceStatusLabel}` : ""}
          </span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-brand-navy-dark leading-tight mt-0.5">
          {t.dashboard.title}
        </h1>
        <p className="font-sans text-xs sm:text-sm text-brand-text-desc">
          {t.dashboard.welcomeBack}:{" "}
          <strong className="text-brand-navy-dark font-semibold">
            {profile.fullName || dashboardData?.user.email}
          </strong>
        </p>
      </div>

      {/* Fase 2 Onboarding: vinculación de kit físico mediante PIN secreto */}
      {!device && (
        <ClaimDeviceCard
          prefilledCode={claimCode}
          onClaimSuccess={loadDashboard}
        />
      )}

      {/* BLOQUE ESTRELLA: MODO RUTA EN CARRETERA (WAKELOCK + TELEMETRÍA CADA 20s) */}
      <LiveRideCard
        isLiveRideActive={isLiveRideActive}
        isScreenLocked={isScreenLocked}
        lastCoords={lastCoords}
        lastHeartbeatTime={lastHeartbeatTime}
        onToggle={toggleLiveRide}
      />

      <IncidentHairline variant="subtle" />

      {/* C-19: formulario médico completo delegado al módulo co-ubicado */}
      <MedicalRecordForm
        profile={profile}
        onProfileChange={setProfile}
        onSubmit={handleSaveProfile}
        isSaving={isSaving}
        noticeMessage={noticeMessage}
        errorMessage={errorMessage}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
