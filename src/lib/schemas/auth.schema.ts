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
import { EmailSchema, PasswordSchema } from "./common.schema";

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

/**
 * Esquema de validación para solicitud de recuperación de contraseña.
 */
export const ForgotPasswordSchema = z
  .object({
    /** Correo electrónico registrado de la cuenta. */
    email: EmailSchema,
    /** Idioma preferido para el correo electrónico enviado. */
    locale: z.enum(["es", "en"]).optional().default("es"),
  })
  .strict();

/**
 * Tipo inferido para solicitud de recuperación de contraseña.
 */
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

/**
 * Esquema de validación para restablecer la contraseña con token criptográfico.
 */
export const ResetPasswordSchema = z
  .object({
    /** Token firmado temporal de recuperación de contraseña. */
    token: z
      .string({ required_error: "El token de recuperación es obligatorio." })
      .min(20, "El token de recuperación es inválido o está incompleto."),

    /** Nueva contraseña deseada (mínimo 8 caracteres, máximo 128). */
    password: PasswordSchema,

    /** Confirmación de la nueva contraseña: debe coincidir exactamente. */
    confirmPassword: PasswordSchema,
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden. Escríbelas exactamente iguales.",
    path: ["confirmPassword"],
  });

/**
 * Tipo inferido para ejecución del restablecimiento de contraseña.
 */
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

