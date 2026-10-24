# SAFE — Contratos Congelados de Backend (AGENTE 1)
> **Fuente de verdad de firmas, tipos y rutas para los 20 subagentes obreros.**
> **Actualizado:** 2026-10-24 · **Estado:** CONGELADO · **Custodia:** AGENTE 1
> **Leyes:** < 500 líneas por archivo · cabecera en Español · cero mocks · Zod · JWT HttpOnly · cooldown 3 min / 150 m.

---

## 1. Reglas de Convivencia para Subagentes

1. **Leer antes de tocar:** `docs/LIVE_ARCHITECTURE_LEDGER.md`, `.agents/rules/SAFE_CORE_RULES.md`, este contrato y las skills asignadas.
2. **Solo escribir los archivos de tu asignación.** Prohibido editar `package.json`, `tsconfig.json`, documentos, archivos de otros subagentes o cualquier ruta de `src/components/`, `src/app/page.tsx`, `src/locales/`, `public/` (custodia del Agente 2).
3. **No instalar dependencias.** El Director ya instaló el `package.json`. Si falta una dependencia, repórtalo; no la agregues.
4. **No crear mocks, datos demo, `// TODO`, `throw new Error("not implemented")` ni respuestas vacías.**
5. **Cada archivo inicia con la cabecera canónica en Español** (PROYECTO, MÓDULO, ARCHIVO, DESCRIPCIÓN, LEYES) y cada función/constante lleva comentario en Español.
6. **Máximo 450 líneas físicas por archivo** (techo absoluto 500). Si te acercas, divide en un archivo auxiliar dentro de tu misma asignación y repórtalo.
7. **Ejecutar `npx tsc --noEmit` al terminar.** Si los errores pertenecen a archivos de otros subagentes, repórtalos sin editarlos.
8. **Reportar:** archivos creados, líneas exactas (`(Get-Content archivo).Count`), exports, imports, resultado de `tsc`, y cualquier desviación.

---

## 2. Entorno y Convenciones

- Alias de imports: `@/` → `src/`. Usar siempre `@/lib/...`, `@/services/...`.
- Runtime de rutas con Prisma/bcrypt/Cloudinary/Nodemailer: `export const runtime = "nodejs";`
- Prohibido importar `src/lib/auth.ts`, `src/lib/db.ts` o Prisma desde `src/middleware.ts` (Edge). El middleware solo usa `@/lib/auth-token`.
- Formato de error congelado:

```ts
export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMIT"
  | "SERVER_ERROR";

export interface ApiResponseSuccess<T> { success: true; data: T; }
export interface ApiResponseError {
  success: false;
  error: { code: ApiErrorCode; message: string; details?: unknown };
}
```

- Formato de éxito congelado: `{ success: true, data: <payload> }`.
- Mensajes de error: humanos, en Español, sin jerga técnica, sin filtrar trazas ni secretos.
- IDs: UUID v4 (`@db.Uuid`). Fechas: ISO 8601 UTC (`Date.toISOString()`).

---

## 3. Variables de Entorno (`src/lib/env.ts`)

```ts
export interface ServerEnv {
  NODE_ENV: "development" | "test" | "production";
  DATABASE_URL: string;
  JWT_SECRET: string;                 // >= 32 chars
  ADMIN_MASTER_KEY: string;           // >= 24 chars
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
  NEXT_PUBLIC_APP_URL: string;        // URL sin barra final
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  CLOUDINARY_UPLOAD_FOLDER: string;
  GMAIL_USER: string;                 // email válido
  GMAIL_APP_PASSWORD: string;
  GMAIL_FROM_NAME: string;
  EMERGENCY_COOLDOWN_SECONDS: number; // default 180
  EMERGENCY_DISTANCE_THRESHOLD_METERS: number; // default 150
  PIN_MAX_ATTEMPTS: number;           // default 5
  PIN_BLOCK_MINUTES: number;          // default 15
  SESSION_TTL_SECONDS: number;        // default 2592000
  TERMS_VERSION: string;              // default "2026-01"
}
export function validateEnv(): ServerEnv; // valida y retorna; lanza error legible
export function getEnv(): ServerEnv;      // cachea validateEnv()
```

