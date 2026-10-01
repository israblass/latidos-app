import Image from "next/image";
import Link from "next/link";

import { ILUSTRACIONES } from "@/lib/ilustraciones";

/**
 * 404: una direccion que no existe en la app. Las nubes del techo del Aula
 * Magna dicen "UCV" sin decir "error".
 */
export default function NoEncontrada() {
  const { src, ancho, alto } = ILUSTRACIONES.nubesTecho;
  return (
    <main className="flex min-h-dvh flex-col justify-center px-5 pb-8 pt-4">
      <Image
        src={src}
        alt=""
        aria-hidden="true"
        width={ancho / 2}
        height={alto / 2}
        priority
        className="mx-auto"
      />
      <p className="etiqueta mt-8">Página no encontrada</p>
      <h1 className="titulo-pantalla mt-3">Por aquí no es</h1>
      <p className="mt-4 text-texto-secundario">
        Esta dirección no existe en Latidos. Vuelve al inicio para seguir sumando.
      </p>
      <Link href="/inicio" className="boton-primario mt-8">
        Ir a Inicio
      </Link>
    </main>
  );
}
