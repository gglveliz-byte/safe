/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Validación de Esquemas (Zod) — Perfil Médico y Latido GPS
 * ARCHIVO: src/lib/schemas/profile.schema.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Define los contratos de entrada para la edición de la ficha médica del
 * motociclista (PUT /api/profile) y para el reporte periódico de ubicación
 * durante el Modo Ruta (POST /api/gps/heartbeat).
 *
 * El perfil admite actualizaciones parciales: todos los campos son opcionales,
 * pero el cuerpo debe contener al menos un campo real para evitar peticiones
 * vacías que desgasten la base de datos. Los contactos de emergencia se validan
 * con el esquema común compartido (1 a 20 contactos, identificadores y correos
 * únicos) para no duplicar reglas clínicas ni de seguridad.
 *
 * Dependencias clave:
 * - zod: validación estricta de tipos y rangos.
 * - ./common.schema: teléfono, tipo de sangre, fecha ISO, coordenadas y
 *   contactos de emergencia canónicos del proyecto.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados, mocks o respuestas de demostración.
 * - Mensajes de validación en Español, aptos para el usuario final.
 * - Rechazo de campos desconocidos (.strict()) en todos los cuerpos.
 * ==============================================================================
 */

import { z } from "zod";
import {
  BloodTypeSchema,
  EmergencyContactsSchema,
  IsoDateSchema,
  LatitudeSchema,
  LongitudeSchema,
  PhoneSchema,
} from "./common.schema";

/**
 * Actualización parcial de la ficha médica del motociclista.
 *
 * Reglas:
 * - Todos los campos son opcionales para permitir ediciones incrementales.
 * - Los textos clínicos aceptan cadena vacía para borrar un dato declarado
 *   previamente (la capa de servicio la convierte en `null` en PostgreSQL).
 * - La fecha de nacimiento se normaliza a `Date` mediante el esquema común.
 * - Los contactos de emergencia, si se envían, deben ser entre 1 y 20 y
 *   mantener identificadores y correos únicos.
 * - Debe existir al menos un campo definido en el cuerpo de la petición.
 */
export const ProfileUpdateSchema = z
  .object({
    /** Nombre completo del motociclista (3 a 100 caracteres). */
    fullName: z.string().trim().min(3).max(100).optional(),

    /** Documento nacional de identidad (5 a 30 caracteres). */
    nationalId: z.string().trim().min(5).max(30).optional(),

    /** URL segura de la fotografía alojada en Cloudinary. */
    photoUrl: z.string().trim().url().max(2048).optional(),

    /** Identificador público de Cloudinary para reemplazar sin dejar huérfanos. */
    photoPublicId: z.string().trim().min(1).max(255).optional(),

    /** Fecha de nacimiento en formato ISO 8601; se transforma en `Date`. */
    birthDate: IsoDateSchema.optional(),

    /** Grupo sanguíneo declarado dentro del catálogo oficial. */
    bloodType: BloodTypeSchema.optional(),

    /** Alergias conocidas; vacío para indicar que no se declaran. */
    allergies: z.string().trim().max(500).optional(),

    /** Enfermedades crónicas o condiciones preexistentes. */
    chronicConditions: z.string().trim().max(500).optional(),

    /** Medicamentos de uso permanente o tratamientos activos. */
    medications: z.string().trim().max(500).optional(),

    /** Información del seguro médico o póliza de accidentes. */
    insuranceInfo: z.string().trim().max(200).optional(),

    /** Teléfono directo de auxilio médico del motociclista. */
    emergencyNumber: PhoneSchema.optional(),

    /** Beneficiario del chip: SELF (Para Mí), CHILD, PARTNER, FAMILY, OTHER */
    beneficiaryType: z.enum(["SELF", "CHILD", "PARTNER", "FAMILY", "OTHER"]).optional(),

    /** País de residencia */
    country: z.string().trim().max(100).optional(),

    /** Ciudad, estado o provincia de residencia */
    city: z.string().trim().max(100).optional(),

    /** Dirección de residencia */
    residentialAddress: z.string().trim().max(250).optional(),

    /** Celular del conductor o tutor con código internacional */
    riderPhone: z.string().trim().max(30).optional(),

    /** Edad en años */
    age: z.coerce.number().int().min(0).max(130).optional(),

    /** Donante de órganos */
    isOrganDonor: z.boolean().optional(),

    /** Hallazgos médicos o antecedentes */
    medicalFindings: z.string().trim().max(500).optional(),

    /** ¿Tiene tutor responsable? */
    hasGuardian: z.boolean().optional(),

    /** Notas de rescate para emergencias */
    rescueNotes: z.string().trim().max(1000).optional(),

    /** Lugar de uso frecuente */
    frequentLocation: z.string().trim().max(200).optional(),

    /** Información vehicular / placa */
    vehicleInfo: z.string().trim().max(150).optional(),

    /** Contactos familiares autorizados para recibir alertas (1 a 20). */
    emergencyContacts: EmergencyContactsSchema.optional(),
  })
  .strict()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Debe enviar al menos un campo del perfil para actualizar.",
  });

/**
 * Latido de ubicación del Modo Ruta.
 *
 * El cliente móvil reporta la coordenada capturada por el sensor GPS y,
 * opcionalmente, si el rastreo en vivo sigue activo. El servicio persiste la
 * posición en `User.lastKnownLat`, `User.lastKnownLng` y `User.lastGpsAt`.
 */
export const HeartbeatSchema = z
  .object({
    /** Latitud decimal válida en el rango [-90, 90]. */
    lat: LatitudeSchema,

    /** Longitud decimal válida en el rango [-180, 180]. */
    lng: LongitudeSchema,

    /** Indica si el Modo Ruta permanece encendido; ausente equivale a activo. */
    active: z.boolean().optional(),
  })
  .strict();

/** Entrada validada y normalizada para actualizar la ficha médica. */
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;

/** Entrada validada para registrar un latido de ubicación GPS. */
export type HeartbeatInput = z.infer<typeof HeartbeatSchema>;
