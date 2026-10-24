/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Internacionalización Bilingüe (i18n) — Contrato de Tipos
 * ARCHIVO: src/locales/index.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Definición estricta de tipos de diccionario bilingüe (Español / Inglés).
 * Erradica por completo los textos en duro ('hardcoded') en componentes y vistas.
 * Todo el contenido está expresado en tono 100% humano, empático y sobrio,
 * libre de tecnicismos o jerga de infraestructura informática.
 * 
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Cero textos hardcodeados en JSX.
 * - Idiomas oficiales: 'es' (Español) y 'en' (Inglés).
 * ==============================================================================
 */

import { es } from "./es";
import { en } from "./en";

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
    backToHome: string;
    riderLogin: string;
    adminPanel: string;
    saveChanges: string;
    saving: string;
    cancel: string;
    errorGeneric: string;
    statusActive: string;
    statusUnclaimed: string;
    requiredField: string;
    allRightsReserved: string;
    systemVersion: string;
  };
  nav: {
    brandSubtitle: string;
    home: string;
    login: string;
    dashboard: string;
    admin: string;
    activateHelmet: string;
    emergencyDemo: string;
  };
  emergency: {
    title: string;
    subtitle: string;
    bannerWarning: string;
    bloodType: string;
    allergies: string;
    noAllergies: string;
    conditions: string;
    noConditions: string;
    medications: string;
    noMedications: string;
    nationalId: string;
    insurance: string;
    noInsurance: string;
    emergencyContacts: string;
    noContacts: string;
    lastGpsLocation: string;
    gpsAcquiring: string;
    gpsReady: string;
    gpsDenied: string;
    dispatchedAlert: string;
    openInGoogleMaps: string;
    alertSentNotice: string;
    directCallParamedic: string;
    scanSourceLabel: string;
    emergencyWarningText: string;
    solarContrastNotice: string;
  };
  activate: {
    title: string;
    subtitle: string;
    stepPinTitle: string;
    pinLabel: string;
    pinPlaceholder: string;
    pinHelp: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    photoLabel: string;
    photoUploadHelp: string;
    photoChangeButton: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    nationalIdLabel: string;
    nationalIdPlaceholder: string;
    bloodTypeLabel: string;
    allergiesLabel: string;
    allergiesPlaceholder: string;
    conditionsLabel: string;
    conditionsPlaceholder: string;
    medicationsLabel: string;
    medicationsPlaceholder: string;
    insuranceLabel: string;
    insurancePlaceholder: string;
    contactsTitle: string;
    contactsSubtitle: string;
    addContactButton: string;
    removeContactButton: string;
    contactNameLabel: string;
    contactPhoneLabel: string;
    contactRelationshipLabel: string;
    acceptTermsPre: string;
    acceptTermsMid: string;
    submitButton: string;
    submittingButton: string;
    successTitle: string;
    successMessage: string;
    goToDashboard: string;
    errorPinInvalid: string;
  };
  dashboard: {
    title: string;
    welcomeBack: string;
    liveRideTitle: string;
    liveRideActive: string;
    liveRideInactive: string;
    liveRideDescription: string;
    liveRideWarning: string;
    liveRideGpsSignal: string;
    editMedicalTitle: string;
    editMedicalSubtitle: string;
    updateSuccess: string;
    updateError: string;
    saveProfileButton: string;
    contactsTitle: string;
    logoutButton: string;
    lastKnownLocationLabel: string;
    folioLabel: string;
  };
  admin: {
    title: string;
    subtitle: string;
    batchTitle: string;
    batchSubtitle: string;
    createBatchButton: string;
    batchNameLabel: string;
    batchNamePlaceholder: string;
    quantityLabel: string;
    quantityPlaceholder: string;
    generatingBatch: string;
    generatedBatchesTitle: string;
    nfcWriterTitle: string;
    nfcWriterSubtitle: string;
    startNfcScanButton: string;
    scanningNfc: string;
    nfcSuccess: string;
    nfcError: string;
    nfcNotSupported: string;
    lockReadOnlyLabel: string;
    simulatorTitle: string;
    simulatorSubtitle: string;
    simulateNfcWriteButton: string;
    printQrsButton: string;
    printSheetTitle: string;
    printSheetHelp: string;
    totalKitsLabel: string;
    unclaimedLabel: string;
    activeLabel: string;
    batchSuccessNotice: string;
  };
  login: {
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    submitButton: string;
    submittingButton: string;
    errorInvalidCredentials: string;
    backToHome: string;
    needHelpActivation: string;
  };
  landing: {
    heroHeadline: string;
    heroSubheadline: string;
    activateCta: string;
    exploreEmergencyCta: string;
    badgeText: string;
    howItWorksTitle: string;
    howItWorksSubtitle: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    statsHelmets: string;
    statsHelmetsLabel: string;
    statsResponseTime: string;
    statsResponseTimeLabel: string;
    statsUptime: string;
    statsUptimeLabel: string;
    quoteTitle: string;
    quoteBody: string;
    quoteAuthor: string;
  };
  legal: {
    termsTitle: string;
    termsSubtitle: string;
    privacyTitle: string;
    privacySubtitle: string;
    lastUpdated: string;
    termsSection1Title: string;
    termsSection1Body: string;
    termsSection2Title: string;
    termsSection2Body: string;
    termsSection3Title: string;
    termsSection3Body: string;
    termsSection4Title: string;
    termsSection4Body: string;
    privacySection1Title: string;
    privacySection1Body: string;
    privacySection2Title: string;
    privacySection2Body: string;
    privacySection3Title: string;
    privacySection3Body: string;
    privacySection4Title: string;
    privacySection4Body: string;
  };
}

/**
 * Obtiene el diccionario tipado correspondiente según el idioma solicitado.
 * Por defecto entrega Español ('es').
 */
export function getDictionary(locale: Locale = "es"): Dictionary {
  return locale === "en" ? en : es;
}
