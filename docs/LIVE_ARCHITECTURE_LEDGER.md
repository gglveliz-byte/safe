# SAFE — LIVE ARCHITECTURE & MULTI-AI DEPENDENCY LEDGER
> **Documentación en Vivo y Registro de Concurrencia Multi-Agente**  
> **Última Actualización:** 2026-10-24 | **Estado del Sistema:** FASE 0 (Inicialización y Reglas Establecidas)  
> **Stack:** Next.js Full-Stack (App Router + TypeScript) · PostgreSQL + Prisma ORM · Cloudinary CDN · Gmail SMTP · Web NFC API · Tailwind CSS v4  
> **Estética:** *Incident — Technical broadsheet on concrete* (`#efefef`, `#000000`, `#ffffff`, `#f25533`, `#ff492c`, `#f1641e`, Times Serif + Arial 13px)

---

## 1. Tabla de Gobernanza y Bloqueos de Concurrencia Multi-IA

> [!IMPORTANT]
> **REGLA DE CONCURRENCIA MULTI-IA:** Si una IA necesita modificar un archivo perteneciente a un módulo asignado a otra IA, **está estrictamente prohibido sobreescribirlo directamente**. Debe registrar aquí una *Solicitud de Cambio entre IAs* y esperar confirmación o particionar su propia extensión de forma no invasiva.

| Dominio / Módulo | IA Asignada / Agente | Estado del Bloqueo | Archivos Bajo Custodia |
| :--- | :--- | :--- | :--- |
| **Gobernanza y Reglas Core** | Antigravity Orchestrator | ACTIVO (Establecido) | `.agents/rules/SAFE_CORE_RULES.md`, `.agents/skills/*`, `.agents/SKILLS_MASTER_MANIFEST.md` |
| **Backend Parte 1: BD, Gateway y Emergencia** | **AGENTE 1 (Director Backend 1)** | ASIGNADO Y ACTIVO | `prisma/*`, `src/lib/db.ts`, `src/lib/env.ts`, `src/lib/api-response.ts`, `src/services/gps-maps.service.ts`, `src/services/cooldown.service.ts`, `src/services/mail.service.ts`, `src/app/r/[code]/*`, `/api/emergency/alert`, `/api/devices/activate` |
| **Backend Parte 2: Auth, Ruta, Admin y Media** | **AGENTE 2 (Director Backend 2)** | ASIGNADO Y ACTIVO | `src/lib/auth.ts`, `src/middleware.ts`, `src/services/ratelimit.service.ts`, `src/services/cloudinary.service.ts`, `src/services/qr-generator.service.ts`, `/api/auth/*`, `/api/gps/heartbeat`, `/api/profile`, `/api/upload/cloudinary`, `/api/admin/*` |

### Solicitudes Pendientes entre IAs (`Inter-Agent Change Requests`):
*Actualmente no hay solicitudes de cambio pendientes entre agentes. Ambos agentes construyen exclusivamente el Backend sin tocar Frontend y sin colisionar en archivos.*

---

## 2. Inventario de Archivos, Conteo de Líneas y Responsabilidades

> **Límite Estricto:** Máximo 500 líneas físicas por archivo. Alerta preventiva a las 380 líneas.

