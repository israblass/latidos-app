import type { ButtonHTMLAttributes, ReactNode } from "react";

import { CirculoFlecha } from "@/components/ui/circulo-flecha";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  /** Tinte del vidrio: amarillo (accion principal) o blanco. */
  tono?: "amarillo" | "blanco";
  /** Mientras espera respuesta: queda deshabilitado y el circulo gira. */
  cargando?: boolean;
}

/**
 * Boton TAP de vidrio (constitution §2, v2.10.2): 64px de alto, etiqueta a la
 * izquierda y el circulo navy de 48px con flecha a la derecha. Es el
 * "Continuar" del registro y su "Crear cuenta". No se desliza: deslizar queda
 * para la bienvenida, Escanear QR y confirmar canje (BotonDeslizar).
 */
export function BotonVidrio({
  children,
  tono = "amarillo",
  cargando = false,
  disabled,
  className = "",
  ...props
}: Props) {
  return (
    <button
      {...props}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      data-boton-vidrio=""
      className={`vidrio ${tono === "amarillo" ? "vidrio-amarillo" : ""} boton-vidrio ${className}`}
    >
      <span>{children}</span>
      {cargando ? (
        <span aria-hidden="true" className="circulo-flecha" style={{ width: 48, height: 48 }}>
          <span className="girador" />
        </span>
      ) : (
        <CirculoFlecha tamano={48} />
      )}
    </button>
  );
}
