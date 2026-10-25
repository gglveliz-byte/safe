/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Infraestructura compartida — Criptografía de servicio (solo Node.js)
 * ARCHIVO: src/lib/crypto.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Utilidades criptográficas nucleares del backend SAFE, congeladas en el §6 de
 * `docs/BACKEND_CONTRACTS.md`. Cifra en reposo los secretos sensibles de un kit
 * (el PIN de activación impreso en la tarjeta, `Device.activationPinEncrypted`)
 * con AES-256-GCM autenticado, anonimiza direcciones IP de escáneres y registros
 * de consentimiento mediante HMAC-SHA256 (jamás se guarda la IP cruda en base de
 * datos), genera tokens de alta entropía para folios/códigos y compara credenciales
 * en tiempo constante para cerrar la puerta a ataques de temporización.
 *
 * Este módulo usa `node:crypto`, por lo que SOLO puede importarse desde rutas y
 * servicios con `runtime = "nodejs"`. Desde `src/middleware.ts` (Edge) está
 * terminantemente prohibido: las sesiones se firman en `@/lib/auth-token`.
 *
 * ENTRADAS: textos planos procedentes de servicios/BD y el secreto `JWT_SECRET`
 * que expone `getEnv()` (`@/lib/env`). SALIDAS: cadenas de sobre cifrado
 * `v1:iv:cipher:tag` en base64, dig hexadecimal (HMAC/SHA-256) y tokens base64url.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas (techo interno del archivo: 450).
 * - Cero datos hardcodeados: toda clave raíz sale de `getEnv()`, nunca de un literal.
 * - `getEnv()` se invoca dentro de las funciones, jamás en el nivel del módulo.
 * - Cero secretos, trazas ni textos cifrados volcados en los mensajes de error.
 * ==============================================================================
 */

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

import { getEnv } from "@/lib/env";

/** Cifrado autenticado de bloque simétrico: confidencialidad + integridad. */
const CIPHER_ALGORITHM = "aes-256-gcm";

/** Tamaño de la clave AES-256 derivada (32 bytes = 256 bits). */
const KEY_LENGTH_BYTES = 32;

/** Vector de inicialización recomendado por NIST para GCM (96 bits). */
const IV_LENGTH_BYTES = 12;

/** Etiqueta de autenticación GCM estándar (128 bits). */
const AUTH_TAG_LENGTH_BYTES = 16;

/**
 * Saludo fijo y público de derivación (no es un secreto). Se congela a propósito:
 * cambian `JWT_SECRET`, no esta sal, para poder descifrar datos ya almacenados.
 */
const ENVELOPE_SALT = "safe.secret.v1";

/** Versión del formato de sobre de cifrado; permite migraciones futuras. */
const ENVELOPE_VERSION = "v1";

/** Separador de las cuatro partes del sobre (los bytes van en base64, sin `:`). */
const ENVELOPE_SEPARATOR = ":";

/** Número exacto de partes del sobre: versión, IV, etiqueta y cifrado. */
const ENVELOPE_PARTS = 4;

/** Digest de SHA-256: longitud fija, base de la comparación en tiempo constante. */
const DIGEST_LENGTH_BYTES = 32;

/** Longitudes admisibles para `randomToken`, para no pedir bytes absurdos. */
const MIN_RANDOM_TOKEN_BYTES = 8;
const MAX_RANDOM_TOKEN_BYTES = 128;

/**
 * Mensaje único y humano de fallo criptográfico. Deliberadamente no distingue
 * entre «formato inválido» y «etiqueta alterada» para no revelar a un atacante
 * qué parte del sobre pudo haber adivinado, y no imprime material sensible.
 */
const DECRYPT_ERROR_MESSAGE = "El dato cifrado no es válido o fue alterado.";

/** Acepta únicamente base64 canónico con relleno (salida de `Buffer#base64`). */
const BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/;

/** Estructura interna ya validada de un sobre de cifrado listo para descifrar. */
interface SecretEnvelope {
  /** Vector de inicialización de 12 bytes usado al cifrar. */
  iv: Buffer;
  /** Etiqueta de autenticación GCM de 16 bytes. */
  authTag: Buffer;
  /** Texto cifrado (puede ser vacío si el plano era vacío). */
  ciphertext: Buffer;
}

/**
 * Deriva la clave AES-256 a partir del secreto de servidor con scrypt.
 * `scryptSync(JWT_SECRET, "safe.secret.v1", 32)` es determinista: mientras el
 * `JWT_SECRET` y la sal no cambien, el mismo sobre se puede descifrar siempre.
 * `getEnv()` se lee aquí dentro (nunca en el nivel del módulo) para que
 * `next build` no exija secretos en el momento de importar el archivo.
 */
function deriveSecretKey(): Buffer {
  return scryptSync(getEnv().JWT_SECRET, ENVELOPE_SALT, KEY_LENGTH_BYTES);
}

/**
 * Comprueba que una cadena es base64 canónico decodificable sin sorpresas.
 * `Buffer.from(..., "base64")` es indulgente y descarta caracteres inválidos,
 * así que la validación previa es obligatoria para rechazar datos manipulados.
 */
function isBase64Candidate(value: string): boolean {
  return value.length % 4 === 0 && BASE64_PATTERN.test(value);
}

/**
 * Divide el sobre `v1:iv:authTag:ciphertext` y valida cada pieza.
 * Lanza el mensaje estándar de descifrado ante cualquier anomalía de formato.
 */
