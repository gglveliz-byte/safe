# SAFE — Emergency Medical & Real-Time GPS Ledger for Riders

Plataforma web progresiva (PWA) de identificación médica de emergencia y localización GPS en tiempo real para motociclistas. Vincula un kit físico de casco (chip NFC NXP NTAG216 + código QR) con un perfil médico en la nube y un motor de despacho automático de alertas por correo con enlace directo a Google Maps.

> **Estética:** *Incident — Technical broadsheet on concrete* (`#efefef`, `#000000`, `#ffffff`, `#f25533`, `#ff492c`, `#f1641e`, Times Serif + Arial 13px).
> **Bilingüe:** Español e Inglés de punta a punta (diccionarios tipados en `src/locales/`).

---

## Stack

- **Framework:** Next.js 15 (App Router) · React 19 · TypeScript estricto
- **Base de datos:** PostgreSQL 16+ (Neon/Supabase/RDS) · Prisma ORM 5
- **Autenticación:** JWT HS256 (`jose`) en cookie HttpOnly · bcryptjs
- **Media:** Cloudinary (optimización facial 600x600)
- **Correo:** Gmail SMTP (Nodemailer, puerto 465 SSL)
- **Estilos:** Tailwind CSS con tokens del sistema Incident

---

## Requisitos

- Node.js v22.18+ (probado en v24)
- PostgreSQL 16+ accesible (local o serverless con `sslmode=require`)
- Cuenta de Cloudinary (subida de fotografías)
- Cuenta de Gmail con contraseña de aplicación (despacho de alertas)

---

## Puesta en marcha

```bash
# 1. Instalar dependencias (ejecuta prisma generate automáticamente vía postinstall)
npm install

# 2. Configurar entorno
#    Copiar .env.example a .env y completar TODAS las variables con credenciales reales.
#    El validador de arranque (src/instrumentation.ts + src/lib/env.ts) detiene el servidor
#    con un diagnóstico en español si alguna variable falta o está mal formada.

# 3. Crear el esquema en la base de datos
npm run db:deploy        # producción / CI (aplica migraciones versionadas)
# npm run db:migrate     # desarrollo local (crea migraciones incrementales)

# 4. Sembrar el administrador maestro (requiere ADMIN_EMAIL y ADMIN_PASSWORD en .env)
npm run db:seed

# 5. Desarrollo
npm run dev              # http://localhost:3000

# 6. Producción
npm run build
npm start
```

### Variables de entorno críticas

| Variable | Propósito |
| :--- | :--- |
| `DATABASE_URL` | Cadena de conexión PostgreSQL (`sslmode=require` en producción) |
| `JWT_SECRET` | Firma de sesiones (mínimo 32 caracteres aleatorios) |
| `ADMIN_MASTER_KEY` | Clave maestra del panel administrativo (mínimo 24) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credenciales del SuperAdmin para el semillero |
| `NEXT_PUBLIC_APP_URL` | URL pública canónica (sin barra final) — **fijar al dominio HTTPS real ANTES de `npm run build`** (las variables `NEXT_PUBLIC_*` se hornean en tiempo de compilación; de ella dependen las URLs grabadas en chips NFC y códigos QR) |
| `CLOUDINARY_*` | Credenciales de Cloudinary |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | Correo y contraseña de aplicación de Gmail |
| `EMERGENCY_COOLDOWN_SECONDS` / `EMERGENCY_DISTANCE_THRESHOLD_METERS` | Ventana anti-spam de alertas (por defecto 180 s / 150 m) |
| `PIN_MAX_ATTEMPTS` / `PIN_BLOCK_MINUTES` | Protección contra fuerza bruta del PIN de activación (5 / 15) |

---

## Flujos principales

1. **Fábrica (`/admin`):** creación de lotes de folios `SAFE-XXXX` con PIN confidencial de 6 dígitos, impresión de stickers QR y grabado NFC en serie (Web NFC API) con bloqueo read-only opcional.
2. **Primer escaneo (`/r/[code]` → `/activate/[code]`):** el kit virgen (`UNCLAIMED`) se activa con PIN, fotografía, ficha médica y contactos; el chip pasa a `ACTIVE` y el piloto queda autenticado (cookie HttpOnly) rumbo a `/dashboard`.
3. **Escaneo de auxilio (`/r/[code]` → `/emergency/[code]`):** con el kit `ACTIVE`, CUALQUIER escaneo abre la ficha médica pública (cédula ofuscada), captura la coordenada del socorrista y despacha correos bilingües a los contactos con enlace exacto a Google Maps. Ventana de protección anti-spam de 3 minutos con excepción de traslado real (>150 m).
4. **Modo Ruta (`/dashboard`):** telemetría GPS cada 20 s (`/api/gps/heartbeat`) con pantalla siempre activa (Screen WakeLock API); la última posición conocida alimenta el respaldo de ubicación de las alertas.

---

## Verificación de calidad

```bash
npm run typecheck        # TypeScript estricto (tsc --noEmit)
npm run build            # Compilación de producción Next.js
npx prisma validate      # Validación del esquema
```

Leyes de ingeniería (ver `.agents/rules/SAFE_CORE_RULES.md`): máximo 500 líneas por archivo, cero datos de demostración, cabeceras y comentarios en español, validación Zod en el 100% de las rutas, bilingüismo sin textos en duro.

---

## Documentación viva

- `docs/LIVE_ARCHITECTURE_LEDGER.md` — registro de arquitectura, bloqueos de concurrencia multi-IA y verificaciones.
- `docs/BACKEND_CONTRACTS.md` — contratos congelados de tipos, DTOs y endpoints.
- `docs/SAFE_Arquitectura_Backend_2026.md` · `docs/SAFE_Arquitectura_BaseDatos_2026.md` · `docs/SAFE_Arquitectura_Frontend_2026.md` — especificaciones por capa.

## Seguridad

- Sesiones JWT HS256 en cookies `HttpOnly; Secure; SameSite=Lax` (nunca localStorage).
- PIN de activación: hash bcrypt + copia cifrada AES-256-GCM (nunca en texto plano); límite de 5 intentos / bloqueo de 15 minutos.
- Datos médicos públicos con cédula ofuscada y contactos sin correo electrónico.
- IPs de escáner persistidas únicamente como hash HMAC-SHA256.
- Cabeceras de seguridad (X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, HSTS y CSP) en middleware y configuración.