Regla: `getEnv()` se invoca dentro de funciones, nunca en el nivel superior de un módulo (para no romper `next build` sin secretos).

---

## 4. Base de Datos (`src/lib/db.ts`)

```ts
import { PrismaClient } from "@prisma/client";
export const db: PrismaClient; // singleton global en desarrollo
```

---

## 5. JWT y Cookies

### `src/lib/auth-token.ts` (Edge-safe, solo `jose` + `env`)
```ts
export const SESSION_COOKIE = "safe_session";
export type SessionRole = "RIDER" | "ADMIN";
export interface SessionPayload { sub: string; email: string; role: SessionRole; }
export function sessionTtlSeconds(): number;
export async function signToken(payload: SessionPayload, ttlSeconds?: number): Promise<string>;
export async function verifyToken(token: string): Promise<SessionPayload | null>;
export function buildSessionCookie(token: string): {
  name: "safe_session";
  value: string;
  options: { httpOnly: true; secure: boolean; sameSite: "lax"; path: "/"; maxAge: number };
};
export function buildClearedSessionCookie(): {
  name: "safe_session";
  value: "";
  options: { httpOnly: true; secure: boolean; sameSite: "lax"; path: "/"; maxAge: 0 };
};
```
JWT: HS256, issuer `safe`, audience `safe-app`, `sub`, `email`, `role`, `iat`, `exp`.

### `src/lib/auth.ts` (Node, Prisma + bcrypt)
```ts
export interface AuthenticatedUser {
  id: string; email: string; role: SessionRole; liveRideActive: boolean;
  lastKnownLat: number | null; lastKnownLng: number | null; lastGpsAt: Date | null;
  createdAt: Date; updatedAt: Date;
}
export async function hashPassword(password: string): Promise<string>;      // bcrypt 12
export async function verifyPassword(password: string, hash: string): Promise<boolean>;
export async function hashActivationPin(pin: string): Promise<string>;      // bcrypt 10
export async function verifyActivationPin(pin: string, hash: string): Promise<boolean>;
export async function getSession(request?: Request): Promise<SessionPayload | null>;
export async function getSessionUser(request?: Request): Promise<AuthenticatedUser | null>;
export async function requireRider(request?: Request): Promise<{ user: AuthenticatedUser; session: SessionPayload }>; // lanza AppError
export async function requireAdmin(request?: Request): Promise<{ session: SessionPayload | null; isMasterKey: boolean }>; // x-admin-key o sesión ADMIN
export function applySessionCookie(response: NextResponse, token: string): void;
export function clearSessionCookie(response: NextResponse): void;
```
`requireRider`/`requireAdmin` lanzan `AppError` (ver §6) con código `UNAUTHORIZED` o `FORBIDDEN`.
`x-admin-key` se compara en tiempo constante contra `ADMIN_MASTER_KEY`.

---

## 6. Respuestas, Errores y Utilidades HTTP

### `src/lib/api-response.ts`
```ts
export type ApiErrorCode = "VALIDATION_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "RATE_LIMIT" | "SERVER_ERROR";
export class AppError extends Error {
  constructor(code: ApiErrorCode, message: string, status?: number, details?: unknown);
  readonly code: ApiErrorCode; readonly status: number; readonly details?: unknown;
}
export function successResponse<T>(data: T, status?: number, headers?: HeadersInit): NextResponse;
export function errorResponse(code: ApiErrorCode, message: string, status?: number, details?: unknown): NextResponse;
export function handleApiError(error: unknown, context: string): NextResponse; // ZodError, AppError, Prisma, desconocido
export async function parseJsonBody<T>(request: Request, schema: ZodType<T>): Promise<T>; // lanza AppError VALIDATION_ERROR
export async function parseQuery<T>(url: string, schema: ZodType<T>): Promise<T>;
```

