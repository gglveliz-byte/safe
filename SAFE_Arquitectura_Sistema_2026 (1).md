# SAFE — Arquitectura Integral del Sistema (Edición 2026)
> **Emergency Medical & Real-Time GPS Ledger for Riders**  
> **Stack:** Next.js Full-Stack (App Router + TypeScript) · PostgreSQL + Prisma ORM · Cloudinary CDN · Gmail SMTP · Web NFC API · Tailwind CSS v4  
> **Regla de Ingeniería:** Comando único (`npm run dev`) y límite estricto de **máximo 500 líneas de código por archivo**.

---

## 1. Visión General y Principios Rectores de Arquitectura

**SAFE** es una plataforma integral de identificación médica de emergencia y localización GPS en tiempo real para motociclistas. El sistema vincula un kit físico instalado en el casco (compuesto por un **chip NFC NXP NTAG216** y un **código QR de alta resistencia**) con un perfil médico en la nube y un motor de despacho automático de alertas con enlace directo a **Google Maps**.

### 1.1. Reglas de Negocio Innegociables
1. **Separación Total entre Escaneo del Casco y Administración de Cuenta:**
   - **Escaneo Primera Vez (`status = UNCLAIMED`):** Cuando el motociclista escanea su chip NFC o código QR virgen por primera vez (`/r/[code]`), el servidor detecta que no tiene dueño y lo redirige a `/activate/[code]`. Allí ingresa su **PIN de activación**, correo, contraseña, foto (vía **Cloudinary**), ficha médica y contactos de emergencia ilimitados. Al guardar, el chip pasa a `ACTIVE` y el usuario queda con sesión iniciada automáticamente rumbo a su `/dashboard`.
   - **Escaneos Posteriores (`status = ACTIVE`):** **Sin excepciones ni reconocimiento de dueño.** Cada vez que cualquier teléfono (incluso el del propio dueño) escanee el link del chip o QR (`/r/[code]`) una vez activo, el sistema entra **directamente en Modo Emergencia**: despliega la ficha médica al instante, captura las coordenadas GPS y dispara las alertas por correo a los familiares con el enlace directo de Google Maps.
   - **Edición de Datos y Modo Ruta (`/login` y `/dashboard`):** Para editar su información médica, actualizar contactos o encender el *Modo Ruta GPS*, el motociclista ingresa directamente a la web o PWA mediante el enlace público de inicio de sesión (`tudominio.com/login`), jamás a través del link del chip.
2. **Relación Estricta `1:1` (Un Chip = Una Cuenta):**
   - Cada cuenta de motociclista está asociada de forma única a un dispositivo (`Device`). Esto simplifica radicalmente la base de datos, la interfaz del panel y la lógica de rastreo GPS.
3. **Cero Dependencias de Terceros para NFC y QR:**
   - El **Administrador** opera directamente desde su teléfono móvil en `/admin`. El propio sistema genera internamente los lotes, renderiza los códigos QR listos para impresión y graba los chips NFC en serie usando la antena del teléfono (`Web NFC API`), sin archivos `.csv` ni aplicaciones externas.
4. **Switch de Bloqueo de Escritura (`Read-Only`) en Panel Admin:**
   - Durante la vinculación del chip NFC, el Administrador cuenta con un interruptor opcional: **"Bloquear escritura del chip (Modo Producción)"**. Desactivado permite regrabar los chips durante pruebas; activado ejecuta `ndef.makeReadOnly()` en el NTAG216 para impedir que terceros sobrescriban la URL en la calle.
5. **Almacenamiento de Fotografía en Cloudinary:**
   - La fotografía del rostro del motociclista (vital para identificación visual por paramédicos) se sube y optimiza mediante **Cloudinary** (`https://console.cloudinary.com/`), guardando únicamente el `secure_url` y `public_id` en PostgreSQL para carga instantánea en zonas de baja cobertura celular.
6. **GPS Directo a Google Maps Oficial:**
   - Las coordenadas capturadas se transforman matemáticamente a formato sexagesimal (`DMS`, ej. `2°10'06.9"S 79°27'10.6"W`) y construyen la URL oficial de Google Maps (`https://www.google.com/maps/place/...`) sin requerir API Keys de pago ni mapas embebidos pesados.
7. **Rate-Limiting y Cooldown Anti-Spam en Alertas (`/api/emergency/alert`):**
   - Para evitar saturación de cuotas de Gmail SMTP y pánico innecesario en familiares por escaneos sucesivos accidentales (ej. un testigo curioso que escanea 5 veces seguidas), el sistema aplica una ventana de cooldown configurable (3 minutos) por dispositivo. Si se reciben escaneos durante este periodo con una variación geográfica inferior a 150 metros, se actualiza el registro en base de datos pero se suprime el reenvío redundante de correos electrónicos.
8. **Modo Ruta Resiliente con Screen WakeLock API & PWA Background:**
   - Para contrarrestar la suspensión agresiva de JavaScript que ejecutan iOS Safari y Android Chrome al bloquearse la pantalla o apagarse en el bolsillo del motociclista, el panel activa la **Screen WakeLock API** (`navigator.wakeLock.request('screen')`) y ofrece soporte PWA (`manifest.json` y Service Worker) con modo HUD de bajo consumo energético para manillar.
