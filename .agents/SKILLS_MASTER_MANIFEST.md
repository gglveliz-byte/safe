# SAFE — Manifiesto Maestro de Skills y Matriz de Activación para Agentes de IA
> **Directorio Central de Capacidades, Prioridades de Decisión y Reglas de Obligatoriedad**  
> **Versión:** 1.0 (Edición 2026) | **Gobernanza:** Concurrencia Multi-IA | **Proyecto:** SAFE

Este documento es la **guía padre de referencia rápida** para cualquier agente de Inteligencia Artificial que trabaje en el repositorio **SAFE**. Antes de ejecutar cualquier tarea, la IA debe consultar esta matriz para saber qué skills aplican a su labor.

---

## 1. Clasificación de Obligatoriedad de las Skills

```mermaid
graph TD
    Task["Nueva Tarea del Agente de IA"] --> Eval{"¿Qué tipo de trabajo es?"}
    
    subgraph Always["1. OBLIGATORIAS SIEMPRE (100% de los casos)"]
        S_Mod["safe-zero-hardcoding-modularity<br/>(<500 líneas · Cero demos · Dinámico)"]
        S_Ledger["safe-multi-ai-live-ledger<br/>(Cabeceras en español · Live Ledger · Multi-IA)"]
    end
    
    Eval -->|Cualquier archivo de código| Always
    
    subgraph Frontend["2. OBLIGATORIAS EN FRONTEND & UI"]
        S_Inc["safe-incident-design-system<br/>(Concrete #efefef · Ink #000 · Times/Arial)"]
        S_Mob["safe-mobile-native-feel<br/>(Touch 44px · Safe areas · WakeLock · Hápticos)"]
        S_I18n["safe-bilingual-i18n<br/>(Cero hardcoding · Diccionarios ES/EN)"]
    end
    
    Eval -->|Vistas, componentes, estilos, textos| Frontend
    
    subgraph Backend["3. OBLIGATORIAS EN BACKEND & API"]
        S_Sec["safe-security-and-compliance<br/>(Cooldown anti-spam · Zod · JWT HttpOnly)"]
    end
    
    Eval -->|API routes, Prisma, Auth, Servicios| Backend
    
    subgraph Legal["4. OBLIGATORIAS EN LEGAL & ONBOARDING"]
        S_Leg["safe-legal-and-terms<br/>(Términos, Privacidad, Habeas Data, Buen Samaritano)"]
    end
    
    Eval -->|Términos, Privacidad, Checkbox de activación| Legal
```

---

## 2. Matriz Detallada de Skills

### 🔴 NIVEL 1: SKILLS OBLIGATORIAS SIEMPRE (Innegociables para Cualquier Tarea)

Estas 2 skills deben obedecerse en **el 100% de las intervenciones**, sin importar si se toca una línea de backend, un archivo de configuración, una base de datos o un componente visual.

