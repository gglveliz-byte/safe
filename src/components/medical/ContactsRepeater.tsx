/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes Médicos — Repetidor Dinámico de Contactos de Emergencia
 * ARCHIVO: src/components/medical/ContactsRepeater.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Administrador dinámico para agregar, editar y eliminar contactos de auxilio.
 * Permite al motociclista definir tantas personas de confianza como necesite.
 * Cada contacto almacena nombre completo, número de teléfono móvil y parentesco.
 * 
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Cero datos hardcodeados.
 * - Objetivos táctiles mínimos de 44x44px en botones de añadir y borrar.
 * ==============================================================================
 */

"use client";

import React from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import type { EmergencyContact } from "@/lib/api-client";
import { IncidentButton } from "@/components/ui/IncidentButton";

export interface ContactsRepeaterProps {
  contacts: EmergencyContact[];
  onChange: (contacts: EmergencyContact[]) => void;
  disabled?: boolean;
}

export function ContactsRepeater({
  contacts,
  onChange,
  disabled = false,
}: ContactsRepeaterProps) {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  // Añadir un nuevo contacto vacío
  const handleAdd = () => {
    triggerHaptic("light");
    const newContact: EmergencyContact = {
      id: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: "",
      phone: "",
      relationship: "",
    };
    onChange([...contacts, newContact]);
  };

  // Modificar un campo específico
  const handleFieldChange = (
    id: string,
    field: keyof EmergencyContact,
    value: string
  ) => {
    const updated = contacts.map((c) =>
      c.id === id ? { ...c, [field]: value } : c
    );
    onChange(updated);
  };

  // Eliminar un contacto
  const handleRemove = (id: string) => {
    triggerHaptic("warning");
    const updated = contacts.filter((c) => c.id !== id);
    onChange(updated);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-serif font-bold text-heading-sm text-ink leading-tight">
            {t.activate.contactsTitle}
          </h4>
          <p className="font-sans text-micro text-carbon mt-0.5">
            {t.activate.contactsSubtitle}
          </p>
        </div>
      </div>

      {/* Lista Dinámica de Contactos */}
      {contacts.length === 0 ? (
        <div className="p-4 border border-dashed border-mist rounded-[8px] bg-paper text-center">
          <p className="font-sans text-micro text-carbon">
            {t.emergency.noContacts}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {contacts.map((contact, index) => (
            <div
              key={contact.id}
              className="p-4 bg-paper border border-ink rounded-[8px] flex flex-col gap-3 relative shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-mist pb-2">
                <span className="font-sans text-micro font-bold text-carbon">
                  #{index + 1} — {contact.name || t.activate.contactNameLabel}
                </span>

                <button
                  type="button"
                  onClick={() => handleRemove(contact.id)}
                  disabled={disabled}
                  className="text-alert-red font-sans text-micro underline hover:text-red-700 min-h-[36px] px-2 flex items-center cursor-pointer"
                >
                  {t.activate.removeContactButton}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Nombre */}
                <div className="flex flex-col gap-1">
                  <label className="font-sans text-[11px] font-semibold uppercase text-carbon">
                    {t.activate.contactNameLabel}
                  </label>
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(e) =>
                      handleFieldChange(contact.id, "name", e.target.value)
                    }
                    disabled={disabled}
                    required
                    placeholder="Ej. María Mendoza"
                    className="h-10 px-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                  />
                </div>

                {/* Teléfono */}
                <div className="flex flex-col gap-1">
                  <label className="font-sans text-[11px] font-semibold uppercase text-carbon">
                    {t.activate.contactPhoneLabel}
                  </label>
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) =>
                      handleFieldChange(contact.id, "phone", e.target.value)
                    }
                    disabled={disabled}
                    required
                    placeholder="+593 99 123 4567"
                    className="h-10 px-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                  />
                </div>

                {/* Parentesco */}
                <div className="flex flex-col gap-1">
                  <label className="font-sans text-[11px] font-semibold uppercase text-carbon">
                    {t.activate.contactRelationshipLabel}
                  </label>
                  <input
                    type="text"
                    value={contact.relationship}
                    onChange={(e) =>
                      handleFieldChange(contact.id, "relationship", e.target.value)
                    }
                    disabled={disabled}
                    required
                    placeholder="Ej. Esposa / Hermano"
                    className="h-10 px-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botón para añadir otro contacto */}
      <div>
        <IncidentButton
          type="button"
          variant="paper"
          onClick={handleAdd}
          disabled={disabled}
          className="w-full sm:w-auto"
        >
          {t.activate.addContactButton}
        </IncidentButton>
      </div>
    </div>
  );
}
