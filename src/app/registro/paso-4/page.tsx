"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { CampoTexto } from "@/components/registro/campo-texto";
import { usePasoHabilitado } from "@/components/registro/guardia-paso";
import { ProgresoRegistro } from "@/components/registro/progreso-registro";
import { useRegistroForm } from "@/hooks/use-registro-form";
import { correoSchema, primerError } from "@/lib/validacion/registro";

export default function PasoCorreo() {
  const router = useRouter();
  const habilitado = usePasoHabilitado(4);
  const { datos, actualizar } = useRegistroForm();
  const [valor, setValor] = useState(datos.correo);
  const [error, setError] = useState<string | null>(null);

  function continuar(evento: FormEvent) {
    evento.preventDefault();
    const mensaje = primerError(correoSchema, valor);
    if (mensaje) {
      setError(mensaje);
      return;
    }
    actualizar({ correo: valor.trim().toLowerCase() });
    router.push("/registro/paso-5");
  }

  if (!habilitado) return null;

  return (
    <ProgresoRegistro paso={4} titulo="Cual es tu correo?">
      <form noValidate onSubmit={continuar} className="flex flex-1 flex-col">
        <CampoTexto
          etiqueta="Correo"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoFocus
          placeholder="tucorreo@ejemplo.com"
          ayuda="Con este correo inicias sesion."
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
