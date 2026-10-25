/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Activación de Kit — Estado y Validación del Formulario (Hook)
 * ARCHIVO: src/app/activate/[code]/activate-form.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Hook `useActivateForm` que concentra TODO el estado del flujo de activación
 * (PIN, cuenta, fotografía real de Cloudinary, ficha médica, contactos con UUID
 * de cliente, consentimiento legal) y orquesta el envío en dos fases:
 *   1. Validación local previa con el esquema REAL del backend
 *      (`ActivateDeviceSchema`, consumo de solo lectura): si falla, el issue de
 *      Zod se TRADUCE a lenguaje humano del idioma activo con etiquetas del
 *      diccionario (hallazgos #16/#15: jamás se exhibe el español crudo del
 *      esquema con jerga técnica en locale EN). Cero textos inventados.
 *   2. Envío del payload PLANO vía `activateKit` (./activate-api.ts). En éxito
 *      guarda el resultado real (redirect + deviceCode + user); en fallo
 *      expone el mensaje humano del backend o null para que la página coloque
 *      la clave genérica del diccionario.
 * La háptica NO se dispara aquí: la página decide el patrón sensorial.
 *
 * ENTRADAS: `code` (folio ya normalizado por la página) y `locale` ("es"/"en").
 * SALIDAS:  valores, setters individuales, addContact, submit() y estados de
 *           envío (isSubmitting, errorMessage, hasFailed, successResult).
 *
 * DEPENDENCIAS CLAVE: ActivateDeviceSchema (src/lib/schemas/activate.schema.ts,
 * SOLO LECTURA), EmergencyContactFormDTO (custodiado por F-03), activate-api.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero mocks y cero fallbacks: el estado inicial es siempre vacío.
 * - Cabecera canónica y comentarios en español.
 * ==============================================================================
 */

"use client";

import { useCallback, useState } from "react";

import { ActivateDeviceSchema } from "@/lib/schemas/activate.schema";
import { getDictionary, type Dictionary, type Locale } from "@/locales";
import type { EmergencyContactFormDTO } from "@/components/medical/medical-contact.types";

import {
  activateKit,
  HumanApiError,
  type ActivateKitPayload,
  type ActivateKitResult,
} from "./activate-api";

/**
 * Estado visual de la fotografía de rostro: URL real (https) entregada por el
 * selector tras la subida al servicio seguro de medios, más el identificador
 * público opcional del asset para permitir su gestión posterior.
 */
export interface ActivatePhotoState {
  photoUrl: string;
  photoPublicId?: string;
}

/**
 * Forma mínima de un issue de validación Zod: sólo lo necesario para la
 * traducción humana (código del fallo y ruta del campo). Estructuralmente
 * compatible con z.ZodIssue sin importar zod en la capa de vista.
 */
interface ValidationIssue {
  code: string;
  path: (string | number)[];
}

/**
 * Traduce el primer issue de la validación previa al envío a lenguaje humano
 * del IDIOMA ACTIVO (hallazgos #16/#15). Reglas:
 * - Campo reconocible → `${etiqueta oficial del diccionario}: campo obligatorio`.
 * - PIN con formato inválido → t.activate.errorPinInvalid (frase dedicada).
 * - Consentimiento legal → frase completa con t.activate.acceptTermsPre.
 * - Ruta no reconocible → t.common.errorGeneric.
 * Nunca se exhibe el mensaje crudo del esquema (español con jerga del backend).
 */
function humanizeValidationIssue(issue: ValidationIssue | undefined, t: Dictionary): string {
  const root = String(issue?.path[0] ?? "");

  // Consentimiento legal: frase completa ensamblada con claves existentes.
  if (root === "termsAccepted") {
    return `${t.activate.acceptTermsPre} ${t.common.termsLink}`;
  }

  // PIN confidencial: ausente → campo obligatorio; formato inválido → frase propia.
  if (root === "activationPin") {
    return issue?.code === "invalid_type"
      ? `${t.activate.pinLabel}: ${t.common.requiredField}`
      : t.activate.errorPinInvalid;
  }

  // Contactos de emergencia: si la ruta penetra el repetidor, se nombra el
  // subcampo concreto; si el fallo es de la lista completa, el título general.
  if (root === "emergencyContacts") {
    const subfield = String(issue?.path[2] ?? "");
    const contactLabel =
      subfield === "name" ? t.activate.contactNameLabel
      : subfield === "phone" ? t.activate.contactPhoneLabel
      : subfield === "relation" ? t.activate.contactRelationshipLabel
      : subfield === "email" ? t.activate.emailLabel
      : null;
    return `${contactLabel ?? t.activate.contactsTitle}: ${t.common.requiredField}`;
  }

  // Resto de campos raíz reconocibles → etiqueta oficial + campo obligatorio.
  const labelByRoot: Record<string, string> = {
    fullName: t.activate.fullNameLabel,
    nationalId: t.activate.nationalIdLabel,
    email: t.activate.emailLabel,
    password: t.activate.passwordLabel,
    photoUrl: t.activate.photoLabel,
    bloodType: t.activate.bloodTypeLabel,
  };
  const label = labelByRoot[root];
  if (label) {
    return `${label}: ${t.common.requiredField}`;
  }

  // Ruta no reconocible (folio, idioma, claves extra): sólo la frase genérica.
  return t.common.errorGeneric;
}

/**
 * Hook de estado completo del formulario de activación del kit.
 * @param code   Folio del casco (trim + mayúsculas, aplicado por la página).
 * @param locale Idioma activo del conductor; viaja al backend para los correos.
 */
