import { redirect } from "next/navigation";

import { CarruselBanners } from "@/components/inicio/carrusel-banners";
import { FondoApp } from "@/components/marca/fondo-app";
import { QueEsLatidos } from "@/components/inicio/que-es-latidos";
import { SaldoInicio } from "@/components/inicio/saldo-inicio";
import { TabBar } from "@/components/navegacion/tab-bar";
import { leerBannersActivos } from "@/lib/banners/leer-banners";
import { exigirPerfil } from "@/lib/usuario/sesion";

/**
 * Pantalla de Inicio (T032).
 *
 * El contador de Beats es la firma visual de la app (constitution §2): numero
 * grande en navy dentro de una card de vidrio, lo primero que se ve. Recien
 * registrada la persona ya tiene el bono de bienvenida, asi que el numero
 * nunca arranca en cero.
 *
 * Orden de arriba a abajo: saludo, contador, banners y "Qué es Latidos" con
 * sus fases. El contador sigue siendo lo primero y lo mas grande; lo demas va
 * debajo, sin competirle.
 */
export default async function Inicio() {
  const perfil = await exigirPerfil();

  // Quien todavia no vio el onboarding pasa por el antes de llegar aqui.
  if (!perfil.onboarding_visto) redirect("/onboarding/pantalla-1");

  const banners = await leerBannersActivos();

  return (
    <>
      <main className="relative isolate flex min-h-dvh flex-col px-5 espacio-barra pt-6">
        {/* El cielo solo en la cabecera: se funde con el crema hacia abajo. */}
        <FondoApp variante="cabecera" />
        <header className="flex items-center justify-between gap-3">
          {/* El diseño no lleva titulo visible (el contador es el heroe), pero
              sin un h1 un lector de pantalla no sabe anunciar donde esta. */}
          <h1 className="sr-only">Inicio</h1>
          {/* Navy y no gris: va sobre el cielo de la cabecera, con un velo
              liviano para que las nubes se vean, y ahi el gris no pasa AA. */}
          <p className="text-[15px] text-texto-principal">
            Hola,{" "}
            <span className="font-medium text-texto-principal">
              {perfil.nombre}
            </span>
          </p>
        </header>

        <section
          aria-label="Tu balance de Beats"
          className="mt-6 flex flex-col items-center"
        >
          {/* Se relee al volver a la app (desbloqueo, segundo plano, red). */}
          <SaldoInicio saldoInicial={perfil.beats_balance} />

          {/*
            Ya no hay caso cero: el perfil nace con el bono de bienvenida (spec
            de registro §9.16), asi que la ilustracion y el texto del estado
            vacio salieron (criterio 12).
          */}
          <p className="mt-8 max-w-[16rem] text-center text-texto-secundario">
            Sigue participando para sumar más.
          </p>
        </section>

        <div className="mt-8">
          <CarruselBanners banners={banners} />
        </div>

        <div className="mt-8">
          <QueEsLatidos />
        </div>
      </main>

      <TabBar />
    </>
  );
}
