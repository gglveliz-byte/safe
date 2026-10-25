/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Esquemas de Validación (Zod) — Autenticación y Credenciales
 * ARCHIVO: src/lib/schemas/auth.schema.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Define los esquemas de validación para las rutas de autenticación de SAFE:
 * inicio de sesión de motociclistas o administradores (POST /api/auth/login)
 * y cierre de sesión (POST /api/auth/logout).
 *
 * Utiliza los esquemas canónicos EmailSchema y PasswordSchema para garantizar
 * que la normalización (trim, minúsculas) y los rangos de longitud sean
 * consistentes en todo el sistema.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * - Rechazo estricto de campos no permitidos (.strict()).
 * - Mensajes de validación en Español.
 * ==============================================================================
 */

import { z } from "zod";
import { EmailSchema } from "./common.schema";

/**
 * Esquema de validación para las credenciales de inicio de sesión.
 */
export const LoginSchema = z
  .object({
    /** Correo electrónico registrado de la cuenta. */
    email: EmailSchema,

    /** Contraseña en texto plano para verificar contra el hash de bcrypt (1 a 128 caracteres). */
    password: z
      .string({ required_error: "La contraseña es obligatoria." })
      .min(1, "La contraseña no puede estar vacía.")
      .max(128, "La contraseña no puede superar los 128 caracteres."),
  })
  .strict();

/**
 * Tipo inferido de las credenciales de inicio de sesión.
 */
export type LoginInput = z.infer<typeof LoginSchema>;
