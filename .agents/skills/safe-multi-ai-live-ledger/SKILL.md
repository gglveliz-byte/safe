---
name: safe-multi-ai-live-ledger
description: >-
  Protocolo obligatorio de documentación en vivo (Live Ledger), cabeceras en español, pruebas automatizadas y gobernanza de concurrencia multi-IA para SAFE. Exige comentarios explicativos en español al inicio y dentro de cada archivo, actualización constante de docs/LIVE_ARCHITECTURE_LEDGER.md tras cada cambio, prohibición de sobreescritura no coordinada entre diferentes IAs y verificación obligatoria de cada integración sin demos.
---

# Skill: Documentación en Vivo, Cabeceras en Español y Concurrencia Multi-IA

Esta skill rige la gobernanza operativa y la colaboración multi-agente en el repositorio **SAFE**.

---

## 1. Regla de Cabeceras y Comentarios en Español

**Cada archivo creado o modificado debe tener una cabecera explicativa al inicio en Español:**
- Qué hace el archivo.
- A qué capa o módulo pertenece.
- Qué entradas y salidas maneja.
- Dependencias clave.

Además, cada función, endpoint, interfaz, enum o constante debe incluir comentarios claros en español explicando su propósito, parámetros y retorno.

### Plantilla Obligatoria de Cabecera:

```typescript
/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: [Nombre del Módulo, ej. Servicios de Localización]
 * ARCHIVO: [Ruta relativa, ej. src/services/gps-maps.service.ts]
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * [Explicación detallada en español de la responsabilidad de este archivo,
 *  cómo interactúa con el resto del sistema y por qué existe].
 * 
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Cero datos hardcodeados o demos.
 * - Bilingüismo ES/EN vía diccionarios tipados.
 * ==============================================================================
 */
```

---

## 2. Registro de Documentación en Vivo (`docs/LIVE_ARCHITECTURE_LEDGER.md`)

El archivo [`docs/LIVE_ARCHITECTURE_LEDGER.md`](file:///c:/Users/HP/OneDrive/Desktop/safe/docs/LIVE_ARCHITECTURE_LEDGER.md) es la **fuente viva de la verdad arquitectónica**.

### Obligación de Actualización Continua:
Cada vez que un agente de IA cree, modifique, divida o elimine un archivo:
1. **Debe registrar el cambio en la tabla de archivos** (nombre, líneas, propósito).
2. **Debe registrar las dependencias** que consume o expone.
3. **Debe registrar el resultado de las pruebas de verificación** (compilación, tipos, endpoints).
4. **Debe mencionar explícitamente en su respuesta al usuario** qué se actualizó en el Ledger Vivo.

---

## 3. Protocolo de Concurrencia Multi-IA (Prohibido Sobreescribir Código Ajeno)

Dado que **múltiples agentes de IA trabajarán concurrentemente en este proyecto**, se aplican estas reglas estrictas de coordinación:

1. **Aislamiento por Dominio:**
   - Ninguna IA tiene permitido modificar o reescribir un archivo programado por otra IA o perteneciente a otro módulo sin previo registro de solicitud en el Ledger Vivo.
2. **Tabla de Bloqueos Activos (`Active Module Locks`):**
   - Antes de iniciar un desarrollo, la IA debe declarar en el Ledger qué módulo o ruta está interviniendo.
3. **Solicitud de Cambio entre IAs (`Inter-Agent Change Request`):**
   - Si una IA necesita que otra IA ajuste una firma de función, contrato de API o tabla de base de datos, **no debe romper el archivo ajeno**. Debe asentar en la sección `Solicitudes Pendientes entre IAs` del Ledger el cambio requerido, permitiendo que la IA responsable lo implemente y confirme de manera armónica.
4. **Cero Regresiones:**
   - Prohibido borrar código preexistente para "resolver" un error de compilación.

---

## 4. Cero Versiones Demo y Verificación Automatizada

- **Prohibido entregar código "demo" o de muestra.**
- Cada integración debe ser verificada ejecutando pruebas automatizadas o validaciones de compilación estricta (`npm run build` o `npx tsc --noEmit`).
- La integración solo se declara completa si compila sin errores y cumple con las reglas de negocio.

---

## 5. Protocolo de Verificación Holística Pre-Entrega (Checklist Anti-Puntos Ciegos)

Para evitar entregar tareas con visión de túnel donde la lógica funciona pero los textos o esquemas periféricos quedan desincronizados, todo agente debe cumplir este checklist estricto antes de reportar la finalización al usuario:

1. **Barrido Forense Global (`git grep`):**  
   Buscar en todo el proyecto los términos clave de la regla modificada para garantizar que ningún texto de ayuda, comentario, esquema o archivo secundario conserve instrucciones del comportamiento anterior.
2. **Sincronización Lingüística:**  
   Comprobar que los diccionarios (`es.ts` y `en.ts`) reflejen fielmente el nuevo flujo.
3. **Compilación Estricta de Tipos:**  
   Ejecutar `npm run typecheck` (`tsc --noEmit`) asegurando 0 errores.
4. **Respeto a los Límites de Líneas:**  
   Comprobar que ningún archivo modificado o creado supere las 500 líneas físicas.
5. **Prueba en Vivo y Limpieza de BD:**  
   Verificar el flujo en navegador o script de integración, limpiando de inmediato cualquier usuario o registro de prueba creado en la base de datos real.
6. **Asentamiento en el Ledger:**  
   Actualizar `docs/LIVE_ARCHITECTURE_LEDGER.md` con el código de hito (`CHK-XXX`) y la descripción técnica de los cambios.
