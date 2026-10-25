---
name: safe-incident-design-system
description: >-
  Sistema de diseño visual obligatorio 'Incident — Technical Broadsheet 2026' para la plataforma SAFE. Define la paleta cromática oficial (Navy Dark #0B1F3A, Navy Secondary #15365B, Text Desc #23466D, Text Muted #5C718A, Brand Accent #FF5138, Nav Blue #2F648F, Nav Active #EDF5FC, Border Subtle #D7E3F0, Border Field #C9D9E9, Border Strong #B8CADD, Separator #DCE5EE, White #FFFFFF, Alt Bg #F8FAFC), tipografía Newsreader (Editorial Serif) para titulares/lectura e Inter (Clean Sans) para microetiquetas/interacciones, micro-animaciones sónar/radares en casco, y tarjetas informativas.
---

# Skill: Sistema de Diseño Visual 'Incident' (Technical Broadsheet 2026)

Esta skill rige la identidad estética obligatoria para todas las interfaces de **SAFE** (Landing, Router del Casco, Activación, Ficha Médica de Emergencia, Panel del Conductor, Admin y Páginas Legales).

---

## 1. Filosofía Estética: Technical Broadsheet 2026

> *"Un boletín médico-editorial en tu casco que habla por ti cuando más lo necesitas. Titulares serif Newsreader de alta autoridad conviven con una tipografía funcional Inter, fondos puros (#FFFFFF y #F8FAFC), líneas estructurales sutiles (#D7E3F0), balizas sónar pulsantes (#FF5138) y acentos azul editorial (#2F648F)."*

El diseño proyecta máxima seriedad clínica, rescate vial inmediato y modernidad táctil. Es sobrio, legible bajo luz solar directa y amigable tanto para rescatistas como para motociclistas.

---

## 2. Tokens Oficiales de Color

| Nombre de Token | Valor Hex | Variable CSS / Tailwind | Rol de Uso Obligatorio |
| :--- | :--- | :--- | :--- |
| **White** | `#FFFFFF` | `brand-white` / `--color-white` | **Lienzo principal de página** y fondo de tarjetas puras. |
| **Bg Alt** | `#F8FAFC` | `brand-bg-alt` | Superficie alterna para contenedores de descripción y tarjetas con fondo suave. |
| **Bg Subtle** | `#F1F5F9` | `brand-bg-subtle` | Fondos de hover sutiles y áreas neutrales. |
| **Navy Dark** | `#0B1F3A` | `brand-navy-dark` | Color principal de titulares serif, cajas de isotipo, botones primarios e insignias numéricas. |
| **Navy Secondary** | `#15365B` | `brand-navy-secondary` | Estado hover de botones primarios y acentos oscuros. |
| **Text Desc** | `#23466D` | `brand-text-desc` | Color de párrafos explicativos, descripciones y enlaces secundarios. |
| **Text Muted** | `#5C718A` | `brand-text-muted` | Metadatos, micro-etiquetas, tooltips, etiquetas de campo y pie de foto. |
| **Accent (Signal)** | `#FF5138` | `brand-accent` | Baliza de marca, anillos sónar, punto de advertencia y borde de la Hora Dorada. |
| **Accent Hover** | `#F45136` | `brand-accent-hover` | Hover sobre acentos de marca activos. |
| **Nav Blue** | `#2F648F` | `brand-nav-blue` | Iconos de tecnología, enlaces interactivos y contornos de foco (focus rings). |
| **Nav Active** | `#EDF5FC` | `brand-nav-active` | Fondo activo suave para píldoras de navegación y fondos de iconos informativos. |
| **Border Subtle** | `#D7E3F0` | `brand-border-subtle` | Bordes divisorios estándar de tarjetas, cabecera y pie. |
| **Border Field** | `#C9D9E9` | `brand-border-field` | Bordes de campos de formulario en estado inactivo. |
| **Border Strong** | `#B8CADD` | `brand-border-strong` | Bordes en hover de tarjetas e inputs. |
| **Separator** | `#DCE5EE` | `brand-separator` | Líneas divisorias horizontales y separadores sutiles. |

---

## 3. Tipografía Bimodal Obligatoria (Newsreader Serif + Inter Sans)

1. **Newsreader (Editorial Serif):** Voz clínica y editorial, titulares `h1`, `h2`, `h3`, grupo sanguíneo, citas médicas y marca SAFE.
2. **Inter (Clean Sans):** Micro-etiquetas, navegación, inputs, botones de acción, metadatos y tooltips.

```css
/* Configuración CSS */
--font-serif: 'Newsreader', Georgia, Cambria, 'Times New Roman', serif;
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

---

## 4. Componentes y Patrones Canónicos

### 4.1. Barra de Navegación Sticky con Isotipo
- Contenedor sticky con `backdrop-blur-md` y fondo `#FFFFFF/95`.
- Isotipo: Cuadrado `#0B1F3A` con punto central `#FF5138`.
- Enlaces con píldoras activas en `#EDF5FC` y texto `#0B1F3A`.
- Menú hamburguesa móvil morphing (3 líneas que se transforman en X).

### 4.2. Tarjeta Visual del Casco con Radares Sónar
- Fotografía oficial con ratio `aspect-[4/3]` y bordes redondeados `rounded-xl`.
- Dos balizas de radar sónar pulsantes (`pulseSonar` + `pulseGlow`) posicionadas estratégicamente sobre el código QR y la antena NFC.
- Pie de foto en degradado oscuro con distintivo "ACTIVO 24/7" y "Kit SAFE NFC / QR Grado Vial".

### 4.3. Formulario de Activación de Casco
- Input con anillo de foco `safe-input-focus` (azul `#2F648F`).
- Botón primario `#0B1F3A` con spinner interactivo de verificación.
- Retroalimentación accesible para códigos válidos o incompletos con conexión a rutas reales `/activate/[code]`.

### 4.4. Tarjetas de Pasos ("¿Cómo Funciona SAFE?")
- Insignia circular con número 1, 2, 3 en `#0B1F3A`.
- Icono lineal azul `#2F648F` en contenedor `#EDF5FC`.
- Pie de tarjeta con viñeta de color distintivo (Adhesivo 3M, Encriptación, Alerta SMS).

### 4.5. Bloque "El Principio de la Hora Dorada"
- Fondo `#F8FAFC` con borde izquierdo `#FF5138` animado con pulso respiratorio (`golden-hour-border`).
- Cita itálica en Newsreader sobre los primeros 60 minutos del siniestro vial.

### 4.6. Ficha Médica de Demostración (Modal)
- Modal accesible con `role="dialog"`, desenfoque de fondo y tecla Escape.
- Muestra grupo sanguíneo O Negativo (O-), Donante Sí, Alergias y Contactos con notificación inmediata.

---

## 5. Reglas Inquebrantables (Do's & Don'ts)

### SÍ HACER (Do):
- Usar `#FFFFFF` y `#F8FAFC` como fondos canónicos del nuevo diseño.
- Usar `Newsreader` para titulares, grupo sanguíneo y citas editoriales.
- Usar `Inter` para toda microtipografía, botones y navegación.
- Mantener objetivos táctiles mínimos de 44x44px en móviles.
- Respetar `prefers-reduced-motion` cancelando animaciones para usuarios con sensibilidad de movimiento.

### PROHIBIDO (Don't):
- Cero folios ficticios o rutas inventadas en el formulario de activación.
- Cero textos hardcodeados; todo copy debe consumirse del diccionario bilingüe (`useLocale`).
- Nunca superar las 500 líneas físicas por archivo.
- Cero colores fuera de la paleta canónica `#0B1F3A`, `#15365B`, `#23466D`, `#5C718A`, `#FF5138`, `#2F648F`, `#EDF5FC`, `#D7E3F0`, `#C9D9E9`, `#B8CADD`, `#FFFFFF`, `#F8FAFC`.
- Cero fallas de accesibilidad: todo botón y elemento interactivo debe tener etiqueta accesible y contraste WCAG AA.

