"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  src: string;
  /** Texto que describe la imagen y que se muestra si no logra cargar. */
  alt: string;
  /** Alto en pixeles. El ancho sale de la proporcion real de la imagen. */
  alto: number;
  className?: string;
  prioritaria?: boolean;
}

/**
 * Imagen de marca servida desde Supabase Storage.
 *
 * Se usa `img` y no `next/image` a proposito: las imagenes son remotas y no se
 * conocen sus dimensiones. `next/image` exige width y height para remotas, y
 * inventarlas deformaria el arte. Fijando solo el alto, el navegador respeta la
 * proporcion real de cada archivo.
 *
 * Si la imagen no carga (bucket caido, archivo renombrado), cae al texto del
 * alt: se pierde el arte, nunca el contenido.
 */
export function ImagenMarca({ src, alt, alto, className = "", prioritaria = false }: Props) {
  const [fallo, setFallo] = useState(false);
  const imagen = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // La imagen se pinta en el servidor y puede fallar antes de que React
    // hidrate: para entonces el evento `error` ya paso y `onError` no se entera.
    // Al montar se revisa el estado real del elemento.
    const el = imagen.current;
    if (el?.complete && el.naturalWidth === 0) setFallo(true);
  }, [src]);

  if (fallo) {
    return (
      <span
        className={`font-display uppercase leading-none text-texto-principal ${className}`}
        style={{ fontSize: alto * 0.8 }}
      >
        {alt}
      </span>
    );
  }

  return (
    // Remota y sin dimensiones conocidas; ver el comentario del componente.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imagen}
      src={src}
      alt={alt}
      // maxWidth ademas del alto: no se conocen las proporciones del arte, y
      // una pieza mas ancha de lo previsto se saldria de su contenedor. Con
      // object-contain se reduce en vez de deformarse o desbordar.
      style={{ height: alto, width: "auto", maxWidth: "100%" }}
      loading={prioritaria ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFallo(true)}
      className={`object-contain ${className}`}
    />
  );
}
