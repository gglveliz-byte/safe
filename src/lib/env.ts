/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Configuración de Entorno del Servidor
 * ARCHIVO: src/lib/env.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Define, valida y cachea las variables de entorno que consume el backend de
 * SAFE (base de datos, firma de sesiones, panel administrativo, Cloudinary,
 * Gmail SMTP y límites operativos de seguridad). Toda la configuración pasa por
 * un esquema Zod estricto antes de ser expuesta al resto del sistema, de modo
 * que una instalación incompleta falle con un diagnóstico legible y sin
 * imprimir jamás valores secretos.
 *
 * ENTRADAS: process.env (cadenas del sistema operativo o del archivo .env).
 * SALIDAS: ServerEnv validado y con tipos nativos (números coercidos).
 * DEPENDENCIAS: zod (v3).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas (techo interno de este archivo: 450).
 * - Cero datos hardcodeados de negocio: solo valores por defecto operativos.
 * - Cero secretos impresos en mensajes de error, trazas o registros.
 * - getEnv() se invoca únicamente dentro de funciones, nunca en el nivel
 *   superior de un módulo, para no romper `next build` sin secretos.
 * ==============================================================================
 */

import { z } from "zod";

/**
 * Configuración validada del servidor SAFE.
 * Es el contrato congelado del §3 de docs/BACKEND_CONTRACTS.md.
 */
export interface ServerEnv {
  /** Entorno de ejecución de Next.js. */
  NODE_ENV: "development" | "test" | "production";
  /** Cadena de conexión PostgreSQL/Postgres con la que Prisma abre el pool. */
  DATABASE_URL: string;
  /** Secreto HS256 para firmar sesiones JWT (mínimo 32 caracteres). */
  JWT_SECRET: string;
  /** Clave maestra del panel administrativo (mínimo 24 caracteres). */
  ADMIN_MASTER_KEY: string;
  /** Correo del administrador; opcional, pero validado si se declara. */
  ADMIN_EMAIL?: string;
  /** Contraseña del administrador; opcional, pero validada si se declara. */
  ADMIN_PASSWORD?: string;
  /** URL pública canónica de la plataforma, http/https y sin barra final. */
  NEXT_PUBLIC_APP_URL: string;
  /** Nombre de la cuenta de Cloudinary. */
  CLOUDINARY_CLOUD_NAME: string;
  /** Clave de API de Cloudinary. */
  CLOUDINARY_API_KEY: string;
  /** Secreto de API de Cloudinary. */
  CLOUDINARY_API_SECRET: string;
  /** Carpeta remota donde se almacenan las fotografías de los motociclistas. */
  CLOUDINARY_UPLOAD_FOLDER: string;
  /** Cuenta de Gmail que despacha las alertas de emergencia. */
  GMAIL_USER: string;
  /** Contraseña de aplicación de Gmail (nunca la contraseña principal). */
  GMAIL_APP_PASSWORD: string;
  /** Nombre visible del remitente en los correos de emergencia. */
  GMAIL_FROM_NAME: string;
  /** Ventana de cooldown anti-spam por dispositivo, en segundos. */
  EMERGENCY_COOLDOWN_SECONDS: number;
  /** Distancia mínima de excepción al cooldown, en metros. */
  EMERGENCY_DISTANCE_THRESHOLD_METERS: number;
  /** Intentos fallidos de PIN permitidos antes del bloqueo. */
  PIN_MAX_ATTEMPTS: number;
  /** Duración del bloqueo por PIN, en minutos. */
  PIN_BLOCK_MINUTES: number;
  /** Vida útil de la cookie de sesión, en segundos. */
  SESSION_TTL_SECONDS: number;
  /** Versión vigente de Términos y Privacidad aceptada por el motociclista. */
  TERMS_VERSION: string;
  /** Clave de autenticación para WhatsApp Cloud API oficial vía NeuroAPI. */
  NEUROAPI_KEY?: string;
  /** ID del número remitente en Meta si se manejan múltiples líneas. */
  NEUROAPI_PHONE_NUMBER_ID?: string;
}

/** Longitud mínima exigida al secreto de firma de sesiones. */
const MIN_JWT_SECRET_LENGTH = 32;

/** Longitud mínima exigida a la clave maestra administrativa. */
const MIN_ADMIN_MASTER_KEY_LENGTH = 24;

/** Longitud mínima exigida a la contraseña administrativa opcional. */
const MIN_ADMIN_PASSWORD_LENGTH = 12;

/** Longitud máxima genérica para cadenas de configuración extensas (URLs). */
const MAX_URL_LENGTH = 2048;

/** Ventana de cooldown por defecto: 3 minutos, según la regla de seguridad. */
const DEFAULT_EMERGENCY_COOLDOWN_SECONDS = 180;

/** Excepción geográfica por defecto: 150 metros de desplazamiento. */
const DEFAULT_EMERGENCY_DISTANCE_THRESHOLD_METERS = 150;

/** Intentos de PIN por defecto antes de bloquear el dispositivo. */
const DEFAULT_PIN_MAX_ATTEMPTS = 5;

