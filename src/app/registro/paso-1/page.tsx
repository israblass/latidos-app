"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { CampoTexto } from "@/components/registro/campo-texto";
import { BannerAliado } from "@/components/registro/banner-aliado";
import { ProgresoRegistro } from "@/components/registro/progreso-registro";
import { BotonVidrio } from "@/components/ui/boton-vidrio";
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
    <ProgresoRegistro
      paso={1}
      titulo="¿Cuál es tu cédula?"
      subtitulo="La usamos para identificarte en el programa."
    >
      {/* noValidate: la validacion nativa del navegador mostraria sus propios
          mensajes por encima de los nuestros. Todos los pasos hacen lo mismo. */}
      <form noValidate onSubmit={continuar} className="flex flex-1 flex-col">
        <div className="vidrio registro-tarjeta">
          <CampoTexto
            etiqueta="Cédula"
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
        </div>
        <div className="mt-5">
          <BannerAliado slot="registro-paso-1" />
        </div>
        <div className="mt-auto pt-6">
          <BotonVidrio type="submit">Continuar</BotonVidrio>
        </div>
      </form>
    </ProgresoRegistro>
  );
}
