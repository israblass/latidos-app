"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string;
  error?: string | null;
  ayuda?: string;
  /**
   * Control que vive dentro del campo, a la derecha (por ejemplo, mostrar u
   * ocultar la contraseña). Sin el, el campo se pinta exactamente igual que
   * siempre: el registro no cambia.
   */
  accesorio?: ReactNode;
}

/** Input del design system con label accesible y mensaje de error. */
export const CampoTexto = forwardRef<HTMLInputElement, Props>(function CampoTexto(
  { etiqueta, error, ayuda, accesorio, ...props },
  ref,
) {
  const id = useId();
  const idError = `${id}-error`;
  const idAyuda = `${id}-ayuda`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="etiqueta">
        {etiqueta}
      </label>
      {(() => {
        const input = (
          <input
            ref={ref}
            id={id}
            aria-invalid={error ? true : undefined}
            aria-describedby={
              [error ? idError : null, ayuda ? idAyuda : null]
                .filter(Boolean)
                .join(" ") || undefined
            }
            className={`campo ${error ? "campo-error" : ""} ${accesorio ? "pr-14" : ""}`}
            {...props}
          />
        );
        if (!accesorio) return input;
        return (
          <div className="relative">
            {input}
            <div className="absolute inset-y-0 right-0 flex items-center">{accesorio}</div>
          </div>
        );
      })()}
      {ayuda ? (
        <p id={idAyuda} className="text-xs text-texto-secundario">
          {ayuda}
        </p>
      ) : null}
      {error ? (
        <p id={idError} role="alert" className="text-xs text-error-texto">
          {error}
        </p>
      ) : null}
    </div>
  );
});