| Skill | Ubicación | Cuándo se Activa | Mandato Principal |
| :--- | :--- | :--- | :--- |
| **`safe-zero-hardcoding-modularity`** | [SKILL.md](file:///c:/Users/HP/OneDrive/Desktop/safe/.agents/skills/safe-zero-hardcoding-modularity/SKILL.md) | **SIEMPRE (100% de las tareas)** | • **Límite máximo de 500 líneas físicas** por archivo.<br/>• **CERO datos mock o demos hardcodeadas**; todo debe leerse y guardarse dinámicamente en PostgreSQL, Cloudinary y Gmail SMTP.<br/>• Código de producción completo sin `// TODO` ni elipsis. |
| **`safe-multi-ai-live-ledger`** | [SKILL.md](file:///c:/Users/HP/OneDrive/Desktop/safe/.agents/skills/safe-multi-ai-live-ledger/SKILL.md) | **SIEMPRE (100% de las tareas)** | • **Cabecera obligatoria en español** al inicio de cada archivo declarando propósito y reglas.<br/>• **Comentarios en español** en cada función y endpoint.<br/>• **Actualización obligatoria de `docs/LIVE_ARCHITECTURE_LEDGER.md`** al terminar cada cambio.<br/>• **Prohibido sobreescribir código de otra IA** sin registrar solicitud formal.<br/>• **Verificación automatizada obligatoria** (`tsc --noEmit` / `build`). |

---

### 🟡 NIVEL 2: SKILLS OBLIGATORIAS PARA FRONTEND, VISTAS Y DISEÑO

Se activan en cualquier tarea que cree o modifique archivos dentro de `src/app/`, `src/components/`, `src/hooks/`, `src/locales/` o `src/app/globals.css`.

| Skill | Ubicación | Cuándo se Activa | Mandato Principal |
| :--- | :--- | :--- | :--- |
| **`safe-incident-design-system`** | [SKILL.md](file:///c:/Users/HP/OneDrive/Desktop/safe/.agents/skills/safe-incident-design-system/SKILL.md) | Al maquetar o estilizar cualquier interfaz visual | • Estética *Technical broadsheet on concrete*.<br/>• Lienzo de página `#efefef` (Concrete), tarjetas `#ffffff` (Paper), texto y bordes `#000000` (Ink), baliza de marca `#f25533` (Signal Orange).<br/>• Tipografía: **Times (serif)** para lectura y titulares; **Arial 13px** para microetiquetas y botones.<br/>• Botones neutros en concreto con borde negro capilar de 1px y radio 4px.<br/>• **CERO GRADIENTES** y sombras ultraligeras al 2-4%. |
| **`safe-mobile-native-feel`** | [SKILL.md](file:///c:/Users/HP/OneDrive/Desktop/safe/.agents/skills/safe-mobile-native-feel/SKILL.md) | Al diseñar experiencias móviles, PWA y Modo Ruta | • Objetivos táctiles mínimos de **44x44px**.<br/>• Adaptación a muescas y gestos con `safe-area-insets`.<br/>• Vibración háptica con `navigator.vibrate` en escaneos y acciones críticas.<br/>• Hojas inferiores modales (*bottom sheets*) para acciones móviles.<br/>• **Screen WakeLock API** (`navigator.wakeLock`) para evitar que el móvil duerma el GPS en Modo Ruta.<br/>• Modo PWA Standalone y alto contraste solar en la vista de emergencia. |
| **`safe-bilingual-i18n`** | [SKILL.md](file:///c:/Users/HP/OneDrive/Desktop/safe/.agents/skills/safe-bilingual-i18n/SKILL.md) | Al escribir cualquier texto, botón, título o correo | • **CERO textos en duro (`hardcoded`) en el código.**<br/>• Todo texto se obtiene de `src/locales/` (`es.ts` y `en.ts`).<br/>• Selector de idioma instantáneo en la cabecera.<br/>• Correos y mensajes de WhatsApp con coordenadas DMS y enlace de Google Maps generados bilingües.<br/>• **Lenguaje humano y empático (Cero jerga técnica o stack-babble en UI).** |

---

### 🔵 NIVEL 3: SKILLS OBLIGATORIAS PARA BACKEND, SEGURIDAD Y BASE DE DATOS

Se activan en cualquier tarea que intervenga `src/app/api/`, `src/services/`, `src/lib/` o `prisma/`.

| Skill | Ubicación | Cuándo se Activa | Mandato Principal |
| :--- | :--- | :--- | :--- |
| **`safe-security-and-compliance`** | [SKILL.md](file:///c:/Users/HP/OneDrive/Desktop/safe/.agents/skills/safe-security-and-compliance/SKILL.md) | Al crear o modificar API routes, autenticación o despacho de alertas | • **Escudo anti-spam y cooldown de 3 minutos** por dispositivo en `/api/emergency/alert` con excepción por desplazamiento >150m.<br/>• Protección anti-fuerza bruta en PIN de 6 dígitos.<br/>• Cookies de sesión `HttpOnly` firmadas con JWT (`jose`).<br/>• Validación estricta con esquemas Zod en todas las peticiones.<br/>• Ofuscación de cédula/ID médico en la vista pública de emergencia. |

---

### 🟢 NIVEL 4: SKILLS CONDICIONALES PARA MÓDULO LEGAL Y ONBOARDING

Se activan al trabajar en las páginas de políticas o en el formulario de registro del kit.

| Skill | Ubicación | Cuándo se Activa | Mandato Principal |
| :--- | :--- | :--- | :--- |
| **`safe-legal-and-terms`** | [SKILL.md](file:///c:/Users/HP/OneDrive/Desktop/safe/.agents/skills/safe-legal-and-terms/SKILL.md) | Al construir o editar `/terms`, `/privacy` o `/activate/[code]` | • Páginas legales reales en Español e Inglés.<br/>• Cláusulas de consentimiento médico expreso (Habeas Data / GDPR).<br/>• Exención de responsabilidad del Buen Samaritano para paramédicos y testigos.<br/>• Consentimiento de geolocalización en tiempo real.<br/>• **Casilla de verificación obligatoria** antes de permitir la activación del kit. |

---

## 3. Protocolo de Decisión Rápida para una Nueva IA (Paso a Paso)

Cuando una nueva IA se incorpore al proyecto, debe seguir obligatoriamente este algoritmo de 4 pasos:

1. **Paso 1: Leer el Registro Vivo**
   - Abrir y leer [`docs/LIVE_ARCHITECTURE_LEDGER.md`](file:///c:/Users/HP/OneDrive/Desktop/safe/docs/LIVE_ARCHITECTURE_LEDGER.md) para conocer el estado actual, las dependencias disponibles, los bloqueos activos de otras IAs y las firmas de los endpoints.
2. **Paso 2: Aplicar las Skills Obligatorias Siempre (Nivel 1)**
   - Activar [`safe-zero-hardcoding-modularity`](file:///c:/Users/HP/OneDrive/Desktop/safe/.agents/skills/safe-zero-hardcoding-modularity/SKILL.md) (vigilar límite de 500 líneas y dinamismo total).
   - Activar [`safe-multi-ai-live-ledger`](file:///c:/Users/HP/OneDrive/Desktop/safe/.agents/skills/safe-multi-ai-live-ledger/SKILL.md) (añadir cabeceras en español y preparar registro).
3. **Paso 3: Identificar y Cargar las Skills de Dominio (Nivel 2, 3 o 4)**
   - Si es **UI / Visual:** Cargar [`safe-incident-design-system`](file:///c:/Users/HP/OneDrive/Desktop/safe/.agents/skills/safe-incident-design-system/SKILL.md), [`safe-mobile-native-feel`](file:///c:/Users/HP/OneDrive/Desktop/safe/.agents/skills/safe-mobile-native-feel/SKILL.md) y [`safe-bilingual-i18n`](file:///c:/Users/HP/OneDrive/Desktop/safe/.agents/skills/safe-bilingual-i18n/SKILL.md).
   - Si es **Backend / API / BD:** Cargar [`safe-security-and-compliance`](file:///c:/Users/HP/OneDrive/Desktop/safe/.agents/skills/safe-security-and-compliance/SKILL.md).
   - Si es **Legal / Onboarding:** Cargar [`safe-legal-and-terms`](file:///c:/Users/HP/OneDrive/Desktop/safe/.agents/skills/safe-legal-and-terms/SKILL.md).
4. **Paso 4: Verificación y Asentamiento en el Ledger Vivo**
   - Ejecutar verificación automatizada (`tsc --noEmit` o `build`).
   - Actualizar [`docs/LIVE_ARCHITECTURE_LEDGER.md`](file:///c:/Users/HP/OneDrive/Desktop/safe/docs/LIVE_ARCHITECTURE_LEDGER.md) con los archivos creados/modificados, líneas exactas y resultado de la prueba.
