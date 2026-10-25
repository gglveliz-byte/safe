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
        // Paleta oficial SAFE 2026
        brand: {
          white: "#FFFFFF",
          "bg-alt": "#F8FAFC",
          "bg-subtle": "#F1F5F9",
          "navy-dark": "#0B1F3A",
          "navy-secondary": "#15365B",
          "text-desc": "#23466D",
          "text-muted": "#5C718A",
          accent: "#FF5138",
          "accent-hover": "#F45136",
          "nav-blue": "#2F648F",
          "nav-active": "#EDF5FC",
          "border-subtle": "#D7E3F0",
          "border-field": "#C9D9E9",
          "border-strong": "#B8CADD",
          separator: "#DCE5EE",
        },
        // Alias de compatibilidad
        concrete: "#FFFFFF",
        paper: "#FFFFFF",
        ink: "#0B1F3A",
        carbon: "#23466D",
        "signal-orange": "#FF5138",
        "alert-red": "#FF5138",
        ember: "#F45136",
        mist: "#D7E3F0",
        fog: "#B8CADD",
        parchment: "#F8FAFC",
      },
      fontFamily: {
        serif: ["var(--font-newsreader)", "Newsreader", "Georgia", "serif"],
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      fontSize: {
        micro: ["13px", { lineHeight: "1.2" }],
        body: ["16px", { lineHeight: "1.5" }],
        "body-lg": ["18px", { lineHeight: "1.6" }],
        "heading-sm": ["22px", { lineHeight: "1.25" }],
        heading: ["34px", { lineHeight: "1.15" }],
      },
      boxShadow: {
        incident: "0 1px 3px 0 rgba(11, 31, 58, 0.05), 0 1px 2px 0 rgba(11, 31, 58, 0.03)",
        card: "0 4px 6px -1px rgba(11, 31, 58, 0.04), 0 2px 4px -1px rgba(11, 31, 58, 0.02)",
        hover: "0 12px 24px -4px rgba(11, 31, 58, 0.08), 0 4px 6px -2px rgba(11, 31, 58, 0.03)",
      },
      keyframes: {
        fadeInDown: {
          from: { opacity: "0", transform: "translateY(-12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseSonar: {
          "0%": { transform: "scale(0.85)", opacity: "0.9" },
          "50%": { opacity: "0.45" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.9", boxShadow: "0 0 0 0 rgba(255, 81, 56, 0.45)" },
          "50%": { opacity: "1", boxShadow: "0 0 12px 3px rgba(255, 81, 56, 0.6)" },
        },
        borderPulse: {
          "0%, 100%": { borderColor: "#FF5138", boxShadow: "-3px 0 10px rgba(255, 81, 56, 0.15)" },
          "50%": { borderColor: "#FF7560", boxShadow: "-3px 0 18px rgba(255, 81, 56, 0.35)" },
        },
      },
      animation: {
        fadeInDown: "fadeInDown 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        fadeInUp: "fadeInUp 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        sonar: "pulseSonar 2.6s cubic-bezier(0.215, 0.61, 0.355, 1) infinite",
        glow: "pulseGlow 2.2s ease-in-out infinite",
        goldenBorder: "borderPulse 3.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

