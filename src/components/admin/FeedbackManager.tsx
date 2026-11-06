/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Panel Administrativo — Gestor de Testimonios y Reseñas de Clientes
 * ARCHIVO: src/components/admin/FeedbackManager.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Consola administrativa para visualizar, moderar, aprobar y descartar las
 * opiniones y valoraciones de 1 a 5 estrellas enviadas por los motociclistas.
 * Los comentarios aprobados se proyectan automáticamente en la portada.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - CERO emojis: estética vectorial pura Incident 2026.
 * - Conexión con /api/admin/feedback.
 * ==============================================================================
 */

"use client";

import React, { useEffect, useState, useCallback } from "react";
import { StarRating } from "@/components/feedback/StarRating";
import { useHaptic } from "@/hooks/useHaptic";
import { useLocale } from "@/hooks/useLocale";

export interface AdminFeedbackItem {
  id: string;
  name: string;
  city?: string | null;
  vehicle?: string | null;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

export function FeedbackManager() {
  const { locale } = useLocale();
  const { triggerHaptic } = useHaptic();

  const [feedbacks, setFeedbacks] = useState<AdminFeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadFeedbacks = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/admin/feedback");
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error?.message || "Error al cargar testimonios.");
      }
      const list = data.data?.feedbacks || data.feedbacks || [];
      setFeedbacks(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al conectar con la base de datos.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFeedbacks();
  }, [loadFeedbacks]);

  const handleToggleApproval = async (item: AdminFeedbackItem) => {
    triggerHaptic("light");
    setTogglingId(item.id);
    const nextStatus = !item.isApproved;

    try {
      const res = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          isApproved: nextStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error?.message || "Error al actualizar estado.");
      }

      setFeedbacks((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, isApproved: nextStatus } : f)),
      );

      triggerHaptic("success");
      setActionNotice(
        nextStatus
          ? locale === "es"
            ? "Testimonio aprobado: Ahora es visible en el carrusel de la portada."
            : "Review approved: Now live on the landing carousel."
          : locale === "es"
          ? "Testimonio ocultado de la portada."
          : "Review hidden from the landing carousel.",
      );
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: unknown) {
      triggerHaptic("error");
      const msg = err instanceof Error ? err.message : "Error al actualizar.";
      setErrorMessage(msg);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      locale === "es"
        ? "¿Estás seguro de eliminar este comentario permanentemente?"
        : "Are you sure you want to permanently delete this review?",
    );
    if (!confirmDelete) return;

    triggerHaptic("warning");
    try {
      const res = await fetch(`/api/admin/feedback?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error?.message || "Error al eliminar comentario.");
      }

      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
      triggerHaptic("success");
      setActionNotice(
        locale === "es" ? "Comentario eliminado exitosamente." : "Review deleted successfully.",
      );
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: unknown) {
      triggerHaptic("error");
      const msg = err instanceof Error ? err.message : "Error al eliminar.";
      setErrorMessage(msg);
    }
  };

  const approvedCount = feedbacks.filter((f) => f.isApproved).length;
  const pendingCount = feedbacks.filter((f) => !f.isApproved).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Tarjeta de Métricas y Estado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-brand-white border border-brand-border-subtle rounded-xl flex flex-col gap-1 shadow-2xs">
          <span className="font-sans text-xs font-semibold text-brand-text-muted uppercase tracking-wider">
            {locale === "es" ? "Total de Opiniones" : "Total Reviews"}
          </span>
          <span className="font-mono text-2xl font-bold text-brand-navy-dark">{feedbacks.length}</span>
        </div>
        <div className="p-4 bg-brand-white border border-emerald-200 rounded-xl flex flex-col gap-1 shadow-2xs">
          <span className="font-sans text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            {locale === "es" ? "Aprobadas en Portada" : "Approved on Landing"}
          </span>
          <span className="font-mono text-2xl font-bold text-emerald-700">{approvedCount}</span>
        </div>
        <div className="p-4 bg-brand-white border border-amber-200 rounded-xl flex flex-col gap-1 shadow-2xs">
          <span className="font-sans text-xs font-semibold text-amber-800 uppercase tracking-wider">
            {locale === "es" ? "Pendientes de Revisión" : "Pending Moderation"}
          </span>
          <span className="font-mono text-2xl font-bold text-amber-700">{pendingCount}</span>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-sans font-medium flex items-center justify-between shadow-2xs">
          <span>{actionNotice}</span>
          <button type="button" onClick={() => setActionNotice(null)} className="font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-brand-accent/30 text-brand-accent rounded-lg text-xs font-sans font-medium">
          {errorMessage}
        </div>
      )}

      {/* Lista de Comentarios */}
      <div className="bg-brand-white border border-brand-border-subtle rounded-xl shadow-xs overflow-hidden flex flex-col">
        <div className="p-4 sm:p-5 border-b border-brand-separator flex items-center justify-between flex-wrap gap-2">
          <div className="flex flex-col">
            <h3 className="font-serif text-lg font-bold text-brand-navy-dark">
              {locale === "es" ? "Moderación de Opiniones de Clientes" : "Customer Reviews Moderation"}
            </h3>
            <p className="font-sans text-xs text-brand-text-desc">
              {locale === "es"
                ? "Activa el interruptor para proyectar las reseñas elegidas en el carrusel de la portada."
                : "Toggle approval to publish selected reviews to the public homepage carousel."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadFeedbacks()}
            disabled={isLoading}
            className="min-h-[38px] px-3.5 py-1.5 bg-brand-bg-alt hover:bg-brand-white border border-brand-border-subtle rounded-lg font-sans text-xs font-bold text-brand-navy-dark transition-all cursor-pointer"
          >
            {isLoading ? "Actualizando..." : "↻ Recargar"}
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <span className="w-6 h-6 rounded-full border-2 border-brand-navy-dark border-t-transparent animate-spin" />
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-2">
            <span className="font-sans text-sm font-semibold text-brand-navy-dark">
              {locale === "es" ? "No hay opiniones recibidas aún" : "No customer reviews yet"}
            </span>
            <p className="font-sans text-xs text-brand-text-muted max-w-sm">
              {locale === "es"
                ? "Cuando los motociclistas envíen sus valoraciones desde el botón del menú o la portada, aparecerán aquí para tu aprobación."
                : "When riders submit feedback from the navbar or landing page, they will show up here."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-brand-separator">
            {feedbacks.map((item) => (
              <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start justify-between gap-4 hover:bg-brand-bg-alt/30 transition-colors">
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <StarRating value={item.rating} readOnly size="sm" />
                    <strong className="font-sans text-sm font-bold text-brand-navy-dark">
                      {item.name}
                    </strong>
                    <span className="font-sans text-xs text-brand-text-muted">
                      {[item.vehicle, item.city].filter(Boolean).join(" · ")}
                    </span>
                    <span className="text-[11px] font-mono text-brand-text-muted">
                      {new Date(item.createdAt).toLocaleDateString(locale === "es" ? "es-EC" : "en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <p className="font-sans text-xs sm:text-sm text-brand-text-desc leading-relaxed italic bg-brand-bg-alt/40 p-3 rounded-lg border border-brand-border-subtle/60">
                    "{item.comment}"
                  </p>
                </div>

                {/* Acciones de Moderación */}
                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    disabled={togglingId === item.id}
                    onClick={() => void handleToggleApproval(item)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-lg font-sans text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      item.isApproved
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
                        : "bg-brand-navy-dark text-white hover:bg-brand-navy-secondary"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${item.isApproved ? "bg-emerald-600" : "bg-slate-400"}`} />
                    <span>{item.isApproved ? "Aprobado (Visible)" : "Aprobar para Landing"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleDelete(item.id)}
                    aria-label="Eliminar comentario"
                    className="w-9 h-9 rounded-lg border border-brand-border-subtle hover:bg-rose-50 hover:text-brand-accent text-brand-text-muted flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