export function useActivateForm(code: string, locale: Locale) {
  // Paso 1 — PIN confidencial y credenciales de la nueva cuenta.
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Paso 2 — Fotografía de rostro (inicial vacío: sin foto fabricada).
  const [photo, setPhoto] = useState<ActivatePhotoState>({ photoUrl: "" });

  // Paso 3 — Ficha médica personal. bloodType inicia en "" (placeholder
  // deshabilitado del select) para forzar una decisión consciente del catálogo.
  const [fullName, setFullName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [allergies, setAllergies] = useState("");
  const [chronicConditions, setChronicConditions] = useState("");
  const [medications, setMedications] = useState("");
  const [insuranceInfo, setInsuranceInfo] = useState("");

  // Paso 4 — Contactos de emergencia (inicial vacío: cero familiares demo).
  const [contacts, setContacts] = useState<EmergencyContactFormDTO[]>([]);

  // Paso 5 — Consentimiento legal y estados de envío.
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasFailed, setHasFailed] = useState(false);
  const [successResult, setSuccessResult] = useState<ActivateKitResult | null>(null);

  /**
   * Añade un contacto vacío con un UUID REAL generado en el cliente
   * (crypto.randomUUID): el esquema del backend exige identificador UUID y
   * rechaza los ids artesanales tipo "cnt_...".
   */
  const addContact = useCallback(() => {
    setContacts((previous) => [
      ...previous,
      { id: crypto.randomUUID(), name: "", relation: "", phone: "", email: "" },
    ]);
  }, []);

  /**
   * Construye el candidato PLANO a validar: refleja con exactitud las claves
   * de ActivateDeviceSchema. Los campos clínicos opcionales solo se incluyen
   * cuando el conductor los declaró (texto no vacío), evitando claves superfluas.
   */
  const buildCandidate = useCallback((): Record<string, unknown> => {
    const candidate: Record<string, unknown> = {
      code,
      activationPin: pin,
      email,
      password,
      fullName,
      nationalId,
      photoUrl: photo.photoUrl,
      bloodType,
      emergencyContacts: contacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        relation: contact.relation,
        phone: contact.phone,
        email: contact.email,
        ...(contact.isPrimary !== undefined ? { isPrimary: contact.isPrimary } : {}),
      })),
      // Solo el literal true satisface el consentimiento; false genera el
      // mensaje humano del propio esquema ("Debe aceptar los Términos…").
      termsAccepted: termsAccepted === true,
      locale,
    };

    if (photo.photoPublicId !== undefined) candidate.photoPublicId = photo.photoPublicId;
    if (allergies.trim().length > 0) candidate.allergies = allergies.trim();
    if (chronicConditions.trim().length > 0) candidate.chronicConditions = chronicConditions.trim();
    if (medications.trim().length > 0) candidate.medications = medications.trim();
    if (insuranceInfo.trim().length > 0) candidate.insuranceInfo = insuranceInfo.trim();

    return candidate;
  }, [
    code, pin, email, password, photo, fullName, nationalId, bloodType,
    allergies, chronicConditions, medications, insuranceInfo, contacts,
    termsAccepted, locale,
  ]);

  /**
   * Valida con el esquema real del backend y, si todo pasa, envía la carga.
   * @returns true cuando la activación fue aceptada (successResult disponible);
   *          false en cualquier fallo (errorMessage/hasFailed actualizados).
   */
  const submit = useCallback(async (): Promise<boolean> => {
    setErrorMessage(null);
    setHasFailed(false);

    // Fase 1 — Validación local con el esquema certificado (solo lectura).
    const validation = ActivateDeviceSchema.safeParse(buildCandidate());
    if (!validation.success) {
      // Traducción humana en el idioma activo: el mensaje crudo del esquema
      // (español con jerga técnica) jamás llega a la pantalla del conductor.
      setErrorMessage(humanizeValidationIssue(validation.error.issues[0], getDictionary(locale)));
      setHasFailed(true);
      return false;
    }

    // Fase 2 — Envío con los valores ya normalizados por el esquema
    // (folio en mayúsculas, correo en minúsculas, textos recortados).
    const data = validation.data;
    setIsSubmitting(true);
    try {
      const payload: ActivateKitPayload = {
        code: data.code,
        activationPin: data.activationPin,
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        nationalId: data.nationalId,
        photoUrl: data.photoUrl,
        photoPublicId: data.photoPublicId,
        bloodType: data.bloodType,
        allergies: data.allergies,
        chronicConditions: data.chronicConditions,
        medications: data.medications,
        insuranceInfo: data.insuranceInfo,
        emergencyContacts: data.emergencyContacts,
        termsAccepted: true,
        locale: data.locale,
      };
      const result = await activateKit(payload);
      setSuccessResult(result);
      return true;
    } catch (error) {
      setHasFailed(true);
      if (error instanceof HumanApiError) {
        // humanMessage puede ser null (red caída): la página coloca la clave
        // genérica del diccionario. Jamás se fabrica un mensaje alternativo.
        setErrorMessage(error.humanMessage);
      } else {
        setErrorMessage(null);
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [buildCandidate, locale]);

  return {
    // Paso 1 — PIN y cuenta (valores + setters individuales).
    pin, setPin,
    email, setEmail,
    password, setPassword,
    // Paso 2 — Fotografía real.
    photo, setPhoto,
    // Paso 3 — Ficha médica.
    fullName, setFullName,
    nationalId, setNationalId,
    bloodType, setBloodType,
    allergies, setAllergies,
    chronicConditions, setChronicConditions,
    medications, setMedications,
    insuranceInfo, setInsuranceInfo,
    // Paso 4 — Contactos con UUID.
    contacts, setContacts, addContact,
    // Paso 5 — Consentimiento y estados de envío.
    termsAccepted, setTermsAccepted,
    isSubmitting, errorMessage, hasFailed, successResult,
    setErrorMessage, submit,
  };
}
