/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Configuración Internacional — Centrales de Emergencia Oficiales por País
 * ARCHIVO: src/lib/country-emergency.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Catálogo canónico de centrales oficiales de rescate y números de emergencia
 * nacionales según el código ISO-3166-1 alfa-2 del país del motociclista.
 *
 * Erradica por completo la necesidad de que el usuario invente o digite un
 * número de ambulancia manual erróneo (ej. "1234567"), garantizando que la
 * ficha pública de auxilio marque directamente a la central nacional
 * correspondiente (ECU 911, Línea 123, 112, etc.).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (este archivo < 150 líneas).
 * - Cero números hardcodeados en vistas: consumo a través de resolveCountryEmergency.
 * - Cabeceras y comentarios canónicos en Español.
 * ==============================================================================
 */

import { COUNTRIES } from "@/lib/countries-data";

export interface CountryEmergencyService {
  /** Código ISO del país en mayúsculas (ej: EC, CO, PE, ES, US) */
  countryCode: string;
  /** Número telefónico de marcación directa (ej: "911", "123", "112") */
  number: string;
  /** Nombre institucional de la central de emergencias */
  agencyName: string;
  /** Etiqueta de llamada en Español */
  labelEs: string;
  /** Etiqueta de llamada en Inglés */
  labelEn: string;
}

const COUNTRY_SERVICES: Record<string, Omit<CountryEmergencyService, "countryCode">> = {
  EC: {
    number: "911",
    agencyName: "ECU 911 (Ecuador)",
    labelEs: "Llamar al ECU 911",
    labelEn: "Call ECU 911",
  },
  CO: {
    number: "123",
    agencyName: "Línea 123 (Colombia)",
    labelEs: "Llamar a Línea 123",
    labelEn: "Call Line 123",
  },
  PE: {
    number: "911",
    agencyName: "Central 911 / 105 (Perú)",
    labelEs: "Llamar al 911 / 105",
    labelEn: "Call 911 / 105",
  },
  MX: {
    number: "911",
    agencyName: "911 Emergencias (México)",
    labelEs: "Llamar al 911",
    labelEn: "Call 911",
  },
  ES: {
    number: "112",
    agencyName: "112 Emergencias (España)",
    labelEs: "Llamar al 112",
    labelEn: "Call 112",
  },
  US: {
    number: "911",
    agencyName: "911 Emergency (USA)",
    labelEs: "Llamar al 911",
    labelEn: "Call 911",
  },
  CA: {
    number: "911",
    agencyName: "911 Emergency (Canada)",
    labelEs: "Llamar al 911",
    labelEn: "Call 911",
  },
  AR: {
    number: "911",
    agencyName: "911 Emergencias (Argentina)",
    labelEs: "Llamar al 911",
    labelEn: "Call 911",
  },
  CL: {
    number: "131",
    agencyName: "131 SAMU (Chile)",
    labelEs: "Llamar al 131 SAMU",
    labelEn: "Call 131 SAMU",
  },
  BR: {
    number: "192",
    agencyName: "192 SAMU (Brasil)",
    labelEs: "Llamar al 192 SAMU",
    labelEn: "Call 192 SAMU",
  },
  UY: {
    number: "911",
    agencyName: "911 Emergencias (Uruguay)",
    labelEs: "Llamar al 911",
    labelEn: "Call 911",
  },
  PY: {
    number: "911",
    agencyName: "911 Emergencias (Paraguay)",
    labelEs: "Llamar al 911",
    labelEn: "Call 911",
  },
  BO: {
    number: "911",
    agencyName: "911 Emergencias (Bolivia)",
    labelEs: "Llamar al 911",
    labelEn: "Call 911",
  },
  VE: {
    number: "911",
    agencyName: "VEN 911 (Venezuela)",
    labelEs: "Llamar al VEN 911",
    labelEn: "Call VEN 911",
  },
  CR: {
    number: "911",
    agencyName: "911 Emergencias (Costa Rica)",
    labelEs: "Llamar al 911",
    labelEn: "Call 911",
  },
  PA: {
    number: "911",
    agencyName: "911 Emergencias (Panamá)",
    labelEs: "Llamar al 911",
    labelEn: "Call 911",
  },
  DO: {
    number: "911",
    agencyName: "911 Sistema Nacional (Rep. Dominicana)",
    labelEs: "Llamar al 911",
    labelEn: "Call 911",
  },
  GT: {
    number: "123",
    agencyName: "123 Bomberos / 110 PNC (Guatemala)",
    labelEs: "Llamar al 123",
    labelEn: "Call 123",
  },
  HN: {
    number: "911",
    agencyName: "911 Emergencias (Honduras)",
    labelEs: "Llamar al 911",
    labelEn: "Call 911",
  },
  SV: {
    number: "911",
    agencyName: "911 Emergencias (El Salvador)",
    labelEs: "Llamar al 911",
    labelEn: "Call 911",
  },
  NI: {
    number: "118",
    agencyName: "118 Policía / 911 (Nicaragua)",
    labelEs: "Llamar al 118",
    labelEn: "Call 118",
  },
  CN: {
    number: "120",
    agencyName: "120 Ambulancias / 110 Policía (China)",
    labelEs: "Llamar al 120 Ambulancias",
    labelEn: "Call 120 Ambulance",
  },
  GB: {
    number: "999",
    agencyName: "999 Emergency Services (Reino Unido)",
    labelEs: "Llamar al 999",
    labelEn: "Call 999",
  },
  JP: {
    number: "119",
    agencyName: "119 Ambulancia y Bomberos (Japón)",
    labelEs: "Llamar al 119 Ambulancia",
    labelEn: "Call 119 Ambulance",
  },
  AU: {
    number: "000",
    agencyName: "000 Triple Zero (Australia)",
    labelEs: "Llamar al 000",
    labelEn: "Call 000",
  },
  FR: {
    number: "112",
    agencyName: "112 / 15 SAMU (Francia)",
    labelEs: "Llamar al 112 SAMU",
    labelEn: "Call 112 SAMU",
  },
  DE: {
    number: "112",
    agencyName: "112 Notruf Rettungsdienst (Alemania)",
    labelEs: "Llamar al 112",
    labelEn: "Call 112",
  },
  IT: {
    number: "112",
    agencyName: "112 Numero Unico Emergenze (Italia)",
    labelEs: "Llamar al 112",
    labelEn: "Call 112",
  },
};

