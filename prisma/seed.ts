/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Persistencia de Datos — Semillero de Inicialización (Prisma Seed)
 * ARCHIVO: prisma/seed.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Semillero del SuperAdmin maestro de la plataforma. Crea, de forma idempotente
 * y a partir de variables de entorno, el ÚNICO usuario con rol ADMIN necesario
 * para desbloquear el panel /admin en despliegues nuevos. Reejecutado, jamás
 * sobreescribe la contraseña de un administrador existente: solo informa.
 *
 * Este script NO crea dispositivos, lotes, perfiles médicos, contactos ni datos
 * de demostración de ningún tipo (Ley 2 de SAFE: cero mocks). Todo registro
 * operativo nace exclusivamente de los flujos reales de la aplicación
 * (/api/devices/activate, /api/admin/batches).
 *
 * EJECUCIÓN:
 *   node --experimental-strip-types prisma/seed.ts
 *   (o bien `npx prisma db seed`, que invoca exactamente ese comando gracias
 *    a la sección "prisma.seed" ya configurada por el Director en package.json)
 *
 * AUTOCONTENCIÓN (requisito de Node con strip-types):
 * - Solo importa paquetes instalados con especificador de paquete ("@prisma/client",
 *   "bcryptjs", "zod") y nunca alias "@/..." ni relativos sin extensión, porque
 *   Node no resuelve los "paths" de tsconfig.json.
 * - Usa únicamente sintaxis borrable por strip-types: tipos annotados e
 *   interfaces, jamás enums TS, namespaces ni decoradores.
 * - Lee process.env directamente con un mini-esquema Zod local en lugar de
 *   src/lib/env.ts, para no arrastrar variables que el semillero no necesita.
 *
 * ENTORNO:
 * - DATABASE_URL puede provenir del archivo .env cargado automáticamente por
 *   el CLI de Prisma cuando se corre vía `prisma db seed`; si se invoca `node`
 *   de forma directa, el operador debe exportar las variables previamente.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 450 líneas.
 * - Cero datos mock, demos o credenciales embebidas en el código.
 * - Contraseña bcrypt coste 12 (contrato §5 de BACKEND_CONTRACTS.md); nunca se
 *   imprime la contraseña plana en consola.
 * - Cierre garantizado de la conexión ($disconnect) incluso ante errores.
 * ==============================================================================
 */

import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Coste de bcrypt exigido por el contrato de seguridad para contraseñas (§5).
const PASSWORD_HASH_COST = 12;

// Mínimo de la contraseña administrativa fijado por la orden del Director.
const MIN_ADMIN_PASSWORD_LENGTH = 12;

// Límite físico de bcrypt: los bytes posteriores a 72 se ignoran en silencio,
// por eso se rechaza explícitamente cualquier contraseña más larga.
const MAX_ADMIN_PASSWORD_LENGTH = 72;

// Longitud máxima razonable de un correo (RFC 5321) alineada con EmailSchema.
const MAX_EMAIL_LENGTH = 254;

/**
 * Mini-esquema Zod local de las variables de entorno del semillero.
 * Cada mensaje de error nombra la variable exacta y su corrección en español,
 * sin usar src/lib/env.ts (que valida todo el stack y exigiría secretos que
 * este script no necesita: JWT_SECRET, CLOUDINARY_*, GMAIL_*, etc.).
 */
const SeedEnvSchema = z.object({
  // Cadena de conexión PostgreSQL obligatoria; se valida el esquema de protocolo
  // para evitar sorpresas con URL de otros proveedores o valores placeholder.
  DATABASE_URL: z
    .string({ required_error: "DATABASE_URL es obligatoria para conectar con PostgreSQL." })
    .min(1, "DATABASE_URL es obligatoria para conectar con PostgreSQL.")
    .regex(
      /^postgres(ql)?:\/\//,
      "DATABASE_URL debe ser una URL PostgreSQL válida que inicie con postgres:// o postgresql://.",
    ),

  // Correo del SuperAdmin maestro; se normaliza a minúsculas para el upsert.
  ADMIN_EMAIL: z
    .string({ required_error: "ADMIN_EMAIL es obligatoria: indica el correo del SuperAdmin maestro." })
    .min(1, "ADMIN_EMAIL es obligatoria: indica el correo del SuperAdmin maestro.")
    .max(MAX_EMAIL_LENGTH, `ADMIN_EMAIL no puede superar ${MAX_EMAIL_LENGTH} caracteres.`)
    .email("ADMIN_EMAIL debe contener una dirección de correo electrónico válida."),

  // Contraseña del SuperAdmin: mínimo 12 caracteres y tope técnico de bcrypt.
  ADMIN_PASSWORD: z
    .string({ required_error: "ADMIN_PASSWORD es obligatoria: define la contraseña del SuperAdmin maestro." })
    .min(
      MIN_ADMIN_PASSWORD_LENGTH,
      `ADMIN_PASSWORD es obligatoria y debe tener al menos ${MIN_ADMIN_PASSWORD_LENGTH} caracteres.`,
    )
    .max(
      MAX_ADMIN_PASSWORD_LENGTH,
      `ADMIN_PASSWORD no puede superar ${MAX_ADMIN_PASSWORD_LENGTH} caracteres porque bcrypt ignora el resto.`,
    ),

  // Entorno de ejecución: opcional; el semillero funciona en cualquier modo.
  NODE_ENV: z.enum(["development", "test", "production"], {
    message:
      "NODE_ENV es opcional, pero si se define debe ser development, test o production.",
  }).optional(),
});

