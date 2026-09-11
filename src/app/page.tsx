import Link from "next/link";

import { PromptsInstalacion } from "@/components/instalacion/prompts-instalacion";
import { ImagenMarca } from "@/components/marca/imagen-marca";
import { ASSETS } from "@/lib/assets";

/**
 * Pantalla de bienvenida (T018).
 *
 * Es la misma sin importar de donde venga la persona: QR fisico, link de
 * WhatsApp, campaña o la web informativa (spec §10 suposicion 1). Sobre ella
 * aparece el prompt de instalacion, que nunca bloquea nada.
 *
 * El logotipo es el arte oficial servido desde el Storage compartido con la
 * web. El amarillo entra como acento bajo el logo: el unico bloque amarillo
 * grande de la pantalla es el CTA, para que la jerarquia quede clara.
 */
export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col px-5 pb-8 pt-16">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="vidrio-medio flex w-full flex-col items-center px-6 py-12">
          {/* El logo es el titulo de la pantalla: dentro de un h1, su texto
              alternativo es lo que anuncia un lector de pantalla al entrar. */}
          <h1>
            <ImagenMarca
              src={ASSETS.latidosHero}
              alt="Latidos"
              alto={96}
              prioritaria
            />
          </h1>
          <div
            aria-hidden="true"
            className="mt-5 h-1.5 w-20 rounded-full bg-primario"
          />
        </div>

        <p className="mt-8 max-w-[17rem] text-texto-secundario">
          Participa, suma Beats y canjea recompensas del programa Latidos UCV.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Link href="/registro/paso-1" className="boton-primario">
          Registrarme
        </Link>

        <PromptsInstalacion />
      </div>

      {/* Credito institucional: los tres organizadores del programa. */}
      <footer className="mt-8 flex flex-col items-center gap-3">
        <p className="etiqueta">Un programa de</p>
        {/* Se envuelve para que en pantallas angostas los tres logos bajen de
            linea en vez de encogerse hasta volverse ilegibles. */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          <ImagenMarca src={ASSETS.flame} alt="The Flame Creative Lab" alto={28} />
          <ImagenMarca
            src={ASSETS.ucv}
            alt="Universidad Central de Venezuela"
            alto={32}
          />
          <ImagenMarca src={ASSETS.munUcv} alt="MUN UCV" alto={32} />
        </div>
      </footer>
    </main>
  );
}