9. **Emulador / Simulador de Hardware NFC en Panel Admin (`/admin`):**
   - A fin de permitir el desarrollo, pruebas automatizadas y demostraciones comerciales en computadoras portátiles o dispositivos sin antena NFC habilitada (iOS / PC), la interfaz de administración incluye un conmutador de "Simulador de Antena NFC" que emula toques físicos, generación de UIDs hexadecimales y avance secuencial de la tira de stickers.
10. **Resiliencia Offline-First para Ficha Médica de Emergencia:**
   - Soporte de caché local mediante Service Worker para que la ficha médica crítica (tipo de sangre, alergias, contactos) pueda ser visualizada con latencia cero incluso en tramos viales o autopistas con conectividad celular intermitente o nula.
11. **Validación Estricta de Credenciales Externas:**
   - Verificación en tiempo de ejecución de las credenciales de Cloudinary y Gmail SMTP, impidiendo la activación de perfiles o el despacho de alertas con credenciales incompletas o mal configuradas.
12. **Bilingüismo Nativo Exhaustivo (Español e Inglés):**
   - El sistema es 100% bilingüe de punta a punta, sin una sola cadena de texto en duro ('hardcoded'). Las 7 vistas principales (Landing, Activación, Emergencia, Dashboard, Admin, Términos y Privacidad) y los canales de comunicación de alerta (correo Gmail y mensaje de WhatsApp con Google Maps) se generan mediante diccionarios tipados estrictos en `src/locales/` (`es.ts` y `en.ts`), permitiendo conmutación instantánea con 1 toque y auto-detección según el idioma del teléfono del socorrista o familiar.

---

## 2. Diagramas de Flujo del Sistema (De Pies a Cabeza)

### 2.1. Arquitectura General de Componentes (Full-Stack Monolith)

```mermaid
graph TB
    subgraph Hardware["Casco del Motociclista"]
        NFC["Sticker NFC NXP NTAG216<br/>(ISO 14443-3A · 868 Bytes)<br/>URL: /r/SAFE-0001?v=nfc"]
        QR["Sticker QR Alta Resistencia<br/>URL: /r/SAFE-0001?v=qr"]
    end

    subgraph Client["Navegadores Móviles (Sin Apps Nativas)"]
        AdminPhone["Teléfono del Admin<br/>Chrome Android (Web NFC API)"]
        ParamedicPhone["Teléfono Paramédico / Testigo<br/>iOS Safari o Android Chrome"]
        RiderPhone["Teléfono del Motociclista<br/>Web / PWA (/login y /dashboard)"]
    end

    subgraph Server["Servidor Unificado Next.js (npm run dev :3000)"]
        Router["Router Inteligente<br/>GET /r/[code]"]
        AdminMod["Módulo Admin<br/>Generador QR + Grabador NFC"]
        AuthMod["Módulo Auth & Onboarding<br/>JWT HttpOnly + Activación PIN"]
        EmergMod["Módulo de Emergencia<br/>Ficha Médica + Receptor GPS"]
        GpsService["Motor de Conversión DMS<br/>Generador Link Google Maps"]
    end

    subgraph External["Base de Datos y Servicios Externos"]
        PG[("PostgreSQL<br/>Prisma ORM")]
        Cloud["Cloudinary CDN<br/>Fotos de Perfil Médico"]
        Gmail["Google SMTP (Gmail)<br/>Despacho de Alertas HTML"]
        GMaps["Google Maps Oficial<br/>Navegación Familiar Directa"]
    end

    AdminPhone -->|1. Crea lote y graba URL + UID físico| AdminMod
    AdminMod -->|Guarda lote y estado ENCODED| PG
    NFC -->|Escaneo sin contacto| Router
    QR -->|Escaneo con cámara| Router
    Router -->|Consulta status del folio| PG
    Router -->|Si status == UNCLAIMED| AuthMod
    Router -->|Si status == ACTIVE (Siempre)| EmergMod
    AuthMod -->|Sube foto del rostro| Cloud
    AuthMod -->|Activa chip + Auto-Login| PG
    RiderPhone -->|Inicia sesión en /login| AuthMod
    RiderPhone -->|Modo Ruta GPS continuo| GpsService
    ParamedicPhone -->|Envía coordenada GPS del accidente| GpsService
    GpsService -->|Construye URL DMS exacta| Gmail
    Gmail -->|Envía correo urgente con botón| GMaps
```

---

