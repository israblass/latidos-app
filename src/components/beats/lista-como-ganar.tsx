import Image from "next/image";

import type { ItemComoGanar } from "@/lib/beats/contenido-como-ganar";

/**
 * Una lista de "como ganar" o "en que los cambias" (T029), con el contenido
 * unico de src/lib/beats/contenido-como-ganar.ts.
 *
 * Los items "Pronto" se atenuan sin perder contraste AA: baja la opacidad del
 * icono y el texto pasa a gris secundario, pero el gris elegido sigue por
 * encima de 4.5:1 sobre el vidrio. No son botones ni enlaces, asi que tocarlos
 * no hace nada (spec §11 criterio 20).
 */
export function ListaComoGanar({
  items,
  titulo,
  idTitulo,
  nivel = 3,
}: {
  items: readonly ItemComoGanar[];
  titulo: string;
  idTitulo: string;
  /** Nivel del titulo de seccion segun donde viva la lista. */
  nivel?: 2 | 3;
}) {
  const Titulo = nivel === 2 ? "h2" : "h3";
  return (
    <section aria-labelledby={idTitulo}>
      <Titulo id={idTitulo} className="etiqueta mb-3 mt-7">
        {titulo}
      </Titulo>
      <ul className="flex flex-col gap-3">
        {items.map((item) => {
          const pronto = item.estado === "pronto";
          return (
            <li
              key={item.titulo}
              data-estado={item.estado}
              className="vidrio-medio flex items-center gap-3 p-4"
            >
              <span
                aria-hidden="true"
                className={`vidrio-sutil flex h-10 w-10 shrink-0 items-center justify-center rounded-control ${
                  pronto ? "opacity-50" : ""
                }`}
              >
                <Image
                  src={`/assets/${item.carpeta}/${item.icono}.webp`}
                  alt=""
                  width={26}
                  height={26}
                />
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={`block text-[15px] font-medium ${
                    pronto ? "text-texto-secundario" : "text-texto-principal"
                  }`}
                >
                  {item.titulo}
                </span>
                <span className="block text-xs text-texto-secundario">{item.detalle}</span>
              </span>

              {pronto ? (
                <span className="shrink-0 rounded-full border border-sutil bg-fondo-alterno px-2.5 py-1 text-[11px] font-medium uppercase tracking-etiqueta text-texto-secundario">
                  Pronto
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