### `src/lib/request.ts`
```ts
export interface RequestContext { ip: string; userAgent: string; }
export function getClientIp(request: Request): string;
export function getUserAgent(request: Request): string;
export function getRequestContext(request: Request): RequestContext;
```

### `src/lib/logger.ts`
```ts
export type LogLevel = "info" | "warn" | "error";
export function logEvent(level: LogLevel, event: string, meta?: Record<string, unknown>): void;
```

### `src/lib/crypto.ts`
```ts
export function encryptSecret(plaintext: string): string; // AES-256-GCM, clave derivada de JWT_SECRET
export function decryptSecret(payload: string): string;
export function hmacSha256(value: string, secret?: string): string; // hex, default JWT_SECRET
export function randomToken(bytes?: number): string; // base64url
export function safeEqual(a: string, b: string): boolean; // tiempo constante
```

---

## 7. Esquemas Zod (`src/lib/schemas/`)

### `common.schema.ts`
```ts
export const DeviceCodeSchema;        // trim + uppercase, 4..32, /^[A-Z0-9-]+$/
export const EmailSchema;             // email, max 254, trim + lowercase
export const PasswordSchema;          // 8..128
export const PinSchema;               // exactamente 6 dígitos
export const PhoneSchema;             // +, dígitos, espacios, guiones, paréntesis; 7..20
export const BloodTypeSchema;         // enum O+, O-, A+, A-, B+, B-, AB+, AB-, DESCONOCIDO
export const EmergencyContactSchema;  // strict: id, name 2..100, relation 2..60, phone, email, isPrimary?: boolean
export const EmergencyContactsSchema; // array 1..20, ids únicos, emails únicos
export const LatitudeSchema;          // -90..90
export const LongitudeSchema;         // -180..180
export const LocaleSchema;            // "es" | "en" (default "es")
export const IsoDateSchema;           // string ISO -> Date
export const DeviceCodeParamSchema;   // code normalizado
export type EmergencyContact = z.infer<typeof EmergencyContactSchema>;
```

### `activate.schema.ts`
```ts
export const ActivateDeviceSchema; // exactamente los campos del §4.1 de la arquitectura
export type ActivateDeviceInput = z.infer<typeof ActivateDeviceSchema>;
```
Campos: `code`, `activationPin`, `email`, `password`, `fullName` (3..100), `nationalId` (5..30), `photoUrl` (URL), `photoPublicId?`, `birthDate?`, `bloodType`, `allergies?` (max 500), `chronicConditions?`, `medications?`, `insuranceInfo?` (max 200), `emergencyNumber?` (max 30), `emergencyContacts` (mín. 1), `termsAccepted: true`, `locale?`.
No aceptar campos extra (`.strict()`).

### `auth.schema.ts`
```ts
export const LoginSchema; // { email, password 1..128 }
export type LoginInput = z.infer<typeof LoginSchema>;
```

### `emergency.schema.ts`
```ts
export const EmergencyAlertSchema; // code, latitude?, longitude?, scanSource "nfc"|"qr"|"direct", accuracy? 0..100000
export const EmergencyScanQuerySchema; // { v?: "nfc"|"qr"|"direct" }
export type EmergencyAlertInput = z.infer<typeof EmergencyAlertSchema>;
```

### `profile.schema.ts`
```ts
export const ProfileUpdateSchema; // todos opcionales; al menos uno; contacts 1..20 si se envía
export const HeartbeatSchema;     // { lat, lng, active?: boolean }
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
export type HeartbeatInput = z.infer<typeof HeartbeatSchema>;
```

