---
name: safe-security-and-compliance
description: >-
  Estándares de seguridad de nivel bancario/médico y protección anti-abuso para SAFE. Define ventanas de cooldown anti-spam en despacho de emergencias, validación estricta de esquemas Zod en todas las API routes, protección contra fuerza bruta en PINs de activación, cookies HttpOnly JWT con jose, autenticación segura del panel Admin y protección de datos médicos sensibles (PII).
---

# Skill: Seguridad, Cero Abuso y Protección de Datos Médicos (SAFE Security)

Dado que **SAFE** maneja información médica de emergencia, ubicación GPS en vivo y despacho masivo de correos, la seguridad es un pilar innegociable.

---

## 1. Escudo Anti-Spam y Cooldown en Alertas (`/api/emergency/alert`)

### El Riesgo:
Un atacante o un transeúnte curioso que escanea repetidamente un casco puede generar decenas de peticiones por minuto, agotando la cuota de Gmail SMTP y aterrorizando a los familiares con notificaciones falsas sucesivas.

### La Solución Obligatoria:
1. **Ventana de Cooldown de 3 Minutos:** Por cada `deviceId`, el servidor verifica el campo `lastAlertAt` en PostgreSQL.
2. **Excepción de Desplazamiento Geográfico:** Si el tiempo transcurrido es menor a 3 minutos pero la distancia entre la coordenada actual y la anterior supera los **150 metros** (usando la fórmula de Haversine), se interpreta como un cambio crítico de ubicación (ej. traslado en ambulancia) y se despacha la alerta.
3. **Registro Auditor:** Toda petición repetida dentro del cooldown sin cambio de ubicación se guarda en la base de datos con `wasThrottled: true` y `emailsSentCount: 0`.

---

## 2. Protección Contra Fuerza Bruta en PIN de Activación

Los kits físicos cuentan con un PIN de 6 dígitos impreso en una tarjeta confidencial dentro del empaque.
- **Límite de Intentos:** Máximo 5 intentos fallidos consecutivos por IP o código de dispositivo en `/api/devices/activate`.
- **Bloqueo Temporal:** Si se superan 5 intentos fallidos, el endpoint responde con HTTP 429 (`Too Many Requests`) durante 15 minutos.
- **Timing Attack Safe:** La comparación de PINs debe ejecutarse con funciones de tiempo constante (`crypto.timingSafeEqual`) o verificación de hash.

---

## 3. Autenticación Robusta y Sesiones HttpOnly

- **JWT con `jose`:** Firmado con algoritmo `HS256` utilizando `JWT_SECRET`.
- **Almacenamiento:** Exclusivamente en cookies `HttpOnly; Secure; SameSite=Lax; Path=/`.
- **Prohibido:** Guardar tokens de autenticación en `localStorage` o `sessionStorage` para erradicar el riesgo de robo por XSS.
- **Panel Admin:** Protegido con `ADMIN_MASTER_KEY` verificado en middleware o en cada endpoint `/api/admin/*`.

---

## 4. Validación Estricta de Esquemas con Zod

**Ningún endpoint de la API puede confiar en el cuerpo de la petición sin validarlo con Zod:**

```typescript
// Ejemplo: src/lib/schemas/activate.schema.ts
import { z } from "zod";

export const ActivateDeviceSchema = z.object({
  code: z.string().min(4).max(20).regex(/^[A-Z0-9-]+$/),
  activationPin: z.string().length(6).regex(/^\d+$/),
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(3).max(100),
  nationalId: z.string().min(5).max(30),
  photoUrl: z.string().url(),
  photoPublicId: z.string().optional(),
  bloodType: z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-", "DESCONOCIDO"]),
  allergies: z.string().max(500),
  chronicConditions: z.string().max(500),
  medications: z.string().max(500),
  emergencyContacts: z.array(z.object({
    id: z.string(),
    name: z.string().min(2),
    relation: z.string().min(2),
    phone: z.string().min(7),
    email: z.string().email()
  })).min(1, "Debe registrar al menos un contacto de emergencia"),
  termsAccepted: z.literal(true, { errorMap: () => ({ message: "Debe aceptar los Términos y Condiciones" }) })
});
```

---

## 5. Protección de Datos Médicos (PII)

- En la vista pública de emergencia (`/emergency/[code]`), el número de identificación nacional (cédula) se muestra parcialmente ofuscado o en formato protegido para evitar robo de identidad por escaneos no autorizados en la calle.
- La foto del rostro se sirve optimizada a través del CDN seguro de Cloudinary sin exponer rutas internas del servidor.
- La coordenada del Modo Ruta solo se expone a los contactos autorizados o durante un evento de emergencia activo.