### 2.2. Flujo 1: Fábrica de Lotes, QRs y Grabación NFC en Serie (`/admin`)

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrador (Móvil Android)
    participant UI as Vista /admin/lotes
    participant API as POST /api/admin/batches
    participant DB as PostgreSQL

    Admin->>UI: Ingresa cantidad (ej. 10 chips) y nombre de lote
    UI->>API: Solicita creación de lote de 10 unidades
    API->>DB: Crea SAFE-0001 a SAFE-0010 (status: UNCLAIMED, isNfcEncoded: false)
    DB-->>UI: Devuelve lista de 10 folios + PINs + QRs generados en SVG/Canvas
    Admin->>UI: Imprime hoja de Stickers QR + Tarjetas PIN y numera la tira física del 1 al 10

    Note over Admin,DB: Fase de Grabación Física en Tira (Web NFC API)
    Admin->>UI: Activa o desactiva Switch "Bloquear escritura (Read-Only)"
    Admin->>UI: Toca botón "Iniciar Vinculación de Tira NFC"
    loop Del Chip #1 al Chip #10 en secuencia automática
        UI->>Admin: Muestra "Acerca el Chip #N (SAFE-000N)..."
        Admin->>UI: Acerca el teléfono al Sticker NTAG216 en la tira
        UI->>UI: Verifica candado Anti-Doble Toque (UID físico != anterior)
        UI->>Admin: Escribe URL única (/r/SAFE-000N?v=nfc) en memoria NDEF
        opt Si Switch "Bloquear escritura" está ACTIVO
            UI->>Admin: Ejecuta ndef.makeReadOnly() en el chip NTAG216
        end
        UI->>API: PATCH /api/admin/devices/SAFE-000N (serialNumber, isNfcEncoded: true)
        API->>DB: Marca estado "VINCULADO (QR + CHIP)" y guarda UID físico
        UI->>Admin: Vibra (150ms) + Sonido Bip + Salta automáticamente al Chip #(N+1)
    end
```

---

### 2.3. Flujo 2: Primer Escaneo del Motociclista (`UNCLAIMED` → Activación + Auto-Login)

```mermaid
sequenceDiagram
    autonumber
    actor Rider as Motociclista (Nuevo Cliente)
    participant Browser as Navegador Móvil
    participant Router as GET /r/[code]
    participant Cloud as Cloudinary API
    participant ActivateAPI as POST /api/devices/activate
    participant DB as PostgreSQL

    Rider->>Browser: Escanea por 1ra vez el NFC o QR de su kit (ej. SAFE-0001)
    Browser->>Router: Solicita /r/SAFE-0001
    Router->>DB: Busca Device por code = "SAFE-0001"
    DB-->>Router: Devuelve status = UNCLAIMED
    Router-->>Browser: Redirige automáticamente a /activate/SAFE-0001

    Rider->>Browser: Completa formulario único (PIN del kit, Email, Password, Foto, Datos Médicos y Contactos ilimitados)
    Browser->>Cloud: Sube fotografía comprimida del motociclista
    Cloud-->>Browser: Retorna secure_url y public_id
    Browser->>ActivateAPI: Envía payload completo + PIN + photoUrl
    ActivateAPI->>DB: Verifica que activationPin coincida y status == UNCLAIMED
    ActivateAPI->>DB: Transacción: Crea User + MedicalProfile + Actualiza Device a ACTIVE
    ActivateAPI-->>Browser: Set-Cookie: safe_session (JWT HttpOnly) + Redirect a /dashboard
    Browser-->>Rider: Entra directo a su Panel de Control ya logueado
