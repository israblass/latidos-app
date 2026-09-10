import { redirect } from "next/navigation";

import { TabBar } from "@/components/navegacion/tab-bar";
import { exigirPerfil } from "@/lib/usuario/sesion";

/**
 * Pantalla de Inicio (T032).
 *
 * El contador de Beats es la firma visual de la app (constitution §2): numero
 * grande en Anton amarillo, lo primero que se ve. Recien registrada la persona,
 * marca cero, y el onboarding que acaba de ver le dio el contexto de por que
 * ese numero va a empezar a moverse.
 */
export default async function Inicio() {
  const perfil = await exigirPerfil();

  // Quien todavia no vio el onboarding pasa por el antes de llegar aqui.
  if (!perfil.onboarding_visto) redirect("/onboarding/pantalla-1");

  return (
    <>
      <main className="flex min-h-dvh flex-col px-5 pb-28 pt-6">
        <header className="flex items-center justify-between gap-3">
          <p className="text-[15px] text-texto-secundario">
            Hola,{" "}
            <span className="font-medium text-texto-principal">
              {perfil.nombre}
            </span>
          </p>
        </header>

        <section
          aria-label="Tu balance de Beats"
          className="flex flex-1 flex-col items-center justify-center text-center"
        >
          <p className="font-display text-[72px] leading-none text-primario">
            {perfil.beats_balance}
          </p>
          <p className="etiqueta mt-1">Beats</p>

          <p className="mt-6 max-w-[16rem] text-texto-secundario">
            {perfil.beats_balance === 0
              ? "Escanea un QR de marca para empezar a sumar."
              : "Sigue participando para sumar mas."}
          </p>
        </section>
      </main>

      <TabBar />
    </>
  );
}
