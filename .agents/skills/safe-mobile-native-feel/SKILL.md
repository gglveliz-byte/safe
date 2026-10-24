---
name: safe-mobile-native-feel
description: >-
  Directrices de ergonomía y experiencia de usuario móvil con sensación nativa (Mobile-First Native Feel) para SAFE. Define áreas seguras (safe-area-insets), objetivos táctiles mínimos de 44x44px, retroalimentación háptica (navigator.vibrate), hojas inferiores modales (bottom sheets), control de suspensión de pantalla (Screen WakeLock API) para el Modo Ruta, modo PWA standalone e interfaces de emergencia legibles bajo luz solar directa.
---

# Skill: Experiencia Móvil con Sensación Nativa (Mobile-First Native Feel)

El 95% de las interacciones con **SAFE** ocurren sobre teléfonos móviles:
1. El **paramédico o testigo** en la calle escaneando el casco bajo luz solar directa.
2. El **motociclista** rodando en carretera con el teléfono en el manillar o en el bolsillo.
3. El **administrador** pasando stickers en serie con la antena NFC del móvil.

Esta skill garantiza que la aplicación web se sienta indistinguible de una app nativa de iOS o Android.

---

## 1. Ergonomía de Pantalla y Zonas Seguras (Safe Area Insets)

Todo layout debe adaptarse a las muescas (notches), barras de inicio gestual y esquinas redondeadas de los teléfonos modernos:

```css
/* Soporte obligatorio para notch y home indicator */
.safe-mobile-container {
  padding-top: max(16px, env(safe-area-inset-top));
  padding-bottom: max(24px, env(safe-area-inset-bottom));
  padding-left: max(16px, env(safe-area-inset-left));
  padding-right: max(16px, env(safe-area-inset-right));
  min-height: 100dvh; /* Dynamic viewport height para evitar brincos con el teclado móvil */
}
```

- **Viewport Meta:**
  `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />`
- **Eliminación del parpadeo táctil en iOS/Android:**
  `-webkit-tap-highlight-color: transparent;`
  `touch-action: manipulation;`

---

## 2. Tamaño de Objetivos Táctiles (Touch Targets Mínimo 44x44px)

Ningún elemento interactivo puede frustrar al usuario o a un paramédico con guantes de rescate:
- **Área mínima interactiva:** `44x44px` físicos, incluso si el icono visual es de 20px (usando padding transparente o pseudo-elementos).
- **Espaciado entre botones críticos:** Mínimo `12px` de separación para evitar toques accidentales entre "Llamar 911" y "Llamar Familiar".

---

## 3. Retroalimentación Háptica (Vibración Sensorial Táctil)

La Web Vibration API debe ejecutarse en momentos de confirmación o alerta:

```typescript
export function triggerHapticFeedback(pattern: "light" | "success" | "warning" | "error") {
  if (typeof window === "undefined" || !("vibrate" in navigator)) return;
  
  switch (pattern) {
    case "light":
      navigator.vibrate(40); // Toque sutil de botón
      break;
    case "success":
      navigator.vibrate([60, 40, 80]); // Confirmación de guardado o chip grabado
      break;
    case "warning":
      navigator.vibrate([100, 50, 100]); // Alerta de emergencia detectada
      break;
    case "error":
      navigator.vibrate([150, 80, 150, 80, 200]); // PIN inválido o error NFC
      break;
  }
}
```

---

## 4. Hojas Inferiores Modales (Bottom Sheets) en Móvil

En lugar de popups o modales centrados flotantes de escritorio (incómodos de alcanzar con una mano), las acciones secundarias en móvil deben abrirse desde la parte inferior:
- Anclaje inferior con tirador visual (`drag handle`) de `32px` de ancho por `4px` de alto en `#dadada`.
- Radio superior de `16px`.
- Botones de acción al alcance del pulgar (`thumb zone`).

---

## 5. Prevención de Suspensión de Pantalla (Screen WakeLock API para Modo Ruta)

Durante el *Modo Ruta*, el motociclista suele montar el móvil en el manillar o rodar con la pantalla encendida. Para evitar que la pantalla se apague y el navegador congele el rastreo GPS:

```typescript
// src/hooks/useWakeLock.ts
export function useWakeLock(isActive: boolean) {
  useEffect(() => {
    let sentinel: any = null;
    async function requestWake() {
      if ("wakeLock" in navigator && isActive) {
        try {
          sentinel = await (navigator as any).wakeLock.request("screen");
        } catch (e) {
          console.warn("WakeLock no disponible:", e);
        }
      }
    }
    requestWake();
    return () => {
      if (sentinel) sentinel.release();
    };
  }, [isActive]);
}
```

---

## 6. Configuración PWA Nativa (`public/manifest.json`)

Para que el usuario pueda "Instalar en Pantalla de Inicio" sin bordes de navegador:
- `display: "standalone"`
- `theme_color: "#efefef"`
- `background_color: "#efefef"`
- `orientation: "portrait"`

---

## 7. Contraste Solar en Vista de Emergencia

En accidentes al aire libre a pleno sol:
- Utilizar tipografía de alto contraste `#000000` sobre fondos `#ffffff`.
- Datos clínicos críticos (tipo de sangre, alergias severas) en texto grande con bordes gruesos de alto contraste.
- Botones de llamada directa (`tel:911` y `tel:+...`) con iconos SVG claros y legibles a distancia de 1 metro.
