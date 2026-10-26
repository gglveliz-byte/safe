/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes Médicos — Repetidor Dinámico de Contactos de Emergencia
 * ARCHIVO: src/components/medical/ContactsRepeater.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Lista dinámica reutilizable para añadir, editar y eliminar los familiares de
 * aviso inmediato. Se construye como GENÉRICO estructural
 * (<T extends ContactEditableBase>) para que DOS consumidores con formas
 * distintas compartan el mismo componente sin cambiar su propio código:
 *   - Panel del conductor (Director 2): pasa EmergencyContact[] de api-types
 *     (relationship obligatorio, relation opcional).
 *   - Formulario de activación (Frontend 1): usa la forma del DTO del backend
 *     (relation y email obligatorios).
 * El campo de parentesco LEE `relation ?? relationship` y al escribir SETEA
 * AMBOS campos, así el api-client (que normaliza relation || relationship) y
 * el esquema Zod del backend (que exige relation) quedan siempre consistentes.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas (objetivo < 450).
 * - CERO texto hardcodeado: 100% diccionario bilingüe vía useLocale.
 * - Objetivos táctiles ≥ 44px y separación entre controles ≥ 12px.
 * - Máximo 20 contactos (límite oficial EmergencyContactsSchema del backend).
 * - Identificadores UUID reales (crypto.randomUUID), nunca patrones inventados.
 * ==============================================================================
 */

"use client";

import React from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { IncidentButton } from "@/components/ui/IncidentButton";
import {
  MAX_EMERGENCY_CONTACTS,
  type ContactEditableBase,
} from "./medical-contact.types";

/** Props públicos CONGELADOS del repetidor de contactos (genérico estructural). */
export interface ContactsRepeaterProps<
  T extends ContactEditableBase = ContactEditableBase,
> {
  /** Lista actual de contactos (cualquier forma compatible con la base editable). */
  contacts: T[];
  /** Emite la lista completa tras cada cambio (patrón puro: nunca muta el estado ajeno). */
  onChange: (contacts: T[]) => void;
  /** Bloquea la edición mientras se guarda la ficha. */
  disabled?: boolean;
  /** Exige el correo del contacto como obligatorio (el flujo de activación lo requiere). */
  requireEmail?: boolean;
}

/**
 * Repetidor dinámico de contactos de emergencia.
 * Genérico sobre T (base editable): compila con el EmergencyContact del panel
 * del Director 2 y con el DTO del formulario de activación sin adaptadores.
 */