function parseEnvelope(payload: string): SecretEnvelope {
  if (typeof payload !== "string" || payload.length === 0) {
    throw new Error(DECRYPT_ERROR_MESSAGE);
  }

  const parts = payload.split(ENVELOPE_SEPARATOR);
  if (parts.length !== ENVELOPE_PARTS || parts[0] !== ENVELOPE_VERSION) {
    throw new Error(DECRYPT_ERROR_MESSAGE);
  }

  const rawIv = parts[1];
  const rawAuthTag = parts[2];
  const rawCiphertext = parts[3];

  if (
    !isBase64Candidate(rawIv) ||
    !isBase64Candidate(rawAuthTag) ||
    !isBase64Candidate(rawCiphertext)
  ) {
    throw new Error(DECRYPT_ERROR_MESSAGE);
  }

  const iv = Buffer.from(rawIv, "base64");
  const authTag = Buffer.from(rawAuthTag, "base64");
  const ciphertext = Buffer.from(rawCiphertext, "base64");

  if (
    iv.length !== IV_LENGTH_BYTES ||
    authTag.length !== AUTH_TAG_LENGTH_BYTES
  ) {
    throw new Error(DECRYPT_ERROR_MESSAGE);
  }

  return { iv, authTag, ciphertext };
}

/**
 * Cifra un texto plano con AES-256-GCM usando una clave derivada del `JWT_SECRET`.
 * Cada llamada emplea un IV aleatorio nuevo, por lo que cifrar dos veces el mismo
 * PIN produce dos sobres distintos (no se filtran equality patterns en la BD).
 * @param plaintext Secreto en claro (PIN de activación, token, etc.).
 * @returns Sobre `v1:iv_b64:authTag_b64:cipher_b64`.
 */
export function encryptSecret(plaintext: string): string {
  if (typeof plaintext !== "string") {
    throw new Error("El dato a cifrar debe ser un texto.");
  }

  const key = deriveSecretKey();
  const iv = randomBytes(IV_LENGTH_BYTES);

  const cipher = createCipheriv(CIPHER_ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH_BYTES,
  });

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Higiene de memoria: la clave derivada no debe sobrevivir a la operación.
  key.fill(0);

  return [
    ENVELOPE_VERSION,
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(ENVELOPE_SEPARATOR);
}

/**
 * Descifra un sobre generado por `encryptSecret`.
 * La etiqueta GCM es la que garantiza la integridad: si alguien alteró un byte,
 * cambió la versión o el dato proviene de otra clave, `decipher.final()` falla.
 * @param payload Sobre cifrado almacenado en base de datos.
 * @returns El texto plano original.
 * @throws Error con mensaje humano en español, sin volcar material sensible.
 */
export function decryptSecret(payload: string): string {
  const { iv, authTag, ciphertext } = parseEnvelope(payload);
  const key = deriveSecretKey();

  try {
    const decipher = createDecipheriv(CIPHER_ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH_BYTES,
    });
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch {
    // Tag no verificado, clave distinta o datos corruptos: mismo mensaje plano.
    throw new Error(DECRYPT_ERROR_MESSAGE);
  } finally {
    key.fill(0);
  }
}

/**
 * HMAC-SHA256 en hexadecimal (64 caracteres) de un valor.
 * Uso obligatorio en SAFE: huella de la IP del escáner que dispara una alerta y
 * del registro de aceptación de términos. La IP o el identificador crudos nunca
 * se persisten, cumpliendo la protección de datos médicos y de geolocalización.
 * @param value Cadena a firmar (por ejemplo `req ip` normalizada).
 * @param secret Clave opcional; por defecto `getEnv().JWT_SECRET`.
 */
export function hmacSha256(value: string, secret?: string): string {
  if (typeof value !== "string") {
    throw new Error("El dato a firmar con HMAC debe ser un texto.");
  }

  const key =
    typeof secret === "string" && secret.length > 0
      ? secret
      : getEnv().JWT_SECRET;

  return createHmac("sha256", key).update(value, "utf8").digest("hex");
}

/**
 * Genera un token aleatorio criptográficamente seguro en base64url sin relleno,
 * apto para códigos de dispositivo, folios de lote o identificadores de auditoría.
 * @param bytes Entropía solicitada; 32 bytes por defecto (≈ 43 caracteres).
 */
export function randomToken(bytes: number = 32): string {
  if (
    !Number.isInteger(bytes) ||
    bytes < MIN_RANDOM_TOKEN_BYTES ||
    bytes > MAX_RANDOM_TOKEN_BYTES
  ) {
    throw new Error(
      `La longitud del token debe ser un entero entre ${MIN_RANDOM_TOKEN_BYTES} y ${MAX_RANDOM_TOKEN_BYTES} bytes.`,
    );
  }

  // `base64url` de Node ya omite el relleno "=" y sustituye +/ por -_.
  return randomBytes(bytes).toString("base64url");
}

/**
 * Compara dos cadenas en TIEMPO CONSTANTE, incluso cuando difieren en longitud.
 * Ambas entradas se condensan con SHA-256 (digest fijo de 32 bytes) y solo esos
 * digests se pasan a `timingSafeEqual`. Así el tiempo de respuesta no revela ni
 * la longitud real del PIN de activación ni en qué carácter diverge la
 * `ADMIN_MASTER_KEY`, erradicando los ataques de temporización descritos en la
 * skill `safe-security-and-compliance` (§2).
 * @returns `true` solo si los contenidos son idénticos.
 */
export function safeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  const digestA = createHash("sha256").update(a, "utf8").digest();
  const digestB = createHash("sha256").update(b, "utf8").digest();

  // Los dos digests miden DIGEST_LENGTH_BYTES (32), la comparación nunca lanza
  // por desajuste de longitud y siempre recorre los 32 bytes completos.
  return (
    digestA.length === DIGEST_LENGTH_BYTES &&
    digestB.length === DIGEST_LENGTH_BYTES &&
    timingSafeEqual(digestA, digestB)
  );
}
