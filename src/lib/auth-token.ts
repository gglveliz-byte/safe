/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Infraestructura compartida — Sesión JWT y cookies (Edge-safe)
 * ARCHIVO: src/lib/auth-token.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Núcleo de sesión de SAFE, con la firma congelada del §5 de
 * `docs/BACKEND_CONTRACTS.md`. Firma y verifica JWT HS256 con `jose`, define el
 * nombre canónico de la cookie de sesión y construye los descriptores exactos de
 * cookie HttpOnly que usan tanto `src/middleware.ts` (runtime Edge) como
 * `src/lib/auth.ts` (runtime Node). Es el ÚNICO módulo de autenticación permitido
 * dentro del middleware: no conoce Prisma, bcrypt, nodemailer ni `node:crypto`,
 * de modo que el mismo código corre sin cambios en Edge Runtime y en Node.
 *
 * Política de seguridad obligatoria (skill `safe-security-and-compliance` §3):
 * el token viaja EXCLUSIVAMENTE en cookie `HttpOnly; SameSite=Lax; Path=/`,
 * `Secure` en producción. Queda prohibido almacenar sesiones en `localStorage`
 * o `sessionStorage`, expuestas a robo por XSS.
 *
 * ENTRADAS: `SessionPayload` (sub/email/role) y cadenas JWT. SALIDAS: JWT
 * compacto firmado, payload verificado o `null`, y descriptores de cookie.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas (techo interno del archivo: 450).
 * - Cero secretos hardcodeados: `JWT_SECRET` y vigencia salen de `getEnv()`.
 * - `getEnv()` se invoca dentro de las funciones, jamás en el nivel del módulo.
 * - Fallo silencioso y seguro en la verificación: `null`, nunca excepciones que
 *   filtren detalles internos al cliente.
 * ==============================================================================
 */

import { SignJWT, jwtVerify } from "jose";

import { getEnv } from "@/lib/env";

/** Nombre canónico de la cookie de sesión, compartido por Edge y Node. */
export const SESSION_COOKIE = "safe_session";

/** Roles válidos de la plataforma: motociclista propietario o administrador. */
export type SessionRole = "RIDER" | "ADMIN";

/** Claims mínimos y verificados que viajan dentro del token de sesión. */
export interface SessionPayload {
  /** Identificador único (UUID) del usuario autenticado. */
  sub: string;
  /** Correo electrónico asociado a la cuenta. */
  email: string;
  /** Rol que determina el alcance de la sesión. */
  role: SessionRole;
}

/** Emisor que se firma y que se exige al verificar (`iss`). */
const JWT_ISSUER = "safe";

/** Audiencia lógica de la aplicación SAFE (`aud`). */
const JWT_AUDIENCE = "safe-app";

/** Único algoritmo admitido por el contrato de seguridad (simétrico HS256). */
const JWT_ALGORITHM = "HS256";

/** Banderas exactas de la cookie de sesión exigidas por el contrato. */
interface SessionCookieOptions {
  /** La cookie no es legible desde JavaScript: inmune a robo por XSS. */
  httpOnly: true;
  /** Solo por HTTPS en producción; en desarrollo local se relaja HTTP. */
  secure: boolean;
  /** Sin envío cross-site: mitiga CSRF en el despacho de alertas y el panel. */
  sameSite: "lax";
  /** Válida en todo el dominio, incluida la vista pública de emergencia. */
  path: "/";
  /** Vida en segundos; `0` provoca el borrado inmediato en el navegador. */
  maxAge: number;
}

/** Descriptor completo listo para `NextResponse.cookies.set`. */
interface SessionCookieDescriptor {
  name: typeof SESSION_COOKIE;
  value: string;
  options: SessionCookieOptions;
}

/**
 * Deriva la clave simétrica de firma como bytes UTF-8 del `JWT_SECRET` validado.
 * Se construye dentro de cada operación (nunca en el nivel del módulo) para que
 * el arranque de `next build` no requiera secretos y para no congelarlos en el
 * bundle de Edge si el entorno cambia entre despliegues.
 */
function getSigningKey(): Uint8Array {
  return new TextEncoder().encode(getEnv().JWT_SECRET);
}

/**
 * Indica si la aplicación corre en producción, según el entorno VALIDADO
 * (`getEnv().NODE_ENV`), no según `process.env` crudo.
 * @returns `true` para exigir el atributo `Secure` de la cookie.
 */
function isProductionRuntime(): boolean {
  return getEnv().NODE_ENV === "production";
}

/**
 * Vigencia de sesión configurada en el entorno, en segundos.
 * El valor por defecto operativo (30 días) lo resuelve el validador de `env.ts`.
 */
