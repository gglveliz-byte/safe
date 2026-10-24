/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Semillero de Base de Datos (Prisma Seed)
 * ARCHIVO: prisma/seed.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Inicializa el único usuario administrador de la plataforma a partir de las
 * variables de entorno ADMIN_EMAIL y ADMIN_PASSWORD. No crea motociclistas,
 * dispositivos, perfiles médicos ni datos de demostración: todo registro
 * operativo nace exclusivamente de los flujos reales de la aplicación.
 *
 * El PIN maestro administrativo (ADMIN_MASTER_KEY) se valida como requisito de
 * despliegue, pero nunca se persiste ni se registra en consola.
 *
 * EJECUCIÓN:
 *   npx prisma db seed
 *
 * DEPENDENCIAS:
 * - @prisma/client (Prisma ORM 6 sobre PostgreSQL)
 * - bcryptjs (hash de contraseña con coste 12)
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 450 líneas.
 * - Cero datos mock, demos o credenciales embebidas.
 * - Cierre garantizado del cliente Prisma en el bloque finally.
 * ==============================================================================
 */

import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

// Coste de bcrypt exigido por el contrato de seguridad para contraseñas.
const PASSWORD_HASH_COST = 12;

// Longitud mínima de la contraseña administrativa (contrato PasswordSchema).
const MIN_PASSWORD_LENGTH = 8;

// Límite físico de bcrypt: los bytes posteriores a 72 se ignoran.
const MAX_PASSWORD_LENGTH = 72;

// Longitud mínima de la clave maestra administrativa (contrato ServerEnv).
const MIN_MASTER_KEY_LENGTH = 24;

// Cliente Prisma único para la ejecución del semillero.
const prisma = new PrismaClient();

/**
 * Lee una variable de entorno obligatoria y falla con un mensaje legible en
 * español cuando está ausente o vacía. Nunca incluye el valor en el error.
 *
 * @param name Nombre exacto de la variable de entorno.
 * @returns Valor recortado de la variable.
 */
function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Falta la variable de entorno obligatoria ${name}. ` +
        "Configúrela en el archivo .env antes de ejecutar el semillero.",
    );
  }

  return value;
}

/**
 * Normaliza y valida el correo del administrador con una comprobación
 * estructural estricta, sin aceptar espacios ni mayúsculas ambiguas.
 *
 * @param rawEmail Valor original de ADMIN_EMAIL.
 * @returns Correo en minúsculas listo para el upsert.
 */
function normalizeAdminEmail(rawEmail: string): string {
  const email = rawEmail.trim().toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email) || email.length > 254) {
    throw new Error(
      "ADMIN_EMAIL no contiene una dirección de correo válida. " +
        "Corrija el valor antes de ejecutar el semillero.",
    );
  }

  return email;
}

/**
 * Valida la contraseña administrativa sin registrarla jamás en consola.
 * Exige el mínimo del contrato y respeta el límite de bcrypt.
 *
 * @param password Valor original de ADMIN_PASSWORD.
 * @returns Contraseña validada, lista para el hash.
 */
function validateAdminPassword(password: string): string {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `ADMIN_PASSWORD debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    );
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new Error(
      `ADMIN_PASSWORD no puede superar ${MAX_PASSWORD_LENGTH} caracteres.`,
    );
  }

  return password;
}

/**
 * Garantiza que la clave maestra administrativa exista y cumpla la longitud
 * mínima del contrato. Su valor no se usa ni se persiste en la base de datos.
 */
function assertAdminMasterKey(): void {
  const masterKey = requireEnv("ADMIN_MASTER_KEY");

  if (masterKey.length < MIN_MASTER_KEY_LENGTH) {
    throw new Error(
      `ADMIN_MASTER_KEY debe tener al menos ${MIN_MASTER_KEY_LENGTH} caracteres.`,
    );
  }
}

/**
 * Crea o actualiza el único usuario ADMIN identificado por su correo.
 * El upsert es idempotente: reejecutar el semillero no duplica cuentas y
 * restablece la contraseña administrativa con un hash bcrypt de coste 12.
 */
async function seedAdminUser(): Promise<void> {
  assertAdminMasterKey();

  const email = normalizeAdminEmail(requireEnv("ADMIN_EMAIL"));
  const password = validateAdminPassword(requireEnv("ADMIN_PASSWORD"));

  // Hash de producción: nunca se almacena ni se imprime la contraseña plana.
  const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_COST);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: Role.ADMIN,
    },
    create: {
      email,
      passwordHash,
      role: Role.ADMIN,
    },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  console.log(
    `[seed] Administrador asegurado: ${admin.email} (rol ${admin.role}, id ${admin.id}).`,
  );
  console.log(
    "[seed] No se crearon motociclistas, dispositivos ni perfiles médicos.",
  );
}

/**
 * Orquesta la ejecución del semillero y garantiza el cierre de la conexión
 * a PostgreSQL incluso ante errores de validación o de red.
 */
async function runSeed(): Promise<void> {
  try {
    await seedAdminUser();
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error desconocido en el semillero.";
    console.error(`[seed] Falló la inicialización: ${message}`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

// Punto de entrada del script ejecutado por `npx prisma db seed`.
void runSeed();
