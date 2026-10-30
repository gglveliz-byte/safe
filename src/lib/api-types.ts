/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Tipos y Contratos de Transporte de API
 * ARCHIVO: src/lib/api-types.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Definiciones de tipos TypeScript para la comunicación entre cliente y backend:
 * perfiles médicos, contactos de emergencia, telemetría GPS, sesiones de usuario
 * y administración de lotes de hardware.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Tipado estricto alineado con Zod y Prisma.
 * - Comentarios canónicos en Español.
 * ==============================================================================
 */

export interface EmergencyContact {
  id: string;
  name: string;
  relation?: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary?: boolean;
}

export interface MedicalProfileData {
  fullName: string;
  nationalId: string;
  birthDate?: string | null;
  bloodType: string;
  allergies?: string | null;
  chronicConditions?: string | null;
  conditions?: string | null; // Alias de compatibilidad UI
  medications?: string | null;
  insuranceInfo?: string | null;
  insurance?: string | null; // Alias de compatibilidad UI
  emergencyNumber?: string | null;
  photoUrl?: string;
  photoPublicId?: string | null;
  idCardFrontUrl?: string | null;
  idCardFrontPublicId?: string | null;
  idCardBackUrl?: string | null;
  idCardBackPublicId?: string | null;
  beneficiaryType?: string;
  country?: string | null;
  city?: string | null;
  residentialAddress?: string | null;
  riderPhone?: string | null;
  age?: number | null;
  isOrganDonor?: boolean;
  medicalFindings?: string | null;
  hasGuardian?: boolean;
  rescueNotes?: string | null;
  frequentLocation?: string | null;
  vehicleInfo?: string | null;
  contacts: EmergencyContact[];
  emergencyContacts?: EmergencyContact[];
}

export interface SessionUser {
  id: string;
  email: string;
  role: "RIDER" | "ADMIN" | string;
}

export interface SessionResponse {
  authenticated: boolean;
  user?: SessionUser;
}

export interface DashboardResponse {
  user: {
    id: string;
    email: string;
    role: string;
    liveRideActive: boolean;
    lastKnownLat: number | null;
    lastKnownLng: number | null;
    lastGpsAt: string | null;
  };
  profile: {
    id: string;
    userId: string;
    fullName: string;
    nationalId: string;
    photoUrl: string;
    photoPublicId?: string | null;
    idCardFrontUrl?: string | null;
    idCardFrontPublicId?: string | null;
    idCardBackUrl?: string | null;
    idCardBackPublicId?: string | null;
    birthDate?: string | null;
    bloodType: string;
    allergies?: string | null;
    chronicConditions?: string | null;
    medications?: string | null;
    insuranceInfo?: string | null;
    emergencyNumber?: string | null;
    riderPhone?: string | null;
    country?: string | null;
    city?: string | null;
    residentialAddress?: string | null;
    isOrganDonor?: boolean;
    rescueNotes?: string | null;
    frequentLocation?: string | null;
    vehicleInfo?: string | null;
    emergencyContacts: EmergencyContact[];
    consentAcceptedAt?: string;
    consentVersion?: string;
  } | null;
  device: {
    code: string;
    status: string;
    isNfcEncoded: boolean;
    createdAt: string;
  } | null;
  isPinDispatchMode?: boolean;
}

export interface EmergencyAlertResult {
  alertId: string;
  googleMapsUrl: string;
  dmsFormatted?: string;
  wasThrottled: boolean;
}

export interface AdminDeviceItem {
  code: string;
  activationPin?: string;
  status: "UNCLAIMED" | "ACTIVE" | "DISABLED" | string;
  isNfcEncoded?: boolean;
  nfcSerialNumber?: string | null;
  encodedAt?: string | null;
  createdAt?: string;
  activatedAt?: string | null;
}

export interface AdminBatchSummary {
  batchName: string;
  totalDevices: number;
  encodedDevices: number;
  activeDevices: number;
  unclaimedDevices: number;
  createdAt: string;
}

/** Chip físico vinculado a un motociclista en el panel administrativo. */
export interface AdminRiderDevice {
  code: string;
  status: string;
  isNfcEncoded: boolean;
  nfcSerialNumber: string | null;
  activatedAt: string | null;
  createdAt: string;
}

/** Usuario registrado con su eventual chip SAFE vinculado. */
export interface AdminRiderItem {
  id: string;
  email: string;
  fullName: string | null;
  photoUrl: string | null;
  isActive: boolean;
  liveRideActive: boolean;
  registeredAt: string;
  device: AdminRiderDevice | null;
}

export interface AdminBatchDetail {
  batchName: string;
  devices: AdminDeviceItem[];
}

export interface CreatedBatchResult {
  batchName: string;
  createdAt: string;
  devices: AdminDeviceItem[];
}

export interface RegisterRiderPayload {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  riderPhone: string;
  country?: string;
  termsAccepted: true;
  deviceCode?: string;
  locale?: "es" | "en";
}

export interface RegisterRiderResponse {
  success: boolean;
  message: string;
  email: string;
  deviceCode?: string | null;
}

export interface ClaimDevicePayload {
  code?: string;
  pin: string;
}

export interface ClaimDeviceResponse {
  success: boolean;
  message: string;
  device: {
    id: string;
    code: string;
    status: string;
  };
}

export interface ActivateDeviceLegacyPayload {
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
}
