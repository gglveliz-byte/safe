/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Esquemas de Validación (Zod) — Alerta de Emergencia y Gateway
 * ARCHIVO: src/lib/schemas/emergency.schema.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Esquemas canónicos del flujo de emergencia de SAFE, consumidos por:
 *   - `POST /api/emergency/alert` → `EmergencyAlertSchema` (payload del
 *     escaneo del casco que dispara el despacho SMTP con enlace a Maps).
 *   - `GET /r/[code]?v=nfc|qr|direct` → `EmergencyScanQuerySchema`
 *     (querystring del gateway inteligente que bifurca UNCLAIMED vs ACTIVE).
 *
 * Contratos de referencia: §7 de BACKEND_CONTRACTS.md (CONGELADO) y §4.2 de
 * SAFE_Arquitectura_Backend_2026.md.
 *
 * ENTRADAS: JSON body del POST de alerta y querystring del gateway público.
 * SALIDAS: `EmergencyAlertInput` tipado, listo para `emergency-alert.service.ts`
 * → `dispatchEmergencyAlert(input, context)`.
 *
 * DEPENDENCIAS: zod (v3, ^3.24) y los esquemas base de common.schema.ts.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - `.strict()` SOLO en el payload de alerta; el querystring del gateway hace
 *   STRIP de claves desconocidas (corrección H-13, ver comentario in situ).
 * - Cero mocks, cero TODO, cero datos de demostración.
 * - Mensajes de error humanos en español sin jerga técnica.
 * ==============================================================================
 */

import { z } from "zod";

import {
  DeviceCodeSchema,
  LatitudeSchema,
  LongitudeSchema,
} from "@/lib/schemas/common.schema";

/**
 * Texto canónico que se devuelve cuando el cliente envía un campo que no
 * forma parte del contrato congelado §7 del payload de alerta.
 */
const STRICT_ALERT_MESSAGE = "El formulario de alerta contiene campos no permitidos.";

/**
 * Catálogo de fuentes de escaneo admitidas por el gateway del casco.
 *   - "nfc":    lectura directa de la antena NFC del casco (Web NFC API).
 *   - "qr":     lectura del código QR impreso en la tira.
 *   - "direct": acceso manual por URL (taller, prueba o enlace compartido).
 * Se consume en `scanSource` de EmergencyAlertSchema y en `v` del querystring
 * del gateway `/r/[code]`.
 */
export const SCAN_SOURCES = ["nfc", "qr", "direct"] as const;

/**
 * Payload de la alerta de emergencia que dispara el despacho SMTP.
 *
 * Campos:
 *   - `code`:        Folio del casco escaneado. DeviceCodeSchema lo normaliza
 *                    a mayúsculas y recorta espacios; esta normalización
 *                    protege contra las variaciones de casing que produce
 *                    el escáner NFC del móvil (algunos lectores devuelven
 *                    el texto en minúsculas o con caracteres mixtos).
 *   - `latitude`:    Latitud GPS WGS84 del escaneo (-90..90). Opcional: si
 *                    falta, el servicio usa `lastKnownLat` del rider.
 *   - `longitude`:   Longitud GPS WGS84 del escaneo (-180..180). Opcional:
 *                    misma regla de fallback que la latitud.
 *   - `scanSource`:  Cómo se leyó el casco (nfc / qr / direct).
 *   - `accuracy`:    Precisión en metros reportada por el sensor del móvil.
 *                    Opcional; si se envía, debe estar en [0, 100000].
 *
 * Invariante de coordenadas (`superRefine`):
 *   La latitud y la longitud DEBEN venir juntas o ninguna. Aceptar una
 *   coordenada suelta produciría un enlace de Google Maps inválido y una
 *   evaluación de cooldown con Haversine sobre datos incompletos.
 *
 * `.strict()` bloquea cualquier campo adicional inyectado por un cliente
 * manipulado antes de que llegue al servicio de despacho.
 */
