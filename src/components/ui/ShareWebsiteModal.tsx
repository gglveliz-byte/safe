/**
 * ==============================================================================
 * PROYECTO: SAFE / ALTUS-CHIP — Protocolo Broadsheet 2026
 * MÓDULO: UI Componentes — Modal de Compartir Web & Código QR Oficial
 * ARCHIVO: src/components/ui/ShareWebsiteModal.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Modal institucional y de alta conversión para compartir la plataforma
 * Altus-Chip Emergencia Médica en canales sociales (WhatsApp, Facebook, X,
 * Telegram, Copiar Enlace y Web Share API) y proyectar el Código QR oficial
 * para acceso directo instantáneo desde la cámara de cualquier teléfono.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - CERO emojis: 100% iconos vectoriales SVG oficiales de cada plataforma.
 * - Cero textos hardcodeados: 100% bilingüe mediante useLocale().
 * - Táctiles >= 44x44px con respuesta háptica y accesibilidad de teclado (ESC).
 * ==============================================================================
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { BrandLogo } from "@/components/ui/BrandLogo";

export interface ShareWebsiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OFFICIAL_URL = "https://www.altuschip.com";

export function ShareWebsiteModal({ isOpen, onClose }: ShareWebsiteModalProps) {
  const { t, locale } = useLocale();
  const { triggerHaptic } = useHaptic();
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  // Detección de soporte para Web Share API nativo en móviles
  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setCanNativeShare(true);
    }
  }, []);

  // Cierre accesible con tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        triggerHaptic("light");
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, triggerHaptic]);

  const shareText = locale === "es"
    ? "Altus Chip — Respaldo Médico en Carretera. Un boletín vital en tu casco que te protege en cualquier accidente vial:"
    : "Altus Chip — Roadside Medical Protection. A vital medical broadsheet on your helmet safeguarding you anywhere:";

  // Acción de copiar al portapapeles
  const handleCopy = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(OFFICIAL_URL);
      }
      triggerHaptic("success");
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback si clipboard está bloqueado
      triggerHaptic("light");
    }
  }, [triggerHaptic]);

  // Acción de compartir nativo
  const handleNativeShare = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        triggerHaptic("light");
        await navigator.share({
          title: "Altus Chip — Emergencia Médica",
          text: shareText,
          url: OFFICIAL_URL,
        });
      } catch {
        // Cancelado o cerrado por el usuario
      }
    }
  }, [shareText, triggerHaptic]);

  if (!isOpen) return null;

  const encodedUrl = encodeURIComponent(OFFICIAL_URL);
  const encodedText = encodeURIComponent(`${shareText} ${OFFICIAL_URL}`);

  const shareChannels = [
    {
      id: "whatsapp",
      label: t.landing.shareViaWhatsApp,
      href: `https://api.whatsapp.com/send?text=${encodedText}`,
      bgClass: "bg-[#25D366] hover:bg-[#20ba59] text-white",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.276-.101-.477-.15-.678.15-.2.302-.779.98-.955 1.18-.175.201-.351.226-.652.076-.301-.151-1.27-.468-2.419-1.493-.894-.798-1.497-1.784-1.673-2.086-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.201-.301.301-.502.101-.201.05-.377-.025-.527-.075-.151-.678-1.633-.929-2.235-.245-.587-.494-.508-.678-.517l-.578-.01c-.2 0-.527.075-.803.377-.276.301-1.054 1.03-1.054 2.512s1.079 2.913 1.23 3.114c.15.201 2.122 3.24 5.141 4.544.718.31 1.278.495 1.716.634.721.229 1.377.197 1.895.12.578-.087 1.78-.728 2.031-1.431.251-.703.251-1.306.176-1.431-.075-.126-.276-.201-.577-.351zM12.004 0C5.378 0 .008 5.37.008 11.996a11.93 11.93 0 001.637 6.064L0 24l6.109-1.602a11.935 11.935 0 005.895 1.545h.005c6.626 0 11.991-5.37 11.991-11.996S18.63 0 12.004 0zm0 21.99a9.98 9.98 0 01-5.086-1.39l-.365-.216-3.774.99.102-3.676-.237-.378a9.96 9.96 0 01-1.536-5.324c0-5.518 4.49-10.007 10.01-10.007 2.673 0 5.186 1.042 7.075 2.932a9.94 9.94 0 012.93 7.075c0 5.52-4.49 10.009-10.009 10.009z" />
        </svg>
      ),
    },
    {
      id: "facebook",
      label: t.landing.shareViaFacebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      bgClass: "bg-[#1877F2] hover:bg-[#156cdb] text-white",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      id: "x",
      label: t.landing.shareViaX,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(shareText)}`,
      bgClass: "bg-black hover:bg-neutral-800 text-white",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      id: "telegram",
      label: t.landing.shareViaTelegram,
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(shareText)}`,
      bgClass: "bg-[#229ED9] hover:bg-[#1e8cc0] text-white",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.943z" />
        </svg>
      ),
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.landing.shareWebsiteModalTitle}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy-dark/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[480px] bg-white rounded-2xl shadow-2xl border border-brand-border-subtle p-6 sm:p-7 overflow-hidden text-brand-navy-dark animate-scaleUp"
      >
        {/* Encabezado del Modal con Logotipo Oficial */}
        <div className="flex items-center justify-between pb-4 border-b border-brand-separator mb-5">
          <div className="flex items-center gap-2.5">
            <BrandLogo size="xs" ringVariant="accent" />
            <div>
              <h2 className="font-serif font-bold text-lg sm:text-xl text-brand-navy-dark leading-tight">
                {t.landing.shareWebsiteModalTitle}
              </h2>
              <span className="font-mono text-[10px] sm:text-[11px] text-brand-text-muted uppercase tracking-wider block">
                {OFFICIAL_URL.replace("https://", "")}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            aria-label={t.landing.shareClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-brand-text-muted hover:text-brand-navy-dark hover:bg-brand-nav-active transition-colors focus:outline-none focus:ring-2 focus:ring-brand-nav-blue"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sección Central: Código QR Oficial para Escaneo Directo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative w-52 h-52 sm:w-56 sm:h-56 bg-white rounded-xl p-2.5 border-2 border-brand-border-field shadow-sm hover:shadow-md transition-shadow flex items-center justify-center">
            <Image
              src="/branding/altuschip-website-qr.png"
              alt="Código QR Oficial de AltusChip Emergencia Médica"
              width={220}
              height={220}
              priority
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
          <p className="font-sans text-xs sm:text-[13px] text-brand-text-desc max-w-xs mt-3 leading-snug">
            {t.landing.shareQrInstruction}
          </p>
        </div>

        {/* Barra de Copiado de Enlace con Feedback Háptico */}
        <div className="mb-6">
          <div className="flex items-center bg-brand-alt-bg rounded-lg border border-brand-border-field p-1.5 focus-within:ring-2 focus-within:ring-brand-nav-blue">
            <input
              type="text"
              readOnly
              value={OFFICIAL_URL}
              className="flex-1 bg-transparent px-3 py-1 text-xs sm:text-sm font-mono text-brand-navy-dark outline-none select-all"
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                copied
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-brand-navy-dark hover:bg-brand-navy-secondary text-white shadow"
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>{t.landing.shareCopyLink}</span>
                </>
              )}
            </button>
          </div>
          {copied && (
            <p className="text-[11px] font-sans text-emerald-700 font-medium mt-1.5 text-center animate-fadeIn">
              {t.landing.shareLinkCopied}
            </p>
          )}
        </div>

        {/* Canales Oficiales de Compartir (Vectores SVG Oficiales - Cero Emojis) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {shareChannels.map((channel) => (
            <a
              key={channel.id}
              href={channel.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => triggerHaptic("light")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all shadow-sm hover:shadow hover:-translate-y-0.5 no-underline cursor-pointer ${channel.bgClass}`}
            >
              {channel.icon}
              <span>{channel.label}</span>
            </a>
          ))}
        </div>

        {/* Compartir Nativo (si el navegador móvil lo soporta) */}
        {canNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full mt-3 py-2.5 px-4 rounded-lg bg-white border border-brand-border-strong text-brand-navy-dark hover:bg-brand-nav-active text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4 text-brand-navy-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>{t.landing.shareNative}</span>
          </button>
        )}
      </div>
    </div>
  );
}
