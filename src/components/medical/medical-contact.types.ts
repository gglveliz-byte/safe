/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes Médicos — Contratos de Tipos de Contactos (CONGELADOS)
 * ARCHIVO: src/components/medical/medical-contact.types.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Definiciones de tipos CONGELADAS por el Director Frontend 1 que unifican las
 * tres formas reales del contacto de emergencia en el sistema:
 *   1. ContactEditableBase: base estructural mínima del repetidor dinámico
 *      genérico (ContactsRepeater). Es deliberadamente compatible con el
 *      EmergencyContact del panel (api-types del Director 2: relationship
 *      obligatorio) y con el DTO del backend (relation obligatorio), para que
 *      ambos consumidores reutilicen el mismo componente sin cambiar sus tipos.
 *   2. EmergencyContactFormDTO: forma EXACTA de la columna JSONB
 *      emergencyContacts validada por POST /api/devices/activate vía
 *      EmergencyContactSchema (id UUID real, relation 2..60, phone, email).
 *   3. PublicEmergencyContactDTO: forma reducida que devuelve
 *      GET /api/emergency/[code] (la ficha pública NUNCA expone emails).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Cero datos hardcodeados: contratos puros y límites oficiales del backend.
 * - Comentarios canónicos en Español.
 * ==============================================================================
 */

/** Máximo de contactos de emergencia aceptado por el backend (EmergencyContactsSchema: array 1..20). */
export const MAX_EMERGENCY_CONTACTS = 20;

/**
 * Base estructural editable compatible con el EmergencyContact del Director 2
 * (api-types) y con el DTO del backend. Ambos campos de parentesco son
 * opcionales aquí para que cualquier forma concreta los satisfaga; el repetidor
 * escribe SIEMPRE los dos (relation y relationship) al editar.
 */
export interface ContactEditableBase {
  /** Identificador UUID real del contacto (crypto.randomUUID()); el backend rechaza patrones inventados. */
  id: string;
  /** Nombre completo del familiar o persona de confianza (2..100 caracteres). */
  name: string;
  /** Teléfono móvil con código de país (7..20 caracteres). */
  phone: string;
  /** Parentesco oficial exigido por el backend (opcional en la base compatible con el panel). */
  relation?: string;
  /** Campo hermano del panel del Director 2; el repetidor lo mantiene sincronizado con relation. */
  relationship?: string;
  /** Correo que recibirá el aviso satelital (obligatorio únicamente en el flujo de activación). */
  email?: string;
  /** Marca el contacto principal de aviso inmediato (solo uno por perfil). */
  isPrimary?: boolean;
}

/**
 * DTO de contacto para el formulario de activación.
 * Forma EXACTA del JSONB emergencyContacts del backend: relation obligatorio,
 * email obligatorio e id UUID validado por Zod en ActivateDeviceSchema.
 */
export interface EmergencyContactFormDTO {
  /** Identificador UUID real generado en el navegador. */
  id: string;
  /** Nombre completo del contacto. */
  name: string;
  /** Parentesco o vínculo declarado por el motociclista. */
  relation: string;
  /** Teléfono móvil con código de país. */
  phone: string;
  /** Correo destinatario del aviso de auxilio con enlace a Google Maps. */
  email: string;
  /** Indica si es el contacto principal del perfil. */
  isPrimary?: boolean;
}

/**
 * DTO de contacto en la ficha pública de emergencia.
 * El backend NO expone emails en la vista pública (privacidad médica):
 * solo identification, nombre, parentesco y teléfono de llamada directa.
 */
export interface PublicEmergencyContactDTO {
  /** Identificador UUID del contacto registrado. */
  id: string;
  /** Nombre completo del contacto. */
  name: string;
  /** Parentesco o vínculo declarado. */
  relation: string;
  /** Teléfono móvil para llamada directa del socorrista. */
  phone: string;
  /** Indica si es el contacto principal (prioridad de aviso). */
  isPrimary?: boolean;
}
