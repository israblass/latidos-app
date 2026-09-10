"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { CampoTexto } from "@/components/registro/campo-texto";
import { ProgresoRegistro } from "@/components/registro/progreso-registro";
import { useRegistroForm } from "@/hooks/use-registro-form";
import { cedulaSchema, primerError } from "@/lib/validacion/registro";

export default function PasoCedula() {
  const router = useRouter();
  const { datos, actualizar } = useRegistroForm();
  const [valor, setValor] = useState(datos.cedula);
  const [error, setError] = useState<string | null>(null);

  function continuar(evento: FormEvent) {
    evento.preventDefault();
    const mensaje = primerError(cedulaSchema, valor);
    if (mensaje) {
      setError(mensaje);
      return;
    }
    actualizar({ cedula: valor.trim() });
    router.push("/registro/paso-2");
  }

  return (
    <ProgresoRegistro paso={1} titulo="Cual es tu cedula?">
      {/* noValidate: la validacion nativa del navegador mostraria sus propios
          mensajes por encima de los nuestros. Todos los pasos hacen lo mismo. */}
      <form noValidate onSubmit={continuar} className="flex flex-1 flex-col">
        <CampoTexto
          etiqueta="Cedula"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          placeholder="12345678"
          value={valor}
          error={error}
          onChange={(evento) => {
            setValor(evento.target.value);
            setError(null);
          }}
        />
        <div className="mt-auto pt-8">
          <button type="submit" className="boton-primario">
            Continuar
          </button>
        </div>
      </form>
    </ProgresoRegistro>
  );
}