```

---

### 2.4. Flujo 3: Escaneo en Emergencia (`ACTIVE` → Perfil Médico + GPS Google Maps + Correo Gmail)

> **Nota Crítica:** Este flujo se ejecuta **siempre** que el chip tenga `status = ACTIVE`, sin importar quién lo escanee.

```mermaid
sequenceDiagram
    autonumber
    actor Rescuer as Paramédico / Testigo (o cualquier escaneo)
    participant View as Vista /emergency/[code]
    participant AlertAPI as POST /api/emergency/alert
    participant DB as PostgreSQL
    participant Mail as Gmail SMTP (Nodemailer)
    actor Family as Familiares / Contactos

    Rescuer->>View: Escanea NFC o QR del casco (/r/SAFE-0001 -> /emergency/SAFE-0001)
    View->>DB: Obtiene Perfil Médico completo + Último GPS conocido del Rider
    DB-->>View: Renderiza al instante Foto (Cloudinary), Sangre, Alergias, Cédula, Botón 911 y Contactos

    par Captura GPS del Teléfono que Escanea
        View->>Rescuer: Solicita permiso navigator.geolocation.getCurrentPosition()
        alt El testigo/paramédico acepta compartir GPS
            Rescuer-->>View: Entrega coordenadas exactas del accidente (lat, lng, accuracy)
            View->>AlertAPI: Dispara alerta con coordenadas frescas del escaneo
        else El testigo rechaza o tarda más de 6 segundos
            View->>AlertAPI: Dispara alerta usando la última coordenada del Modo Ruta del Rider (Fallback)
        end
    and Acción Manual Inmediata en Pantalla
        Rescuer->>View: Puede tocar "Llamar al 911", "Llamar a Familiar" o "Enviar WhatsApp con Link Google Maps"
    end

    AlertAPI->>DB: Registra EmergencyAlert y GpsPoint
    AlertAPI->>AlertAPI: Convierte (lat, lng) a DMS (ej. 2°10'06.9"S 79°27'10.6"W) y arma URL oficial Google Maps
    AlertAPI->>Mail: Envía correo urgente a TODOS los contactos registrados
    Mail-->>Family: Reciben Email con Coordenada DMS y Botón directo a Google Maps App
```

---

### 2.5. Flujo 4: Administración de Datos y Modo Ruta GPS (`/login` → `/dashboard`)

```mermaid
flowchart LR
    A["Motociclista entra a<br/>tudominio.com/login"] --> B{"Credenciales<br/>Válidas?"}
    B -- No --> A
    B -- Sí --> C["Panel Privado<br/>/dashboard"]
    C --> D["Editar Ficha Médica<br/>y Foto en Cloudinary"]
    C --> E["Agregar / Eliminar<br/>Contactos Ilimitados"]
    C --> F["Switch: Modo Ruta<br/>(GPS Siempre Activo)"]
    F -->|"Cada 15 seg mientras rueda"| G["POST /api/gps/heartbeat<br/>Actualiza lastKnownLat/Lng en PostgreSQL"]
```

---

## 3. Especificación de Hardware NFC y Grabación Web

El sistema está calibrado para trabajar con las etiquetas **NXP NTAG216** verificadas en laboratorio, manteniendo al mismo tiempo compatibilidad con cualquier etiqueta estándar **NFC Forum Type 2**:

| Parámetro Técnico | Valor Verificado del Chip | Uso Dentro de la Arquitectura **SAFE** |
| :--- | :--- | :--- |
| **Fabricante y Modelo** | `NXP - NTAG216` | Lectura nativa sin apps en iPhone (iOS) y Android. |
| **Estándar de Radiofrecuencia** | `ISO 14443-3A` (`NfcA`, `MifareUltralight`, `Ndef`) | Compatible con la API nativa `NDEFReader` de Chrome en Android para grabación directa. |
| **Formato de Datos** | `NFC Forum Type 2` | Permite almacenar registros `url` estándar que abren el navegador al acercar el casco. |
| **Capacidad de Memoria** | `924 bytes` totales (`231 páginas` de 4 bytes) / **`868 Bytes` útiles NDEF** | Nuestra URL (`https://tudominio.com/r/SAFE-0001?v=nfc`) consume ~40 bytes (< 5% de la memoria). |
| **Número de Serie Físico (UID)** | 7 bytes hexadecimales (ej. `04:D4:F1:34:C2:2A:81`) | Se captura durante la grabación en `/admin` para evitar doble toque en la tira y auditar cada chip físico. |
| **Bloqueo de Sólo Lectura** | Soportado (`Sólo lectura posible: Sí`) | Controlado desde `/admin` mediante el switch opcional `ndef.makeReadOnly()`. |

---

## 4. Sistema de Diseño Visual: **Incident — Technical Broadsheet on Concrete**
> *"Technical broadsheet on concrete. Times-serif headlines float on a warm-gray page with hairline black rules and a single orange flare that breaks the calm like a signal beacon."*

### 4.1. Reglas Visuales Estrictas
* **Lienzo Principal (`Page Canvas`):** `#efefef` (`--color-concrete`). El tono cálido y papel que da al sistema su presencia de publicación técnica. Nunca usar blanco puro como fondo de página.
* **Superficie de Tarjetas (`Card Surface`):** `#ffffff` (`--color-paper`) con bordes capilares (`hairline`) de `1px` color `#000000` (`--color-ink`) o acentos semánticos según el estado.
* **Acento Cromático Único:** `#f25533` (`--color-signal-orange`). Reservado para la marca, detalles de logotipo y balizas de foco. Nunca como fondo de botones de acción.
* **Botones Neutros:** Fondo `#efefef` (Concrete) con borde de `1px solid #000000`, radio de `4px`, padding compacto `6px 12px`, y texto en Arial `13px` color `#000000`.
* **Estados de Alerta y Advertencia:** `#ff492c` (`--color-alert-red`) para el banner crítico de emergencia médica y `#f1641e` (`--color-ember`) para advertencias o bordes de foco.
* **Tipografía Bimodal:**
  - **Times (system serif):** Voz editorial para cuerpo de texto, titulares y lectura médica (`16px`, `19px`, `24px`, `32px`).
  - **Arial (system sans 13px):** Micro-etiquetas, etiquetas de botones neutros e indicadores funcionales.
* **Cero Gradientes ni Sombras Pesadas:** Todo elemento es plano y sobrio; la profundidad proviene de líneas capilares de 1px y sombras sutiles al 2-4%.

### 4.2. Configuración Lista para `src/app/globals.css` (Tailwind CSS v4)

```css
@import "tailwindcss";

@theme {
  /* Paleta Oficial Incident */
  --color-signal-orange: #f25533;
  --color-concrete: #efefef;
  --color-ink: #000000;
  --color-paper: #ffffff;
  --color-carbon: #161618;
  --color-mist: #dadada;
  --color-fog: #cccccc;
  --color-parchment: #e4d9c8;
  --color-alert-red: #ff492c;
  --color-ember: #f1641e;

  /* Tipografías */
  --font-times-system-serif: 'Times (system serif)', ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-arial-system-sans: 'Arial (system sans)', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  /* Escala Tipográfica */
  --text-micro: 13px;
  --text-body: 16px;
  --text-body-lg: 19px;
  --text-heading-sm: 24px;
  --text-heading: 32px;

  /* Radios Nombrados */
  --radius-tags: 4px;
  --radius-cards: 12px;
  --radius-buttons: 4px;
  --radius-alertbanners: 8px;

  /* Sombras Editoriales Incident */
  --shadow-md: rgba(22, 22, 24, 0.02) 0px 8px 15px -3px, rgba(22, 22, 24, 0.04) 0px 4px 6px -2px;
}

body {
  background-color: var(--color-concrete);
  color: var(--color-ink);
  font-family: var(--font-times-system-serif);
  -webkit-font-smoothing: antialiased;
}
```

---

## 5. Estructura Modular de Archivos (Límite Estricto < 500 Líneas)

Todo el sistema se levanta con un único comando `npm run dev`. Ningún archivo supera las **280 líneas**, garantizando mantenibilidad total:

```text
safe-platform/ (o raíz del proyecto)
├── package.json                                  # Scripts unificados (npm run dev) [~65 líneas]
├── .env                                          # Variables PostgreSQL, Cloudinary y Gmail [~25 líneas]
├── public/
│   ├── manifest.json                             # Metadatos PWA e iconos de instalación [~40 líneas]
│   └── sw.js                                     # Service Worker para caché offline de ficha médica [~55 líneas]
├── prisma/
│   └── schema.prisma                             # Esquema PostgreSQL 1:1 con Cooldown [~140 líneas]
└── src/
    ├── app/
    │   ├── globals.css                           # Tokens Column Tailwind v4 [~95 líneas]
    │   ├── layout.tsx                            # Layout raíz + Navbar institucional + PWA Meta [~90 líneas]
    │   ├── page.tsx                              # 1. Landing Page Informativa (Halftone Hero) [~240 líneas]
    │   ├── r/
    │   │   └── [code]/
    │   │       └── page.tsx                      # 2. Router del Chip/QR (Redirige según status) [~70 líneas]
    │   ├── activate/
    │   │   └── [code]/
    │   │       └── page.tsx                      # 3. Onboarding 1ra Vez + PIN + Auto-Login [~260 líneas]
    │   ├── emergency/
    │   │   └── [code]/
    │   │       └── page.tsx                      # 4. Vista Pública de Emergencia + Disparo GPS [~275 líneas]
    │   ├── login/
    │   │   └── page.tsx                          # 5. Inicio de Sesión Web/PWA para Edición [~140 líneas]
    │   ├── dashboard/
    │   │   └── page.tsx                          # 6. Panel del Motociclista + WakeLock Modo Ruta [~280 líneas]
    │   ├── admin/
    │   │   └── page.tsx                          # 7. Fábrica Móvil: Lotes, QRs y Grabador/Simulador NFC [~290 líneas]
    │   └── api/
    │       ├── auth/
    │       │   ├── login/route.ts                # POST Login + Cookie JWT [~90 líneas]
    │       │   └── logout/route.ts               # POST Logout [~35 líneas]
    │       ├── upload/
    │       │   └── cloudinary/route.ts           # POST Subida firmada a Cloudinary [~85 líneas]
    │       ├── devices/
    │       │   └── activate/route.ts             # POST Vinculación 1ra vez + Creación Perfil [~150 líneas]
    │       ├── profile/
    │       │   └── route.ts                      # GET/PUT Edición de Ficha Médica y Contactos [~130 líneas]
    │       ├── gps/
    │       │   └── heartbeat/route.ts            # POST Coordenada en vivo del Modo Ruta [~75 líneas]
    │       ├── emergency/
    │       │   └── alert/route.ts                # POST Captura GPS Accidente + Cooldown + Gmail [~170 líneas]
    │       └── admin/
    │           ├── batches/route.ts              # GET/POST Generación de Lotes y Folios [~120 líneas]
    │           └── encode-nfc/route.ts           # PATCH Confirmación de Grabación Física NFC [~80 líneas]
    ├── components/
    │   ├── ui/
    │   │   ├── HalftoneMapSvg.tsx                # Mapa de puntos degradado característico de Column [~110 líneas]
    │   │   └── ColumnNavbar.tsx                  # Barra superior con Backdrop Blur [~90 líneas]
    │   ├── medical/
    │   │   ├── ContactsRepeater.tsx              # Lista dinámica ilimitada (+ Agregar contacto) [~160 líneas]
    │   │   ├── CloudinaryPhotoUploader.tsx       # Selector de cámara/galería hacia Cloudinary [~120 líneas]
    │   │   └── EmergencyActionButtons.tsx        # Botón 911 + Llamada Directa + WhatsApp con GPS [~140 líneas]
    │   └── admin/
    │       ├── NfcBurstWriterModal.tsx           # Grabador Web NFC en tira + Switch Read-Only [~210 líneas]
    │       ├── NfcSimulatorModal.tsx             # Emulador de antena NFC para pruebas en PC/Mac [~130 líneas]
    │       └── QrPrintSheet.tsx                  # Plancha de impresión de Stickers QR + Tarjetas PIN [~145 líneas]
    ├── hooks/
    │   ├── useWakeLock.ts                        # Hook para Screen WakeLock API en Modo Ruta [~50 líneas]
    │   └── useLocale.ts                          # Hook de gestión y conmutación de idioma ES/EN [~45 líneas]
    ├── locales/
    │   ├── index.ts                              # Tipos e interfaces del diccionario bilingüe [~70 líneas]
    │   ├── es.ts                                 # Diccionario 100% en Español (Cero hardcoding) [~280 líneas]
    │   └── en.ts                                 # Diccionario 100% en Inglés (Cero hardcoding) [~280 líneas]
    ├── services/
    │   ├── gps-maps.service.ts                   # Conversión Decimal -> DMS y URL Oficial Google Maps [~75 líneas]
    │   ├── cooldown.service.ts                   # Control anti-spam de alertas y distancia GPS [~60 líneas]
    │   ├── mail.service.ts                       # Cliente SMTP Gmail + Plantilla HTML Column [~165 líneas]
    │   ├── cloudinary.service.ts                 # SDK Cloudinary v2 (Subida y optimización de rostro) [~70 líneas]
    │   └── qr-generator.service.ts               # Generación local de códigos QR en SVG/DataURL [~60 líneas]
    └── lib/
        ├── db.ts                                 # Instancia Singleton de Prisma Client [~30 líneas]
        └── auth.ts                               # Firmado y verificación de JWT con jose [~85 líneas]
```

---

## 6. Esquema de Base de Datos PostgreSQL (`prisma/schema.prisma`)

Diseñado específicamente para relación **`1:1` (Un Chip = Una Cuenta)**, contactos de emergencia ilimitados y trazabilidad completa del chip NTAG216:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  RIDER
  ADMIN
}