/** Minutos de bloqueo por defecto tras agotar los intentos de PIN. */
const DEFAULT_PIN_BLOCK_MINUTES = 15;

/** Vida útil por defecto de la sesión: 30 días en segundos. */
const DEFAULT_SESSION_TTL_SECONDS = 2_592_000;

/** Versión legal por defecto cuando no se declara TERMS_VERSION. */
const DEFAULT_TERMS_VERSION = "2026-01";

/**
 * Convierte una variable de entorno vacía o compuesta solo por espacios en
 * `undefined`, permitiendo que los valores por defecto seguros se apliquen.
 */
function emptyToUndefined(value: unknown): unknown {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

/**
 * Crea un esquema para una cadena obligatoria, recortada y acotada.
 * `label` es el nombre legible usado en los diagnósticos, nunca el valor.
 */
function requiredText(label: string, maxLength: number): z.ZodString {
  return z
    .string({ required_error: `${label} es obligatoria.` })
    .trim()
    .min(1, `${label} no puede estar vacía.`)
    .max(maxLength, `${label} supera el máximo de ${maxLength} caracteres.`);
}

/**
 * Crea un esquema para un secreto obligatorio. No recorta el valor para no
 * alterar la entropía original, pero exige una longitud mínima verificable.
 */
function requiredSecret(label: string, minLength: number): z.ZodType<string, z.ZodTypeDef, unknown> {
  return z
    .string({ required_error: `${label} es obligatoria.` })
    .min(minLength, `${label} debe tener al menos ${minLength} caracteres.`)
    .refine(
      (value) => value.trim().length >= minLength,
      `${label} no puede estar compuesta solo por espacios.`,
    );
}

/**
 * Crea un esquema para un correo opcional. Un valor vacío se interpreta como
 * ausente; si existe, se valida su formato y longitud.
 */
function optionalEmail(label: string): z.ZodType<string | undefined, z.ZodTypeDef, unknown> {
  return z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .email(`${label} debe ser un correo electrónico válido.`)
      .max(254, `${label} supera el máximo de 254 caracteres.`)
      .optional(),
  );
}

/**
 * Crea un esquema para una contraseña opcional con longitud mínima de
 * seguridad. Un valor vacío se interpreta como ausente.
 */
function optionalPassword(label: string, minLength: number): z.ZodType<string | undefined, z.ZodTypeDef, unknown> {
  return z.preprocess(
    emptyToUndefined,
    z
      .string()
      .min(minLength, `${label} debe tener al menos ${minLength} caracteres.`)
      .max(128, `${label} supera el máximo de 128 caracteres.`)
      .optional(),
  );
}

/**
 * Crea un esquema numérico entero positivo coercido desde texto, con un valor
 * por defecto seguro y un techo configurable. Los vacíos usan el default.
 */
function positiveIntegerWithDefault(
  label: string,
  defaultValue: number,
  maxValue: number,
): z.ZodType<number, z.ZodTypeDef, unknown> {
  return z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ invalid_type_error: `${label} debe ser un número entero.` })
      .int(`${label} debe ser un número entero.`)
      .min(1, `${label} debe ser mayor o igual a 1.`)
      .max(maxValue, `${label} no puede superar ${maxValue}.`)
      .default(defaultValue),
  );
}

/**
 * Valida la cadena de conexión de PostgreSQL: prefijo `postgres://` o
 * `postgresql://` y estructura de URL con host resoluble.
 */
function databaseUrlSchema(): z.ZodType<string> {
  return requiredText("DATABASE_URL", MAX_URL_LENGTH).superRefine((value, ctx) => {
    if (!/^postgres(ql)?:\/\//i.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "DATABASE_URL debe comenzar con postgres:// o postgresql://.",
      });
      return;
    }

    try {
      const parsed = new URL(value);
      if (!parsed.hostname) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "DATABASE_URL debe incluir un host de base de datos.",
        });
      }
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "DATABASE_URL no es una URL de conexión válida.",
      });
    }
  });
}

/**
 * Valida la URL pública de la aplicación con `z.string().url()` (protocolo
 * http/https y host) y aplica un `transform` que elimina las barras finales
 * sobrantes, porque este valor se usa como base para construir enlaces
 * internos (activación, gateway `/r/[code]`, correos de emergencia).
 */
function appUrlSchema(): z.ZodType<string, z.ZodTypeDef, unknown> {
  return z
    .string({ required_error: "NEXT_PUBLIC_APP_URL es obligatoria." })
    .trim()
    .max(MAX_URL_LENGTH, "NEXT_PUBLIC_APP_URL supera el máximo de caracteres permitido.")
    .url("NEXT_PUBLIC_APP_URL debe ser una URL válida con protocolo http o https.")
    .transform((value) => value.replace(/\/+$/, ""));
}

/**
 * Esquema maestro de validación del entorno. Se construye al importar el módulo
 * pero no lee `process.env` hasta que se invoca validateEnv()/getEnv().
 */
