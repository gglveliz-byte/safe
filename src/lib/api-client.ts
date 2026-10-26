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
  EmergencyContact,
  MedicalProfileData,
  SessionUser,
  SessionResponse,
  DashboardResponse,
  EmergencyAlertResult,
  AdminDeviceItem,
  AdminBatchSummary,
  AdminBatchDetail,
  AdminRiderItem,
  CreatedBatchResult,
} from "./api-types";
import {
  lanzarErrorHttp,
  normalizarContactos,
  ensureContactUuid,
  HttpApiError,
} from "./api-client-helpers";

export { HttpApiError, ensureContactUuid };

export type {
  EmergencyContact,
  MedicalProfileData,
  SessionUser,
  SessionResponse,
  DashboardResponse,
  EmergencyAlertResult,
  AdminDeviceItem,
  AdminBatchSummary,
  AdminBatchDetail,
  AdminRiderItem,
  CreatedBatchResult,
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
  async activateDevice(payload: {
    code: string;
    activationPin: string;
    email: string;
    password?: string;
    fullName?: string;
    nationalId?: string;
    photoUrl?: string;
    photoPublicId?: string;
    birthDate?: string;
    bloodType?: string;
    allergies?: string;
    chronicConditions?: string;
    medications?: string;
    insuranceInfo?: string;
    emergencyNumber?: string;
    emergencyContacts?: EmergencyContact[];
    medicalData?: MedicalProfileData;
    termsAccepted?: boolean;
    locale?: "es" | "en";
  }): Promise<{ success: boolean; redirect: string }> {
    const md = payload.medicalData;

    // [C5-C8] Cero datos sensibles fabricados: el esquema del backend exige
    // contraseña real, fotografía existente, grupo sanguíneo declarado por el
    // piloto y consentimiento legal explícito (literal true) del llamador.
    if (!payload.password) throw new Error("La contraseña es obligatoria para activar el kit.");
    if (!(md?.photoUrl || payload.photoUrl)) throw new Error("La fotografía del piloto es obligatoria.");
    if (!(md?.bloodType || payload.bloodType)) throw new Error("El grupo sanguíneo es obligatorio.");
    if (payload.termsAccepted !== true) throw new Error("Debe aceptar los Términos y Condiciones.");

    let body: Record<string, unknown>;
    if (md) {
      body = {
        code: payload.code.trim().toUpperCase(),
        activationPin: payload.activationPin.trim(),
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
        fullName: md.fullName.trim(),
        nationalId: md.nationalId.trim(),
        photoUrl: md.photoUrl || payload.photoUrl,
        photoPublicId: md.photoPublicId || undefined,
        birthDate: md.birthDate || undefined,
        bloodType: md.bloodType || payload.bloodType,
        allergies: md.allergies?.trim() || undefined,
        chronicConditions: (md.chronicConditions || md.conditions || "")?.trim() || undefined,
        medications: md.medications?.trim() || undefined,
        insuranceInfo: (md.insuranceInfo || md.insurance || "")?.trim() || undefined,
        emergencyNumber: md.emergencyNumber?.trim() || undefined,
        // Contactos reales: sin ids inventados ni parentescos supuestos.
        emergencyContacts: normalizarContactos(md.emergencyContacts || md.contacts || []),
        termsAccepted: payload.termsAccepted,
        locale: payload.locale || "es",
      };
    } else {
      body = {
        ...payload,
        code: payload.code.trim().toUpperCase(),
        activationPin: payload.activationPin.trim(),
        termsAccepted: payload.termsAccepted,
      };
    }

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
    const sourceContacts = profile.emergencyContacts || profile.contacts || [];
    // [M8] Contactos reales: sin ids fabricados ni parentesco "Familiar"
    // supuesto; si la relación falta, la clave se omite y el backend valida.
    const normalizedContacts = normalizarContactos(sourceContacts);

    // [B3] ProfileUpdateSchema solo acepta string|undefined (.optional()):
    // enviar null provocaba un rechazo 400. JSON.stringify omite
    // automáticamente las claves con undefined, así que el campo ausente
    // simplemente no se modifica en PostgreSQL.
    const payload = {
      fullName: profile.fullName?.trim(),
      nationalId: profile.nationalId?.trim(),
      photoUrl: profile.photoUrl || undefined,
      photoPublicId: profile.photoPublicId || undefined,
      birthDate: profile.birthDate || undefined,
      // Cero grupo sanguíneo fabricado: si el piloto no lo ha declarado, la
      // clave se OMITE (enviar "" rechazaría el enum del backend y antes se
      // colaba "O+" como valor por defecto, un dato clínico inventado).
      bloodType: profile.bloodType?.trim() || undefined,
      allergies: profile.allergies?.trim() || undefined,
      chronicConditions: (profile.chronicConditions || profile.conditions || "")?.trim() || undefined,
      medications: profile.medications?.trim() || undefined,
      insuranceInfo: (profile.insuranceInfo || profile.insurance || "")?.trim() || undefined,
      emergencyNumber: profile.emergencyNumber?.trim() || undefined,
      emergencyContacts: normalizedContacts,
    };

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
