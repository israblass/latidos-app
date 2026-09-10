import Link from "next/link";

import { PromptsInstalacion } from "@/components/instalacion/prompts-instalacion";

/**
 * Pantalla de bienvenida (T018).
 *
 * Es la misma sin importar de donde venga la persona: QR fisico, link de
 * WhatsApp, campaña o la web informativa (spec §10 suposicion 1). Sobre ella
 * aparece el prompt de instalacion, que nunca bloquea nada.
 *
 * El fondo de textura de cielo del branding (constitution §2) todavia no esta
 * en el repo; mientras tanto se usa el fondo oscuro con un resplandor amarillo,
 * que respeta la paleta.
 */
export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden px-5 pb-10 pt-16">
      {/* Resplandor de marca detras del logotipo. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[22%] h-72 w-72 -translate-x-1/2 rounded-full bg-primario/10 blur-3xl"
      />

      <div className="relative flex flex-1 flex-col items-center justify-center text-center">
        <h1 className="font-display text-[64px] uppercase leading-none text-primario">
          Latidos
        </h1>

        <p className="etiqueta mt-4">Universidad Central de Venezuela</p>

        <p className="mt-6 max-w-[17rem] text-texto-secundario">
          Participa, suma Beats y canjea recompensas del programa Latidos UCV.
        </p>
      </div>

      <div className="relative flex flex-col gap-3">
        <Link href="/registro/paso-1" className="boton-primario">
          Registrarme
        </Link>

        <PromptsInstalacion />
      </div>
    </main>
  );
}
