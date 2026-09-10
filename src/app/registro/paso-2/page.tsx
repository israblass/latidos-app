"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { CampoTexto } from "@/components/registro/campo-texto";
import { usePasoHabilitado } from "@/components/registro/guardia-paso";
import { ProgresoRegistro } from "@/components/registro/progreso-registro";
import { useRegistroForm } from "@/hooks/use-registro-form";
import {
  apellidoSchema,
  nombreSchema,
  primerError,
} from "@/lib/validacion/registro";

export default function PasoNombre() {
  const router = useRouter();
  const habilitado = usePasoHabilitado(2);
  const { datos, actualizar } = useRegistroForm();
  const [nombre, setNombre] = useState(datos.nombre);
  const [apellido, setApellido] = useState(datos.apellido);
  const [errores, setErrores] = useState<{
    nombre?: string | null;
    apellido?: string | null;
  }>({});

  function continuar(evento: FormEvent) {
    evento.preventDefault();
    const errorNombre = primerError(nombreSchema, nombre);
    const errorApellido = primerError(apellidoSchema, apellido);
    if (errorNombre || errorApellido) {
      setErrores({ nombre: errorNombre, apellido: errorApellido });
      return;
    }
    actualizar({ nombre: nombre.trim(), apellido: apellido.trim() });
    router.push("/registro/paso-3");
  }

  if (!habilitado) return null;

  return (
    <ProgresoRegistro paso={2} titulo="Como te llamas?">
      <form noValidate onSubmit={continuar} className="flex flex-1 flex-col gap-4">
        <CampoTexto
          etiqueta="Nombre"
          autoComplete="given-name"
          autoFocus
          placeholder="Maria"
          value={nombre}
          error={errores.nombre}
          onChange={(evento) => {
            setNombre(evento.target.value);
            setErrores((previo) => ({ ...previo, nombre: null }));
          }}
        />
        <CampoTexto
          etiqueta="Apellido"
          autoComplete="family-name"
          placeholder="Rodriguez"
          value={apellido}
          error={errores.apellido}
          onChange={(evento) => {
            setApellido(evento.target.value);
            setErrores((previo) => ({ ...previo, apellido: null }));
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
