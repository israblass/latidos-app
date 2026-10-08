import { redirect } from "next/navigation";

import { PanelInicio } from "@/components/inicio/panel-inicio";
import { TabBar } from "@/components/navegacion/tab-bar";
import { leerBannersActivos } from "@/lib/banners/leer-banners";
import { leerAvatarPath } from "@/lib/perfil/leer-avatar";
import { exigirPerfil } from "@/lib/usuario/sesion";

/**
 * Pantalla de Inicio (constitution §2, v2.6.0).
 *
 * Fondo en degradado de marca (.fondo-inicio, sin foto ni desenfoque) y, de
 * arriba a abajo: techo de nubes (v2.9.0), pildoras de campana y perfil,
 * saludo, tarjeta de Beats en vidrio con los circulos del pulso,
 * Escanear QR, banners y los acordeones de actividad y "Qué es Latidos"
 * (PanelInicio). Margenes laterales de 16px, como la referencia aprobada.
 *
 * Recien registrada la persona ya tiene el bono de bienvenida, asi que el
 * numero nunca arranca en cero.
 */
// En minusculas a proposito: React 18 no reconoce `fetchPriority` y avisa en
// consola; el atributo HTML pasa tal cual.
const PRIORIDAD_BAJA = { fetchpriority: "low" } as object;

export default async function Inicio() {
  const perfil = await exigirPerfil();

  // Quien todavia no vio el onboarding pasa por el antes de llegar aqui.
  if (!perfil.onboarding_visto) redirect("/onboarding/pantalla-1");

  const [banners, avatarPath] = await Promise.all([leerBannersActivos(), leerAvatarPath(perfil.id)]);

  return (
    <>
      {/* Sin padding arriba: el techo de nubes nace en el borde de la pantalla
          y ya incluye la zona segura en su alto. */}
      <main className="relative isolate flex min-h-dvh flex-col px-4 espacio-barra">
        <div aria-hidden="true" className="fondo-inicio" />
        {/* Techo de nubes (v2.9.0): decorativo y solo en el Inicio. Prioridad
            baja para no competir con el saludo ni con el CTA. */}
        <div aria-hidden="true" data-techo-nubes="" className="techo-nubes -mx-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ilustraciones/techo-nubes.webp" alt="" width={860} height={375} decoding="async" {...PRIORIDAD_BAJA} />
        </div>
        <PanelInicio
          nombre={perfil.nombre}
          usuarioId={perfil.id}
          saldoInicial={perfil.beats_balance}
          banners={banners}
          avatarPath={avatarPath}
        />
      </main>

      <TabBar />
    </>
  );
}
