"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { CampoTexto } from "@/components/registro/campo-texto";
import { usePasoHabilitado } from "@/components/registro/guardia-paso";
import { BannerAliado } from "@/components/registro/banner-aliado";
import { ProgresoRegistro } from "@/components/registro/progreso-registro";
import { BotonVidrio } from "@/components/ui/boton-vidrio";
import { useRegistroForm } from "@/hooks/use-registro-form";
import { primerError, telefonoSchema } from "@/lib/validacion/registro";

export default function PasoTelefono() {
  const router = useRouter();
  const habilitado = usePasoHabilitado(3);
  const { datos, actualizar } = useRegistroForm();
  const [valor, setValor] = useState(datos.telefono);
  const [error, setError] = useState<string | null>(null);

  function continuar(evento: FormEvent) {
    evento.preventDefault();
    const mensaje = primerError(telefonoSchema, valor);
    if (mensaje) {
      setError(mensaje);
      return;
    }
    actualizar({ telefono: valor.trim() });
    router.push("/registro/paso-4");
  }

  if (!habilitado) return null;

  return (
    <ProgresoRegistro
      paso={3}
      titulo="¿Cuál es tu teléfono?"
      subtitulo="Para avisarte de eventos y recompensas."
    >
      <form noValidate onSubmit={continuar} className="flex flex-1 flex-col">
        <div className="vidrio registro-tarjeta">
          <CampoTexto
            etiqueta="Teléfono"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            autoFocus
            placeholder="04141234567"
            value={valor}
            error={error}
            onChange={(evento) => {
              setValor(evento.target.value);
              setError(null);
            }}
          />
        </div>
        <div className="mt-5">
          <BannerAliado slot="registro-paso-3" />
        </div>
        <div className="mt-auto pt-6">
          <BotonVidrio type="submit">Continuar</BotonVidrio>
        </div>
      </form>
    </ProgresoRegistro>
  );
}