export function ContactsRepeater<T extends ContactEditableBase>({
  contacts,
  onChange,
  disabled = false,
  requireEmail = false,
}: ContactsRepeaterProps<T>) {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  // Tope oficial del backend: al llegar a 20 contactos se deshabilita añadir más
  const isAtLimit = contacts.length >= MAX_EMERGENCY_CONTACTS;

  /**
   * Crea una copia modificada del contacto conservando los campos adicionales
   * del genérico T (el spread aporta todas las propiedades existentes).
   */
  const patchContact = (original: T, changes: Partial<ContactEditableBase>): T =>
    ({ ...original, ...changes }) as T;

  /** Aplica cambios parciales a un contacto identificado y emite la lista nueva. */
  const handleFieldChange = (id: string, changes: Partial<ContactEditableBase>) => {
    onChange(
      contacts.map((c) => (c.id === id ? patchContact(c, changes) : c)),
    );
  };

  /**
   * Añade un contacto vacío con UUID real. El backend exige identificadores
   * UUID válidos en EmergencyContactSchema (el patrón viejo "cnt_..." era
   * inválido y provocaba rechazo en la activación).
   */
  const handleAdd = () => {
    if (isAtLimit) return;
    // Cast de compatibilidad dual: el objeto literal satisface a la vez el
    // EmergencyContact del panel del Director 2 (relationship obligatorio) y
    // el EmergencyContactFormDTO del backend (relation y email obligatorios);
    // por eso se rellenan AMBOS parentescos y el correo vacío desde el inicio.
    const newContact = {
      id: crypto.randomUUID(),
      name: "",
      phone: "",
      relation: "",
      relationship: "",
      email: "",
      isPrimary: false,
    } as unknown as T;
    onChange([...contacts, newContact]);
  };

  /**
   * Marca o desmarca el contacto principal. Al activar uno se desactivan los
   * demás: el backend solo acepta un flujo coherente con un único principal.
   */
  const handlePrimaryChange = (id: string, checked: boolean) => {
    triggerHaptic("light");
    onChange(
      contacts.map((c) =>
        patchContact(c, { isPrimary: checked ? c.id === id : false }),
      ),
    );
  };

  /** Elimina un contacto de la lista con retroalimentación háptica de advertencia. */
  const handleRemove = (id: string) => {
    triggerHaptic("warning");
    onChange(contacts.filter((c) => c.id !== id));
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Encabezado de sección con títulos del diccionario bilingüe */}
      <div>
        <h4 className="font-serif font-bold text-heading-sm text-ink leading-tight">
          {t.activate.contactsTitle}
        </h4>
        <p className="font-sans text-micro text-carbon mt-0.5">
          {t.activate.contactsSubtitle}
        </p>
      </div>

      {/* Estado vacío humano (sin datos inventados de demostración) */}
      {contacts.length === 0 ? (
        <div className="p-4 border border-dashed border-mist rounded-[8px] bg-paper text-center">
          <p className="font-sans text-micro text-carbon">
            {t.emergency.noContacts}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {contacts.map((contact, index) => (
            <div
              key={contact.id}
              className="p-5 bg-brand-bg-alt border border-brand-border-subtle rounded-xl flex flex-col gap-4 shadow-xs"
            >
              {/* Cabecera de la tarjeta: posición en la lista y acción de quitar */}
              <div className="flex items-center justify-between gap-3 border-b border-brand-separator pb-3">
                <span className="font-sans text-xs font-bold text-brand-navy-dark truncate">
                  {index + 1}. {contact.name || t.activate.contactNameLabel}
                </span>

                <button
                  type="button"
                  onClick={() => handleRemove(contact.id)}
                  disabled={disabled}
                  className="min-h-[44px] px-3 inline-flex items-center justify-center bg-transparent border-0 rounded-md font-sans text-xs font-bold text-brand-accent hover:text-brand-accent-hover hover:underline cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  {t.activate.removeContactButton}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Nombre completo del contacto */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-xs font-semibold text-brand-navy-dark">
                    {t.activate.contactNameLabel}
                  </label>
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(e) =>
                      handleFieldChange(contact.id, { name: e.target.value })
                    }
                    disabled={disabled}
                    required
                    placeholder={t.activate.contactNameLabel}
                    className="safe-input-focus h-11 min-h-[44px] px-3.5 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted"
                  />
                </div>

                {/* Teléfono móvil con código de país */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-xs font-semibold text-brand-navy-dark">
                    {t.activate.contactPhoneLabel}
                  </label>
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) =>
                      handleFieldChange(contact.id, { phone: e.target.value })
                    }
                    disabled={disabled}
                    required
                    placeholder={t.activate.contactPhoneLabel}
                    className="safe-input-focus h-11 min-h-[44px] px-3.5 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted"
                  />
                </div>

                {/* Parentesco */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-xs font-semibold text-brand-navy-dark">
                    {t.activate.contactRelationshipLabel}
                  </label>
                  <input
                    type="text"
                    value={contact.relation ?? contact.relationship ?? ""}
                    onChange={(e) =>
                      handleFieldChange(contact.id, {
                        relation: e.target.value,
                        relationship: e.target.value,
                      })
                    }
                    disabled={disabled}
                    required
                    placeholder={t.activate.contactRelationshipLabel}
                    className="safe-input-focus h-11 min-h-[44px] px-3.5 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted"
                  />
                </div>

                {/* Correo del aviso satelital */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-xs font-semibold text-brand-navy-dark">
                    {t.activate.emailLabel}
                  </label>
                  <input
                    type="email"
                    value={contact.email ?? ""}
                    onChange={(e) =>
                      handleFieldChange(contact.id, { email: e.target.value })
                    }
                    disabled={disabled}
                    required={requireEmail}
                    placeholder={t.activate.emailPlaceholder}
                    className="safe-input-focus h-11 min-h-[44px] px-3.5 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted"
                  />
                </div>
              </div>

              {/* Contacto principal */}
              <label className="flex items-center gap-3 min-h-[44px] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={Boolean(contact.isPrimary)}
                  onChange={(e) =>
                    handlePrimaryChange(contact.id, e.target.checked)
                  }
                  disabled={disabled}
                  className="h-4 w-4 rounded border-brand-border-field text-brand-navy-dark accent-brand-navy-dark cursor-pointer flex-shrink-0"
                />
                <span className="font-sans text-xs font-semibold text-brand-navy-dark">
                  {t.emergency.emergencyContacts}
                </span>
              </label>
            </div>
          ))}
        </div>
      )}

      {/* Añadir otro familiar */}
      <div>
        <IncidentButton
          type="button"
          variant="paper"
          onClick={handleAdd}
          disabled={disabled || isAtLimit}
          className="w-full sm:w-auto"
        >
          {t.activate.addContactButton}
        </IncidentButton>
      </div>
    </div>
  );
}
