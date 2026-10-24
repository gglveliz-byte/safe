/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Vistas Oficiales — VISTA 5: Panel de Control del Motociclista
 * ARCHIVO: src/app/dashboard/page.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Panel privado del piloto. Integra el 'Modo Ruta' (mantiene la pantalla encendida
 * en el manillar vía Screen WakeLock API y emite coordenadas GPS periódicas en carretera),
 * edición de datos clínicos, actualización de fotografía y gestión de contactos.
 * 
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Integración obligatoria de useWakeLock y useHaptic (safe-mobile-native-feel).
 * - Cero jerga técnica visible.
 * ==============================================================================
 */

"use client";

import React, { useState, useEffect } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { useWakeLock } from "@/hooks/useWakeLock";
import { apiClient, type MedicalProfileData, type EmergencyContact } from "@/lib/api-client";
import { IncidentCard } from "@/components/ui/IncidentCard";
import { IncidentButton } from "@/components/ui/IncidentButton";
import { IncidentHairline } from "@/components/ui/IncidentHairline";
import { CloudinaryPhotoPicker } from "@/components/medical/CloudinaryPhotoPicker";
import { ContactsRepeater } from "@/components/medical/ContactsRepeater";

export default function DashboardPage() {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  // Estado del Modo Ruta en Carretera
  const [isLiveRideActive, setIsLiveRideActive] = useState(false);
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Activación de Screen WakeLock para mantener pantalla encendida en carretera
  const { isLocked: isScreenLocked } = useWakeLock(isLiveRideActive);

  // Estados del perfil médico
  const [profile, setProfile] = useState<MedicalProfileData>({
    fullName: "Carlos Mendoza",
    nationalId: "1720394819",
    bloodType: "O+",
    allergies: "Penicilina",
    conditions: "Ninguna",
    medications: "Ninguno",
    insurance: "Seguros del Estado - Póliza #992812",
    photoUrl: "",
    contacts: [
      { id: "c1", name: "Elena Mendoza", phone: "+593998877665", relationship: "Esposa" },
    ],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Carga inicial del perfil
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await apiClient.getProfile();
        setProfile(data);
      } catch {
        // En desarrollo o modo autónomo, mantiene los datos base listos para edición
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Intervalo de captura satelital durante Modo Ruta (cada 45 segundos)
  useEffect(() => {
    if (!isLiveRideActive) return;

    const capturePosition = () => {
      if (typeof navigator !== "undefined" && "geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setLastCoords(coords);
            apiClient.sendGpsHeartbeat(coords.lat, coords.lng);
          },
          () => {},
          { enableHighAccuracy: true, timeout: 8000 }
        );
      }
    };

    capturePosition();
    const interval = setInterval(capturePosition, 45000);
    return () => clearInterval(interval);
  }, [isLiveRideActive]);

  // Conmutador del Modo Ruta
  const toggleLiveRide = () => {
    const next = !isLiveRideActive;
    setIsLiveRideActive(next);
    triggerHaptic(next ? "success" : "light");
  };

  // Guardar cambios médicos
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
    } catch (err: any) {
      triggerHaptic("error");
      setErrorMessage(err?.message || t.dashboard.updateError);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="safe-mobile-container py-8 sm:py-12 flex flex-col gap-8">
      {/* Encabezado del Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-ink pb-4">
        <div>
          <span className="font-sans text-micro font-bold uppercase text-signal-orange">
            {t.common.statusActive}
          </span>
          <h1 className="font-serif text-3xl font-bold text-ink leading-tight mt-0.5">
            {t.dashboard.title}
          </h1>
          <p className="font-sans text-micro text-carbon">
            {t.dashboard.welcomeBack}: <strong className="text-ink">{profile.fullName}</strong>
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

      {/* BLOQUE ESTRELLA: MODO RUTA EN CARRETERA (WAKELOCK + GPS HEARTBEAT) */}
      <IncidentCard
        padding="md"
        variant={isLiveRideActive ? "emergency" : "default"}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-3xl">🏍️</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-heading-sm text-ink leading-tight">
                  {t.dashboard.liveRideTitle}
                </h3>
                {isLiveRideActive && (
                  <span className="w-2.5 h-2.5 rounded-full bg-signal-orange animate-ping" />
                )}
              </div>
              <p className="font-sans text-micro text-carbon mt-1 max-w-lg">
                {t.dashboard.liveRideDescription}
              </p>
            </div>
          </div>

          <IncidentButton
            type="button"
            variant={isLiveRideActive ? "emergency" : "neutral"}
            size="lg"
            onClick={toggleLiveRide}
            className="w-full sm:w-auto min-w-[200px]"
          >
            {isLiveRideActive ? `⚡ ${t.dashboard.liveRideActive}` : `○ ${t.dashboard.liveRideInactive}`}
          </IncidentButton>
        </div>

        {/* Indicadores de Estado de Pantalla Activa y Satélites */}
        {isLiveRideActive && (
          <div className="p-3 bg-concrete border border-ink rounded-[6px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-micro font-sans">
            <span className="font-semibold text-ink flex items-center gap-2">
              <span className="text-signal-orange">●</span>
              {t.dashboard.liveRideWarning} {isScreenLocked ? "(Pantalla Despierta)" : ""}
            </span>
            {lastCoords && (
              <span className="font-mono text-carbon text-[11px]">
                GPS: {lastCoords.lat.toFixed(5)}, {lastCoords.lng.toFixed(5)}
              </span>
            )}
          </div>
        )}
      </IncidentCard>

      <IncidentHairline variant="subtle" />

      {/* Formulario de Edición de la Ficha Médica */}
      <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
        <div>
          <h2 className="font-serif text-heading-sm font-bold text-ink">
            {t.dashboard.editMedicalTitle}
          </h2>
          <p className="font-sans text-micro text-carbon mt-0.5">
            {t.dashboard.editMedicalSubtitle}
          </p>
        </div>

        {/* Selector de Fotografía */}
        <CloudinaryPhotoPicker
          currentPhotoUrl={profile.photoUrl}
          onPhotoSelected={(url) => setProfile({ ...profile, photoUrl: url })}
          disabled={isSaving}
        />

        {/* Datos Clínicos Principales */}
        <IncidentCard padding="md" className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="font-sans text-micro font-bold uppercase text-carbon">
                {t.activate.fullNameLabel}
              </label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                required
                className="h-11 px-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-sans text-micro font-bold uppercase text-carbon">
                {t.activate.bloodTypeLabel}
              </label>
              <select
                value={profile.bloodType}
                onChange={(e) => setProfile({ ...profile, bloodType: e.target.value })}
                className="h-11 px-3 bg-concrete border-2 border-ink rounded-[4px] font-serif text-body font-bold text-ink focus:outline-none cursor-pointer"
              >
                {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-sans text-micro font-bold uppercase text-carbon">
                {t.activate.nationalIdLabel}
              </label>
              <input
                type="text"
                value={profile.nationalId}
                onChange={(e) => setProfile({ ...profile, nationalId: e.target.value })}
                required
                className="h-11 px-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>

            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="font-sans text-micro font-bold uppercase text-carbon">
                {t.activate.insuranceLabel}
              </label>
              <input
                type="text"
                value={profile.insurance || ""}
                onChange={(e) => setProfile({ ...profile, insurance: e.target.value })}
                className="h-11 px-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="flex flex-col gap-1">
              <label className="font-sans text-micro font-bold uppercase text-alert-red">
                {t.activate.allergiesLabel}
              </label>
              <textarea
                rows={3}
                value={profile.allergies || ""}
                onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                className="p-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink resize-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-sans text-micro font-bold uppercase text-carbon">
                {t.activate.conditionsLabel}
              </label>
              <textarea
                rows={3}
                value={profile.conditions || ""}
                onChange={(e) => setProfile({ ...profile, conditions: e.target.value })}
                className="p-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink resize-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-sans text-micro font-bold uppercase text-carbon">
                {t.activate.medicationsLabel}
              </label>
              <textarea
                rows={3}
                value={profile.medications || ""}
                onChange={(e) => setProfile({ ...profile, medications: e.target.value })}
                className="p-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink resize-none"
              />
            </div>
          </div>
        </IncidentCard>

        {/* Repetidor de Contactos */}
        <ContactsRepeater
          contacts={profile.contacts}
          onChange={(newContacts: EmergencyContact[]) =>
            setProfile({ ...profile, contacts: newContacts })
          }
          disabled={isSaving}
        />

        {noticeMessage && (
          <div className="p-4 bg-green-50 border border-green-600 rounded-[8px] text-micro text-green-900 font-sans font-bold text-center">
            ✓ {noticeMessage}
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-red-50 border border-alert-red rounded-[8px] text-micro text-alert-red font-sans font-bold text-center">
            ⚠️ {errorMessage}
          </div>
        )}

        <div className="pt-2">
          <IncidentButton
            type="submit"
            variant="emergency"
            size="lg"
            isLoading={isSaving}
            disabled={isSaving || isLoading}
            className="w-full sm:w-auto min-w-[240px]"
          >
            {isSaving ? t.common.saving : t.dashboard.saveProfileButton}
          </IncidentButton>
        </div>
      </form>
    </div>
  );
}
