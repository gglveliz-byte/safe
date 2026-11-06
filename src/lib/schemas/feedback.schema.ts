/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Validación de Esquemas (Zod) — Reseñas y Testimonios de Clientes
 * ARCHIVO: src/lib/schemas/feedback.schema.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Esquema de validación para el envío y moderación de testimonios y valoraciones
 * del servicio por parte de los motociclistas.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Validación estricta (.strict()) de propiedades.
 * - Mensajes canónicos en español.
 * ==============================================================================
 */

import { z } from "zod";

export const CreateFeedbackSchema = z
  .object({
    name: z
      .string({ required_error: "Tu nombre es requerido." })
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres.")
      .max(100, "El nombre no puede superar los 100 caracteres."),
    city: z
      .string()
      .trim()
      .max(100, "La ciudad no puede superar los 100 caracteres.")
      .optional()
      .nullable(),
    vehicle: z
      .string()
      .trim()
      .max(100, "La información del vehículo no puede superar los 100 caracteres.")
      .optional()
      .nullable(),
    rating: z.coerce
      .number({ required_error: "La calificación de 1 a 5 estrellas es obligatoria." })
      .int("La calificación debe ser un número entero.")
      .min(1, "La calificación mínima es 1 estrella.")
      .max(5, "La calificación máxima es 5 estrellas."),
    comment: z
      .string({ required_error: "Tu opinión o sugerencia es obligatoria." })
      .trim()
      .min(10, "Por favor comparte una opinión de al menos 10 caracteres.")
      .max(600, "La opinión no puede superar los 600 caracteres."),
  })
  .strict();

export type CreateFeedbackInput = z.infer<typeof CreateFeedbackSchema>;

export const UpdateFeedbackStatusSchema = z
  .object({
    isApproved: z.boolean({ required_error: "El estado de aprobación es obligatorio." }),
  })
  .strict();

export type UpdateFeedbackStatusInput = z.infer<typeof UpdateFeedbackStatusSchema>;