### `admin.schema.ts`
```ts
export const CreateBatchSchema;     // { batchName 3..80, quantity int 1..100 }
export const BatchesQuerySchema;    // { page?: 1.., pageSize?: 1..100, batchName?, includePins?: boolean }
export const EncodeNfcSchema;       // { code, nfcSerialNumber 8..64, isLockedReadOnly boolean }
export type CreateBatchInput = z.infer<typeof CreateBatchSchema>;
```

### `upload.schema.ts`
```ts
export const CloudinaryUploadSchema; // { image: data URI de imagen, deviceCode?: DeviceCodeSchema }
export type CloudinaryUploadInput = z.infer<typeof CloudinaryUploadSchema>;
```

### `index.ts`
Reexporta todos los esquemas y tipos. **Solo el subagente dueño de `index.ts` lo escribe.**

---

## 8. Servicios Nucleares

### `src/services/gps-maps.service.ts`
```ts
export function decimalToDMS(latitude: number, longitude: number): string;
// 2.168583, -79.452944 => 2°10'06.9"N 79°27'10.6"W
export function buildGoogleMapsUrl(latitude: number, longitude: number): string;
export interface GoogleMapsDirectData {
  dmsFormatted: string; googleMapsUrl: string; whatsappShareUrl: string; whatsappText: string;
}
export function buildGoogleMapsDirectData(latitude: number, longitude: number, riderName: string): GoogleMapsDirectData;
```

### `src/services/cooldown.service.ts`
```ts
export interface CooldownDecision {
  shouldDispatch: boolean;
  reason: "NO_PREVIOUS_ALERT" | "COOLDOWN_EXPIRED" | "LOCATION_CHANGED" | "THROTTLED";
  elapsedSeconds: number | null;
  distanceMeters: number | null;
  cooldownRemainingSeconds: number;
  cooldownSeconds: number;
  distanceThresholdMeters: number;
}
export function haversineDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number;
export function evaluateCooldown(input: {
  lastAlertAt: Date | null; lastLatitude: number | null; lastLongitude: number | null;
  nextLatitude: number; nextLongitude: number; now?: Date;
  cooldownSeconds?: number; distanceThresholdMeters?: number;
}): CooldownDecision;
export async function checkEmergencyAlertCooldown(deviceId: string, newLat: number, newLng: number, now?: Date): Promise<CooldownDecision>;
```
Regla: si no hay alerta previa → despachar. Si `elapsed >= cooldownSeconds` → despachar. Si `elapsed < cooldown` y distancia `>= threshold` → despachar. Si no hay coordenadas previas → `THROTTLED`. Radio terrestre 6.371.000 m.

### `src/services/qr-generator.service.ts`
```ts
export function buildHelmetGatewayUrl(code: string, source?: "nfc" | "qr" | "direct", baseUrl?: string): string;
export async function generateQrSvg(url: string): Promise<string>;
export async function generateQrDataUrl(url: string): Promise<string>; // data:image/png;base64,...
export async function generateQrPngBuffer(url: string): Promise<Buffer>;
```

### `src/services/ratelimit.service.ts`
```ts
export interface RateLimitPolicy { maxAttempts: number; windowSeconds: number; blockSeconds: number; }
export interface RateLimitStatus { allowed: boolean; attempts: number; remaining: number; blockedUntil: Date | null; retryAfterSeconds: number; }
export const RATE_LIMITS: {
  pin: RateLimitPolicy; login: RateLimitPolicy; loginIp: RateLimitPolicy;
  emergencyAlertIp: RateLimitPolicy; publicEmergencyIp: RateLimitPolicy;
  uploadIp: RateLimitPolicy; gatewayIp: RateLimitPolicy;
};
export async function getRateLimitStatus(scope: string, key: string, policy: RateLimitPolicy): Promise<RateLimitStatus>;
export async function recordRateLimitFailure(scope: string, key: string, policy: RateLimitPolicy): Promise<RateLimitStatus>;
export async function consumeRateLimit(scope: string, key: string, policy: RateLimitPolicy): Promise<RateLimitStatus>;
export async function clearRateLimit(scope: string, key: string): Promise<void>;
export async function enforceNotBlocked(scope: string, key: string, policy: RateLimitPolicy): Promise<RateLimitStatus>; // lanza AppError RATE_LIMIT
```
Persistencia en PostgreSQL (`RateLimitBucket`) con transacción serializable y reintentos P2034. Nunca memoria volátil.