enum DeviceStatus {
  UNCLAIMED // Virgen: al escanear lleva a /activate/[code]
  ACTIVE    // Activado: al escanear lleva SIEMPRE a /emergency/[code] y envía alertas
  DISABLED  // Dado de baja por extravío
}

model User {
  id             String          @id @default(uuid())
  email          String          @unique
  passwordHash   String
  role           Role            @default(RIDER)
  
  // Relación 1:1 con el Chip/QR
  device         Device?
  medicalProfile MedicalProfile?

  // Estado del Modo Ruta GPS (cuando el motociclista sale a rodar)
  liveRideActive Boolean         @default(false)
  lastKnownLat   Float?
  lastKnownLng   Float?
  lastGpsAt      DateTime?

  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
}

model Device {
  id                String           @id @default(uuid())
  code              String           @unique // Ej: "SAFE-0001"
  activationPin     String                   // PIN secreto de 6 dígitos impreso en la tarjeta
  batchName         String                   // Ej: "Tira-NTAG216-01"
  
  // Metadatos del chip físico NTAG216 grabados desde el teléfono del Admin
  nfcSerialNumber   String?                  // Ej: "04:D4:F1:34:C2:2A:81"
  isNfcEncoded      Boolean          @default(false)
  isLockedReadOnly  Boolean          @default(false)
  status            DeviceStatus     @default(UNCLAIMED)

  // Vinculación 1:1 con la cuenta del motociclista
  userId            String?          @unique
  user              User?            @relation(fields: [userId], references: [id], onDelete: SetNull)

  alerts            EmergencyAlert[]
  lastAlertAt       DateTime?        // Timestamp de última alerta enviada (cooldown anti-spam)
  encodedAt         DateTime?
  activatedAt       DateTime?
  createdAt         DateTime         @default(now())
}

