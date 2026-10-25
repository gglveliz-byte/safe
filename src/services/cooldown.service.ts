/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Servicios de Emergencia — Escudo Anti-Spam de Alertas (Cooldown)
 * ARCHIVO: src/services/cooldown.service.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Implementa la "ventana de protección de avisos" por dispositivo según el
 * contrato CONGELADO de docs/BACKEND_CONTRACTS.md §8 y la skill
 * safe-security-and-compliance §1. Cada vez que un casco NFC o un QR de
 * rescate se escanea, este servicio decide si se DESPACHAN correos de
 * emergencia a los familiares o si la petición se estrangula (THROTTLED).
 *
 * PROPÓSITO VITAL (por qué existe):
 * 1. Proteger la cuota de Gmail SMTP: un transeúnte curioso o un script
 *    malicioso que escanee el casco decenas de veces por minuto agotaría el
 *    cupo diario de envíos y dejaría a SAFE sin capacidad de avisar de verdad.
 * 2. NO aterrorizar a los familiares: una cascada de correos idénticos por
 *    un mismo evento genera pánico y fatiga de alerta ("¿cuántos accidentes
 *    tuvo ya?"). La ventana de 180 segundos unifica el evento en un solo aviso.
 * 3. Respetar el traslado real: si en menos de 3 minutos la víctima se
 *    desplaza 150 metros o más (distancia ortodrómica de Haversine), el
 *    escenario cambió de verdad — típicamente un traslado en ambulancia hacia
 *    un hospital — y la nueva ubicación DEBE avisarse de inmediato.
 *
 * ENTRADAS / SALIDAS:
 * - Entrada: última alerta persistida del Device (lastAlertAt/lastAlertLat/
 *   lastAlertLng) + coordenadas GPS del nuevo escaneo.
 * - Salida: CooldownDecision (despacha o no, motivo, segundos restantes).
 *
 * DEPENDENCIAS:
 * - @/lib/db  → singleton PrismaClient (modelo Device tipado por prisma).
 * - @/lib/env → getEnv() con EMERGENCY_COOLDOWN_SECONDS (def. 180) y
 *   EMERGENCY_DISTANCE_THRESHOLD_METERS (def. 150); se invoca SOLO dentro de
 *   las funciones y solo cuando el llamador omita el parámetro explícito.
 *
 * LEYES DE INGENIERÍA:
 * - Límite < 500 líneas físicas, cero datos de demo, umbrales dinámicos
 *   desde el entorno validado, comentarios canónicos en Español y cero TODO.
 * ==============================================================================
 */

import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";

/**
 * Radio medio de la Tierra en metros, fijado por el contrato §8 y por el
 * plano de arquitectura (fórmula §5.2). Es una constante física de la
 * ortodrómica, no un dato de negocio configurable.
 */
const EARTH_RADIUS_METERS = 6371000;

/**
 * Resultado puro de la evaluación anti-spam de alertas de emergencia.
 * `shouldDispatch` es la única señal de despacho; `reason` alimenta la
 * auditoría (`wasThrottled`) y los logs sin exponer jerga al usuario.
 */
export interface CooldownDecision {
  /** true → despachar correos Gmail; false → throttling silencioso. */
  shouldDispatch: boolean;
  /** Motivo técnico de la decisión (auditoría y telemetría). */
  reason: "NO_PREVIOUS_ALERT" | "COOLDOWN_EXPIRED" | "LOCATION_CHANGED" | "THROTTLED";
  /** Segundos desde la última alerta despachada; null si nunca hubo alerta. */
  elapsedSeconds: number | null;
  /** Distancia Haversine en metros a la última alerta; null si no calculable. */
  distanceMeters: number | null;
  /** Segundos que faltan para cerrar la ventana (0 si la ventana expiró). */
  cooldownRemainingSeconds: number;
  /** Ventana de cooldown aplicada en segundos (eco del umbral usado). */
  cooldownSeconds: number;
  /** Umbral de desplazamiento crítico en metros (eco del umbral usado). */
  distanceThresholdMeters: number;
}

/**
 * Convierte grados a radianes (unidades naturales de las funciones trigonométricas de JS).
 * @param degrees Ángulo en grados decimales.
 * @returns El mismo ángulo en radianes.
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Valida que un valor sea un número finito dentro del rango geográfico exigido.
 * Rechaza NaN, Infinity, cadenas y extrapola-ciones polares/antimeridianas.
 * @param value Valor a validar (latitud o longitud en grados decimales).
 * @param limit Límite absoluto del rango (90 para latitud, 180 para longitud).
 * @throws Error("Coordenada geográfica fuera de rango.") si el valor es inválido.
 */
function assertCoordinateInRange(value: number, limit: number): void {
  if (typeof value !== "number" || !Number.isFinite(value) || Math.abs(value) > limit) {
    throw new Error("Coordenada geográfica fuera de rango.");
  }
}

/**
 * Distancia ortodrómica (gran círculo) en metros entre dos coordenadas
 * geográficas WGS84, usando la forma de Haversine con arcsin del plano de
 * arquitectura §5.2: Δσ = 2·arcsin(√(sin²(Δφ/2) + cosφ1·cosφ2·sin²(Δλ/2))),
 * distancia = R·Δσ con R = 6.371.000 m. Precisión sobradísima para la resolución
 * del GPS de un teléfono (±3-10 m) frente al umbral de 150 m.
 * @param lat1 Latitud del punto de origen (grados decimales, -90..90).
 * @param lng1 Longitud del punto de origen (grados decimales, -180..180).
 * @param lat2 Latitud del punto de destino (grados decimales, -90..90).
 * @param lng2 Longitud del punto de destino (grados decimales, -180..180).
 * @returns Distancia en metros (float, siempre >= 0).
 * @throws Error("Coordenada geográfica fuera de rango.") si alguna coordenada es inválida.
 */
export function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  assertCoordinateInRange(lat1, 90);
  assertCoordinateInRange(lng1, 180);
  assertCoordinateInRange(lat2, 90);
  assertCoordinateInRange(lng2, 180);

  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lng2 - lng1);

  // a = sin²(Δφ/2) + cosφ1·cosφ2·sin²(Δλ/2). En polos opuestos el redondeo
  // de coma flotante puede empujar a por encima de 1; se satura a 1 para que
  // arcsin no devuelva NaN (distancia media circunferencia, caso máximo).
  const a =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  const centralAngle = 2 * Math.asin(Math.min(1, Math.sqrt(a)));

  return EARTH_RADIUS_METERS * centralAngle;
}

