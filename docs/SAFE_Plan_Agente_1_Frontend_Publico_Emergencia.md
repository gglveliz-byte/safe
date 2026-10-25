# SAFE — Plan de Arquitectura Frontend: AGENTE 1 (Público, Emergencia y Onboarding)
> **Rol:** Director de Frontend — Parte 1: Frente Vial, Emergencia en Carretera y Activación de Kits  
> **Dominio Exclusivo:** Vistas Públicas (`/`, `/emergency/[code]`, `/activate/[code]`, `/terms`, `/privacy`) · Componentes UI Broadsheet · Componentes Médicos de Rescate  
> **Regla de Integración:** 100% acoplado a los endpoints del Backend ya certificado. **PROHIBIDO TOCAR CÓDIGO DE BACKEND**.  
> **Límite Estricto:** Menos de 500 líneas físicas por archivo · Cabeceras y comentarios en Español · Cero mocks o datos estáticos de demostración.

---

## 1. Misión y Territorio Exclusivo de Agente 1 (Frontend Parte 1)

El **Agente 1** construye la experiencia visual pública más crítica de la plataforma: la pantalla que salva vidas en carretera cuando un rescatista escanea el casco de un motociclista accidentado, el portal de activación de nuevos kits físicos y la portada institucional.

```mermaid
flowchart TD
    subgraph DominioFrontend1["FRONTEND PARTE 1 (DIRECTOR AGENTE 1)"]
        subgraph VistasPublicas["Vistas Públicas Oficiales"]
            V_Land["src/app/page.tsx (Landing Page Editorial Broadsheet)"]
            V_Emerg["src/app/emergency/[code]/page.tsx (Ficha Médica + GPS + 911)"]
            V_Act["src/app/activate/[code]/page.tsx (Onboarding de Casco + PIN)"]
            V_Terms["src/app/terms/page.tsx (Términos Legales y Buen Samaritano)"]
            V_Priv["src/app/privacy/page.tsx (Política de Privacidad y Habeas Data)"]
        end

        subgraph ComponentesUI["Librería de Componentes Broadsheet (src/components/ui/*)"]
            C_Nav["IncidentNavbar.tsx (Cabecera editorial con selector de idioma)"]
            C_Foot["IncidentFooter.tsx (Pie de página técnico sobrio)"]
            C_Btn["IncidentButton.tsx (Botón neutro con marco negro 1px)"]
            C_Card["IncidentCard.tsx (Tarjeta sobre papel blanco con bordes 1px)"]
            C_Ban["IncidentAlertBanner.tsx (Banner de estado de alerta Signal Orange)"]
            C_Hair["IncidentHairline.tsx (Línea separadora de 1px)"]
        end

        subgraph ComponentesMedicos["Componentes Clínicos y de Rescate (src/components/medical/*)"]
            M_Badge["MedicalBadge.tsx (Grupo sanguíneo, alergias en alto contraste solar)"]
            M_Panel["EmergencyActionPanel.tsx (Llamada 911, WhatsApp SOS, compartir GPS)"]
            M_Rep["ContactsRepeater.tsx (Añadir/editar contactos familiares dinámicos)"]
            M_Pick["CloudinaryPhotoPicker.tsx (Cámara/foto con subida a Cloudinary)"]
        end
    end

    subgraph BackendEndpoints["Route Handlers Certificados en Neon (SOLO CONSUMO)"]
        API_EmgCode["GET /api/emergency/[code] (Lectura de ficha médica real)"]
        API_EmgAlert["POST /api/emergency/alert (Despacho GPS de alerta en vivo)"]
        API_DevAct["POST /api/devices/activate (Alta atómica con PIN)"]
        API_Upload["POST /api/upload/cloudinary (Subida de foto de rostro)"]
    end

    V_Emerg --> API_EmgCode
    V_Emerg --> API_EmgAlert
    V_Act --> API_DevAct
    M_Pick --> API_Upload
```

---

## 2. Inventario de Archivos Bajo Custodia Exclusiva (Frontend Parte 1)

> [!CAUTION]
> **LÍMITE DE CUSTODIA:** El Director Frontend 2 y otros agentes tienen **estrictamente prohibido modificar estos archivos**:

1. `src/app/page.tsx`: Landing page broadsheet con estadísticas de respuesta, explicación del chip y accesos directos.
2. `src/app/emergency/[code]/page.tsx`: Ficha médica de rescate; consume `GET /api/emergency/[code]`, captura GPS del navegador al montar y dispara `POST /api/emergency/alert`.
3. `src/app/activate/[code]/page.tsx`: Formulario de activación de 1ra vez; valida PIN, captura datos clínicos y consentimiento, y despacha a `POST /api/devices/activate`.
4. `src/app/terms/page.tsx`: Términos de rescate y cláusula del Buen Samaritano bilingüe.
5. `src/app/privacy/page.tsx`: Política de tratamiento de datos médicos sensibles (Habeas Data).
6. `src/components/ui/IncidentNavbar.tsx`: Barra superior con selector de idioma instantáneo.
7. `src/components/ui/IncidentFooter.tsx`: Pie de página editorial con enlaces legales y estado del sistema.
8. `src/components/ui/IncidentButton.tsx`: Botón neutro interactivo con feedback háptico.
9. `src/components/ui/IncidentCard.tsx`: Contenedor tipo ficha sobre papel blanco.
10. `src/components/ui/IncidentAlertBanner.tsx`: Indicador visual de alerta despachada y ventana anti-spam.
11. `src/components/ui/IncidentHairline.tsx`: Separador gráfico de 1px.
12. `src/components/medical/MedicalBadge.tsx`: Insignia de alta visibilidad para grupo sanguíneo y alergias.
13. `src/components/medical/EmergencyActionPanel.tsx`: Botonera táctil de 44x44px mínimos para 911 y WhatsApp.
14. `src/components/medical/ContactsRepeater.tsx`: Repetidor dinámico de contactos de emergencia.
15. `src/components/medical/CloudinaryPhotoPicker.tsx`: Componente de captura de foto con recorte centrado.

---

## 3. Principio de Conexión Real al Backend (Erradicación de Mocks)

* **En `src/app/emergency/[code]/page.tsx`:**  
  Eliminar cualquier estado inicial de demostración (`fullName: "Conductor Protegido"`). La vista debe arrancar en estado de carga (*skeleton* broadsheet) y hacer fetch a `GET /api/emergency/[code]`. Si el chip está inactivo o no existe, renderizar el estado de error humano en el idioma seleccionado.
* **En `src/app/activate/[code]/page.tsx`:**  
  Conectar directamente con `POST /api/devices/activate`. Al recibir `{ success: true, redirect: "/dashboard" }`, redirigir al panel del conductor.
* **En `src/components/medical/CloudinaryPhotoPicker.tsx`:**  
  Subir el archivo base64 o multipart directamente a `POST /api/upload/cloudinary` y recibir `{ photoUrl, photoPublicId }`.

---

## 4. Verificación Automatizada Independiente de Agente 1
1. Ejecutar `npx tsc --noEmit` para verificar tipado estricto.
2. Comprobar que ningún archivo exceda las 500 líneas físicas.
3. Actualizar `docs/LIVE_ARCHITECTURE_LEDGER.md` tras completar cada vista o componente.
