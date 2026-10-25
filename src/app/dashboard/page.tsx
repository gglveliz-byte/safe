/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Vistas Oficiales — VISTA 5: Panel de Control del Motociclista
 * ARCHIVO: src/app/dashboard/page.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Panel privado del piloto conectado al backend real en Neon PostgreSQL.
 * Integra el 'Modo Ruta' (pantalla encendida continua vía Screen WakeLock API y
 * telemetría satelital GPS cada 20s enviada a POST /api/gps/heartbeat).
 *
 * PARTICIÓN OBLIGATORIA C-19 (zona crítica 451-500 líneas): este archivo queda
 * como ORQUESTADOR DELGADO (<380 líneas) que delega la vista en módulos
 * co-ubicados: `DashboardSkeleton` (estado de carga con claves del diccionario),
 * `MedicalRecordForm` (foto + datos clínicos + contactos + guardado) y
 * `LiveRideCard` (conmutador del Modo Ruta).
 *
 * CORRECCIONES CRÍTICAS APLICADAS:
 * - C-11: fallback fabricado "SAFE-XXXX" erradicado; sin dispositivo vinculado
 *   se muestra un guión neutro "—" (cero folios inventados, Ley 2).
 * - C-12: la desactivación del Modo Ruta SIEMPRE notifica al servidor (fix GPS
 *   de la sesión → última posición persistida en BD → coordenada neutra 0,0 con
 *   active=false), erradicando el estado fantasma liveRideActive=true.
 * - M-20: la etiqueta de estado conmuta según el status real del dispositivo
 *   (ACTIVE/UNCLAIMED) en vez de afirmar "activo" incondicionalmente.
 * - I4: la comprobación de coordenadas usa `!= null` para no descartar el
 *   valor legítimo 0 (ecuador / meridiano de Greenwich).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (objetivo de partición < 380).
 * - Cero datos hardcodeados o mocks de demostración.
 * - Integración obligatoria de useWakeLock, useHaptic y useLocale.
 * - Cero jerga técnica visible en la interfaz de usuario.
 * ==============================================================================
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { useWakeLock } from "@/hooks/useWakeLock";
import {
  apiClient,
  type MedicalProfileData,
  type EmergencyContact,
  type DashboardResponse,
} from "@/lib/api-client";
import { IncidentButton } from "@/components/ui/IncidentButton";
import { IncidentHairline } from "@/components/ui/IncidentHairline";
import { LiveRideCard } from "@/components/dashboard/LiveRideCard";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { MedicalRecordForm } from "@/components/dashboard/MedicalRecordForm";

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  // Estado del usuario y dispositivo vinculado
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);

  // Estado del Modo Ruta en Carretera
  const [isLiveRideActive, setIsLiveRideActive] = useState(false);
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [lastHeartbeatTime, setLastHeartbeatTime] = useState<string | null>(null);

  // Activación de Screen WakeLock para mantener la pantalla despierta en el manillar
  const { isLocked: isScreenLocked } = useWakeLock(isLiveRideActive);

  // Estados del perfil médico (inicializado vacío, poblado dinámicamente)
  const [profile, setProfile] = useState<MedicalProfileData>({
    fullName: "",
    nationalId: "",
    bloodType: "O+",
    allergies: "",
    chronicConditions: "",
    conditions: "",
    medications: "",
    insuranceInfo: "",
    insurance: "",
    photoUrl: "",
    contacts: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Carga inicial de datos desde PostgreSQL
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await apiClient.getDashboard();
        if (!isMounted) return;

        setDashboardData(data);
        setIsLiveRideActive(Boolean(data.user.liveRideActive));

        // I4: `!= null` acepta la coordenada legítima 0 (ecuador/Greenwich);
        // el check truthy anterior la descartaba como si fuera ausencia de fix.
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

          const formattedContacts: EmergencyContact[] = rawContacts.map((c) => ({
            id: c.id || `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: c.name || "",
            relation: c.relation || c.relationship || "Familiar",
            relationship: c.relationship || c.relation || "Familiar",
            phone: c.phone || "",
            email: c.email || "",
            isPrimary: c.isPrimary ?? false,
          }));

          setProfile({
            fullName: data.profile.fullName || "",
            nationalId: data.profile.nationalId || "",
            birthDate: data.profile.birthDate || null,
            bloodType: data.profile.bloodType || "O+",
            allergies: data.profile.allergies || "",
            chronicConditions: data.profile.chronicConditions || "",
            conditions: data.profile.chronicConditions || "",
            medications: data.profile.medications || "",
            insuranceInfo: data.profile.insuranceInfo || "",
            insurance: data.profile.insuranceInfo || "",
            emergencyNumber: data.profile.emergencyNumber || "",
            photoUrl: data.profile.photoUrl || "",
            contacts: formattedContacts,
          });
        }
      } catch {
        if (!isMounted) return;
        router.replace("/login");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [router]);

  // Función atómica para capturar y emitir posición GPS a /api/gps/heartbeat
  const sendCurrentPosition = useCallback(
    (isActiveStatus: boolean) => {
      if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setLastCoords(coords);
          const result = await apiClient.sendGpsHeartbeat(
            coords.lat,
            coords.lng,
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
      sendCurrentPosition(true);
      heartbeatIntervalRef.current = setInterval(() => {
        sendCurrentPosition(true);
      }, 20000); // 20s (dentro del rango requerido de 15 a 30s)
    } else {
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
      // Prioridad de coordenada de cierre:
      // 1) último fix GPS de la sesión; 2) última posición persistida en la BD;
      // 3) coordenada neutra (0,0) — el backend la acepta (Float válido) y lo
      //    determinante para apagar el estado fantasma es active=false.
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
    setIsSaving(true);
    triggerHaptic("light");

    try {
      await apiClient.updateProfile(profile);
      triggerHaptic("success");
      setNoticeMessage(t.dashboard.updateSuccess);
      setTimeout(() => setNoticeMessage(""), 4000);
    } catch (err: unknown) {
      triggerHaptic("error");
      const msg = err instanceof Error ? err.message : t.dashboard.updateError;
      setErrorMessage(msg || t.dashboard.updateError);
    } finally {
      setIsSaving(false);
    }
  };

  // C-10: skeleton delegado al módulo co-ubicado (cero textos hardcodeados)
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // C-11: sin dispositivo vinculado se muestra guión neutro (cero folios fabricados)
  const device = dashboardData?.device ?? null;
  const helmetFolio = device?.code ?? "—";

  // M-20: etiqueta de estado según el status REAL del dispositivo.
  // DISABLED u otros estados no afirman protección: se omite el sufijo
  // (no existe clave de diccionario para "kit deshabilitado"; reportado).
  const deviceStatusLabel =
    device?.status === "ACTIVE"
      ? t.common.statusActive
      : device?.status === "UNCLAIMED"
        ? t.common.statusUnclaimed
        : "";

  return (
    <div className="safe-mobile-container py-8 sm:py-12 flex flex-col gap-8">
      {/* Encabezado del Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-ink pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-signal-orange" />
            {/* M-4: folio en sans serif con tracking amplio (legibilidad de códigos) */}
            <span className="font-sans text-micro font-bold uppercase tracking-widest text-carbon">
              {helmetFolio}
              {deviceStatusLabel ? ` · ${deviceStatusLabel}` : ""}
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-ink leading-tight mt-0.5">
            {t.dashboard.title}
          </h1>
          <p className="font-sans text-micro text-carbon">
            {t.dashboard.welcomeBack}:{" "}
            <strong className="text-ink">{profile.fullName || dashboardData?.user.email}</strong>
          </p>
        </div>

        <IncidentButton
          variant="neutral"
          size="sm"
          onClick={() => apiClient.logout()}
        >
          🚪 {t.dashboard.logoutButton}
        </IncidentButton>
      </div>

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
