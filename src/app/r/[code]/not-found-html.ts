/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Gateway Público del Casco — Página HTML Bilingüe de Chip Inactivo
 * ARCHIVO: src/app/r/[code]/not-found-html.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Módulo co-ubicado del gateway `/r/[code]` que construye la página "404 HTML
 * bilingüe" exigida por docs/BACKEND_CONTRACTS.md §9 y §11 cuando el casco
 * escaneado no existe o fue dado de baja (DISABLED). El documento es 100%
 * autónomo: CSS en línea con los tokens del sistema de diseño 'Incident —
 * Technical broadsheet on concrete' (lienzo Concrete #efefef, tarjeta Paper
 * #ffffff con borde Ink de 1px y radio de 12px, titular Times 24px bold,
 * baliza Signal Orange #f25533, microetiquetas Arial 13px) y CERO assets
 * externos (sin fuentes, imágenes ni scripts), de modo que se renderiza
 * íntegro incluso al borde de la vía con cobertura móvil mínima.
 *
 * VOZ BILINGÜE (skill safe-bilingual-i18n):
 * - El español y el inglés conviven en el mismo documento (bloques lang).
 * - Lenguaje 100% humano, sin jerga técnica: jamás aparece "404 Not Found";
 *   explica qué pasó ("Este casco no está registrado o fue dado de baja"),
 *   orienta ante una emergencia real y ofrece volver al inicio.
 *
 * ENTRADAS: ninguna (documento institucional estático, sin datos de BD).
 * SALIDAS: string HTML completo listo para servirse como text/html; charset=utf-8.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 450 líneas físicas.
 * - Cero datos hardcodeados de demo: sólo copy institucional y tokens de diseño.
 * - Cabecera y comentarios canónicos en Español.
 * ==============================================================================
 */

/**
 * Construye el documento HTML autónomo (CSS en línea, cero assets externos)
 * que el gateway devuelve con estado 404 cuando el casco escaneado no existe
 * o está DISABLED. Cumple el contrato §9/§11: aviso humano bilingüe con la
 * estética 'Incident' en lugar de un JSON técnico incomprensible para el
 * transeúnte que acaba de escanear el chip en la vía.
 *
 * @returns Documento HTML completo (DOCTYPE incluido) como string.
 */
export function buildChipInactiveHtml(): string {
  // Nota: el HTML es institucional y estático; no interpola datos de la base
  // ni del escáner, por lo que no requiere escapado dinámico ni assets.
  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>SAFE — Casco no registrado · Helmet not registered</title>
    <style>
      /* Tokens del sistema de diseño 'Incident': plano, editorial, sin gradientes. */
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: #efefef; /* Concrete: lienzo principal */
        color: #000000;      /* Ink: texto y líneas capilares */
        font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
      }
      .card {
        width: 100%;
        max-width: 480px;
        background: #ffffff; /* Paper: tarjeta flotando sobre el concreto */
        border: 1px solid #000000;
        border-radius: 12px; /* Radio canónico de tarjeta */
        padding: 32px 24px;
        box-shadow: rgba(22, 22, 24, 0.02) 0px 8px 15px -3px,
                    rgba(22, 22, 24, 0.04) 0px 4px 6px -2px; /* Sombra ultraligera */
        text-align: center;
      }
      .micro {
        margin: 0 0 20px;
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
        font-size: 13px;      /* Microetiqueta Arial 13px */
        line-height: 1.2;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .beacon {
        width: 14px;
        height: 14px;
        margin: 0 auto 20px;
        border-radius: 50%;
        background: #f25533; /* Signal Orange: baliza de marca */
        box-shadow: 0 0 0 6px rgba(242, 85, 51, 0.15);
      }
      h1 {
        margin: 0 0 8px;
        font-size: 24px; /* Times 24px bold: titular canónico */
        font-weight: 700;
        line-height: 1.2;
      }
      .headline-en {
        margin: 0 0 20px;
        font-size: 19px;
        line-height: 1.2;
        color: #161618; /* Carbon: énfasis atenuado del bloque inglés */
      }
      .rule {
        border: 0;
        border-top: 1px solid #dadada; /* Hairline Mist entre secciones */
        margin: 0 0 20px;
      }
      p.body-text {
        margin: 0 0 14px;
        font-size: 16px;
        line-height: 1.5;
        text-align: left;
      }
      p.body-text[lang="en"] { margin-bottom: 24px; color: #161618; }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px; /* Objetivo táctil mínimo (mobile-first) */
        padding: 12px 18px;
        background: #efefef;         /* Botón neutro enmarcado */
        border: 1px solid #000000;
        border-radius: 4px;          /* Radio estricto de botón, sin píldoras */
        color: #000000;
        text-decoration: none;
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
        font-size: 13px;
      }
      .btn:active { transform: scale(0.98); } /* Hundimiento leve al pulsar */
    </style>
  </head>
  <body>
    <main class="card">
      <div class="beacon" aria-hidden="true"></div>
      <p class="micro">SAFE · Estado del casco · Helmet status</p>

      <h1>Este casco no está registrado o fue dado de baja</h1>
      <p class="headline-en" lang="en">This helmet is not registered or was deactivated</p>

      <hr class="rule" />

      <p class="body-text">
        El código que escaneaste no pertenece a un casco activo de SAFE. Puede que
        el conductor aún no haya completado el registro de su kit, o que este casco
        haya sido reportado como perdido, robado o reemplazado.
      </p>
      <p class="body-text" lang="en">
        The code you scanned does not belong to an active SAFE helmet. The rider may
        not have finished registering the kit yet, or this helmet may have been
        reported as lost, stolen or replaced.
      </p>
      <p class="body-text">
        Si estás atendiendo una emergencia real en la vía, llama de inmediato al
        número local de emergencias de tu ciudad.
      </p>
      <p class="body-text" lang="en">
        If you are assisting a real emergency on the road, call your local emergency
        number right away.
      </p>

      <a class="btn" href="/">Volver al inicio · Back to home</a>
    </main>
  </body>
</html>`;
}