### `src/services/mail/templates.ts`
```ts
export interface EmergencyEmailPayload {
  riderName: string; bloodType: string; allergies: string | null; chronicConditions: string | null;
  medications: string | null; dmsFormatted: string; googleMapsUrl: string; scannedAt: Date; alertId: string;
}
export interface EmailContent { subject: string; html: string; text: string; }
export function buildEmergencyEmailContent(payload: EmergencyEmailPayload, locale: "es" | "en", recipientName?: string): EmailContent;
export function escapeHtml(value: string): string;
```

### `src/services/mail.service.ts`
```ts
export interface EmergencyMailRecipient { name: string; email: string; relation?: string; }
export interface EmergencyMailResult {
  sentCount: number; failedCount: number;
  deliveries: Array<{ email: string; delivered: boolean; messageId?: string; error?: string }>;
}
export async function sendEmergencyAlertEmail(recipients: EmergencyMailRecipient[], payload: EmergencyEmailPayload, locale: "es" | "en"): Promise<EmergencyMailResult>;
```
Nodemailer SMTP Gmail (puerto 465, secure), HTML bilingüe Incident ES+EN, deduplicación de correos, concurrencia máxima 5, timeout 20 s. Cero envíos si no hay destinatarios válidos.

### `src/services/cloudinary.service.ts`
```ts
export interface CloudinaryUploadResult { photoUrl: string; photoPublicId: string; width: number; height: number; format: string; bytes: number; }
export async function uploadRiderPhotoToCloudinary(base64Data: string, code: string): Promise<CloudinaryUploadResult>;
export async function deleteCloudinaryAsset(publicId: string): Promise<void>;
```
MIME permitido: jpeg/png/webp. Máximo 5 MB decodificados. Transformación 600x600 `crop: fill`, `gravity: face`, `quality: auto:good`, `fetch_format: auto`. `public_id` estable por código para evitar huérfanos.

### `src/services/device-code.service.ts`
```ts
export function formatDeviceCode(sequence: number): string; // SAFE-0001
export function parseDeviceCodeNumber(code: string): number | null;
export function generateActivationPin(): string; // 6 dígitos criptográficos, incluye ceros iniciales
export async function resolveNextFolioSequence(tx: Prisma.TransactionClient): Promise<number>; // advisory lock PostgreSQL + MAX
```

### `src/services/activation.service.ts`
```ts
export interface ActivateDeviceResult {
  user: AuthenticatedUser; token: string; redirect: "/dashboard"; deviceCode: string;
}
export async function activateDevice(input: ActivateDeviceInput, context: RequestContext): Promise<ActivateDeviceResult>;
```
- Rate limit PIN por `code+ip` (5 fallos / 15 min / bloqueo 15 min).
- Verifica PIN con bcrypt (`verifyActivationPin`), device `UNCLAIMED`, email libre.
- Hash de contraseña 12; transacción atómica User + MedicalProfile + Device(ACTIVE, activatedAt, userId).
- Guarda consentimiento (`consentAcceptedAt`, `consentVersion`, `consentIpHash`) y `termsAccepted`.
- Limpia intentos al éxito. Error de PIN siempre genérico.