/**
 * Parámetros puros de la evaluación de cooldown. El llamador (endpoint
 * /api/emergency/alert) extrae `lastAlert*` de la base de datos y pasa las
 * coordenadas nuevas ya validadas por Zod; `now` permite inyectar tiempo en
 * pruebas deterministas sin depender del reloj del servidor.
 */
export interface EvaluateCooldownInput {
  /** Timestamp de la última alerta DESPACHADA del dispositivo (no de un escaneo throttled). */
  lastAlertAt: Date | null;
  /** Latitud asociada a la última alerta despachada; null si no se registró. */
  lastLatitude: number | null;
  /** Longitud asociada a la última alerta despachada; null si no se registró. */
  lastLongitude: number | null;
  /** Latitud del nuevo escaneo de emergencia (obligatoria). */
  nextLatitude: number;
  /** Longitud del nuevo escaneo de emergencia (obligatoria). */
  nextLongitude: number;
  /** Momento de la decisión; por defecto new Date(). */
  now?: Date;
  /** Sobrescribe EMERGENCY_COOLDOWN_SECONDS (uso en pruebas o política especial). */
  cooldownSeconds?: number;
  /** Sobrescribe EMERGENCY_DISTANCE_THRESHOLD_METERS (uso en pruebas). */
  distanceThresholdMeters?: number;
}

/**
 * Núcleo determinista y aislado de la base de datos: aplica literalmente
 * las reglas del contrato §8 sobre datos ya leídos.
 * Reglas: sin alerta previa → despacha (NO_PREVIOUS_ALERT); ventana expirada
 * (elapsed >= cooldown) → despacha (COOLDOWN_EXPIRED); dentro de la ventana
 * con coordenadas previas y distancia >= umbral → despacha (LOCATION_CHANGED,
 * traslado real tipo ambulancia); dentro de la ventana sin coordenadas
 * previas o con distancia < umbral → THROTTLED (no se aterroriza a la familia).
 * cooldownRemainingSeconds = max(0, cooldown − elapsed) y es 0 cuando la
 * decisión se toma por ventana expirada; sin alerta previa vale la ventana completa.
 * @param input Datos de la última alerta y de la nueva posición.
 * @returns Decisión pura lista para el auditor (EmergencyAlert.wasThrottled).
 */
