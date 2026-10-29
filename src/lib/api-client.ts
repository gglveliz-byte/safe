/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Cliente de API Desacoplado (Transporte HTTP Real sin Mocks)
 * ARCHIVO: src/lib/api-client.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Cliente centralizado para comunicación con los Route Handlers del backend:
 * /api/auth/*, /api/profile, /api/gps/heartbeat, /api/admin/*,
 * /api/devices/activate, /api/emergency/*, /api/upload/cloudinary.
 *
 * CORRECCIÓN DE AUDITORÍA (FIX-D2A): cero defaults fabricados (contraseñas,
 * fotos, grupos sanguíneos, parentescos, éxitos y perfiles simulados); las
 * funciones duplicadas por clientes canónicos (activate-api.ts,
 * emergency-api.ts, CloudinaryPhotoPicker) quedan @deprecated pero conservan
 * su exportación; el texto de error proviene del backend y, si no existe,
 * se usa un único mensaje neutro (helpers en api-client-helpers.ts).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 450 líneas físicas; helpers en api-client-helpers.ts.
 * - Cero mocks o datos simulados (llamadas 100% reales a Neon PostgreSQL).
 * - Cero jerga técnica en las excepciones al usuario.
 * ==============================================================================
 */

import type {
  EmergencyContact, MedicalProfileData, SessionUser, SessionResponse, DashboardResponse,
  EmergencyAlertResult, AdminDeviceItem, AdminBatchSummary, AdminBatchDetail, AdminRiderItem, CreatedBatchResult,
  RegisterRiderPayload, RegisterRiderResponse, ClaimDevicePayload, ClaimDeviceResponse, ActivateDeviceLegacyPayload,
} from "./api-types";
import {
  lanzarErrorHttp,
  normalizarContactos,
  ensureContactUuid,
  HttpApiError,
  buildActivatePayload,
  buildProfileUpdatePayload,
} from "./api-client-helpers";

export { HttpApiError, ensureContactUuid };

export type {
  EmergencyContact, MedicalProfileData, SessionUser, SessionResponse, DashboardResponse,
  EmergencyAlertResult, AdminDeviceItem, AdminBatchSummary, AdminBatchDetail, AdminRiderItem, CreatedBatchResult,
  RegisterRiderPayload, RegisterRiderResponse, ClaimDevicePayload, ClaimDeviceResponse, ActivateDeviceLegacyPayload,
};

