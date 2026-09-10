import Link from "next/link";

import { PromptsInstalacion } from "@/components/instalacion/prompts-instalacion";

/**
 * Pantalla de bienvenida (T018).
 *
 * Es la misma sin importar de donde venga la persona: QR fisico, link de
 * WhatsApp, campaña o la web informativa (spec §10 suposicion 1). Sobre ella
 * aparece el prompt de instalacion, que nunca bloquea nada.
 *
 * El amarillo de marca no se lee como texto sobre blanco. Tampoco funciona
 * pintar el logotipo como un bloque amarillo entero: queda del mismo peso que
 * el boton de registrarse y la pantalla pierde jerarquia. El amarillo entra
 * como acento bajo el logotipo, y el unico bloque amarillo grande es el CTA.
 */
export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col px-5 pb-10 pt-16">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="w-full rounded-card bg-fondo-alterno px-6 py-12">
          <h1 className="font-display text-[64px] uppercase leading-none text-texto-principal">
            Latidos
          </h1>
          <div
            aria-hidden="true"
            className="mx-auto mt-4 h-1.5 w-20 rounded-full bg-primario"
          />
          <p className="etiqueta mt-4">Universidad Central de Venezuela</p>
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
    </main>
  );
}
