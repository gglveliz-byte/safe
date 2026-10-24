/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Sistema de Diseño Incident — Tokens de Tailwind CSS
 * ARCHIVO: tailwind.config.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Tokens oficiales del sistema 'Incident — Technical broadsheet on concrete'.
 * Define la paleta cromática sobria (#efefef, #000000, #ffffff, #f25533, #ff492c),
 * tipografía bimodal (Times para titulares y lectura, Arial para microetiquetas),
 * y radios estrictos sin píldoras.
 * 
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Cero colores fuera de la paleta canónica.
 * - Cero gradientes.
 * ==============================================================================
 */

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        concrete: "#efefef",
        paper: "#ffffff",
        ink: "#000000",
        carbon: "#161618",
        "signal-orange": "#f25533",
        "alert-red": "#ff492c",
        ember: "#f1641e",
        mist: "#dadada",
        fog: "#cccccc",
        parchment: "#e4d9c8",
      },
      fontFamily: {
        serif: [
          "'Times (system serif)'",
          "ui-serif",
          "Georgia",
          "Cambria",
          "'Times New Roman'",
          "Times",
          "serif",
        ],
        sans: [
          "'Arial (system sans)'",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
      },
      fontSize: {
        micro: ["13px", { lineHeight: "1.2" }],
        body: ["16px", { lineHeight: "1.25" }],
        "body-lg": ["19px", { lineHeight: "1.25" }],
        "heading-sm": ["24px", { lineHeight: "1.2" }],
        heading: ["32px", { lineHeight: "1.2" }],
      },
      boxShadow: {
        incident: "0px 4px 6px -2px rgba(22, 22, 24, 0.04), 0px 8px 15px -3px rgba(22, 22, 24, 0.02)",
      },
    },
  },
  plugins: [],
};

export default config;