### `src/services/batch.service.ts`
```ts
export interface CreatedBatch { batchName: string; createdAt: string; devices: Array<{ code: string; activationPin: string }>; }
export interface BatchSummary { batchName: string; totalDevices: number; encodedDevices: number; activeDevices: number; createdAt: string; }
export async function createBatch(input: CreateBatchInput): Promise<CreatedBatch>;
export async function listBatches(): Promise<BatchSummary[]>;
export async function getBatchDetail(batchName: string, includePins: boolean): Promise<{
  batchName: string;
  devices: Array<{ code: string; status: string; isNfcEncoded: boolean; nfcSerialNumber: string | null; createdAt: string; activatedAt: string | null; activationPin?: string }>;
}>;
export async function encodeNfc(input: EncodeNfcInput): Promise<{ code: string; nfcSerialNumber: string; isNfcEncoded: boolean; isLockedReadOnly: boolean; encodedAt: string }>;
```
- Folios secuenciales con advisory lock; nombre de lote no repetido; PIN cifrado (`activationPinEncrypted`) + hash (`activationPinHash`).
- PIN visible solo al crear el lote y en detalle con `includePins=true`.
- `encodeNfc` valida dispositivo existente y serial NFC no repetido.

### `src/services/emergency-alert.service.ts`
```ts
export interface EmergencyAlertResult {
  alertId: string; dmsFormatted: string; googleMapsUrl: string;
  emailsSentCount: number; wasThrottled: boolean; createdAt: string;
}
export async function dispatchEmergencyAlert(input: EmergencyAlertInput, context: RequestContext): Promise<EmergencyAlertResult>;
```
- Rate limit por IP (`emergencyAlertIp`).
- Device ACTIVE + perfil médico obligatorio. Si faltan coordenadas, usa `lastKnownLat/Lng` del rider (`RIDER_FALLBACK_GPS`); si tampoco existen → VALIDATION_ERROR.
- Cooldown por dispositivo; si `THROTTLED`, crea alerta con `wasThrottled=true`, `emailsSentCount=0`, no actualiza `lastAlertAt` (mantiene referencia del último aviso real) y no envía correos.
- Si despacha: crea alerta, actualiza `lastAlertAt/lastAlertLat/lastAlertLng`, envía correos y actualiza `emailsSentCount` + `emailDelivery`.
- `scannerIp` se guarda como hash HMAC (nunca IP cruda).

---

## 9. Endpoints y Respuestas

Todas las rutas: `runtime = "nodejs"`, `dynamic = "force-dynamic"`, `Cache-Control: no-store`, try/catch con `handleApiError(error, "contexto")`.

| Método | Ruta | Auth | Body / Query | `data` de éxito |
| :--- | :--- | :--- | :--- | :--- |
| POST | `/api/auth/login` | Pública + rate limit | `LoginSchema` | `{ user: { id,email,role }, redirect: "/dashboard" \| "/admin" }` + cookie |
| POST | `/api/auth/logout` | Pública | — | `{ loggedOut: true }` + cookie expirada |
| GET | `/api/auth/session` | Cookie | — | `{ authenticated: boolean, user?: { id,email,role } }` |
| POST | `/api/devices/activate` | Pública + PIN | `ActivateDeviceSchema` | `{ redirect: "/dashboard", deviceCode, user: { id,email,role } }` + cookie, HTTP 201 |
| POST | `/api/emergency/alert` | Pública | `EmergencyAlertSchema` | `EmergencyAlertResult` |
| GET | `/api/emergency/[code]` | Pública + rate limit | params `code` | `{ device:{code,status}, profile:{fullName,nationalIdMasked,birthDate,bloodType,allergies,chronicConditions,medications,insuranceInfo,emergencyNumber,photoUrl,emergencyContacts:[{id,name,relation,phone,isPrimary}]}, updatedAt }` |
| POST | `/api/gps/heartbeat` | RIDER | `HeartbeatSchema` | `{ recordedAt, liveRideActive }` |
| GET | `/api/profile` | RIDER | — | `{ user:{id,email,liveRideActive,lastKnownLat,lastKnownLng,lastGpsAt}, profile:{...}, device:{code,status} }` |
| PUT | `/api/profile` | RIDER | `ProfileUpdateSchema` | `{ profile:{...}, updatedAt }` |
| GET | `/api/admin/batches` | Admin | `BatchesQuerySchema` | sin `batchName`: `{ batches: BatchSummary[] }`; con `batchName`: detalle de lote |
| POST | `/api/admin/batches` | Admin | `CreateBatchSchema` | `CreatedBatch`, HTTP 201 |
| PATCH | `/api/admin/encode-nfc` | Admin | `EncodeNfcSchema` | `{ device }` |
| POST | `/api/upload/cloudinary` | Pública + rate limit | JSON `{image,deviceCode?}` o multipart `file` + `deviceCode?` | `{ photoUrl, photoPublicId }`, HTTP 201 |
| GET | `/r/[code]` | Pública | `?v=nfc\|qr` | 307 a `/activate/[code]` o `/emergency/[code]?v=...`; 404 HTML bilingüe si no existe/deshabilitado |

