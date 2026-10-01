import { redirect } from "next/navigation";

import { PanelInicio } from "@/components/inicio/panel-inicio";
import { TabBar } from "@/components/navegacion/tab-bar";
import { leerBannersActivos } from "@/lib/banners/leer-banners";
import { exigirPerfil } from "@/lib/usuario/sesion";

/**
 * Pantalla de Inicio (constitution §2, v2.6.0).
 *
 * Fondo en degradado de marca (.fondo-inicio, sin foto ni desenfoque) y, de
 * arriba a abajo: pildoras de ayuda y perfil, saludo, tarjeta navy de Beats,
 * Escanear QR, banners y los acordeones de actividad y "Qué es Latidos"
 * (PanelInicio). Margenes laterales de 16px, como la referencia aprobada.
 *
 * Recien registrada la persona ya tiene el bono de bienvenida, asi que el
 * numero nunca arranca en cero.
 */
export default async function Inicio() {
  const perfil = await exigirPerfil();

  // Quien todavia no vio el onboarding pasa por el antes de llegar aqui.
  if (!perfil.onboarding_visto) redirect("/onboarding/pantalla-1");

  const banners = await leerBannersActivos();

  return (
    <>
      <main className="relative isolate flex min-h-dvh flex-col px-4 espacio-barra pt-[max(22px,env(safe-area-inset-top))]">
        <div aria-hidden="true" className="fondo-inicio" />
        <PanelInicio
          nombre={perfil.nombre}
          usuarioId={perfil.id}
          saldoInicial={perfil.beats_balance}
          banners={banners}
        />
      </main>

      <TabBar />
    </>
  );
}