| Archivo | Líneas Físicas | Estado | Responsabilidad / Descripción General |
| :--- | :--- | :--- | :--- |
| `SAFE_Arquitectura_Sistema_2026 (1).md` | ~740 | Documento Base | Plano arquitectónico general, reglas de negocio y flujos del sistema. |
| `.agents/rules/SAFE_CORE_RULES.md` | ~60 | Aprobado | Las 13 reglas inquebrantables de ingeniería del proyecto. |
| `.agents/skills/safe-incident-design-system/SKILL.md` | ~120 | Aprobado | Guía y tokens de diseño 'Incident' (Technical broadsheet on concrete). |
| `.agents/skills/safe-mobile-native-feel/SKILL.md` | ~135 | Aprobado | Ergonomía móvil nativa, WakeLock, PWA, vibración háptica y safe areas. |
| `.agents/skills/safe-bilingual-i18n/SKILL.md` | ~150 | Aprobado | Arquitectura de internacionalización bilingüe (Español e Inglés sin hardcoding). |
| `.agents/skills/safe-security-and-compliance/SKILL.md` | ~110 | Aprobado | Cooldown anti-spam (3 min / 150m), Zod, JWT HttpOnly y protección médica PII. |
| `.agents/skills/safe-legal-and-terms/SKILL.md` | ~85 | Aprobado | Marco legal de Términos, Privacidad, Habeas Data y Buen Samaritano. |
| `.agents/skills/safe-zero-hardcoding-modularity/SKILL.md` | ~75 | Aprobado | Cero demos, 100% dinámico y particionamiento a <500 líneas. |
| `.agents/skills/safe-multi-ai-live-ledger/SKILL.md` | ~90 | Aprobado | Protocolo multi-IA, cabeceras en español y actualización continua de este Ledger. |
| `.agents/SKILLS_MASTER_MANIFEST.md` | ~110 | Aprobado | Manifiesto maestro padre, matriz de decisión y obligatoriedad de skills para IAs. |
| `.agents/skills/README.md` | ~20 | Aprobado | Índice rápido de skills y redirección al manifiesto maestro. |
| `docs/SAFE_Arquitectura_Backend_2026.md` | ~272 | Aprobado | Arquitectura pura de Backend: Route Handlers, Zod Schemas, Servicios DMS/SMTP/Cloudinary. |
| `docs/SAFE_Arquitectura_BaseDatos_2026.md` | ~272 | Aprobado | Arquitectura pura de Base de Datos: PostgreSQL 16+, ERD, Prisma, Índices y JSONB. |
| `docs/SAFE_Plan_Agente_1_Backend_Parte1.md` | ~85 | Aprobado | Guía y límites de custodia para Agente 1 (Backend Parte 1: BD, Gateway y Emergencia). |
| `docs/SAFE_Plan_Agente_2_Backend_Parte2.md` | ~85 | Aprobado | Guía y límites de custodia para Agente 2 (Backend Parte 2: Auth, Ruta, Admin y Media). |
| `docs/PROMPT_DIRECTOR_AGENTE_1_BACKEND.md` | ~90 | Aprobado | Prompt maestro para Agente 1 (Director de Backend Parte 1 con 20 subagentes). |
| `docs/PROMPT_DIRECTOR_AGENTE_2_BACKEND.md` | ~90 | Aprobado | Prompt maestro para Agente 2 (Director de Backend Parte 2 con 20 subagentes). |

---

## 3. Directriz de Voz y Tono Humano para el Frontend (Cero Jerga Técnica)

> [!CAUTION]
> **PROHIBICIÓN ESTRICTA DE STACK-BABBLE:**
> Ninguna vista del usuario final debe contener términos de ingeniería o infraestructura (`Next.js`, `Prisma`, `PostgreSQL`, `JWT`, `Bcrypt`, `Zod`, `API`, `HTTP 500`, `Payload`, `Cookies`, `SMTP`, etc.).

### Mapeo de Conceptos Técnicos a Lenguaje Humano:
| Término Técnico Prohibido en UI | Expresión Humana Obligatoria (ES) | Human Translation (EN) |
| :--- | :--- | :--- |
| Endpoint / API | Servicio de auxilio / Enlace de conexión | Emergency assistance / Secure link |
| JWT Cookie / Auth | Tu sesión segura de conductor | Your secure rider session |
| Prisma / PostgreSQL | Registro médico protegido | Protected medical record |
| Cooldown / Rate Limit | Ventana de protección de avisos | Alert protection interval |
| NDEF / Web NFC API | Antena de contacto de tu casco | Helmet contact antenna |
| QR Code | Código visual de rescate | Visual rescue code |
| Error 500 / Exception | No fue posible conectar con el centro de auxilio | Could not connect to emergency dispatch |

---

## 4. Directorio de Endpoints y Contratos de API (Para Integración Inmediata de IAs)

