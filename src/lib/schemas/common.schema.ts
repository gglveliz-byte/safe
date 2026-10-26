/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Esquemas de Validación (Zod) — Comunes y Compartidos (Capa: src/lib)
 * ARCHIVO: src/lib/schemas/common.schema.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Bloque atómico de validación Zod v3 compartido por TODOS los endpoints de
 * SAFE (Parte 1 y Parte 2): `/api/devices/activate`, `/api/emergency/alert`,
 * el gateway público `/r/[code]`, `/api/profile`, `/api/gps/heartbeat`,
 * `/api/upload/cloudinary` y `/api/admin/*`. Define las reglas canónicas
 * congeladas en `docs/BACKEND_CONTRACTS.md` §7: folio del casco, correo,
 * contraseña, PIN de 6 dígitos, teléfono, grupo sanguíneo, contactos de
 * emergencia (contrato JSONB `emergencyContacts` de la BD §4 del documento
 * de Base de Datos), coordenadas GPS WGS84, idioma y fechas ISO 8601.
 *
 * ENTRADAS: Objetos JSON/y params de ruta ya serializados como string/number.
 * SALIDAS: Datos normalizados (código en mayúsculas, correo en minúsculas,
 * fecha ISO convertida a instancia `Date`) o errores Zod con mensajes humanos.
 *
 * DEPENDENCIAS: zod (v3, ^3.24). Ninguna otra: este archivo es la hoja.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados de demo: el catálogo de sangre es la única
 *   fuente canónica (`BLOOD_TYPES`) reutilizada por la UI y los servicios.
 * - Mensajes de error en español sin jerga técnica (directriz de voz §3
 *   del Ledger) para que el motociclista o el familiar entiendan qué corregir.
 * - Ningún export de este archivo se elimina sin Solicitud de Cambio entre
 *   IAs registrada en el Ledger (consumido por auth/profile/admin/upload).
 * ==============================================================================
 */

import { z } from "zod";

/**
 * Folio público del kit / casco grabado en la antena NFC y en el QR de rescate.
 * Se consume en: `code` de ActivateDeviceSchema, EmergencyAlertSchema, el param
 * de ruta `/r/[code]`, admin `EncodeNfcSchema` y upload `deviceCode`.
 *
 * NORMALIZACIÓN (anti-variaciones del escáner NFC): los chips grabados y los
 * teclados físicos de taller producen el mismo folio en mayúsculas, minúsculas
 * o con espacios sueltos. Se recorta primero, se validan las longitudes sobre
 * el valor crudo (4..32 ANTES de normalizar, para no medir una mutación) y
 * SOLO DESPUÉS se transforma a mayúsculas; el `.regex` final se aplica sobre
 * el valor ya normalizado mediante `.pipe`, por lo que "SAFE-0001" y
 * "safe-0001" son aceptados y producidos idénticamente. TS infiere `string`
 * de principio a fin (entrada string, salida string).
 */
export const DeviceCodeSchema = z
  .string({
    required_error: "El código del casco es obligatorio.",
    invalid_type_error: "El código del casco debe escribirse como texto.",
  })
  .trim()
  .min(4, "El código del casco debe tener al menos 4 caracteres.")
  .max(32, "El código del casco no puede superar los 32 caracteres.")
  .transform((value) => value.toUpperCase())
  .pipe(z.string().regex(/^[A-Z0-9-]+$/, "El código del casco solo puede usar letras, números y guiones."));

/**
 * Alias del folio como PARÁMETRO DE RUTA (ej. `/r/[code]` y los handlers que
 * leen `params.code`). Existe como nombre propio para que la intención sea
 * explícita en los route handlers y el Ledger (§7) la documenta como export
 * congelado; su reglas son idénticas a `DeviceCodeSchema`.
 */
export const DeviceCodeParamSchema = DeviceCodeSchema;

/**
 * Correo electrónico para inicio de sesión, activación y avisos a familiares.
 * Se recortan los espacios y se normaliza a minúsculas antes de validar, para
 * que "Juan@Gmail.com " y "juan@gmail.com" sean la misma identidad. Máximo 254
 * caracteres (límite práctico RFC 5322 / SMTP).
 * Consumido por: ActivateDeviceSchema, LoginSchema y cada contacto de emergencia.
 */
export const EmailSchema = z
  .string({
    required_error: "El correo electrónico es obligatorio.",
    invalid_type_error: "El correo electrónico debe escribirse como texto.",
  })
  .trim()
  .toLowerCase()
  .email("Escribe un correo electrónico válido, por ejemplo nombre@dominio.com.")
  .max(254, "El correo electrónico no puede superar los 254 caracteres.");

/**
 * Contraseña de la sesión del conductor. Mínimo 8 caracteres (política de
 * fuerza bruta del Ledger §2) y máximo 128 (cota de bcrypt: los bytes más
 * allá se ignorarían en silencio, así que se rechazan de frente).
 * Consumido por: ActivateDeviceSchema y LoginSchema.
 */