### Autenticación administrativa
- `POST /api/auth/login` con rol ADMIN devuelve cookie y `redirect: "/admin"`.
- Rutas `/api/admin/*`: `requireAdmin(request)` acepta `x-admin-key` (comparación tiempo constante) o cookie de sesión ADMIN.
- Middleware `/admin/*`: solo cookie ADMIN; sin sesión → `/login?redirect=/admin`.

---

## 10. Prisma — Modelos y Campos Extra Necesarios

Además del ERD de `docs/SAFE_Arquitectura_BaseDatos_2026.md`, se agregan campos de seguridad y operación (todos obligatorios en el schema):

- `Device`: `activationPinHash String`, `activationPinEncrypted String`, `lastAlertLat Float?`, `lastAlertLng Float?`, `updatedAt DateTime @updatedAt`, `@@index([batchName])`, `@@index([createdAt])`.
- `MedicalProfile`: `consentAcceptedAt DateTime`, `consentVersion String`, `consentIpHash String?`, `createdAt DateTime @default(now())`; clínicos opcionales (`String?`) para representar “no declarado” sin textos en duro.
- `EmergencyAlert`: `accuracyMeters Float?`, `emailDelivery Json?`, `@@index([createdAt])`.
- `RateLimitBucket`: `id String @id @default(uuid()) @db.Uuid`, `key String @unique`, `scope String`, `attempts Int @default(0)`, `windowStartedAt DateTime`, `blockedUntil DateTime?`, `expiresAt DateTime`, `createdAt`, `updatedAt`, `@@index([scope])`, `@@index([expiresAt])`.
- Enums: `Role { RIDER ADMIN }`, `DeviceStatus { UNCLAIMED ACTIVE DISABLED }`.
- `User` conserva `email @unique`, `passwordHash`, `role`, `liveRideActive`, `lastKnownLat/Lng`, `lastGpsAt`, timestamps.
- Relaciones: User 1:1 Device (`onDelete: SetNull`), User 1:1 MedicalProfile (`onDelete: Cascade`), Device 1:N EmergencyAlert (`onDelete: Cascade`).

---

## 11. Mensajes y Bilingüismo

- Correos y la vista HTML de chip inactivo incluyen Español e Inglés en el mismo documento.
- Asunto ES: `🚨 ALERTA MÉDICA SAFE: Casco de {nombre} escaneado en carretera`.
- Asunto EN: `🚨 SAFE EMERGENCY ALERT: {nombre}'s helmet scanned on route`.
- Prohibido exponer cédula completa, correos de contactos o `passwordHash` en respuestas públicas.
- Diseño Incident en correos: Concrete `#efefef`, Paper `#ffffff`, Ink `#000000`, Signal Orange `#f25533`, Alert Red `#ff492c`; Times serif + Arial 13px; botón neutro con borde 1px; cero gradientes.
