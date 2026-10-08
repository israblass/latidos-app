"use client";

import { useEffect, useState } from "react";

import { BANNERS, type SlotBanner } from "@/lib/banners";

/** Por debajo de esta fraccion del alto de la ventana, el teclado esta abierto. */
const UMBRAL_TECLADO = 0.75;

/**
 * Banner "Aliado" del registro (constitution §2, v2.10.2): 1200 x 600 mostrado
 * a ~330 x 165, con el chip "Aliado" en la esquina.
 *
 * Se oculta con el teclado abierto (visualViewport mas bajo que el 75% de la
 * ventana) y, por CSS, en pantallas de menos de 700px de alto: nunca empuja
 * el boton fuera de la zona tocable. En pantallas que se desplazan (el
 * Perfil) no empuja nada: con `siempreVisible` se queda tambien en pantallas
 * bajas.
 */
export function BannerAliado({
  slot,
  siempreVisible = false,
}: {
  slot: SlotBanner;
  siempreVisible?: boolean;
}) {
  const banner = BANNERS[slot];
  const [teclado, setTeclado] = useState(false);

  useEffect(() => {
    const vista = window.visualViewport;
    if (!vista) return;
    const medir = () => setTeclado(vista.height < window.innerHeight * UMBRAL_TECLADO);
    medir();
    vista.addEventListener("resize", medir);
    return () => vista.removeEventListener("resize", medir);
  }, []);

  return (
    <figure
      className="banner-aliado"
      data-banner-aliado={slot}
      data-teclado={teclado ? "" : undefined}
      data-siempre-visible={siempreVisible ? "" : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={banner.src}
        alt={banner.alt}
        width={banner.ancho}
        height={banner.alto}
        loading="lazy"
        decoding="async"
      />
      <figcaption className="chip-aliado">Aliado</figcaption>
    </figure>
  );
}
