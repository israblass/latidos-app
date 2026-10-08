import type { ButtonHTMLAttributes, ReactNode } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  /** Tinte del vidrio: amarillo (accion principal) o blanco. */
  tono?: "amarillo" | "blanco";
  /** Mientras espera respuesta: queda deshabilitado y sin flecha. */
  cargando?: boolean;
  /** La flecha junto al texto. Sin ella cuando no lleva a ningun lado ("Cancelar"). */
  flecha?: boolean;
}

/**
 * Boton TAP de vidrio (constitution §2, v2.10.3): pildora de 64px de alto,
 * texto centrado y una flecha pequeña justo a su derecha. SIN el circulo navy
 * con flecha: ese circulo es la manija de BotonDeslizar (bienvenida,
 * Escanear QR y confirmar canje) y aqui haria creer que el boton se desliza.
 * Es el "Continuar" del registro y su "Crear cuenta".
 */
export function BotonVidrio({
  children,
  tono = "amarillo",
  cargando = false,
  flecha = true,
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
      {cargando || !flecha ? null : (
        <svg
          aria-hidden="true"
          data-flecha-boton=""
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      )}
    </button>
  );
}
