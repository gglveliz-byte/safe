---
name: safe-zero-hardcoding-modularity
description: >-
  Leyes de ingeniería inquebrantables para SAFE: Límite estricto de máximo 500 líneas físicas por archivo y erradicación total de datos hardcodeados o mocks de demostración. Exige que el 100% de los datos sean dinámicos (PostgreSQL vía Prisma ORM, Cloudinary, Gmail SMTP y rutas dinámicas) con código de producción completo sin comentarios perezosos ni elipsis.
---

# Skill: Dinamismo Total (Cero Hardcoding) y Modularidad (< 500 Líneas)

Esta skill establece las normas de calidad de código obligatorias para todo agente de IA y desarrollador que trabaje en el repositorio **SAFE**.

---

## 1. Ley 1: Límite Estricto de 500 Líneas por Archivo

**Ningún archivo puede superar jamás las 500 líneas de código.**  
Si un archivo se aproxima a las 400 líneas, debe ser particionado proactivamente siguiendo el principio de Responsabilidad Única (SRP).

### Tabla de Umbrales:
| Líneas | Estado | Acción Obligatoria |
| :--- | :--- | :--- |
| **1 a 380** | Óptimo | Continuar desarrollo manteniendo cohesión. |
| **381 a 450** | Alerta Preventiva | Extraer subcomponentes, validadores o helpers a archivos independientes antes de seguir. |
| **451 a 500** | Crítico | Partición obligatoria inmediata. Prohibido agregar nuevas funciones al archivo. |
| **> 500** | Violación Bloqueante | El archivo es inválido. Debe dividirse en 2 o más archivos de inmediato. |

### Cómo Dividir Archivos sin Romper Imports:
- **Componentes Extensos:** Mover sub-bloques a `src/components/<modulo>/`.
- **Lógica de Estado / Efectos:** Extraer a hooks en `src/hooks/use<Feature>.ts`.
- **Esquemas de Validación:** Colocar en `src/lib/schemas/<dominio>.schema.ts`.
- **Cálculos y Transformaciones:** Mover a `src/services/<dominio>.service.ts`.

---

## 2. Ley 2: Cero Hardcoding y Cero Datos Demo

**Queda terminantemente prohibido introducir datos simulados, arreglos falsos o "falsos usuarios" hardcodeados en el código de producción.**

- **Contactos de Emergencia:** Deben provenir siempre de la columna JSON `emergencyContacts` del `MedicalProfile` en PostgreSQL o ser añadidos dinámicamente mediante el formulario.
- **Folios de Casco y Kits:** Se generan y persisten a través de la API en lotes reales (`/api/admin/batches`) con PINs criptográficamente aleatorios.
- **Ubicación GPS:** Debe capturarse dinámicamente desde el sensor del móvil vía `navigator.geolocation.getCurrentPosition()` o desde la última posición reportada en base de datos.
- **Fotografía de Perfil:** Se sube y procesa dinámicamente a través de la API oficial de Cloudinary.
- **Correos Electrónicos:** Se despachan mediante el transporte real SMTP de Gmail a las direcciones de los contactos guardados en base de datos.

---

## 3. Ley 3: Código Completo y de Producción (Sin Pereza ni `// TODO`)

- Prohibido dejar funciones incompletas, comentarios como `// implementar después`, o stubs que retornen objetos vacíos.
- Todo endpoint debe manejar exhaustivamente errores (`try/catch`), validar esquemas, responder con códigos HTTP semánticos (200, 201, 400, 401, 403, 404, 429, 500) y registrar logs limpios en consola.

---

## 4. Ley 4: Protocolo de Barrido Forense Global ante Cambios de Reglas (Erradicación Total de Código y Textos Obsoletos)

**Prohibido asumir que una modificación está completa solo porque la lógica del componente o el endpoint directamente involucrado funciona.**

Cuando el usuario solicite eliminar, modificar o invertir un comportamiento, flujo o regla de negocio (ej. *"el PIN ya no es automático, ahora se ingresa de forma manual"*):

1. **Visión de Túnel Terminantemente Prohibida:**  
   No te limites a editar únicamente el componente o ruta donde ocurre la acción visible. Todo cambio de regla tiene ramificaciones en la periferia del sistema.

2. **Barrido Forense Obligatorio (`git grep` en `src/`):**  
   Antes de dar por terminada la tarea, es mandatorio ejecutar una búsqueda global de texto con palabras clave del cambio en todo `src/` para inspeccionar:
   - **Diccionarios de Idioma (`src/locales/`):** Verificar que los textos de ayuda (`*Help`), subtítulos, badges, descripciones y placeholders no sigan explicando o prometiendo el comportamiento que se acaba de eliminar.
   - **Esquemas de Validación Zod (`src/lib/schemas/`):** Eliminar parámetros obsoletos en querystrings, query schemas y DTOs que sigan aceptando o propagando el dato eliminado.
   - **Hardware y Servicios Periféricos:** Revisar generadores de código QR (`qr-generator.service.ts`, `nfc-write-utils.ts`), grabadores Web NFC (`NfcBurstWriterModal.tsx`), plantillas de correo (`templates.ts`, `welcome-template.ts`) y hojas de impresión técnica.
   - **Componentes y Hooks Co-ubicados:** Limpiar cualquier flag o prop residual (`prefilled*`, `auto*`, `is*Assigned`).

3. **Cero Declaraciones Prematuras de Finalización:**  
   No reportes al usuario que el trabajo está "listo y seguro" hasta haber ejecutado el barrido forense global, verificado la coherencia de los textos en pantalla y comprobado la prueba de integración en vivo.
