"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Region viva que anuncia a los lectores de pantalla un cambio de saldo con la
 * pantalla abierta (T037; spec §10.15): "Sumaste 10 Beats" o, si resta, "Se
 * descontaron 3 Beats". El primer valor no se anuncia: es la carga, no un
 * cambio.
 *
 * La region existe siempre, vacia al principio. Si se montara junto con el
 * mensaje, varios lectores de pantalla no lo leerian.
 */
export function AnuncioVivo({ saldo }: { saldo: number | null }) {
  const anterior = useRef<number | null>(null);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (saldo === null) return;
    const previo = anterior.current;
    anterior.current = saldo;
    if (previo === null || previo === saldo) return;

    const diferencia = saldo - previo;
    setMensaje(
      diferencia > 0
        ? `Sumaste ${diferencia} ${diferencia === 1 ? "Beat" : "Beats"}`
        : `Se descontaron ${-diferencia} ${diferencia === -1 ? "Beat" : "Beats"}`,
    );
  }, [saldo]);

  return (
    <p aria-live="polite" role="status" className="sr-only" data-anuncio-beats>
      {mensaje}
    </p>
  );
}
