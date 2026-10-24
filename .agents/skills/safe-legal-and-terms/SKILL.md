---
name: safe-legal-and-terms
description: >-
  Marco legal, cumplimiento normativo y páginas de Términos y Condiciones y Política de Privacidad para SAFE. Define cláusulas de consentimiento expreso para tratamiento de datos médicos sensibles (Habeas Data / GDPR), exención de responsabilidad del Buen Samaritano para paramédicos y testigos, consentimiento de geolocalización GPS en tiempo real y aceptación obligatoria en el flujo de activación del kit.
---

# Skill: Marco Legal, Cumplimiento y Privacidad Médica (SAFE Legal)

**SAFE** procesa datos biomédicos de alta sensibilidad (grupo sanguíneo, patologías, alergias) y coordenadas satelitales en vivo. Para operar con total respaldo jurídico, el sistema debe incluir páginas legales reales y mecanismos de consentimiento vinculante.

---

## 1. Rutas Legales Obligatorias

El sistema debe exponer dos páginas públicas completas, disponibles tanto en Español como en Inglés:
1. **`/terms` (Términos y Condiciones del Servicio):**
   - Reglas de uso del kit físico (NFC y QR).
   - Alcance del servicio de despacho de alertas y limitaciones de cobertura celular/GPS.
   - Cláusula de **Exención de Responsabilidad del Buen Samaritano**: los testigos o socorristas que escaneen el casco o brinden auxilio actúan de buena fe y no incurren en responsabilidad civil ante SAFE.
   - Deber del motociclista de mantener actualizada su ficha médica y teléfonos de emergencia.
2. **`/privacy` (Política de Privacidad y Tratamiento de Datos Médicos):**
   - Consentimiento explícito para el almacenamiento de datos clínicos en la nube (PostgreSQL cifrado).
   - Finalidad exclusiva de los datos: identificación en caso de siniestro vial y despacho de auxilio.
   - Política de fotos en Cloudinary: uso exclusivo para reconocimiento visual de paramédicos.
   - Derechos ARCO / Habeas Data: derecho de rectificación y eliminación de la cuenta y sus datos en cualquier momento desde `/dashboard`.

---

## 2. Checkbox de Aceptación Obligatoria en Activación (`/activate/[code]`)

Durante el registro del kit, el formulario no puede enviarse sin que el motociclista marque la casilla de consentimiento expreso:

```tsx
<label className="flex items-start gap-3 cursor-pointer select-none">
  <input
    type="checkbox"
    required
    checked={termsAccepted}
    onChange={(e) => setTermsAccepted(e.target.checked)}
    className="mt-1 h-4 w-4 rounded border-black text-signal-orange focus:ring-0"
  />
  <span className="text-micro font-sans text-ink">
    {t.activate.acceptTermsPre}{" "}
    <Link href="/terms" target="_blank" className="underline font-bold text-ink hover:text-signal-orange">
      {t.common.termsLink}
    </Link>{" "}
    {t.activate.acceptTermsMid}{" "}
    <Link href="/privacy" target="_blank" className="underline font-bold text-ink hover:text-signal-orange">
      {t.common.privacyLink}
    </Link>
  </span>
</label>
```

---

## 3. Pie de Página Institucional (Legal Broadhseet Footer)

Todas las vistas públicas (`/`, `/activate/[code]`, `/login`, `/emergency/[code]`, `/terms`, `/privacy`) deben incluir un pie de página sobrio con enlaces directos a las páginas legales, versión de la plataforma y aviso de derechos reservados.