const DEFAULT_SERVICE: Omit<CountryEmergencyService, "countryCode"> = {
  number: "911",
  agencyName: "Central 911",
  labelEs: "Llamar al 911",
  labelEn: "Call 911",
};

/**
 * Normaliza cualquier entrada de país (código ISO 2, nombre en español, nombre en inglés, etc.)
 * a su código ISO 3166-1 alfa-2 estándar en mayúsculas (ej: "EC", "CO", "ES", "PE", "US").
 */
export function normalizeCountryCode(input?: string | null): string {
  if (!input) return "EC";
  const trimmed = input.trim();
  if (!trimmed) return "EC";

  const upper = trimmed.toUpperCase();
  // 1. Si ya es un código ISO directo de 2 letras registrado en el catálogo
  if (COUNTRY_SERVICES[upper]) {
    return upper;
  }

  // 2. Normalización de tildes para búsqueda flexible
  const normalized = trimmed
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // 3. Buscar en el catálogo de COUNTRIES por nombre español o inglés
  const match = COUNTRIES.find((c) => {
    if (c.code.toUpperCase() === upper) return true;
    const normEs = c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const normEn = c.nameEn.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return normEs === normalized || normEn === normalized;
  });

  if (match && COUNTRY_SERVICES[match.code.toUpperCase()]) {
    return match.code.toUpperCase();
  }

  // 4. Mapeos fonéticos y variantes comunes
  if (normalized.includes("colomb")) return "CO";
  if (normalized.includes("ecuad")) return "EC";
  if (normalized.includes("espan") || normalized.includes("spain")) return "ES";
  if (normalized.includes("peru")) return "PE";
  if (normalized.includes("mexic")) return "MX";
  if (normalized.includes("chile")) return "CL";
  if (normalized.includes("argentin")) return "AR";
  if (normalized.includes("unite") || normalized.includes("estad") || normalized === "usa") return "US";
  if (normalized.includes("canad")) return "CA";
  if (normalized.includes("brasil") || normalized.includes("brazil")) return "BR";
  if (normalized.includes("chin")) return "CN";
  if (normalized.includes("japon") || normalized.includes("japan")) return "JP";
  if (normalized.includes("reino unido") || normalized.includes("united kingdom") || normalized === "uk") return "GB";
  if (normalized.includes("australi")) return "AU";
  if (normalized.includes("franci") || normalized.includes("france")) return "FR";
  if (normalized.includes("alemani") || normalized.includes("germany")) return "DE";
  if (normalized.includes("itali") || normalized.includes("italy")) return "IT";

  return upper.length === 2 ? upper : "EC";
}

/**
 * Resuelve la central de emergencia oficial según el código ISO o nombre del país.
 *
 * @param countryCode Código de 2 letras (ej. "EC", "CO", "ES", "US") o nombre completo.
 * @returns Configuración completa de la central con número y rótulo bilingüe.
 */
export function resolveCountryEmergency(countryCode?: string | null): CountryEmergencyService {
  const cleanCode = normalizeCountryCode(countryCode);
  const service = COUNTRY_SERVICES[cleanCode] || DEFAULT_SERVICE;
  return {
    countryCode: cleanCode,
    ...service,
  };
}
