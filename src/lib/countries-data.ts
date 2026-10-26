/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Catálogo Internacional de Países y Prefijos Telefónicos (ISO 3166-1)
 * ARCHIVO: src/lib/countries-data.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Catálogo canónico con todos los países del mundo, códigos ISO 2, nombres
 * en español e inglés, prefijos telefónicos de discado internacional y banderas
 * emoji. Permite poblar automáticamente los selectores de país y teléfono
 * tanto para el conductor/beneficiario como para cada contacto de auxilio.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos mock; catálogo geográfico estándar completo.
 * - Tipado inmutable y funciones utilitarias rápidas indexadas por código ISO.
 * ==============================================================================
 */

export interface CountryItem {
  code: string; // ISO 3166-1 alpha-2 (ej. "EC", "CO", "MX")
  name: string; // Nombre en Español
  nameEn: string; // Nombre en Inglés
  dialCode: string; // Prefijo internacional con '+' (ej. "+593", "+57")
  flag: string; // Emoji de bandera (ej. "🇪🇨")
}

/** Catálogo compacto de países del mundo ordenado alfabéticamente en español */
export const COUNTRIES: CountryItem[] = [
  { code: "EC", name: "Ecuador", nameEn: "Ecuador", dialCode: "+593", flag: "🇪🇨" },
  { code: "CO", name: "Colombia", nameEn: "Colombia", dialCode: "+57", flag: "🇨🇴" },
  { code: "PE", name: "Perú", nameEn: "Peru", dialCode: "+51", flag: "🇵🇪" },
  { code: "MX", name: "México", nameEn: "Mexico", dialCode: "+52", flag: "🇲🇽" },
  { code: "AR", name: "Argentina", nameEn: "Argentina", dialCode: "+54", flag: "🇦🇷" },
  { code: "CL", name: "Chile", nameEn: "Chile", dialCode: "+56", flag: "🇨🇱" },
  { code: "VE", name: "Venezuela", nameEn: "Venezuela", dialCode: "+58", flag: "🇻🇪" },
  { code: "ES", name: "España", nameEn: "Spain", dialCode: "+34", flag: "🇪🇸" },
  { code: "US", name: "Estados Unidos", nameEn: "United States", dialCode: "+1", flag: "🇺🇸" },
  { code: "CA", name: "Canadá", nameEn: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { code: "BR", name: "Brasil", nameEn: "Brazil", dialCode: "+55", flag: "🇧🇷" },
  { code: "BO", name: "Bolivia", nameEn: "Bolivia", dialCode: "+591", flag: "🇧🇴" },
  { code: "UY", name: "Uruguay", nameEn: "Uruguay", dialCode: "+598", flag: "🇺🇾" },
  { code: "PY", name: "Paraguay", nameEn: "Paraguay", dialCode: "+595", flag: "🇵🇾" },
  { code: "PA", name: "Panamá", nameEn: "Panama", dialCode: "+507", flag: "🇵🇦" },
  { code: "CR", name: "Costa Rica", nameEn: "Costa Rica", dialCode: "+506", flag: "🇨🇷" },
  { code: "GT", name: "Guatemala", nameEn: "Guatemala", dialCode: "+502", flag: "🇬🇹" },
  { code: "HN", name: "Honduras", nameEn: "Honduras", dialCode: "+504", flag: "🇭🇳" },
  { code: "SV", name: "El Salvador", nameEn: "El Salvador", dialCode: "+503", flag: "🇸🇻" },
  { code: "NI", name: "Nicaragua", nameEn: "Nicaragua", dialCode: "+505", flag: "🇳🇮" },
  { code: "DO", name: "República Dominicana", nameEn: "Dominican Republic", dialCode: "+1809", flag: "🇩🇴" },
  { code: "CU", name: "Cuba", nameEn: "Cuba", dialCode: "+53", flag: "🇨🇺" },
  { code: "PR", name: "Puerto Rico", nameEn: "Puerto Rico", dialCode: "+1787", flag: "🇵🇷" },
  { code: "DE", name: "Alemania", nameEn: "Germany", dialCode: "+49", flag: "🇩🇪" },
  { code: "AD", name: "Andorra", nameEn: "Andorra", dialCode: "+376", flag: "🇦🇩" },
  { code: "AO", name: "Angola", nameEn: "Angola", dialCode: "+244", flag: "🇦🇴" },
  { code: "SA", name: "Arabia Saudita", nameEn: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦" },
  { code: "DZ", name: "Argelia", nameEn: "Algeria", dialCode: "+213", flag: "🇩🇿" },
  { code: "AM", name: "Armenia", nameEn: "Armenia", dialCode: "+374", flag: "🇦🇲" },
  { code: "AU", name: "Australia", nameEn: "Australia", dialCode: "+61", flag: "🇦🇺" },
  { code: "AT", name: "Austria", nameEn: "Austria", dialCode: "+43", flag: "🇦🇹" },
  { code: "AZ", name: "Azerbaiyán", nameEn: "Azerbaijan", dialCode: "+994", flag: "🇦🇿" },
  { code: "BS", name: "Bahamas", nameEn: "Bahamas", dialCode: "+1242", flag: "🇧🇸" },
  { code: "BD", name: "Bangladés", nameEn: "Bangladesh", dialCode: "+880", flag: "🇧🇩" },
  { code: "BB", name: "Barbados", nameEn: "Barbados", dialCode: "+1246", flag: "🇧🇧" },
  { code: "BE", name: "Bélgica", nameEn: "Belgium", dialCode: "+32", flag: "🇧🇪" },
  { code: "BZ", name: "Belice", nameEn: "Belize", dialCode: "+501", flag: "🇧🇿" },
  { code: "BY", name: "Bielorrusia", nameEn: "Belarus", dialCode: "+375", flag: "🇧🇾" },
  { code: "BA", name: "Bosnia y Herzegovina", nameEn: "Bosnia and Herzegovina", dialCode: "+387", flag: "🇧🇦" },
  { code: "BG", name: "Bulgaria", nameEn: "Bulgaria", dialCode: "+359", flag: "🇧🇬" },
  { code: "KH", name: "Camboya", nameEn: "Cambodia", dialCode: "+855", flag: "🇰🇭" },
  { code: "CM", name: "Camerún", nameEn: "Cameroon", dialCode: "+237", flag: "🇨🇲" },
  { code: "QA", name: "Catar", nameEn: "Qatar", dialCode: "+974", flag: "🇶🇦" },
  { code: "CN", name: "China", nameEn: "China", dialCode: "+86", flag: "🇨🇳" },
  { code: "CY", name: "Chipre", nameEn: "Cyprus", dialCode: "+357", flag: "🇨🇾" },
  { code: "KR", name: "Corea del Sur", nameEn: "South Korea", dialCode: "+82", flag: "🇰🇷" },
  { code: "HR", name: "Croacia", nameEn: "Croatia", dialCode: "+385", flag: "🇭🇷" },
  { code: "DK", name: "Dinamarca", nameEn: "Denmark", dialCode: "+45", flag: "🇩🇰" },
  { code: "EG", name: "Egipto", nameEn: "Egypt", dialCode: "+20", flag: "🇪🇬" },
  { code: "AE", name: "Emiratos Árabes Unidos", nameEn: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪" },
  { code: "SK", name: "Eslovaquia", nameEn: "Slovakia", dialCode: "+421", flag: "🇸🇰" },
  { code: "SI", name: "Eslovenia", nameEn: "Slovenia", dialCode: "+386", flag: "🇸🇮" },
  { code: "EE", name: "Estonia", nameEn: "Estonia", dialCode: "+372", flag: "🇪🇪" },
  { code: "PH", name: "Filipinas", nameEn: "Philippines", dialCode: "+63", flag: "🇵🇭" },
  { code: "FI", name: "Finlandia", nameEn: "Finland", dialCode: "+358", flag: "🇫🇮" },
  { code: "FR", name: "Francia", nameEn: "France", dialCode: "+33", flag: "🇫🇷" },
  { code: "GR", name: "Grecia", nameEn: "Greece", dialCode: "+30", flag: "🇬🇷" },
  { code: "NL", name: "Países Bajos", nameEn: "Netherlands", dialCode: "+31", flag: "🇳🇱" },
  { code: "HU", name: "Hungría", nameEn: "Hungary", dialCode: "+36", flag: "🇭🇺" },
  { code: "IN", name: "India", nameEn: "India", dialCode: "+91", flag: "🇮🇳" },
  { code: "ID", name: "Indonesia", nameEn: "Indonesia", dialCode: "+62", flag: "🇮🇩" },
  { code: "IE", name: "Irlanda", nameEn: "Ireland", dialCode: "+353", flag: "🇮🇪" },
  { code: "IS", name: "Islandia", nameEn: "Iceland", dialCode: "+354", flag: "🇮🇸" },
  { code: "IL", name: "Israel", nameEn: "Israel", dialCode: "+972", flag: "🇮🇱" },
  { code: "IT", name: "Italia", nameEn: "Italy", dialCode: "+39", flag: "🇮🇹" },
  { code: "JM", name: "Jamaica", nameEn: "Jamaica", dialCode: "+1876", flag: "🇯🇲" },
  { code: "JP", name: "Japón", nameEn: "Japan", dialCode: "+81", flag: "🇯🇵" },
  { code: "JO", name: "Jordania", nameEn: "Jordan", dialCode: "+962", flag: "🇯🇴" },
  { code: "KZ", name: "Kazajistán", nameEn: "Kazakhstan", dialCode: "+7", flag: "🇰🇿" },
  { code: "KE", name: "Kenia", nameEn: "Kenya", dialCode: "+254", flag: "🇰🇪" },
  { code: "KW", name: "Kuwait", nameEn: "Kuwait", dialCode: "+965", flag: "🇰🇼" },
  { code: "LV", name: "Letonia", nameEn: "Latvia", dialCode: "+371", flag: "🇱🇻" },
  { code: "LB", name: "Líbano", nameEn: "Lebanon", dialCode: "+961", flag: "🇱🇧" },
  { code: "LT", name: "Lituania", nameEn: "Lithuania", dialCode: "+370", flag: "🇱🇹" },
  { code: "LU", name: "Luxemburgo", nameEn: "Luxembourg", dialCode: "+352", flag: "🇱🇺" },
  { code: "MY", name: "Malasia", nameEn: "Malaysia", dialCode: "+60", flag: "🇲🇾" },
  { code: "MT", name: "Malta", nameEn: "Malta", dialCode: "+356", flag: "🇲🇹" },
  { code: "MA", name: "Marruecos", nameEn: "Morocco", dialCode: "+212", flag: "🇲🇦" },
  { code: "MC", name: "Mónaco", nameEn: "Monaco", dialCode: "+377", flag: "🇲🇨" },
  { code: "NG", name: "Nigeria", nameEn: "Nigeria", dialCode: "+234", flag: "🇳🇬" },
  { code: "NO", name: "Noruega", nameEn: "Norway", dialCode: "+47", flag: "🇳🇴" },
  { code: "NZ", name: "Nueva Zelanda", nameEn: "New Zealand", dialCode: "+64", flag: "🇳🇿" },
  { code: "PL", name: "Polonia", nameEn: "Poland", dialCode: "+48", flag: "🇵🇱" },
  { code: "PT", name: "Portugal", nameEn: "Portugal", dialCode: "+351", flag: "🇵🇹" },
  { code: "GB", name: "Reino Unido", nameEn: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
  { code: "CZ", name: "República Checa", nameEn: "Czech Republic", dialCode: "+420", flag: "🇨🇿" },
  { code: "RO", name: "Rumania", nameEn: "Romania", dialCode: "+40", flag: "🇷🇴" },
  { code: "RU", name: "Rusia", nameEn: "Russia", dialCode: "+7", flag: "🇷🇺" },
  { code: "SG", name: "Singapur", nameEn: "Singapore", dialCode: "+65", flag: "🇸🇬" },
  { code: "ZA", name: "Sudáfrica", nameEn: "South Africa", dialCode: "+27", flag: "🇿🇦" },
  { code: "SE", name: "Suecia", nameEn: "Sweden", dialCode: "+46", flag: "🇸🇪" },
  { code: "CH", name: "Suiza", nameEn: "Switzerland", dialCode: "+41", flag: "🇨🇭" },
  { code: "TH", name: "Tailandia", nameEn: "Thailand", dialCode: "+66", flag: "🇹🇭" },
  { code: "TW", name: "Taiwán", nameEn: "Taiwan", dialCode: "+886", flag: "🇹🇼" },
  { code: "TR", name: "Turquía", nameEn: "Turkey", dialCode: "+90", flag: "🇹🇷" },
  { code: "UA", name: "Ucrania", nameEn: "Ukraine", dialCode: "+380", flag: "🇺🇦" },
  { code: "VN", name: "Vietnam", nameEn: "Vietnam", dialCode: "+84", flag: "🇻🇳" },
];

/** País por defecto (Ecuador) para preselección en formularios */
export const DEFAULT_COUNTRY = COUNTRIES[0];

/** Mapa indexado por código ISO para búsquedas O(1) */
const COUNTRY_MAP = new Map<string, CountryItem>(
  COUNTRIES.map((c) => [c.code.toUpperCase(), c]),
);

/**
 * Busca un país por su código ISO 3166-1 alpha-2 (case-insensitive).
 */
export function getCountryByCode(code: string | null | undefined): CountryItem | undefined {
  if (!code) return undefined;
  return COUNTRY_MAP.get(code.trim().toUpperCase());
}

/**
 * Busca el país que coincide con un prefijo telefónico (ej. "+593").
 */
export function getCountryByDialCode(dialCode: string | null | undefined): CountryItem | undefined {
  if (!dialCode) return undefined;
  const clean = dialCode.trim();
  return COUNTRIES.find((c) => c.dialCode === clean);
}
