"use client";

import { useId, type InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string;
  error?: string | null;
  ayuda?: string;
}

/** Input del design system con label accesible y mensaje de error. */
export function CampoTexto({ etiqueta, error, ayuda, ...props }: Props) {
  const id = useId();
  const idError = `${id}-error`;
  const idAyuda = `${id}-ayuda`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="etiqueta">
        {etiqueta}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [error ? idError : null, ayuda ? idAyuda : null]
            .filter(Boolean)
            .join(" ") || undefined
        }
        className={`campo ${error ? "campo-error" : ""}`}
        {...props}
      />
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
}