export const EmergencyAlertSchema = z
  .object(
    {
      /** Folio del casco escaneado (normalizado a mayúsculas por DeviceCodeSchema). */
      code: DeviceCodeSchema,

      /** Latitud GPS WGS84 del punto de escaneo. Opcional; ver superRefine. */
      latitude: LatitudeSchema.optional(),

      /** Longitud GPS WGS84 del punto de escaneo. Opcional; ver superRefine. */
      longitude: LongitudeSchema.optional(),

      /** Fuente del escaneo: NFC, QR o acceso directo por URL. */
      scanSource: z.enum(SCAN_SOURCES, {
        errorMap: () => ({
          message: "La fuente de escaneo debe ser nfc, qr o direct.",
        }),
      }),

      /** Precisión en metros del sensor GPS del móvil (0..100000). Opcional. */
      accuracy: z
        .number({
          invalid_type_error: "La precisión debe ser un número decimal en metros.",
        })
        .min(0, "La precisión no puede ser negativa.")
        .max(100000, "La precisión reportada supera el límite admisible (100.000 m).")
        .optional(),
    },
  )
  .strict(STRICT_ALERT_MESSAGE)
  .superRefine((data, ctx) => {
    /**
     * Guarda de integridad geodésica: latitud y longitud son un par inseparable.
     * Si el cliente envía solo una de las dos, el enlace de Google Maps y el
     * cálculo Haversine del cooldown.service.ts quedarían corruptos. Se añade
     * el issue en AMBOS caminos para que el cliente reciba el error apuntando
     * al campo que falta, no al que sí llegó.
     */
    const hasLat = data.latitude !== undefined;
    const hasLng = data.longitude !== undefined;

    if (hasLat !== hasLng) {
      const message =
        "Las coordenadas deben enviarse completas (latitud y longitud).";
      if (hasLat) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["longitude"],
          message,
        });
      } else {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["latitude"],
          message,
        });
      }
    }
  });

/**
 * Tipo TypeScript inferido del esquema de alerta de emergencia. Es el DTO
 * que recibe `emergency-alert.service.ts` → `dispatchEmergencyAlert(input,
 * context)`. Los campos opcionales aparecen como `T | undefined`.
 */
export type EmergencyAlertInput = z.infer<typeof EmergencyAlertSchema>;

/**
 * Querystring del gateway inteligente del casco `/r/[code]?v=nfc|qr|direct`.
 *
 * El parámetro `v` indica al gateway cómo fue leído el casco y se reenvía
 * tal cual a la vista de activación o de emergencia para que la UI muestre
 * el indicador visual correspondiente (antena NFC, sticker QR o enlace
 * directo). Es opcional: si falta, la vista asume "direct" por defecto.
 *
 * Por qué este esquema NO usa `.strict()` (corrección H-13): el gateway es la
 * entrada MÁS crítica del sistema y su URL se comparte por WhatsApp y otras
 * apps de mensajería, que añaden parámetros de tracking ajenos al contrato
 * (?fbclid=..., ?igsh=..., ?utm_source=...). Con `.strict()`, cada enlace
 * legítimo reenviado respondería 400 VALIDATION_ERROR y la víctima o el
 * rescatista quedarían sin acceso a la ficha en el peor momento posible. Se
 * deja por tanto el comportamiento por defecto de zod v3 (STRIP): las claves
 * desconocidas se eliminan en silencio y `v` sigue validándose contra el enum
 * nfc|qr|direct. El payload de alerta (EmergencyAlertSchema) SÍ conserva
 * `.strict()` porque es JSON controlado exclusivamente por nuestro cliente.
 *
 * Consumido por: `src/app/r/[code]/route.ts` (o page.tsx) mediante
 * `parseQuery(url, EmergencyScanQuerySchema)` de `api-response.ts`.
 */
export const EmergencyScanQuerySchema = z.object({
  /** Fuente de escaneo reportada por el cliente en la URL del gateway. */
  v: z
    .enum(SCAN_SOURCES, {
      errorMap: () => ({
        message: "El parámetro de escaneo debe ser nfc, qr o direct.",
      }),
    })
    .optional(),
});

/**
 * Tipo TypeScript inferido del querystring del gateway.
 */
export type EmergencyScanQueryInput = z.infer<typeof EmergencyScanQuerySchema>;
