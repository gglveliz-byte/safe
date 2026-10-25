/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Esquemas de Validación (Zod) — Activación de Kit / Casco
 * ARCHIVO: src/lib/schemas/activate.schema.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Esquema canónico `ActivateDeviceSchema` que valida el payload completo del
 * endpoint `POST /api/devices/activate` (contrato §7 de BACKEND_CONTRACTS.md
 * y §4.1 de SAFE_Arquitectura_Backend_2026.md). Recibe el folio del casco,
 * el PIN confidencial de 6 dígitos, las credenciales de la nueva cuenta del
 * motociclista (correo + contraseña), el perfil médico inicial (grupo
 * sanguíneo, alergias, padecimientos, medicamentos, fecha de nacimiento,
 * fotografía de rostro, número de emergencia) y la lista de contactos de
 * emergencia que recibirán los avisos SMTP.
 *
 * ENTRADAS: JSON body del POST /api/devices/activate.
 * SALIDAS: `ActivateDeviceInput` tipado, listo para el servicio
 * `activation.service.ts` que ejecuta la transacción atómica User +
 * MedicalProfile + Device(ACTIVE).
 *
 * DEPENDENCIAS: zod (v3, ^3.24) y los esquemas base de common.schema.ts.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - `.strict()`: rechaza campos extra (mensaje español canónico).
 * - Cero mocks, cero TODO, cero datos de demostración.
 * - Mensajes de error humanos en español sin jerga técnica.
 * ==============================================================================
 */

import { z } from "zod";

import {
  BloodTypeSchema,
  DeviceCodeSchema,
  EmailSchema,
  EmergencyContactsSchema,
  IsoDateSchema,
  LocaleSchema,
  PasswordSchema,
  PinSchema,
} from "@/lib/schemas/common.schema";

/**
 * Texto canónico que se devuelve cuando el cliente envía un campo que no
 * forma parte del contrato congelado §7. Se aplica a `.strict()` para que
 * Zod rechace el payload completo antes de validar cada propiedad individual.
 */
const STRICT_FORM_MESSAGE = "El formulario contiene campos no permitidos.";

/**
 * URL de la fotografía de rostro del motociclista subida a Cloudinary.
 * Se exige un URL sintácticamente válido (`.url()`) y, adicionalmente, se
 * refina para aceptar únicamente los protocolos `http:` y `https:`; así se
 * bloquean esquemas como `file://`, `javascript:` o `data:` que un cliente
 * manipulado podría inyectar.
 *
 * Consumido por: `photoUrl` de ActivateDeviceSchema y ProfileUpdateSchema.
 */
const HttpsUrlSchema = z
  .string({
    required_error: "La URL de la fotografía es obligatoria.",
    invalid_type_error: "La URL de la fotografía debe escribirse como texto.",
  })
  .url("Debe enviar una URL válida de la fotografía del conductor.")
  .refine(
    (value) => value.startsWith("http://") || value.startsWith("https://"),
    "La URL de la fotografía debe usar los protocolos http o https.",
  );

/**
 * Esquema completo de activación del kit. Reúne, en un único objeto estricto,
 * todas las piezas que el endpoint `POST /api/devices/activate` necesita para:
 *   1. Verificar el folio y el PIN contra el Device UNCLAIMED en PostgreSQL.
 *   2. Crear el User (con contraseña bcrypt coste 12) y la MedicalProfile.
 *   3. Guardar el consentimiento legal (termsAccepted = true) y la versión
 *      de términos vigente (leída de env.TERMS_VERSION en el servicio).
 *   4. Emitir la cookie de sesión JWT HttpOnly y redirigir al dashboard.
 *
 * `.strict()` garantiza que ningún campo espurio (inyectado por un formulario
 * adulterado o por una versión antigua del cliente) llegue al servicio.
 */