export const apiClient = {
  /** Consulta el estado de autenticación de la sesión HttpOnly */
  async getSession(): Promise<SessionResponse> {
    try {
      const res = await fetch("/api/auth/session", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (!res.ok) return { authenticated: false };
      const json = await res.json();
      return json.data || { authenticated: false };
    } catch {
      return { authenticated: false };
    }
  },

  /**
   * Dispara una alerta de siniestro vial al escanear el casco.
   *
   * @deprecated Duplicada por `src/app/emergency/[code]/emergency-api.ts`
   * (POST /api/emergency/alert). Se conserva exportada por compatibilidad.
   */
  async triggerEmergencyAlert(params: {
    code: string;
    latitude?: number;
    longitude?: number;
    lat?: number;
    lng?: number;
    scanSource: "nfc" | "qr" | "direct";
    accuracy?: number;
  }): Promise<EmergencyAlertResult> {
    const lat = params.latitude !== undefined ? params.latitude : params.lat;
    const lng = params.longitude !== undefined ? params.longitude : params.lng;
    const payload: Record<string, unknown> = {
      code: params.code.trim().toUpperCase(),
      scanSource: params.scanSource,
    };
    if (lat !== undefined && lng !== undefined) {
      payload.latitude = lat;
      payload.longitude = lng;
    }
    if (params.accuracy !== undefined) payload.accuracy = params.accuracy;

    const res = await fetch("/api/emergency/alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) await lanzarErrorHttp(res);
    const json = await res.json();
    return json.data;
  },

  /**
   * Consulta el expediente público de auxilio vial para rescatistas.
   *
   * @deprecated Duplicada por `src/app/emergency/[code]/emergency-api.ts`
   * (GET /api/emergency/[code]). Se conserva exportada por compatibilidad.
   */
  async getEmergencyProfile(code: string): Promise<unknown> {
    const res = await fetch(
      `/api/emergency/${encodeURIComponent(code.trim().toUpperCase())}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      },
    );
    if (!res.ok) await lanzarErrorHttp(res);
    const json = await res.json();
    return json.data;
  },

  /**
   * Sube fotografía de rostro a Cloudinary optimizada para socorristas.
   *
   * @deprecated Duplicada por `src/components/medical/CloudinaryPhotoPicker.tsx`
   * (POST /api/upload/cloudinary). Se conserva exportada por compatibilidad.
   */
  async uploadPhoto(
    image: string,
    deviceCode?: string,
  ): Promise<{ photoUrl: string; photoPublicId: string }> {
    const res = await fetch("/api/upload/cloudinary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, deviceCode }),
    });
    if (!res.ok) await lanzarErrorHttp(res);
    const json = await res.json();
    return json.data;
  },

  /** Emite el latido satelital periódico durante el Modo Ruta */
  async sendGpsHeartbeat(
    lat: number,
    lng: number,
    active = true,
  ): Promise<{ success: boolean; recordedAt?: string }> {
    try {
      const res = await fetch("/api/gps/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng, active }),
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, recordedAt: json.data?.recordedAt };
      }
    } catch {
      // Tolerar pérdidas temporales de señal celular en carretera
    }
    return { success: false };
  },

  /**
   * Activa un kit virgen con su PIN secreto de 6 dígitos.
   *
   * @deprecated La ruta canónica es `src/app/activate/[code]/activate-api.ts`
   * (POST /api/devices/activate). Se conserva exportada y corregida: ya no
   * fabrica contraseña, fotografía, grupo sanguíneo ni consentimiento.
   */
  async activateDevice(payload: ActivateDeviceLegacyPayload): Promise<{ success: boolean; redirect: string }> {
    const body = buildActivatePayload(payload);
    const res = await fetch("/api/devices/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) await lanzarErrorHttp(res);
    const data = await res.json();
    // [M9] Sin éxitos fabricados: si el backend no entrega resultado, error.
    if (!data?.data) throw new Error("No se pudo completar la activación.");
    return data.data;
  },

  /** Registra una cuenta nueva de motociclista (Fase 1 de Onboarding rápido sin PIN) */
  async registerRider(payload: RegisterRiderPayload): Promise<RegisterRiderResponse> {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) await lanzarErrorHttp(res);
    const json = await res.json();
    return json.data;
  },

  /** Vincula y activa un kit físico mediante su folio y PIN desde el dashboard */
  async claimDevice(payload: ClaimDevicePayload): Promise<ClaimDeviceResponse> {
    const res = await fetch("/api/devices/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) await lanzarErrorHttp(res);
    const json = await res.json();
    return json.data;
  },

  /** Inicia sesión con verificación Bcrypt y recepción de cookie HttpOnly */
  async login(credentials: {
    email: string;
    password?: string;
  }): Promise<{ success: boolean; user?: SessionUser; redirect?: string }> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) await lanzarErrorHttp(res);
    const json = await res.json();
    return {
      success: true,
      user: json.data?.user,
      redirect: json.data?.redirect,
    };
  },

  /** Cierra la sesión segura revocando la cookie HttpOnly */
  async logout(): Promise<void> {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Silenciar
    }
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },

  /** Solicita el correo con el enlace de recuperación de contraseña */
  async requestPasswordReset(email: string, locale?: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, locale }),
    });
    if (!res.ok) await lanzarErrorHttp(res);
    const json = await res.json();
    return { success: true, message: json.data?.message };
  },

  /** Restablece la contraseña usando el token criptográfico temporal */
  async resetPassword(payload: {
    token: string;
    password: string;
    confirmPassword: string;
  }): Promise<{ success: boolean; message?: string }> {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) await lanzarErrorHttp(res);
    const json = await res.json();
    return { success: true, message: json.data?.message };
  },

  /** Consulta el expediente completo del piloto autenticado */
  async getDashboard(): Promise<DashboardResponse> {
    const res = await fetch("/api/profile", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) await lanzarErrorHttp(res);
    const json = await res.json();
    return json.data;
  },

  /**
   * Consulta el perfil médico formateado del usuario autenticado.
   *
   * @deprecated Código muerto sin consumidores vigentes (el dashboard usa
   * getDashboard). Se conserva exportada; ya no retorna perfiles simulados.
   */
  async getProfile(): Promise<MedicalProfileData> {
    const data = await this.getDashboard();
    const p = data.profile;
    // Cero perfiles simulados: si la ficha no existe se lanza un error
    // humano en vez de inventar un expediente vacío con grupo "O+".
    if (!p) {
      throw new Error("No se pudo cargar la información médica.");
    }

    const rawContacts = Array.isArray(p.emergencyContacts) ? p.emergencyContacts : [];
    const formattedContacts: EmergencyContact[] = rawContacts.map((c) => ({
      id: c.id,
      name: c.name,
      relation: c.relation || c.relationship,
      relationship: c.relationship || c.relation || "",
      phone: c.phone,
      email: c.email || "",
      isPrimary: c.isPrimary ?? false,
    }));

    return {
      fullName: p.fullName,
      nationalId: p.nationalId,
      birthDate: p.birthDate,
      bloodType: p.bloodType,
      allergies: p.allergies || "",
      chronicConditions: p.chronicConditions || "",
      conditions: p.chronicConditions || "",
      medications: p.medications || "",
      insuranceInfo: p.insuranceInfo || "",
      insurance: p.insuranceInfo || "",
      emergencyNumber: p.emergencyNumber || "",
      photoUrl: p.photoUrl || "",
      photoPublicId: p.photoPublicId || "",
      contacts: formattedContacts,
    };
  },

  /** Actualiza la ficha médica y contactos de auxilio en PostgreSQL */
  async updateProfile(profile: Partial<MedicalProfileData>): Promise<{ success: boolean }> {
    const payload = buildProfileUpdatePayload(profile as MedicalProfileData);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) await lanzarErrorHttp(res);
    return { success: true };
  },

  /** Lista los usuarios registrados y el chip que tienen vinculado (solo ADMIN) */
  async getAdminRiders(): Promise<{ riders: AdminRiderItem[] }> {
    const res = await fetch("/api/admin/riders", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) await lanzarErrorHttp(res);
    const json = await res.json();
    return json.data || { riders: [] };
  },

  /** Activa o desactiva la cuenta de un motociclista en el sistema */
  async toggleAdminRiderStatus(
    userId: string,
    isActive: boolean,
  ): Promise<{ success: boolean; isActive: boolean; message: string }> {
    const res = await fetch(`/api/admin/riders/${encodeURIComponent(userId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
      cache: "no-store",
    });
    if (!res.ok) await lanzarErrorHttp(res);
    const json = await res.json();
    return json.data || { success: false, isActive, message: "" };
  },

  /** Elimina un usuario registrado y su chip vinculado (transacción atómica) */
  async deleteAdminRider(userId: string): Promise<{
    success: boolean;
    notFound: boolean;
    message: string;
  }> {
    const res = await fetch(`/api/admin/riders/${encodeURIComponent(userId)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) await lanzarErrorHttp(res);
    const json = await res.json();
    return json.data || { success: false, notFound: false, message: "" };
  },

  /** Elimina un chip físico (libera al usuario asociado) */
  async deleteAdminDevice(code: string): Promise<{
    success: boolean;
    notFound: boolean;
    message: string;
  }> {
    const res = await fetch(
      `/api/admin/devices/${encodeURIComponent(code.trim().toUpperCase())}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      },
    );
    if (!res.ok) await lanzarErrorHttp(res);
    const json = await res.json();
    return json.data || { success: false, notFound: false, message: "" };
  },

  /** Lista el resumen de todos los lotes de producción */
  async getAdminBatches(): Promise<{ batches: AdminBatchSummary[] }> {
    const res = await fetch("/api/admin/batches", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) await lanzarErrorHttp(res);
    const json = await res.json();
    return json.data || { batches: [] };
  },

  /** Obtiene el detalle individual de kits de un lote con sus PINs para impresión */
  async getAdminBatchDetail(batchName: string, includePins = true): Promise<AdminBatchDetail> {
    const query = new URLSearchParams({
      batchName,
      includePins: includePins ? "true" : "false",
    });
    const res = await fetch(`/api/admin/batches?${query.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) await lanzarErrorHttp(res);
    const json = await res.json();
    return json.data;
  },

  /** Genera un nuevo lote de folios secuenciales en Neon PostgreSQL */
  async createAdminBatch(batchName: string, quantity: number): Promise<CreatedBatchResult> {
    const res = await fetch("/api/admin/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchName, quantity }),
    });
    if (!res.ok) await lanzarErrorHttp(res);
    const json = await res.json();
    const data = json.data || {};
    // [M10] El backend solo entrega folio y PIN por kit: ya no se fabrican
    // status, isNfcEncoded ni createdAt. El consumidor obtiene el detalle
    // veraz del lote vía getAdminBatchDetail(batchName).
    const devices = (data.devices || []).map((d: { code: string; activationPin: string }) => {
      const minimo: Partial<AdminDeviceItem> = { code: d.code, activationPin: d.activationPin };
      return minimo as AdminDeviceItem;
    });
    return { batchName: data.batchName, createdAt: data.createdAt, devices };
  },

  /** Registra la confirmación de grabación física de la antena NFC y devuelve el dispositivo real persistido por el backend */
  async recordNfcWrite(params: {
    code: string;
    nfcSerialNumber: string;
    isLockedReadOnly: boolean;
  }): Promise<{ success: boolean; device?: AdminDeviceItem }> {
    const res = await fetch("/api/admin/encode-nfc", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) await lanzarErrorHttp(res);
    // La ruta responde { success: true, data: { device } } con el registro veraz de PostgreSQL
    // (code, nfcSerialNumber, isNfcEncoded, isLockedReadOnly, encodedAt). Nunca se fabrica estado.
    const json = await res.json().catch(() => null);
    const device = (json?.data?.device ?? undefined) as AdminDeviceItem | undefined;
    return { success: true, device };
  },

  /** Elimina un lote completo de chips de forma atómica */
  async deleteAdminBatch(batchName: string): Promise<{ success: boolean; deletedCount: number; message: string }> {
    const res = await fetch(`/api/admin/batches/${encodeURIComponent(batchName.trim())}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) await lanzarErrorHttp(res);
    const json = await res.json();
    return json.data || { success: false, deletedCount: 0, message: "" };
  },

  /** Purga completa de datos de motociclistas y chips físicos (conserva administradores) */
  async purgeAllAdminData(): Promise<{ success: boolean; deletedRiders: number; deletedDevices: number; message: string }> {
    const res = await fetch("/api/admin/purge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) await lanzarErrorHttp(res);
    const json = await res.json();
    return json.data || { success: false, deletedRiders: 0, deletedDevices: 0, message: "" };
  },
};
