/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: API Pública — Envío y Consulta de Testimonios y Reseñas
 * ARCHIVO: src/app/api/feedback/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint público para:
 * 1. POST: Registrar la valoración (1 a 5 estrellas) y opinión de un motociclista
 *    o visitante sobre el servicio SAFE. Se almacena con isApproved: false
 *    a la espera de moderación del administrador.
 * 2. GET: Listar los testimonios aprobados para el carrusel de la portada.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Validación Zod rigurosa con CreateFeedbackSchema.
 * - Runtime Node.js explícito y caché deshabilitada.
 * ==============================================================================
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  handleApiError,
  parseJsonBody,
  successResponse,
} from "@/lib/api-response";
import { CreateFeedbackSchema } from "@/lib/schemas/feedback.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Testimonios base pre-cargados de alta calidad para cuando aún no hay
 * testimonios aprobados en la base de datos.
 */
const FALLBACK_TESTIMONIALS = [
  {
    id: "fb-curated-1",
    name: "Carlos Méndez",
    city: "Quito, Ecuador",
    vehicle: "Yamaha MT-09",
    rating: 5,
    comment:
      "Tener la tranquilidad de que en un accidente cualquier paramédico solo acerca su celular a mi casco y ve mi tipo de sangre y contacta a mi esposa no tiene precio. El Modo Ruta con GPS en vivo es impecable.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fb-curated-2",
    name: "Dra. Sofía Alarcón",
    city: "Medellín, Colombia",
    vehicle: "BMW F850 GS · Médico Urgentista",
    rating: 5,
    comment:
      "Como socorrista y motociclista, sé que los primeros 10 minutos salvan vidas. ALTUS-CHIP elimina la incertidumbre de no saber qué medicamentos o alergias tiene el piloto tendido en carretera.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fb-curated-3",
    name: "Esteban Larrea",
    city: "Guayaquil, Ecuador",
    vehicle: "KTM 390 Adventure",
    rating: 5,
    comment:
      "La opción de registrar a mi acompañante habitual en mi misma cuenta y con su propia cédula y tipo de sangre fue lo que me convenció. 100% recomendado para todo el que salga a rodar.",
    createdAt: new Date().toISOString(),
  },
];

export async function GET(): Promise<NextResponse> {
  try {
    const approved = await db.feedback.findMany({
      where: { isApproved: true },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        name: true,
        city: true,
        vehicle: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    });

    // Unificamos TODO en el mismo carrusel: primero los testimonios reales aprobados por el admin,
    // y a continuación los 3 testimonios base curados para que salgan todos juntos sin separarse
    const testimonials = [...approved, ...FALLBACK_TESTIMONIALS];

    return successResponse({
      testimonials,
      total: testimonials.length,
      hasRealData: approved.length > 0,
    });
  } catch (error) {
    return handleApiError(error, "feedback.get");
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const input = await parseJsonBody(request, CreateFeedbackSchema);

    const feedback = await db.feedback.create({
      data: {
        name: input.name,
        city: input.city?.trim() || null,
        vehicle: input.vehicle?.trim() || null,
        rating: input.rating,
        comment: input.comment,
        isApproved: false,
      },
    });

    return successResponse(
      {
        message: "Muchas gracias por tu opinión. Tu comentario ha sido recibido exitosamente.",
        id: feedback.id,
      },
      201,
    );
  } catch (error) {
    return handleApiError(error, "feedback.post");
  }
}
