# SAFE — Reglas del Sistema y Restricciones Operativas

Estas reglas son de cumplimiento **obligatorio e incondicional** en todo momento dentro del proyecto **SAFE**:

1. **Límite Estricto de 500 Líneas por Archivo:**
   - Ningún archivo puede superar jamás las 500 líneas físicas.
   - Si un archivo supera las 380 líneas, se debe particionar proactivamente en submódulos, hooks o schemas dedicados.

2. **Dinamismo Total (Cero Demos / Cero Hardcoding):**
   - Prohibido dejar arrays falsos, datos mock de demostración o constantes simuladas en el código de producción.
   - Todos los dispositivos, perfiles médicos, contactos, fotos, coordenadas GPS y correos deben leerse y guardarse dinámicamente en PostgreSQL, Cloudinary y Gmail SMTP.

3. **Sistema de Diseño 'Incident' Constante:**
   - Estética *Technical broadsheet on concrete*:
     - Lienzo general de página: `#efefef` (Concrete).
     - Tarjetas y contenedores: `#ffffff` (Paper).
     - Líneas estructurales y texto principal: `#000000` (Ink).
     - Baliza de marca y acento de logo: `#f25533` (Signal Orange).
     - Acentos de alerta y advertencia: `#ff492c` (Alert Red) y `#f1641e` (Ember).
     - Tipografía bimodal: **Times (serif)** para cuerpo, titulares y navegación; **Arial 13px** para microetiquetas y botones neutros.
     - Botones neutros: Fondo `#efefef`, borde de `1px solid #000000`, radio `4px`, padding `6px 12px`.
     - Cero gradientes, cero botones de colores saturados, sombras ultraligeras al 2-4%.

4. **Soporte Bilingüe Obligatorio (Español / Inglés):**
   - Cero cadenas de texto en duro dentro de componentes JSX/TSX.
   - Todas las etiquetas, botones, formularios, alertas y correos deben consumirse de los diccionarios tipados `src/locales/` (`es` y `en`).

5. **Ergonomía Móvil Nativa (Mobile-First Native Feel):**
   - Áreas táctiles mínimas de 44x44px.
   - Respeto de `safe-area-insets` para muescas (notches) e indicadores gestuales.
   - Vibración sensorial háptica (`navigator.vibrate`) en escaneos, confirmaciones y errores.
   - Screen WakeLock API (`navigator.wakeLock`) para evitar que el móvil duerma el GPS en Modo Ruta.
   - Manifiesto PWA (`display: "standalone"`, `theme_color: "#efefef"`).

6. **Seguridad y Anti-Abuso Innegociable:**
   - Cooldown de 3 minutos por dispositivo en `/api/emergency/alert` con excepción por movimiento (>150m) para proteger la cuota de Gmail SMTP.
   - Protección contra fuerza bruta en PIN de 6 dígitos.
   - Sesiones en cookies `HttpOnly` firmadas con JWT (`jose`).
   - Validación estricta con esquemas Zod en todas las API routes.

7. **Páginas Legales Obligatorias:**
   - Rutas `/terms` y `/privacy` con contenido legal completo en Español e Inglés para tratamiento de datos médicos, consentimiento GPS y exención del Buen Samaritano.
   - Casilla de verificación de consentimiento obligatoria en `/activate/[code]`.

8. **Cabeceras Obligatorias y Comentarios Explicativos en Español:**
   - Todo archivo debe iniciar con una cabecera estandarizada en Español que declare el proyecto, módulo, responsabilidad del archivo y reglas de ingeniería aplicables.
   - Cada endpoint, función de servicio, hook, componente y esquema debe estar comentado en español explicando claramente parámetros, comportamiento y retorno.

9. **Registro y Actualización Continua de la Documentación en Vivo (`docs/LIVE_ARCHITECTURE_LEDGER.md`):**
   - Tras cada intervención, el agente de IA debe actualizar obligatoriamente el Ledger Vivo registrando archivos intervenidos, conteo de líneas físicas, dependencias y estado de compilación. Debe informar al usuario en cada respuesta qué fue registrado en el Ledger.

10. **Gobernanza de Concurrencia Multi-IA (Prohibido Sobreescribir Código Ajeno):**
    - Prohibido que una IA modifique o reescriba archivos programados por otra IA sin declarar previamente la solicitud de cambio en el Ledger Vivo.
    - Cada IA opera dentro de su dominio asignado; si requiere cambios en interfaces o bases de datos compartidas, registra la solicitud para coordinación armónica sin romper código existente.

11. **Cero Demos y Verificación Automatizada Obligatoria:**
    - Prohibido entregar versiones de demostración o stubs incompletos.
    - Cada integración debe ser verificada mediante compilación estricta de TypeScript (`npx tsc --noEmit` o `npm run build`), garantizando que no haya errores de tipo, sintaxis o dependencias rotas.

12. **Lenguaje Humano y Natural en el Frontend (Cero Jerga Técnica / Cero Stack-Babble):**
    - El usuario final nunca debe ver términos técnicos de programación o infraestructura en las pantallas (`Next.js`, `Prisma`, `PostgreSQL`, `JWT`, `Bcrypt`, `Zod`, `API`, `HTTP 500`, `Payload`, `Cookies`, `SMTP`, etc.).
    - Todo el texto del frontend y de los diccionarios bilingües debe expresarse con un tono humano, empático, claro e institucional enfocado en la vida y seguridad del motociclista: *"Ficha médica de emergencia"*, *"Ubicación satelital en tiempo real"*, *"Aviso inmediato a tus seres queridos"*, *"Tus datos están protegidos y solo se revelan en auxilio vial"*.

13. **Directorio Verídico de Imports, Exports y Endpoints en el Ledger Vivo:**
    - El archivo `docs/LIVE_ARCHITECTURE_LEDGER.md` debe mantener un registro minucioso y 100% verídico de las funciones exportadas, esquemas DTO, rutas de endpoints y dependencias de cada archivo.
    - Esto permite que cualquier IA concurrente que ingrese al proyecto lea el Ledger y comience a programar de inmediato sin tener que adivinar qué importa o qué expone cada módulo.


