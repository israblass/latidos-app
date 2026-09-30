import type { Metadata } from "next";

import { PantallaBeats } from "@/components/beats/pantalla-beats";

export const metadata: Metadata = { title: "Beats · Latidos" };

/**
 * /beats. La pagina en si no lee nada del servidor: todo lo trae la pantalla
 * de cliente con la sesion de quien la abre (plan §4, decisiones 10 y 11). Asi
 * el HTML es el mismo para todos y el service worker lo puede guardar para
 * abrirlo sin señal.
 */
export default function PaginaBeats() {
  return <PantallaBeats />;
}
