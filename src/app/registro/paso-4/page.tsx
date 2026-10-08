"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { CampoTexto } from "@/components/registro/campo-texto";
import { usePasoHabilitado } from "@/components/registro/guardia-paso";
import { BannerAliado } from "@/components/registro/banner-aliado";
import { ProgresoRegistro } from "@/components/registro/progreso-registro";
import { BotonVidrio } from "@/components/ui/boton-vidrio";
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
    <ProgresoRegistro
      paso={4}
      titulo="¿Cuál es tu correo?"
      subtitulo="Ahí te llega el enlace para activar tu cuenta."
    >
      <form noValidate onSubmit={continuar} className="flex flex-1 flex-col">
        <div className="vidrio registro-tarjeta">
          <CampoTexto
            etiqueta="Correo"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoFocus
            placeholder="tucorreo@ejemplo.com"
            ayuda="Con este correo inicias sesión."
            value={valor}
            error={error}
            onChange={(evento) => {
              setValor(evento.target.value);
              setError(null);
            }}
          />
        </div>
        <div className="mt-5">
          <BannerAliado slot="registro-paso-4" />
        </div>
        <div className="mt-auto pt-6">
          <BotonVidrio type="submit">Continuar</BotonVidrio>
        </div>
      </form>
    </ProgresoRegistro>
  );
}
