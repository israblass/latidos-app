"use client";

import { HojaInferior } from "@/components/ui/hoja-inferior";

/**
 * Notificaciones del Inicio (constitution §2, v2.7.0). Por ahora es solo
 * interfaz: no hay tablas, RPC ni push detras, asi que la lista siempre llega
 * vacia y se ve el estado vacio. Cuando exista la funcion, basta con pasarle
 * los avisos a <ListaNotificaciones>.
 */

export type Notificacion = {
  id: string;
  titulo: string;
  detalle: string;
  /** Texto ya formateado ("Hoy", "Ayer", "12 oct"). */
  cuando: string;
};

export function IconoCampana({ tamano }: { tamano: number }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
      <path d="M10.3 20a1.9 1.9 0 0 0 3.4 0" />
    </svg>
  );
}

export function ListaNotificaciones({ items }: { items: Notificacion[] }) {
  if (items.length === 0) {
    return (
      <div data-notificaciones-vacio="" className="flex flex-col items-center gap-1.5 px-3 pb-3.5 pt-7 text-center">
        <span
          aria-hidden="true"
          className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-secundario/[0.12] text-texto-principal"
        >
          <IconoCampana tamano={28} />
        </span>
        <p className="text-[17px] font-semibold text-texto-principal">Sin notificaciones recientes</p>
        <p className="text-[14px] text-texto-secundario">Cuando haya novedades de Latidos, las verás aquí.</p>
      </div>
    );
  }

  return (
    <ul aria-label="Notificaciones recientes" className="divide-y divide-texto-principal/[0.08]">
      {items.map((n) => (
        <li key={n.id} className="flex items-start gap-3 py-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secundario/[0.12] text-texto-principal"
          >
            <IconoCampana tamano={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-texto-principal">{n.titulo}</p>
            <p className="text-[13px] text-texto-secundario">{n.detalle}</p>
          </div>
          <span className="shrink-0 text-[12px] text-texto-secundario">{n.cuando}</span>
        </li>
      ))}
    </ul>
  );
}

export function HojaNotificaciones({ abierta, alCerrar }: { abierta: boolean; alCerrar: () => void }) {
  return (
    <HojaInferior abierta={abierta} alCerrar={alCerrar} titulo="Notificaciones" variante="aviso">
      <ListaNotificaciones items={[]} />
    </HojaInferior>
  );
}
