import Link from "next/link";

import { ListaComoGanar } from "@/components/beats/lista-como-ganar";
import { FORMAS_DE_GANAR, TITULO_COMO_GANAR } from "@/lib/beats/contenido-como-ganar";

/**
 * Estado inicial de la pantalla de Beats (T031; spec §8.1).
 *
 * Mientras la persona no haya escaneado nunca, debajo de su historial aparece
 * desplegado como ganar Beats, con una linea guia y el boton para ir al
 * escaner. Es justo cuando mas lo necesita, sobre todo si se salto el
 * onboarding. Con el primer escaneo desaparece y la explicacion queda solo en
 * el boton "¿Cómo gano Beats?".
 */
export function EstadoInicial() {
  return (
    <section aria-label="Cómo empezar a sumar" className="mt-2">
      <ListaComoGanar
        items={FORMAS_DE_GANAR}
        titulo={TITULO_COMO_GANAR}
        idTitulo="estado-inicial-como-ganar"
        nivel={2}
      />
      <p className="mt-6 text-center text-texto-principal">Escanea tu primer QR para sumar.</p>
      <Link href="/escanear" className="boton-primario mt-4">
        Escanear
      </Link>
    </section>
  );
}
