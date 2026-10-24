---
name: safe-bilingual-i18n
description: >-
  Arquitectura de internacionalización bilingüe (Español e Inglés) obligatoria para SAFE. Prohíbe textos en duro ('hardcoded') en componentes y define un sistema de diccionarios tipados para toda la plataforma (Landing, Emergencia, Activación, Dashboard, Admin, Páginas Legales y correos de alerta automática con Google Maps).
---

# Skill: Arquitectura de Internacionalización Bilingüe (Español / English)

Esta skill garantiza que todo el sistema **SAFE** esté disponible de forma fluida y sin textos fijos ("hardcoded") en dos idiomas oficiales:
1. **Español (`es`):** Idioma primario de operación en Latinoamérica y España.
2. **Inglés (`en`):** Idioma secundario para motociclistas extranjeros, turistas, rutas internacionales y personal médico bilingüe.

---

## 1. Regla Inquebrantable: Cero Textos Hardcodeados

**Queda estrictamente prohibido escribir texto directo en JSX/TSX.**  
Todo texto, etiqueta, título, botón, mensaje de error, placeholder y plantilla de correo debe resolverse a través del diccionario tipado o del contexto de idioma.

- **Incorrecto:** `<button>Activar mi Casco</button>`
- **Correcto:** `<button>{t.activate.submitButton}</button>`

---

## 2. Estructura de Diccionarios Tipados (`src/locales/`)

Para mantener los archivos bajo el límite de 500 líneas, los diccionarios se dividen limpiamente por idioma:

```text
src/locales/
├── index.ts        # Tipos exportados y función selectora getDictionary(lang)
├── es.ts           # Diccionario completo en Español [~280 líneas]
└── en.ts           # Diccionario completo en Inglés [~280 líneas]
```

### Contrato de Diccionario (`src/locales/index.ts`):

```typescript
export type Locale = "es" | "en";

export interface Dictionary {
  common: {
    appName: string;
    tagline: string;
    emergencyBadge: string;
    call911: string;
    callContact: string;
    shareWhatsApp: string;
    copyLink: string;
    linkCopied: string;
    termsLink: string;
    privacyLink: string;
    languageToggle: string;
  };
  emergency: {
    title: string;
    subtitle: string;
    bloodType: string;
    allergies: string;
    conditions: string;
    medications: string;
    nationalId: string;
    insurance: string;
    emergencyContacts: string;
    gpsAcquiring: string;
    gpsReady: string;
    gpsDenied: string;
    dispatchedAlert: string;
    openInGoogleMaps: string;
  };
  activate: {
    title: string;
    subtitle: string;
    pinLabel: string;
    pinPlaceholder: string;
    emailLabel: string;
    passwordLabel: string;
    photoLabel: string;
    fullNameLabel: string;
    nationalIdLabel: string;
    bloodTypeLabel: string;
    allergiesLabel: string;
    conditionsLabel: string;
    medicationsLabel: string;
    addContactButton: string;
    acceptTermsLabel: string;
    submitButton: string;
    successMessage: string;
  };
  dashboard: {
    title: string;
    liveRideTitle: string;
    liveRideActive: string;
    liveRideInactive: string;
    liveRideDescription: string;
    editMedicalButton: string;
    contactsTitle: string;
    logoutButton: string;
  };
  admin: {
    title: string;
    batchTitle: string;
    createBatchButton: string;
    batchNamePlaceholder: string;
    quantityLabel: string;
    nfcWriterTitle: string;
    lockReadOnlyLabel: string;
    simulatorLabel: string;
    printQrsButton: string;
  };
  legal: {
    termsTitle: string;
    privacyTitle: string;
    lastUpdated: string;
  };
}
```

---

## 3. Selector y Detección Automática de Idioma

El sistema detecta automáticamente la preferencia del usuario en este orden de prioridad:
1. Cookie o `localStorage` de preferencia explícita (`safe_locale = "es" | "en"`).
2. Cabecera `Accept-Language` o `navigator.language` del navegador.
3. Fallback por defecto: `"es"`.

### Hook de Consumo en Cliente (`src/hooks/useLocale.ts`):

```typescript
export function useLocale() {
  const [locale, setLocale] = useState<Locale>("es");
  // Permite conmutar con 1 clic en la barra de navegación:
  const toggleLocale = () => {
    const next = locale === "es" ? "en" : "es";
    setLocale(next);
    localStorage.setItem("safe_locale", next);
    document.cookie = `safe_locale=${next}; path=/; max-age=31536000`;
  };
  return { locale, t: getDictionary(locale), toggleLocale };
}
```

---

## 4. Despacho de Correo Bilingüe a Familiares

Cuando un casco es escaneado en emergencia, el correo HTML despachado por Gmail SMTP incluye el mensaje claro en ambos idiomas o en el idioma configurado por el motociclista en su perfil:

- **Asunto ES:** `🚨 ALERTA MÉDICA SAFE: Casco de [Nombre] escaneado en carretera`
- **Asunto EN:** `🚨 SAFE EMERGENCY ALERT: [Name]'s helmet scanned on route`
- **Cuerpo con Botón Directo a Google Maps:** Instrucciones legibles en Español e Inglés para abrir la ubicación satelital en 1 toque.
