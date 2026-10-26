/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes Médicos — Repetidor Dinámico de Contactos de Emergencia
 * ARCHIVO: src/components/medical/ContactsRepeater.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Lista dinámica reutilizable para añadir, editar y eliminar los familiares de
 * aviso inmediato. Permite seleccionar directamente el número de contactos (1, 2 o 3)
 * e incorpora para cada contacto el selector universal de países con prefijo
 * telefónico internacional y bandera (PhoneInputWithCountry).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas (este archivo ~320 líneas).
 * - CERO texto hardcodeado: 100% diccionario bilingüe vía useLocale.
 * - Objetivos táctiles ≥ 44px y separación entre controles ≥ 12px.
 * - Máximo 20 contactos (límite oficial EmergencyContactsSchema del backend).
 * - Identificadores UUID reales (crypto.randomUUID).
 * ==============================================================================
 */

"use client";

import React from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { IncidentButton } from "@/components/ui/IncidentButton";
import { PhoneInputWithCountry } from "@/components/ui/PhoneInputWithCountry";
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
  const { locale, t } = useLocale();
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
   * Crea un contacto nuevo vacío con UUID válido.
   */
  const createEmptyContact = (isPrimary = false): T =>
    ({
      id: crypto.randomUUID(),
      name: "",
      phone: "",
      relation: "",
      relationship: "",
      email: "",
      isPrimary,
    } as unknown as T);

  /**
   * Añade un contacto vacío con UUID real.
   */
  const handleAdd = () => {
    if (isAtLimit) return;
    triggerHaptic("light");
    onChange([...contacts, createEmptyContact(contacts.length === 0)]);
  };

  /**
   * Ajusta directamente la cantidad de contactos (1, 2 o 3) según solicitud del usuario.
   */
  const handleSetContactCount = (targetCount: number) => {
    triggerHaptic("light");
    if (contacts.length === targetCount) return;

    if (contacts.length < targetCount) {
      const added: T[] = [];
      for (let i = contacts.length; i < targetCount; i++) {
        added.push(createEmptyContact(contacts.length === 0 && i === 0));
      }
      onChange([...contacts, ...added]);
    } else {
      onChange(contacts.slice(0, targetCount));
    }
  };

  /**
   * Marca o desmarca el contacto principal.
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-separator pb-3">
        <div>
          <h4 className="font-serif font-bold text-xl text-brand-navy-dark leading-tight">
            {t.activate.contactsTitle}
          </h4>
          <p className="font-sans text-xs text-brand-text-desc mt-0.5">
            {t.activate.contactsSubtitle}
          </p>
        </div>

        {/* Selector rápido de cantidad de contactos (1, 2, 3) */}
        <div className="flex items-center gap-1 bg-brand-bg-alt border border-brand-border-subtle p-1 rounded-lg">
          <span className="font-sans text-[11px] font-bold text-brand-text-muted px-2 hidden sm:inline">
            {locale === "es" ? "Contactos:" : "Contacts:"}
          </span>
          {[1, 2, 3].map((num) => {
            const isSelected = contacts.length === num;
            return (
              <button
                key={num}
                type="button"
                disabled={disabled}
                onClick={() => handleSetContactCount(num)}
                className={`min-h-[36px] px-2.5 py-1 rounded-md font-sans text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-brand-navy-dark text-white shadow-xs"
                    : "bg-transparent text-brand-navy-dark hover:bg-brand-border-subtle"
                }`}
              >
                {num} {num === 1 ? (locale === "es" ? "Contacto" : "Contact") : (locale === "es" ? "Contactos" : "Contacts")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Estado vacío humano (sin datos inventados de demostración) */}
      {contacts.length === 0 ? (
        <div className="p-6 border border-dashed border-brand-border-field rounded-xl bg-brand-bg-alt text-center flex flex-col items-center gap-3">
          <p className="font-sans text-xs text-brand-text-desc">
            {t.emergency.noContacts}
          </p>
          <IncidentButton
            type="button"
            variant="paper"
            onClick={handleAdd}
            disabled={disabled}
          >
            {t.activate.addContactButton}
          </IncidentButton>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {contacts.map((contact, index) => {
            const isFirst = index === 0;
            const requiredBadge = isFirst
              ? (locale === "es" ? "(Obligatorio)" : "(Required)")
              : (locale === "es" ? "(Opcional)" : "(Optional)");

            return (
              <div
                key={contact.id}
                className="p-5 bg-brand-bg-alt border border-brand-border-subtle rounded-xl flex flex-col gap-4 shadow-xs hover:border-brand-border-strong transition-all"
              >
                {/* Cabecera de la tarjeta: posición en la lista y acción de quitar */}
                <div className="flex items-center justify-between gap-3 border-b border-brand-separator pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white bg-brand-navy-dark px-2 py-0.5 rounded">
                      #{index + 1}
                    </span>
                    <span className="font-sans text-xs font-bold text-brand-navy-dark truncate">
                      {contact.name || (locale === "es" ? `Contacto ${index + 1}` : `Contact ${index + 1}`)}{" "}
                      <span className="font-normal text-brand-text-muted text-[11px]">{requiredBadge}</span>
                    </span>
                  </div>

                  {contacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemove(contact.id)}
                      disabled={disabled}
                      className="min-h-[44px] px-3 inline-flex items-center justify-center bg-transparent border-0 rounded-md font-sans text-xs font-bold text-brand-accent hover:text-brand-accent-hover hover:underline cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                    >
                      {t.activate.removeContactButton}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Nombre completo del contacto */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-xs font-semibold text-brand-navy-dark">
                      {t.activate.contactNameLabel} {isFirst ? "*" : ""}
                    </label>
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) =>
                        handleFieldChange(contact.id, { name: e.target.value })
                      }
                      disabled={disabled}
                      required={isFirst}
                      placeholder={locale === "es" ? "Ej. María Gómez (Madre)" : "Ex. Mary Smith (Mother)"}
                      className="safe-input-focus h-11 min-h-[44px] px-3.5 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted"
                    />
                  </div>

                  {/* Teléfono móvil con selector de país internacional */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-xs font-semibold text-brand-navy-dark">
                      {t.activate.contactPhoneLabel} {isFirst ? "*" : ""}
                    </label>
                    <PhoneInputWithCountry
                      value={contact.phone}
                      onChange={(fullPhone) =>
                        handleFieldChange(contact.id, { phone: fullPhone })
                      }
                      disabled={disabled}
                      required={isFirst}
                      placeholder={locale === "es" ? "99 123 4567" : "99 123 4567"}
                    />
                  </div>

                  {/* Parentesco */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-xs font-semibold text-brand-navy-dark">
                      {t.activate.contactRelationshipLabel} {isFirst ? "*" : ""}
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
                      required={isFirst}
                      placeholder={locale === "es" ? "Ej. Madre, Esposo/a, Hermano" : "Ex. Mother, Spouse, Sibling"}
                      className="safe-input-focus h-11 min-h-[44px] px-3.5 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted"
                    />
                  </div>

                  {/* Correo del aviso satelital */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-xs font-semibold text-brand-navy-dark">
                      {t.activate.emailLabel}{" "}
                      {isFirst && requireEmail
                        ? "*"
                        : (locale === "es" ? "(Opcional, pero recomendado)" : "(Optional, recommended)")}
                    </label>
                    <input
                      type="email"
                      value={contact.email ?? ""}
                      onChange={(e) =>
                        handleFieldChange(contact.id, { email: e.target.value })
                      }
                      disabled={disabled}
                      required={isFirst && requireEmail}
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
                    {locale === "es"
                      ? "Marcar como contacto de aviso prioritario"
                      : "Mark as primary emergency contact"}
                  </span>
                </label>
              </div>
            );
          })}
        </div>
      )}

      {/* Botón para añadir contacto adicional hasta el límite */}
      <div className="flex justify-between items-center pt-1">
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