| Endpoint | Método | Middleware / Auth | Entrada Principal (Zod DTO) | Salida Exitosa | Responsabilidad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/devices/activate` | `POST` | Pública con PIN | `code`, `activationPin`, `email`, `password`, `medicalData`, `contacts` | `{ success: true, redirect: "/dashboard" }` + Cookie JWT | Activa un kit virgen, crea cuenta y perfil médico en una transacción. |
| `/api/emergency/alert` | `POST` | Pública | `code`, `lat`, `lng`, `scanSource ("nfc" \| "qr")` | `{ success: true, alertId, googleMapsUrl, wasThrottled }` | Dispara GPS, evalúa cooldown anti-spam y envía correos Gmail a familiares. |
| `/api/gps/heartbeat` | `POST` | JWT (RIDER) | `{ lat: number, lng: number }` | `{ success: true, timestamp }` | Actualiza `lastKnownLat/Lng` durante el Modo Ruta en carretera. |
| `/api/auth/login` | `POST` | Pública | `{ email: string, password: string }` | `{ success: true, user }` + Cookie JWT | Inicia sesión del motociclista para editar datos médicos. |
| `/api/auth/logout` | `POST` | Pública | Ninguna | `{ success: true }` + Borra Cookie | Cierra la sesión en el navegador. |
| `/api/profile` | `GET/PUT` | JWT (RIDER) | Perfil médico y array de contactos | `{ medicalProfile }` | Consulta o actualiza datos clínicos y familiares de emergencia. |
| `/api/admin/batches` | `GET/POST` | Master Key | `{ batchName: string, quantity: number }` | `{ batch, devices: Array<{ code, activationPin }> }` | Crea lotes de folios secuenciales listos para imprimir y codificar. |
| `/api/admin/encode-nfc`| `PATCH`| Master Key | `{ code: string, nfcSerialNumber: string, isLockedReadOnly: boolean }` | `{ success: true, device }` | Confirma la grabación física de la antena NFC en serie. |

---

## 5. Directorio de Exports, Tipos y Servicios Reutilizables

| Archivo | Exportaciones Disponibles | Propósito / Cuándo Importar |
| :--- | :--- | :--- |
| `src/lib/db.ts` | `db` (PrismaClient Singleton) | Para cualquier consulta o mutación a la base de datos PostgreSQL. |
| `src/lib/auth.ts` | `signToken(payload)`, `verifyToken(token)`, `getSessionUser(req)` | Para autenticar rutas y generar cookies HttpOnly. |
| `src/services/gps-maps.service.ts` | `buildGoogleMapsDirectData(lat, lng, riderName)` | Para generar enlace oficial de Google Maps y texto sexagesimal DMS. |
| `src/services/cooldown.service.ts` | `checkEmergencyAlertCooldown(deviceId, newLat, newLng)` | Para evaluar si se despacha correo o si aplica cooldown anti-spam. |
| `src/services/mail.service.ts` | `sendEmergencyAlertEmail(contacts, alertData, locale)` | Para enviar correos HTML bilingües con botón directo a Google Maps. |
| `src/services/cloudinary.service.ts` | `uploadRiderPhotoToCloudinary(base64Data, code)` | Para subir y optimizar fotografías de perfil centradas en rostro. |
| `src/services/qr-generator.service.ts` | `generateQrDataUrl(url)` | Para renderizar stickers QR en alta resolución SVG/PNG. |
| `src/locales/index.ts` | `getDictionary(locale)`, `type Locale = "es" \| "en"` | Para acceder al diccionario tipado bilingüe sin hardcoding. |
| `src/hooks/useLocale.ts` | `useLocale()` -> `{ locale, t, toggleLocale }` | Hook de cliente para lectura de textos en componentes React. |
| `src/hooks/useWakeLock.ts` | `useWakeLock(isActive)` | Hook para mantener la pantalla activa en móvil durante Modo Ruta. |

---

## 6. Registro de Verificación Automatizada de Integración

| ID Verificación | Fecha / Hora | Componente Evaluado | Comando Ejecutado | Resultado | Observaciones |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `CHK-001` | 2026-10-24 14:08 | Entorno Local | `node -v; npm -v` | EXITOSO | Node v24.14.1, NPM 11.11.0. Listo para Next.js 15. |
| `CHK-002` | 2026-10-24 14:26 | Skills y Reglas | Auditoría de archivos `.agents/` | EXITOSO | 7 skills y 13 reglas de gobernanza instaladas y activas. |
| `CHK-003` | 2026-10-24 14:29 | Protocolo Multi-IA | Validación de contratos de Ledger | EXITOSO | Directorio de imports, exports y endpoints formalizado. |

---

## 7. Próxima Integración Planificada: **Bloque 1**
1. Andamiaje del proyecto Next.js 15 en la raíz del workspace.
2. Configuración de Tailwind CSS v4 con los tokens exactos de **Incident** en `src/app/globals.css`.
3. Esquema de Prisma (`prisma/schema.prisma`) con control de cooldown `lastAlertAt`.
4. Creación de diccionarios tipados exhaustivos en `src/locales/` (`es.ts`, `en.ts`, `index.ts`).
5. Servicios nucleares con cabeceras completas en español (`gps-maps`, `cooldown`, `cloudinary`, `mail`, `qr-generator`).