export function evaluateCooldown(input: EvaluateCooldownInput): CooldownDecision {
  // Los umbrales provienen de parámetros explícitos o, si se omiten, del
  // entorno validado (getEnv() solo dentro de funciones, nunca en top-level).
  const cooldownSeconds = input.cooldownSeconds ?? getEnv().EMERGENCY_COOLDOWN_SECONDS;
  const thresholdMeters =
    input.distanceThresholdMeters ?? getEnv().EMERGENCY_DISTANCE_THRESHOLD_METERS;
  const now = input.now ?? new Date();

  // La coordenada nueva SIEMPRE debe ser geográficamente válida: un NaN aquí
  // provendría de un sensor GPS sucio y debe abortar el despacho con error claro.
  assertCoordinateInRange(input.nextLatitude, 90);
  assertCoordinateInRange(input.nextLongitude, 180);

  // Regla 1 — Primer escaneo registrado: no hay nada que proteger aún.
  if (input.lastAlertAt === null) {
    return {
      shouldDispatch: true,
      reason: "NO_PREVIOUS_ALERT",
      elapsedSeconds: null,
      distanceMeters: null,
      cooldownRemainingSeconds: cooldownSeconds,
      cooldownSeconds,
      distanceThresholdMeters: thresholdMeters,
    };
  }

  // Segundos transcurridos desde el último aviso real. Se trunca a entero y
  // se protege contra relojes desincronizados (diferencias negativas).
  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - input.lastAlertAt.getTime()) / 1000));

  // Distancia a la última alerta: solo medible si el despacho previo dejó
  // coordenadas guardadas (última coordenada conocida del rider).
  const hasPreviousCoordinates = input.lastLatitude !== null && input.lastLongitude !== null;
  const distanceMeters = hasPreviousCoordinates
    ? haversineDistanceMeters(
        input.lastLatitude as number,
        input.lastLongitude as number,
        input.nextLatitude,
        input.nextLongitude,
      )
    : null;

  // Regla 2 — Ventana expirada: la alerta anterior ya es historia clínica;
  // este escaneo es un evento nuevo legítimo y la ventana restante es 0.
  if (elapsedSeconds >= cooldownSeconds) {
    return {
      shouldDispatch: true,
      reason: "COOLDOWN_EXPIRED",
      elapsedSeconds,
      distanceMeters,
      cooldownRemainingSeconds: 0,
      cooldownSeconds,
      distanceThresholdMeters: thresholdMeters,
    };
  }

  // Dentro de la ventana: resta tiempo de protección según la fórmula del contrato.
  const cooldownRemainingSeconds = Math.max(0, cooldownSeconds - elapsedSeconds);

  // Regla 3 — Traslado real: >= umbral de metros con coordenadas previas
  // conocidas (víctima en ambulancia, cambio crítico de escenario de rescate).
  if (hasPreviousCoordinates && distanceMeters !== null && distanceMeters >= thresholdMeters) {
    return {
      shouldDispatch: true,
      reason: "LOCATION_CHANGED",
      elapsedSeconds,
      distanceMeters,
      cooldownRemainingSeconds,
      cooldownSeconds,
      distanceThresholdMeters: thresholdMeters,
    };
  }

  // Reglas 4 y 5 — Sin coordenadas previas medibles, o mismo lugar: se
  // estrangula. El endpoint registrará la petición con wasThrottled=true y
  // emailsSentCount=0, y NO actualizará lastAlertAt (la ventana del aviso
  // real sigue corriendo desde el despacho original).
  return {
    shouldDispatch: false,
    reason: "THROTTLED",
    elapsedSeconds,
    distanceMeters,
    cooldownRemainingSeconds,
    cooldownSeconds,
    distanceThresholdMeters: thresholdMeters,
  };
}

/**
 * Puerta de servicio para el endpoint `/api/emergency/alert`: lee la última
 * alerta despachada del Device en PostgreSQL y delega la regla pura en
 * evaluateCooldown. El endpoint YA validó que el dispositivo existe (código
 * de casco vía Zod); este guardián defensivo cubre la carrera entre la
 * validación y esta lectura (dispositivo eliminado o desactivado entre medias).
 * @param deviceId Identificador Prisma (UUID) del casco/kit escaneado.
 * @param newLat Latitud GPS del escaneo actual (grados decimales).
 * @param newLng Longitud GPS del escaneo actual (grados decimales).
 * @param now Momento de la evaluación; por defecto new Date().
 * @returns La CooldownDecision que gobierna el despacho de correos.
 * @throws Error("Dispositivo no encontrado.") si el deviceId no existe en la BD.
 */
export async function checkEmergencyAlertCooldown(
  deviceId: string,
  newLat: number,
  newLng: number,
  now?: Date,
): Promise<CooldownDecision> {
  const device = await db.device.findUnique({
    where: { id: deviceId },
    select: { lastAlertAt: true, lastAlertLat: true, lastAlertLng: true },
  });

  if (!device) {
    throw new Error("Dispositivo no encontrado.");
  }

  return evaluateCooldown({
    lastAlertAt: device.lastAlertAt,
    lastLatitude: device.lastAlertLat,
    lastLongitude: device.lastAlertLng,
    nextLatitude: newLat,
    nextLongitude: newLng,
    now,
  });
}