model MedicalProfile {
  id                String   @id @default(uuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Datos de Identificación y Cloudinary
  fullName          String
  nationalId        String   // Número de Cédula / Identificación
  photoUrl          String   // URL optimizada de Cloudinary
  photoPublicId     String?  // ID público en Cloudinary para reemplazo limpio
  birthDate         DateTime?

  // Datos Clínicos Críticos
  bloodType         String   // Ej: "O+", "A-", etc.
  allergies         String   // Alergias a medicamentos o alimentos
  chronicConditions String   // Enfermedades preexistentes
  medications       String   // Medicación actual
  insuranceInfo     String?  // Seguro médico / Póliza / Clínica
  emergencyNumber   String   @default("911") // Número de emergencia local para testigos

  // Contactos de Emergencia Ilimitados
  // Estructura JSON: Array<{ id: string, name: string, relation: string, phone: string, email: string }>
  emergencyContacts Json     @default("[]")

  updatedAt         DateTime @updatedAt
}

model EmergencyAlert {
  id              String   @id @default(uuid())
  deviceId        String
  device          Device   @relation(fields: [deviceId], references: [id], onDelete: Cascade)
  scanSource      String   // "nfc" o "qr"
  latitude        Float
  longitude       Float
  dmsFormatted    String   // Ej: "2°10'06.9"S 79°27'10.6"W"
  googleMapsUrl   String   // Link directo oficial a Google Maps
  locationOrigin  String   // "SCANNER_DEVICE_GPS" o "RIDER_FALLBACK_GPS"
  emailsSentCount Int      @default(0)
  wasThrottled    Boolean  @default(false) // Indica si se suprimió el reenvío de correo por ventana de cooldown
  scannerIp       String?
  createdAt       DateTime @default(now())
}
```

---

## 7. Módulos Nucleares de Código (Referencia de Implementación)

### 7.1. Servicio Generador de Link Directo Google Maps (`src/services/gps-maps.service.ts`)
Transforma cualquier coordenada decimal en la nomenclatura sexagesimal exacta (`DMS`) y genera el enlace directo de Google Maps:

```typescript
export interface DirectGoogleMapsPayload {
  lat: number;
  lng: number;
  dmsLabel: string;
  googleMapsUrl: string;
  whatsappShareText: string;
}

function decimalToDMS(coord: number, isLatitude: boolean): string {
  const absolute = Math.abs(coord);
  const degrees = Math.floor(absolute);
  const minutesFloat = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = ((minutesFloat - minutes) * 60).toFixed(1);

  const hemisphere = isLatitude
    ? coord >= 0 ? "N" : "S"
    : coord >= 0 ? "E" : "W";

  const minPadded = String(minutes).padStart(2, "0");
  const secPadded = String(seconds).padStart(4, "0");

  return `${degrees}°${minPadded}'${secPadded}"${hemisphere}`;
}

export function buildGoogleMapsDirectData(
  lat: number,
  lng: number,
  riderName: string
): DirectGoogleMapsPayload {
  const latDMS = decimalToDMS(lat, true);
  const lngDMS = decimalToDMS(lng, false);
  const dmsLabel = `${latDMS} ${lngDMS}`;

  const encodedDms = encodeURIComponent(dmsLabel).replace(/%20/g, "+");
  const googleMapsUrl = `https://www.google.com/maps/place/${encodedDms}/@${lat},${lng},744m/data=!3m2!1e3!4b1!4m4!3m3!8m2!3d${lat}!4d${lng}`;

  const whatsappShareText =
    `🚨 *ALERTA DE EMERGENCIA SAFE* 🚨
` +
    `Se ha escaneado el casco de *${riderName}*.

` +
    `📍 *Coordenadas:* ${dmsLabel}
` +
    `🗺️ *Abrir ubicación exacta en Google Maps:*
${googleMapsUrl}`;

  return {
    lat,
    lng,
    dmsLabel,
    googleMapsUrl,
    whatsappShareText,
  };
}
```

---

### 7.2. Servicio de Subida de Fotografía a Cloudinary (`src/services/cloudinary.service.ts`)
Conecta con tu cuenta de `https://console.cloudinary.com/`, redimensiona automáticamente la foto a un cuadrado nítido de `600x600px` centrado en el rostro y la entrega en formato `webp`/`avif` ultraligero:

```typescript
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface CloudinaryUploadResult {
  photoUrl: string;
  photoPublicId: string;
}

export async function uploadRiderPhotoToCloudinary(
  base64DataUri: string,
  deviceCode: string
): Promise<CloudinaryUploadResult> {
  const result = await cloudinary.uploader.upload(base64DataUri, {
    folder: "safe_riders_profiles",
    public_id: `rider_${deviceCode}_${Date.now()}`,
    overwrite: true,
    transformation: [
      { width: 600, height: 600, crop: "fill", gravity: "face" },
      { quality: "auto:good", fetch_format: "auto" },
    ],
  });

  return {
    photoUrl: result.secure_url,
    photoPublicId: result.public_id,
  };
}
```

---

### 7.3. Grabador Web NFC en Serie con Switch de Bloqueo (`src/components/admin/NfcBurstWriterModal.tsx` - Lógica Central)
Permite al Administrador pasar el teléfono del Chip 1 al 10 sobre la tira de stickers NTAG216, grabando la URL, leyendo el número de serie físico (`04:D4:F1:34:C2:2A:81`) y aplicando el bloqueo de solo lectura si el switch está activo:

```typescript
export async function startNfcStripEncodingSession(options: {
  devicesToEncode: Array<{ code: string }>;
  lockReadOnly: boolean;
  baseUrl: string;
  onProgress: (index: number, code: string, serialNumber: string) => void;
  onComplete: () => void;
  onError: (msg: string) => void;
}) {
  if (!("NDEFReader" in window)) {
    options.onError("Usa Google Chrome en tu teléfono Android con el NFC activado.");
    return;
  }

  const ndef = new (window as any).NDEFReader();
  await ndef.scan();

  let currentIndex = 0;
  let lastPhysicalUid = "";

  ndef.onreading = async (event: any) => {
    const physicalUid: string = event.serialNumber || "UID-UNKNOWN";

    // Candado Anti-Doble Toque en la tira de stickers
    if (physicalUid === lastPhysicalUid) {
      return;
    }

    const targetDevice = options.devicesToEncode[currentIndex];
    if (!targetDevice) return;

    const uniqueChipUrl = `${options.baseUrl}/r/${targetDevice.code}?v=nfc`;

    try {
      // 1. Escribir registro URL NDEF en el chip NTAG216
      await ndef.write({
        records: [{ recordType: "url", data: uniqueChipUrl }],
      });

      // 2. Si el Admin activó el Switch "Bloquear escritura (Modo Producción)"
      if (options.lockReadOnly && typeof ndef.makeReadOnly === "function") {
        await ndef.makeReadOnly();
      }

      // 3. Registrar en PostgreSQL que tanto el QR como el Chip ya están vinculados
      await fetch("/api/admin/encode-nfc", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: targetDevice.code,
          nfcSerialNumber: physicalUid,
          isLockedReadOnly: options.lockReadOnly,
        }),
      });

      lastPhysicalUid = physicalUid;
      navigator.vibrate?.([120, 60, 120]);
      options.onProgress(currentIndex + 1, targetDevice.code, physicalUid);

      currentIndex++;
      if (currentIndex >= options.devicesToEncode.length) {
        options.onComplete();
      }
    } catch (err: any) {
      options.onError(`Error grabando ${targetDevice.code}: ${err.message}`);
    }
  };
}
```

---

### 7.4. Router del Casco sin Complicaciones (`src/app/r/[code]/page.tsx`)
Cumple al pie de la letra tu instrucción: si está virgen (`UNCLAIMED`) lleva a activar; si ya está activo (`ACTIVE`), lleva **siempre** a la vista de emergencia y dispara los avisos sin importar quién lo escanee:

```typescript
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";

interface RouteProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ v?: string }>;
}

export default async function ChipEntryRouterPage({ params, searchParams }: RouteProps) {
  const { code } = await params;
  const { v } = await searchParams;
  const scanSource = v === "nfc" || v === "qr" ? v : "direct";

  const device = await db.device.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!device || device.status === "DISABLED") {
    notFound();
  }

  // 1. PRIMERA VEZ: Chip virgen -> Formulario de Activación + Auto-Login
  if (device.status === "UNCLAIMED" || !device.userId) {
    redirect(`/activate/${device.code}`);
  }

  // 2. CHIP ACTIVO: Siempre abre Modo Emergencia y dispara las alertas
  redirect(`/emergency/${device.code}?v=${scanSource}`);
}
```

---

## 8. Variables de Entorno Requeridas (`.env.example`)

```ini
# 1. Base de Datos PostgreSQL
DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/safe_db?schema=public"

# 2. URL Pública del Servidor (En desarrollo o dominio de producción)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# 3. Seguridad de Sesión (JWT HttpOnly para /login y /dashboard)
JWT_SECRET="clave_secreta_institucional_safe_2026_super_segura"

# 4. Credenciales de Administrador (Acceso a /admin desde el móvil)
ADMIN_MASTER_KEY="admin_safe_2026"

# 5. Cloudinary (Subida de Fotos de Perfil Médico - https://console.cloudinary.com/)
CLOUDINARY_CLOUD_NAME="tu_cloud_name"
CLOUDINARY_API_KEY="tu_api_key"
CLOUDINARY_API_SECRET="tu_api_secret"

# 6. Correo Google SMTP (Envío automático de Alertas con Link Google Maps)
GMAIL_USER="tucorreo@gmail.com"
GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"
```

---

## 9. Hoja de Ruta de Construcción (Orden de Entrega de Código)

Para mantener cada archivo limpio y por debajo de las 500 líneas, construiremos el código ejecutable en **4 bloques modulares**:

1. **Bloque 1 — Base, Base de Datos y Servicios Backend:** `package.json`, `prisma/schema.prisma`, `src/app/globals.css` (Tokens Column), `src/lib/db.ts`, `src/lib/auth.ts`, `src/services/gps-maps.service.ts`, `src/services/cloudinary.service.ts`, `src/services/mail.service.ts` y `src/services/qr-generator.service.ts`.
2. **Bloque 2 — API Routes Completas (`/api/*`):** Endpoints de creación de lotes, marcado de chip NFC, subida a Cloudinary, activación con PIN + Auto-Login, inicio de sesión web, actualización de perfil/contactos, *heartbeat* GPS y disparo de alerta de emergencia por Gmail.
3. **Bloque 3 — Vistas Públicas y de Emergencia:** Landing Page estilo Column (`/`), Router del casco (`/r/[code]`), Vista de Activación de Primera Vez (`/activate/[code]`) y Vista de Emergencia con captura GPS, botón 911 y enlaces directos de WhatsApp/Llamada (`/emergency/[code]`).
4. **Bloque 4 — Panel del Motociclista y Fábrica Móvil del Admin:** Login independiente (`/login`), Dashboard del Motociclista con contactos ilimitados y Modo Ruta GPS (`/dashboard`), y Panel Admin móvil con impresión de QRs y grabador Web NFC en tira con switch de bloqueo (`/admin`).
