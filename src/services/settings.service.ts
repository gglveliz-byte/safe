/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Configuración del Sistema — Persistencia Dinámica de Parámetros Globales
 * ARCHIVO: src/services/settings.service.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Servicio de acceso y persistencia para la configuración global de la plataforma
 * almacenada en la tabla `SystemSetting` de Neon PostgreSQL.
 *
 * Administra el estado del "Modo Entrega Asistida de PIN por Administrador"
 * y el correo de notificación administrativo al que se despachan las credenciales
 * cuando un motociclista registra un nuevo kit.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (este archivo < 100 líneas).
 * - Cero valores en duro: el correo y estado se leen de la base de datos.
 * - Cabecera y comentarios canónicos en Español.
 * ==============================================================================
 */

import { db } from "@/lib/db";

export const SETTING_KEYS = {
  ADMIN_PIN_DISPATCH_MODE: "admin_pin_dispatch_mode",
  ADMIN_PIN_NOTIFICATION_EMAIL: "admin_pin_notification_email",
} as const;

export interface AdminPinDispatchConfig {
  enabled: boolean;
  notificationEmail: string;
}

/**
 * Obtiene el valor de una clave de configuración desde la base de datos.
 */
export async function getSystemSetting(key: string, defaultValue = ""): Promise<string> {
  try {
    const setting = await db.systemSetting.findUnique({
      where: { key },
      select: { value: true },
    });
    return setting?.value ?? defaultValue;
  } catch (error) {
    console.error(`[SettingsService] Error al leer configuración '${key}':`, error);
    return defaultValue;
  }
}

/**
 * Guarda o actualiza el valor de una clave de configuración.
 */
export async function setSystemSetting(key: string, value: string): Promise<void> {
  await db.systemSetting.upsert({
    where: { key },
    update: { value, updatedAt: new Date() },
    create: { key, value },
  });
}

/**
 * Obtiene la configuración consolidada del modo de despacho de PIN por administrador.
 */
export async function getAdminPinDispatchConfig(): Promise<AdminPinDispatchConfig> {
  const [modeVal, emailVal] = await Promise.all([
    getSystemSetting(SETTING_KEYS.ADMIN_PIN_DISPATCH_MODE, "false"),
    getSystemSetting(SETTING_KEYS.ADMIN_PIN_NOTIFICATION_EMAIL, ""),
  ]);

  return {
    enabled: modeVal === "true",
    notificationEmail: emailVal.trim(),
  };
}

/**
 * Actualiza la configuración del modo de despacho de PIN por administrador.
 */
export async function setAdminPinDispatchConfig(
  enabled: boolean,
  notificationEmail: string,
): Promise<void> {
  await Promise.all([
    setSystemSetting(SETTING_KEYS.ADMIN_PIN_DISPATCH_MODE, enabled ? "true" : "false"),
    setSystemSetting(SETTING_KEYS.ADMIN_PIN_NOTIFICATION_EMAIL, notificationEmail.trim()),
  ]);
}
