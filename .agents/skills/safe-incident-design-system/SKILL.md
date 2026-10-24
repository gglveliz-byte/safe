---
name: safe-incident-design-system
description: >-
  Sistema de diseño visual obligatorio 'Incident — Technical broadsheet on concrete' para la plataforma SAFE. Define la paleta cromática exacta (Concrete #efefef, Ink #000000, Signal Orange #f25533, Paper #ffffff, Alert Red #ff492c, Ember #f1641e), tipografía serif editorial Times para titulares y Arial 13px para microetiquetas, botones neutros enmarcados con borde de 1px negro, cero gradientes y sombras ultraligeras.
---

# Skill: Sistema de Diseño Visual 'Incident' (Technical Broadsheet)

Esta skill rige la identidad estética obligatoria para todas las interfaces de **SAFE** (Landing, Router del Casco, Activación, Ficha Médica de Emergencia, Panel del Motociclista, Admin y Páginas Legales).

---

## 1. Filosofía Estética: Technical Broadsheet on Concrete

> *"Un boletín técnico sobre concreto. Titulares serif estilo Times flotan sobre una página gris cálido con líneas capilares de color negro puro y un destello de naranja señal que rompe la calma como una baliza de emergencia."*

El diseño proyecta la autoridad y sobriedad de un manual técnico o una publicación editorial de alta confianza. **La disciplina cromática es extrema:** el color no es decorativo ni abultado; se raciona rigurosamente y sólo interviene como aviso de marca o indicador semántico de advertencia/emergencia.

---

## 2. Tokens Oficiales de Color

| Nombre de Token | Valor Hex | Variable CSS | Rol de Uso Obligatorio |
| :--- | :--- | :--- | :--- |
| **Concrete** | `#efefef` | `--color-concrete` | **Lienzo principal de página** y fondo de botones neutros. Aporta calidez de papel periódico/concreto. Nunca usar blanco puro como fondo de página. |
| **Paper** | `#ffffff` | `--color-paper` | Superficie de tarjetas (`cards`), contenedores de formularios y barra de navegación superior. |
| **Ink** | `#000000` | `--color-ink` | Texto principal, líneas divisorias capilares (hairline rules de 1px), bordes estructurales de tarjetas y botones. |
| **Carbon** | `#161618` | `--color-carbon` | Casi-negro para trazos de navegación, texto de énfasis y base de sombras sutiles. |
| **Signal Orange** | `#f25533` | `--color-signal-orange` | Baliza de marca, acento de logo, insignias destacadas de SAFE y detalles de foco. **Nunca como fondo de botones de acción.** |
| **Alert Red** | `#ff492c` | `--color-alert-red` | Acento decorativo para iconos de peligro/accidente y bordes de banner crítico de emergencia médica. |
| **Ember** | `#f1641e` | `--color-ember` | Borde de advertencia para estados degradados o avisos secundarios (batería baja, GPS impreciso). |
| **Mist** | `#dadada` | `--color-mist` | Tono de sombra sutil y bordes atenuados para elementos deshabilitados. |
| **Fog** | `#cccccc` | `--color-fog` | Tono secundario de sombras tenues en tarjetas elevadas. |
| **Parchment** | `#e4d9c8` | `--color-parchment` | Superficie crema cálida para badges de archivo o etiquetas de datos técnicos. |

---

## 3. Tipografía Bimodal Obligatoria (Serif Editorial + Micro Sans)

La tipografía utiliza una división estricta:
1. **Times (Serif):** Voz principal, titulares, cuerpo de lectura médica, etiquetas de navegación, valores clínicos.
2. **Arial (Sans 13px):** Micro-etiquetas funcionales, textos auxiliares de botones, metadatos y tooltips.

```css
/* Configuración CSS */
--font-times-system-serif: 'Times (system serif)', ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif;
--font-arial-system-sans: 'Arial (system sans)', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Escala */
--text-micro: 13px;       /* Arial (system sans), Line Height 1.2 */
--text-body: 16px;        /* Times, Line Height 1.2 */
--text-body-lg: 19px;     /* Times, Line Height 1.2 */
--text-heading-sm: 24px;  /* Times, Line Height 1.2 */
--text-heading: 32px;     /* Times Bold, Line Height 1.2 */
```

---

## 4. Componentes Canónicos

### 4.1. Botón Neutro (Neutral Button)
Es el botón interactivo principal. **No lleva colores vivos de fondo**:
- **Fondo:** `#efefef` (Concrete, idéntico al lienzo).
- **Borde:** `1px solid #000000` (Ink).
- **Radio:** `4px` estricto (nunca píldora redondeada).
- **Padding:** `6px 12px` (compacto y preciso).
- **Texto:** `Arial 13px`, peso 400, color `#000000`.
- **Sombra:** Ninguna. Al pulsar (`:active`), leve hundimiento `transform: scale(0.98)`.

### 4.2. Tarjeta de Contenedor (Status / Paper Card)
- **Fondo:** `#ffffff` (Paper).
- **Radio de Borde:** `12px`.
- **Borde:** `1px solid #000000` o borde cromático semántico según el estado (`#ff492c` para alerta médica activa, `#f1641e` para advertencias).
- **Padding:** `20px` a `24px`.
- **Sombra:** `rgba(22, 22, 24, 0.02) 0px 8px 15px -3px, rgba(22, 22, 24, 0.04) 0px 4px 6px -2px`.

### 4.3. Banner Crítico de Emergencia Médica
- **Fondo:** Lavado suave rojizo tintado a partir de `#ff492c` al 8% de opacidad (`rgba(255, 73, 44, 0.08)`).
- **Borde:** `1px solid #ff492c`.
- **Icono:** Triángulo de advertencia en `#ff492c`.
- **Titular:** Times `16px` Bold, `#000000`.
- **Cuerpo:** Times `16px` Regular, `#000000`.
- **Radio:** `8px`.

### 4.4. Hairlines (Líneas Divisorias Capilares)
- Separación entre secciones mediante bordes de `1px solid #000000` o `#dadada`.
- Espaciado vertical entre secciones: `40px` a `64px`.

---

## 5. Reglas Inquebrantables (Do's & Don'ts)

### SÍ HACER (Do):
- Usar siempre `#efefef` de fondo general en `body` y contenedores base.
- Dejar que las tarjetas blancas `#ffffff` floten sobre el concreto `#efefef`.
- Usar `Times` para todo texto de lectura, titulares médicos y avisos.
- Usar `Arial 13px` únicamente para microetiquetas y botones neutros.
- Usar `Signal Orange (#f25533)` exclusivamente para isotipo, detalles de marca o balizas de foco.

### PROHIBIDO (Don't):
- **CERO GRADIENTES:** La estética 'Incident' es estrictamente plana y editorial.
- **CERO BOTONES CON FONDOS AZULES, VERDES O NARANJAS BRILLANTES:** Los botones deben ser neutros en concreto con borde negro capilar.
- **CERO SOMBRAS NEGRAS PESADAS:** Solo sombras ultraligeras de 2% a 4% de opacidad.
- **CERO BORDES REDONDEADOS TIPO PÍLDORA (pill):** Radios de 4px para botones, 8px para banners y 12px para tarjetas.