export const ActivateDeviceSchema = z
  .object(
    {
      /** Folio público del casco (NFC + QR). Normalizado a mayúsculas por DeviceCodeSchema. */
      code: DeviceCodeSchema,

      /** PIN confidencial de 6 dígitos impreso en la tarjeta del empaque. */
      activationPin: PinSchema,

      /** Correo del motociclista; será su identidad de sesión y destinatario de avisos. */
      email: EmailSchema,

      /** Contraseña de la nueva cuenta (8..128 caracteres). */
      password: PasswordSchema,

      /** Nombre completo del conductor (3..100 caracteres). */
      fullName: z
        .string({
          required_error: "El nombre completo es obligatorio.",
          invalid_type_error: "El nombre completo debe escribirse como texto.",
        })
        .trim()
        .min(3, "El nombre completo debe tener al menos 3 caracteres.")
        .max(100, "El nombre completo no puede superar los 100 caracteres."),

      /** Cédula / identificación nacional del conductor (5..30 caracteres). */
      nationalId: z
        .string({
          required_error: "El número de identificación es obligatorio.",
          invalid_type_error: "El número de identificación debe escribirse como texto.",
        })
        .trim()
        .min(5, "El número de identificación debe tener al menos 5 caracteres.")
        .max(30, "El número de identificación no puede superar los 30 caracteres."),

      /** URL pública de la fotografía de rostro subida a Cloudinary (http/https). */
      photoUrl: HttpsUrlSchema,

      /** Identificador público del asset en Cloudinary; opcional, máx 200 chars. */
      photoPublicId: z
        .string()
        .trim()
        .max(200, "El identificador público de la foto no puede superar los 200 caracteres.")
        .optional(),

      /**
       * Fecha de nacimiento del conductor en formato ISO 8601 (AAAA-MM-DD).
       * Opcional: el taller puede dar el alta sin declararla. Cuando se envía,
       * IsoDateSchema la transforma a instancia `Date` lista para Prisma.
       */
      birthDate: IsoDateSchema.optional(),

      /** Grupo sanguíneo del catálogo canónico (O+, O-, A+, ..., DESCONOCIDO). */
      bloodType: BloodTypeSchema,

      /** Alergias conocidas del conductor; texto libre, máx 500 caracteres. */
      allergies: z
        .string()
        .trim()
        .max(500, "El texto de alergias no puede superar los 500 caracteres.")
        .optional(),

      /** Padecimientos crónicos; texto libre, máx 500 caracteres. */
      chronicConditions: z
        .string()
        .trim()
        .max(500, "El texto de padecimientos crónicos no puede superar los 500 caracteres.")
        .optional(),

      /** Medicamentos en uso; texto libre, máx 500 caracteres. */
      medications: z
        .string()
        .trim()
        .max(500, "El texto de medicamentos no puede superar los 500 caracteres.")
        .optional(),

      /** Información de la aseguradora / póliza; texto libre, máx 200 caracteres. */
      insuranceInfo: z
        .string()
        .trim()
        .max(200, "La información de seguro no puede superar los 200 caracteres.")
        .optional(),

      /** Teléfono de emergencia alternativo del conductor; máx 30 caracteres. */
      emergencyNumber: z
        .string()
        .trim()
        .max(30, "El número de emergencia no puede superar los 30 caracteres.")
        .optional(),

      /**
       * Lista de contactos de emergencia (mínimo 1, máximo 20).
       * EmergencyContactsSchema ya impone:
       *   - `.min(1, "Debe registrar al menos un contacto de emergencia.")`
       *   - IDs únicos y correos únicos (deduplicación anti-spam SMTP).
       * Cada `id` es UUID generado en el cliente para estabilidad de edición.
       */
      emergencyContacts: EmergencyContactsSchema,

      /**
       * Consentimiento legal vinculante: el motociclista acepta los Términos
       * y Condiciones y la Política de Privacidad (Habeas Data / GDPR para
       * datos médicos sensibles). Debe ser literalmente `true`; cualquier
       * otro valor (false, undefined, string) es rechazado de inmediato.
       */
      termsAccepted: z.literal(true, {
        errorMap: () => ({
          message: "Debe aceptar los Términos y Condiciones.",
        }),
      }),

      /** Idioma preferido para correos de alerta (ES/EN). Por defecto español. */
      locale: LocaleSchema.optional(),
    },
  )
  .strict(STRICT_FORM_MESSAGE);

/**
 * Tipo TypeScript inferido del esquema de activación. Es el DTO que recibe
 * `activation.service.ts` → `activateDevice(input, context)`. Los campos
 * opcionales aparecen como `T | undefined`; `birthDate` llega como `Date`;
 * `termsAccepted` queda fijado en el literal `true`.
 */
export type ActivateDeviceInput = z.infer<typeof ActivateDeviceSchema>;