type SeedEnv = z.infer<typeof SeedEnvSchema>;

/**
 * Construye el objeto crudo de variables desde process.env tratando las cadenas
 * vacías como ausentes, para que Zod exija las obligatorias y las opcionales
 * queden indefinidas en lugar de romper la validación con "".
 *
 * @returns Registro clave/valor listo para SeedEnvSchema.parse.
 */
function readRawEnv(): Record<string, string | undefined> {
  const names = ["DATABASE_URL", "ADMIN_EMAIL", "ADMIN_PASSWORD", "NODE_ENV"] as const;
  const raw: Record<string, string | undefined> = {};

  for (const name of names) {
    const value = process.env[name]?.trim();
    raw[name] = value && value.length > 0 ? value : undefined;
  }

  return raw;
}

/**
 * Valida el entorno del semillero y, ante cualquier incumplimiento, lanza un
 * único Error acumulando en español la lista de variables exactas en fallo.
 * Nunca incluye valores secretos (contraseñas o URLs con credenciales) en el
 * diagnóstico impreso.
 *
 * @returns Entorno validado y tipado.
 */
function parseSeedEnv(): SeedEnv {
  const result = SeedEnvSchema.safeParse(readRawEnv());

  if (result.success) {
    return result.data;
  }

  // Se agrupan los problemas por variable para un diagnóstico legible de 1 línea cada una.
  const diagnostic = result.error.issues
    .map((issue) => {
      const variable = issue.path.length > 0 ? String(issue.path[0]) : "ENV";
      return `  - ${variable}: ${issue.message}`;
    })
    .join("\n");

  throw new Error(
    "El semillero no puede ejecutarse con el entorno actual. Corrija .env:\n" +
      diagnostic +
      "\nRecuerde: DATABASE_URL puede provenir del .env cargado por el CLI de Prisma (`prisma db seed`).",
  );
}

/**
 * Asegura la existencia del SuperAdmin maestro mediante upsert por correo.
 *
 * Comportamiento de idempotencia ordenado por el Director:
 * - Si NO existe: se crea con role ADMIN y passwordHash bcrypt(coste 12).
 * - Si YA existe: el `update: {}` del upsert garantiza que NO se sobreescribe
 *   su hash ni ningún otro campo; se aviso explícito en consola.
 *
 * @param env Entorno validado del semillero.
 * @param prisma Cliente Prisma activo.
 * @returns Verdadero si se creó un administrador nuevo en esta ejecución.
 */
async function upsertSuperAdmin(env: SeedEnv, prisma: PrismaClient): Promise<boolean> {
  // Normalización defensiva: el correo se almacena en minúsculas (EmailSchema).
  const email = env.ADMIN_EMAIL.toLowerCase();

  // Detección previa para el aviso en consola; el upsert sigue siendo atómico.
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, createdAt: true },
  });

  if (existing) {
    console.log(
      `[SAFE][SEED] El administrador ${email} ya existe (id ${existing.id}, ` +
        "creado el " +
        existing.createdAt.toISOString() +
        "). No se sobreescribe su contraseña ni su hash: conservelos como credencial vigente.",
    );
    return false;
  }

  // Hash de producción: la contraseña plana jamás se imprime ni se persiste.
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, PASSWORD_HASH_COST);

  const admin = await prisma.user.upsert({
    where: { email },
    // Update deliberadamente vacío: reejecutar el semillero no rota credenciales.
    update: {},
    create: {
      email,
      passwordHash,
      role: Role.ADMIN,
    },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  console.log(
    `[SAFE][SEED] SuperAdmin creado: ${admin.email} (rol ${admin.role}, id ${admin.id}, ` +
      `alta ${admin.createdAt.toISOString()}) con hash bcrypt coste ${PASSWORD_HASH_COST}.`,
  );
  return true;
}

/**
 * Orquesta el semillero: valida entorno, asegura el SuperAdmin y garantiza la
 * desconexión del cliente Prisma en todos los caminos de salida. Los fallos
 * fijan process.exitCode = 1 para que el CLI de Prisma o el pipeline de
 * despliegue detecten la ejecución insatisfactoria sin lanzar stack trace.
 */
async function runSeed(): Promise<void> {
  const prisma = new PrismaClient();

  try {
    console.log("[SAFE][SEED] Iniciando semillero del SuperAdmin maestro...");

    const env = parseSeedEnv();

    console.log(
      `[SAFE][SEED] Entorno validado (NODE_ENV=${env.NODE_ENV ?? "sin definir"}). Conectando con PostgreSQL...`,
    );

    const created = await upsertSuperAdmin(env, prisma);

    if (created) {
      console.log(
        "[SAFE][SEED] Proceso limpio: CERO dispositivos, CERO perfiles médicos, CERO datos demo.",
      );
      console.log("[SAFE][SEED] Semillero completado con éxito.");
    } else {
      console.log("[SAFE][SEED] Nada que crear: el sistema ya estaba inicializado.");
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido en el semillero.";
    console.error(`[SAFE][SEED] ERROR: ${message}`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    console.log("[SAFE][SEED] Conexión con PostgreSQL cerrada.");
  }
}

// Punto de entrada del script autocontenido ejecutado por el CLI de Prisma.
void runSeed();
