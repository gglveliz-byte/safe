/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Landing Page — Reproductor Vertical Oficial 9:16 (Hero Video)
 * ARCHIVO: src/components/landing/HeroVideoCard.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Reproductor editorial del spot oficial de ALTUS-CHIP en formato vertical 9:16.
 * Reemplaza la fotografía estática del casco manteniendo la estética
 * 'Incident — Technical Broadsheet 2026', controles táctiles >=44px sin cubrir
 * las gráficas internas del video, conmutador de audio accesible y barra de
 * progreso interactiva.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero texto hardcodeado (consumo de t vía useLocale).
 * - Accesibilidad WCAG AA y respeto de prefers-reduced-motion.
 * ==============================================================================
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";

const HERO_VIDEO_URL = "/media/altuschip-promo.mp4";

function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function VolumeIcon({ muted, className }: { muted: boolean; className: string }) {
  if (muted) {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
  );
}

export interface HeroVideoCardProps {
  maxWidthClass?: string;
}

export function HeroVideoCard({
  maxWidthClass = "max-w-[252px] sm:max-w-[268px]",
}: HeroVideoCardProps = {}) {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Sincronizar metadatos si el navegador ya cargó duración antes de hidratar React
    if (Number.isFinite(video.duration) && video.duration > 0) {
      setDuration(video.duration);
    }
    if (video.currentTime > 0) {
      setCurrentTime(video.currentTime);
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      video.pause();
      setIsPlaying(false);
    } else {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          setIsPlaying(false);
        });
      }
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = isMuted;
    }
  }, [isMuted]);

  const handleTogglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    triggerHaptic("light");
    if (video.paused) {
      void video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [triggerHaptic]);

  const handleToggleMute = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const video = videoRef.current;
      if (!video) return;
      triggerHaptic("light");
      const nextMuted = !isMuted;
      video.muted = nextMuted;
      setIsMuted(nextMuted);

      // Si el usuario activa el audio y el video estaba pausado, reanudar automáticamente
      if (!nextMuted && video.paused) {
        void video.play();
        setIsPlaying(true);
      }
    },
    [isMuted, triggerHaptic],
  );

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      if (!video || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      video.currentTime = ratio * duration;
      setCurrentTime(video.currentTime);
    },
    [duration],
  );

  const handleSeekKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      if (!video || !duration) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        video.currentTime = Math.min(duration, video.currentTime + 5);
        setCurrentTime(video.currentTime);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        video.currentTime = Math.max(0, video.currentTime - 5);
        setCurrentTime(video.currentTime);
      }
    },
    [duration],
  );

  const handleFullscreen = useCallback(() => {
    const target = videoRef.current ?? containerRef.current;
    if (!target) return;
    triggerHaptic("light");

    const anyVideo = target as HTMLVideoElement & {
      webkitEnterFullscreen?: () => void;
    };

    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else if (typeof target.requestFullscreen === "function") {
      void target.requestFullscreen();
    } else if (typeof anyVideo.webkitEnterFullscreen === "function") {
      anyVideo.webkitEnterFullscreen();
    }
  }, [triggerHaptic]);

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      ref={containerRef}
      className={`helmet-hero-card relative w-full ${maxWidthClass} mx-auto rounded-2xl overflow-hidden border border-brand-border-strong bg-brand-navy-dark shadow-[0_20px_50px_-12px_rgba(11,31,58,0.28)] ring-1 ring-brand-navy-dark/10`}
    >
      {/* Contenedor estricto 9:16 sin recortar elementos gráficos del video */}
      <div className="relative w-full aspect-[9/16] bg-brand-navy-dark overflow-hidden">
        <video
          ref={videoRef}
          src={HERO_VIDEO_URL}
          autoPlay
          muted={isMuted}
          loop
          playsInline
          preload="auto"
          aria-label={t.landing.videoAriaLabel}
          onClick={handleTogglePlayPause}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onDurationChange={(e) => setDuration(e.currentTarget.duration || 0)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime || 0)}
          className="w-full h-full object-cover cursor-pointer"
        />

        {/* Píldora Superior Izquierda: Baliza Sónar Activa */}
        <div
          className="absolute top-3 left-2.5 pointer-events-none inline-flex items-center gap-1.5 rounded-full bg-brand-navy-dark/75 backdrop-blur-md border border-white/15 px-2 py-1 text-white shadow-sm"
          aria-hidden="true"
        >
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-brand-accent animate-pulse" />
          <span className="font-sans text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
            {t.landing.helmetTagStatus}
          </span>
        </div>

        {/* Botón Superior Derecho: Activación rápida de audio (>=44px táctil) */}
        <button
          type="button"
          onClick={handleToggleMute}
          aria-label={isMuted ? t.landing.videoUnmute : t.landing.videoMute}
          className={`absolute top-2 right-2.5 inline-flex items-center gap-1 rounded-full px-2.5 sm:px-3 min-h-[44px] min-w-[44px] text-[10px] sm:text-[11px] font-sans font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white shadow-md ${
            isMuted
              ? "bg-brand-accent hover:bg-brand-accent-hover text-white"
              : "bg-brand-navy-dark/80 hover:bg-brand-navy-dark text-white border border-white/20 backdrop-blur-md"
          }`}
        >
          <VolumeIcon muted={isMuted} className="w-3.5 h-3.5 shrink-0" />
          <span>{isMuted ? t.landing.videoUnmute : t.landing.videoMute}</span>
        </button>

        {/* Indicador central de Play únicamente cuando el video está en pausa */}
        {!isPlaying && (
          <button
            type="button"
            onClick={handleTogglePlayPause}
            aria-label={t.landing.videoPlay}
            className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-brand-navy-dark/85 hover:bg-brand-navy-dark border border-white/25 text-white flex items-center justify-center shadow-xl backdrop-blur-sm transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          >
            <svg className="w-6 h-6 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        )}
      </div>

      {/* Barra de Control y Pie Editorial acoplados DEBAJO del video (cero obstrucción visual) */}
      <div className="bg-brand-navy-dark text-white border-t border-white/10">
        {/* Barra interactiva de progreso */}
        <div
          role="slider"
          aria-label={t.landing.videoAriaLabel}
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(currentTime)}
          tabIndex={0}
          onClick={handleSeek}
          onKeyDown={handleSeekKeyDown}
          className="w-full h-2.5 bg-white/15 cursor-pointer relative group focus:outline-none focus:ring-2 focus:ring-brand-accent"
        >
          <div
            className="h-full bg-brand-accent transition-[width] duration-150 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="px-1.5 sm:px-2.5 py-1.5 flex items-center justify-between gap-0.5">
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={handleTogglePlayPause}
              aria-label={isPlaying ? t.landing.videoPause : t.landing.videoPlay}
              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              {isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <span className="font-mono text-[10px] sm:text-[11px] tabular-nums whitespace-nowrap text-white/75 select-none">
              {formatSeconds(currentTime)} / {formatSeconds(duration)}
            </span>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={handleToggleMute}
              aria-label={isMuted ? t.landing.videoUnmute : t.landing.videoMute}
              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              <VolumeIcon muted={isMuted} className={`w-4 h-4 ${isMuted ? "text-brand-accent" : ""}`} />
            </button>

            <button
              type="button"
              onClick={handleFullscreen}
              aria-label={t.landing.videoFullscreen}
              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-3 pb-2.5 pt-0.5 flex items-center justify-between border-t border-white/5 text-[10px] font-sans text-white/75 tracking-wide uppercase">
          <span className="truncate">{t.landing.videoBadge}</span>
          <span className="shrink-0 text-brand-accent font-semibold">NFC / QR</span>
        </div>
      </div>
    </div>
  );
}