export function sessionTtlSeconds(): number {
  return getEnv().SESSION_TTL_SECONDS;
}

/**
 * Normaliza la vigencia solicitada para `signToken`.
 * Rechaza valores no numéricos, nulos, negativos o infinitos y cae en la
 * vigencia del entorno, evitando tokens perpetuos por un descuido del llamante.
 * @param ttlSeconds Vigencia opcional pedida por el servicio de sesión.
 */
function resolveTtl(ttlSeconds?: number): number {
  if (
    typeof ttlSeconds === "number" &&
    Number.isFinite(ttlSeconds) &&
    ttlSeconds > 0
  ) {
    return Math.floor(ttlSeconds);
  }

  return sessionTtlSeconds();
}

/**
 * Valida en tiempo de ejecución la forma del payload antes de firmar.
 * Un token mal formado jamás debe salir al navegador: si falta el identificador,
 * el correo o el rol, se aborta con un mensaje humano y sin datos personales.
 * @param payload Datos de sesión recibidos desde `auth.ts` o un endpoint.
 */
function assertSignablePayload(payload: SessionPayload): void {
  if (
    !payload ||
    typeof payload.sub !== "string" ||
    payload.sub.length === 0 ||
    typeof payload.email !== "string" ||
    payload.email.length === 0 ||
    (payload.role !== "RIDER" && payload.role !== "ADMIN")
  ) {
    throw new Error(
      "No es posible emitir una sesión sin identificador, correo y rol válidos.",
    );
  }
}

/**
 * Firma un JWT de sesión HS256 listo para viajar en la cookie HttpOnly.
 * Claims emitidos: `sub`, `email`, `role`, `iss` (`safe`), `aud` (`safe-app`),
 * `iat` (ahora) y `exp` (ahora + vigencia).
 * @param payload Identificador, correo y rol del usuario autenticado.
 * @param ttlSeconds Vigencia opcional en segundos; por defecto `sessionTtlSeconds()`.
 * @returns Token compacto `header.payload.firma`.
 */
export async function signToken(
  payload: SessionPayload,
  ttlSeconds?: number,
): Promise<string> {
  assertSignablePayload(payload);

  const lifetime = resolveTtl(ttlSeconds);
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + lifetime;

  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: JWT_ALGORITHM, typ: "JWT" })
    .setSubject(payload.sub)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt(issuedAt)
    .setExpirationTime(expiresAt)
    .sign(getSigningKey());
}

/**
 * Verifica firma, algoritmo, emisor, audiencia y vigencia de un token de sesión.
 * Cualquier anomalía (vacío, expirado, alterado, claims ausentes, rol desconocido
 * o entorno incompleto) se resuelve como `null`: el llamante decide el rechazo y
 * ninguna excepción filtra detalles internos al cliente.
 * @param token Cadena JWT leída de la cookie `safe_session`.
 * @returns El payload saneado o `null` si la sesión no es confiable.
 */
export async function verifyToken(
  token: string,
): Promise<SessionPayload | null> {
  if (typeof token !== "string" || token.length === 0) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSigningKey(), {
      algorithms: [JWT_ALGORITHM],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    const subject = payload.sub;
    const email = payload.email;
    const role = payload.role;

    if (typeof subject !== "string" || subject.length === 0) {
      return null;
    }

    if (typeof email !== "string" || email.length === 0) {
      return null;
    }

    if (role !== "RIDER" && role !== "ADMIN") {
      return null;
    }

    return { sub: subject, email, role };
  } catch {
    // jose lanza JWTExpired / JWSSignatureVerificationFailed / etc. Todo cuenta
    // igual: sesión no válida. Se devuelve null sin distinguir el motivo.
    return null;
  }
}

/**
 * Construye la cookie de sesión del contrato: HttpOnly, `Secure` solo en
 * producción, SameSite=Lax, Path=/ y Max-Age igual a la vigencia del entorno.
 * @param token Token previamente firmado con `signToken`.
 */
export function buildSessionCookie(token: string): SessionCookieDescriptor {
  return {
    name: SESSION_COOKIE,
    value: token,
    options: {
      httpOnly: true,
      secure: isProductionRuntime(),
      sameSite: "lax",
      path: "/",
      maxAge: sessionTtlSeconds(),
    },
  };
}

/**
 * Construye la cookie de cierre inmediato de sesión (logout): valor vacío y
 * Max-Age=0 con las mismas banderas de seguridad, para que el navegador elimine
 * la credencial anterior aunque el dominio cambie entre HTTP y HTTPS.
 */
export function buildClearedSessionCookie(): SessionCookieDescriptor {
  return {
    name: SESSION_COOKIE,
    value: "",
    options: {
      httpOnly: true,
      secure: isProductionRuntime(),
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    },
  };
}