const serverEnvSchema = z.object({
  NODE_ENV: z.preprocess(
    emptyToUndefined,
    z
      .enum(["development", "test", "production"], {
        errorMap: () => ({
          message: "NODE_ENV debe ser development, test o production.",
        }),
      })
      .default("development"),
  ),
  DATABASE_URL: databaseUrlSchema(),
  JWT_SECRET: requiredSecret("JWT_SECRET", MIN_JWT_SECRET_LENGTH),
  ADMIN_MASTER_KEY: requiredSecret("ADMIN_MASTER_KEY", MIN_ADMIN_MASTER_KEY_LENGTH),
  ADMIN_EMAIL: optionalEmail("ADMIN_EMAIL"),
  ADMIN_PASSWORD: optionalPassword("ADMIN_PASSWORD", MIN_ADMIN_PASSWORD_LENGTH),
  NEXT_PUBLIC_APP_URL: appUrlSchema(),
  CLOUDINARY_CLOUD_NAME: requiredText("CLOUDINARY_CLOUD_NAME", 120).regex(
    /^[a-z0-9_-]+$/i,
    "CLOUDINARY_CLOUD_NAME solo admite letras, números, guiones y guiones bajos.",
  ),
  CLOUDINARY_API_KEY: requiredText("CLOUDINARY_API_KEY", 200),
  CLOUDINARY_API_SECRET: requiredText("CLOUDINARY_API_SECRET", 200),
  CLOUDINARY_UPLOAD_FOLDER: requiredText("CLOUDINARY_UPLOAD_FOLDER", 200),
  GMAIL_USER: requiredText("GMAIL_USER", 254).email(
    "GMAIL_USER debe ser un correo electrónico válido.",
  ),
  GMAIL_APP_PASSWORD: requiredSecret("GMAIL_APP_PASSWORD", 8),
  GMAIL_FROM_NAME: requiredText("GMAIL_FROM_NAME", 120),
  EMERGENCY_COOLDOWN_SECONDS: positiveIntegerWithDefault(
    "EMERGENCY_COOLDOWN_SECONDS",
    DEFAULT_EMERGENCY_COOLDOWN_SECONDS,
    86_400,
  ),
  EMERGENCY_DISTANCE_THRESHOLD_METERS: positiveIntegerWithDefault(
    "EMERGENCY_DISTANCE_THRESHOLD_METERS",
    DEFAULT_EMERGENCY_DISTANCE_THRESHOLD_METERS,
    100_000,
  ),
  PIN_MAX_ATTEMPTS: positiveIntegerWithDefault(
    "PIN_MAX_ATTEMPTS",
    DEFAULT_PIN_MAX_ATTEMPTS,
    20,
  ),
  PIN_BLOCK_MINUTES: positiveIntegerWithDefault(
    "PIN_BLOCK_MINUTES",
    DEFAULT_PIN_BLOCK_MINUTES,
    1_440,
  ),
  SESSION_TTL_SECONDS: positiveIntegerWithDefault(
    "SESSION_TTL_SECONDS",
    DEFAULT_SESSION_TTL_SECONDS,
    31_536_000,
  ),
  TERMS_VERSION: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .min(1, "TERMS_VERSION no puede estar vacía.")
      .max(40, "TERMS_VERSION supera el máximo de 40 caracteres.")
      .default(DEFAULT_TERMS_VERSION),
  ),
  NEUROAPI_KEY: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  NEUROAPI_PHONE_NUMBER_ID: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
});

/**
 * Transforma los problemas de Zod en líneas legibles por operador.
 * Solo expone el nombre de la variable y la expectativa incumplida, nunca el
 * valor recibido, para no filtrar secretos en consolas o registros.
 */
function formatEnvIssues(issues: readonly z.ZodIssue[]): string {
  return issues
    .map((issue) => {
      const field = issue.path.length > 0 ? issue.path.join(".") : "entorno";
      return `  - ${field}: ${issue.message}`;
    })
    .join("\n");
}

/**
 * Valida `process.env` contra el esquema maestro y devuelve la configuración
 * tipada. Si algo falta o es inválido, lanza un Error de diagnóstico claro sin
 * incluir valores sensibles. No cachea el resultado: para eso existe getEnv().
 */
export function validateEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const details = formatEnvIssues(parsed.error.issues);
    const error = new Error(
      [
        "[SAFE] La configuración del entorno no es válida.",
        details,
        "Revise sus variables de entorno (archivo .env local o panel de despliegue).",
      ].join("\n"),
    );
    error.name = "EnvValidationError";
    throw error;
  }

  return parsed.data as ServerEnv;
}

/** Configuración validada y compartida durante la vida del proceso. */
let cachedEnv: ServerEnv | null = null;

/**
 * Devuelve la configuración validada, validando y cacheando en la primera
 * invocación. Debe llamarse dentro de funciones (handlers, servicios), nunca
 * en el nivel superior de un módulo, para no romper `next build` sin secretos.
 */
export function getEnv(): ServerEnv {
  if (cachedEnv === null) {
    cachedEnv = validateEnv();
  }

  return cachedEnv;
}