export const PasswordSchema = z
  .string({
    required_error: "La contraseña es obligatoria.",
    invalid_type_error: "La contraseña debe escribirse como texto.",
  })
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(128, "La contraseña no puede superar los 128 caracteres.");

/**
 * PIN confidencial de 6 dígitos impreso en la tarjeta dentro del empaque.
 * Se mantiene como STRING (nunca número) para conservar los ceros iniciales:
 * el PIN "004921" es válido y perder los ceros lo convertiría en otro PIN.
 * Consumido por: ActivateDeviceSchema y la verificación anti-fuerza-bruta de
 * `/api/devices/activate` (comparación con hash bcrypt de tiempo constante).
 */
export const PinSchema = z
  .string({
    required_error: "El PIN de activación de 6 dígitos es obligatorio.",
    invalid_type_error: "El PIN debe escribirse como texto de 6 dígitos.",
  })
  .trim()
  .length(6, "El PIN de activación debe tener exactamente 6 dígitos.")
  .regex(/^\d{6}$/, "El PIN de activación solo puede contener dígitos numéricos.");

/**
 * Teléfono de contacto (fijo o celular, local o internacional). Admite el
 * signo `+` inicial, dígitos, espacios, guiones y paréntesis de marcación.
 * 7..20 caracteres totales, con el patrón congelado {6,19} sobre la parte
 * nacional y un refinado final que exige AL MENOS 7 DÍGITOS reales, para
 * rechazar adornos como "+ (---)" que pasarían un regex laxo.
 * Consumido por: EmergencyContactSchema.phone y los formularios de perfil.
 */
export const PhoneSchema = z
  .string({
    required_error: "El teléfono de contacto es obligatorio.",
    invalid_type_error: "El teléfono debe escribirse como texto.",
  })
  .trim()
  .min(7, "El teléfono debe tener al menos 7 caracteres.")
  .max(20, "El teléfono no puede superar los 20 caracteres.")
  .regex(/^\+?[0-9\s()\-]{6,19}$/, "El teléfono solo puede usar números, espacios, guiones y paréntesis. Ejemplo: +593 99 123 4567.")
  .refine(
    (value) => (value.match(/\d/g) ?? []).length >= 7,
    "El teléfono debe contener al menos 7 dígitos para poder marcarlo.",
  );

/**
 * Catálogo clínico canónico de grupos sanguíneos estándar (ABO/Rh).
 * Erradicado 'DESCONOCIDO' por exigencia de seguridad médica en carretera.
 * Se añade 'OTRO' para requerir especificación obligatoria de variantes raras.
 */
export const STANDARD_BLOOD_TYPES = [
  "O+",
  "O-",
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
] as const;

export const BLOOD_TYPES = [
  ...STANDARD_BLOOD_TYPES,
  "OTRO",
] as const;

/**
 * Validación del grupo sanguíneo declarado por el motociclista. Consumido por
 * ActivateDeviceSchema y ProfileUpdateSchema; se almacena en MedicalProfile
 * y se muestra en la ficha médica pública de emergencia (vista `/emergency/[code]`).
 * Prohíbe explícitamente 'DESCONOCIDO' y acepta formatos estándar o especificaciones 'OTRO: ...'.
 */
export const BloodTypeSchema = z
  .string({
    required_error: "El grupo sanguíneo es obligatorio.",
    invalid_type_error: "El grupo sanguíneo debe escribirse como texto.",
  })
  .trim()
  .min(2, "Selecciona o especifica un tipo de sangre válido.")
  .max(60, "El grupo sanguíneo no puede superar los 60 caracteres.")
  .refine(
    (val) => val.toUpperCase() !== "DESCONOCIDO",
    "El grupo sanguíneo no puede ser 'DESCONOCIDO'. Selecciona tu tipo real u OTRO especificando tu caso.",
  );

/**
 * Un familiar o persona de auxilio registrado en el JSONB `emergencyContacts`
 * de MedicalProfile (contrato §4 del documento de Base de Datos). Es estricto:
 * RECHAZA cualquier campo adicional enviado por un formulario adulterado.
 *
 * El campo `id` es un UUID generado en el CLIENTE (repetidor del formulario
 * de activación) para que cada tarjeta de contacto tenga identidad estable
 * al editar, duplicar o eliminar antes de llegar al servidor; el servidor lo
 * conserva tal cual dentro del JSON.
 */
export const EmergencyContactSchema = z.strictObject({
  /** UUID del contacto generado en el cliente; debe ser un identificador válido. */
  id: z
    .string({ required_error: "El identificador del contacto es obligatorio." })
    .trim()
    .uuid("Identificador del contacto inválido."),
  /** Nombre completo de la persona de auxilio. */
  name: z
    .string({ required_error: "El nombre del contacto es obligatorio." })
    .trim()
    .min(2, "El nombre del contacto debe tener al menos 2 letras.")
    .max(100, "El nombre del contacto no puede superar los 100 caracteres."),
  /** Parentesco o relación con el conductor (Madre, Esposa, Hermano, Amigo...). */
  relation: z
    .string({ required_error: "Indica la relación o parentesco del contacto." })
    .trim()
    .min(2, "La relación debe tener al menos 2 caracteres.")
    .max(60, "La relación no puede superar los 60 caracteres."),
  /** Teléfono directo para la llamada/WhatsApp de aviso inmediato. */
  phone: PhoneSchema,
  /** Correo que recibirá la alerta con el enlace exacto a Google Maps. */
  email: EmailSchema,
  /** Marca opcional del contacto primario (quien responde primero). */
  isPrimary: z.boolean().optional(),
});

/**
 * Tipo TypeScript de un contacto de emergencia, espejo del elemento del JSONB
 * `emergencyContacts` que persiste Prisma en PostgreSQL.
 */
export type EmergencyContact = z.infer<typeof EmergencyContactSchema>;

/**
 * Lista completa de contactos de emergencia (entre 1 y 20 personas).
 * Garantías adicionales por `superRefine`: identificadores `id` únicos y
 * correos únicos sin distinguir mayúsculas/minúsculas, porque dos copias del
 * mismo correo duplicarían los envíos SMTP y aterrorizarían dos veces al
 * mismo familiar. Consumido por ActivateDeviceSchema y ProfileUpdateSchema.
 */
export const EmergencyContactsSchema = z
  .array(EmergencyContactSchema)
  .min(1, "Debe registrar al menos un contacto de emergencia.")
  .max(20, "No puedes registrar más de 20 contactos de emergencia.")
  .superRefine((contacts, ctx) => {
    const seenIds = new Set<string>();
    const seenEmails = new Set<string>();

    contacts.forEach((contact, index) => {
      if (seenIds.has(contact.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, "id"],
          message: "Este contacto se repite en la lista; elimínalo o crea uno nuevo.",
        });
      }
      seenIds.add(contact.id);

      const normalizedEmail = contact.email.toLowerCase();
      if (seenEmails.has(normalizedEmail)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, "email"],
          message: "El mismo correo ya pertenece a otro contacto de emergencia.",
        });
      }
      seenEmails.add(normalizedEmail);
    });
  });

/**
 * Latitud GPS en grados decimales WGS84, rango físico [-90, 90].
 * Se consume en `latitude` de EmergencyAlertSchema y en lat de HeartbeatSchema.
 * Estrictamente numérico: el sensor del móvil siempre entrega números, y un
 * string aquí sería señal de un envío manipulado.
 */
export const LatitudeSchema = z
  .number({
    required_error: "La latitud GPS es obligatoria.",
    invalid_type_error: "La latitud debe ser un número decimal (ej. -0.1807).",
  })
  .min(-90, "La latitud está fuera del planeta (mínimo -90).")
  .max(90, "La latitud está fuera del planeta (máximo 90).");

/**
 * Longitud GPS en grados decimales WGS84, rango físico [-180, 180].
 * Se consume junto a LatitudeSchema; la dupla alimenta la conversión DMS y
 * el enlace directo de Google Maps del correo de alerta.
 */
export const LongitudeSchema = z
  .number({
    required_error: "La longitud GPS es obligatoria.",
    invalid_type_error: "La longitud debe ser un número decimal (ej. -78.4678).",
  })
  .min(-180, "La longitud está fuera del planeta (mínimo -180).")
  .max(180, "La longitud está fuera del planeta (máximo 180).");

/**
 * Idioma preferido para los correos de alerta y la interfaz (bilingüe ES/EN
 * del skill safe-bilingual-i18n). Por defecto español: el conductor típico
 * de SAFE opera en LatAm.
 */
export const LocaleSchema = z.enum(["es", "en"], {
  errorMap: () => ({ message: "El idioma debe ser español (es) o inglés (en)." }),
}).default("es");

/**
 * Fecha en formato ISO 8601 (nacimiento, consentimiento, etc.). Exige una
 * forma AAAA-MM-DD con hora opcional y luego intenta la conversión real:
 * fechas inexistentes como "2026-02-30" son rechazadas porque el motor de
 * fechas las produce inválidas. La SALIDA es una instancia `Date` lista para
 * Prisma/PostgreSQL; el navegador puede enviar `null` o no enviar el campo.
 * Consumido por `birthDate` en ActivateDeviceSchema y ProfileUpdateSchema.
 */
export const IsoDateSchema = z
  .string({
    required_error: "La fecha es obligatoria.",
    invalid_type_error: "La fecha debe enviarse como texto con formato AAAA-MM-DD.",
  })
  .trim()
  .regex(
    /^[1-9]\d{3}-\d{2}-\d{2}([Tt ]\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?([Zz]|[+-]\d{2}:?\d{2})?)?$/,
    "La fecha debe usar el formato AAAA-MM-DD (por ejemplo 1995-08-22).",
  )
  .transform((value) => new Date(value))
  .refine(
    (date) => !Number.isNaN(date.getTime()),
    "La fecha enviada no corresponde a un día real del calendario.",
  );
