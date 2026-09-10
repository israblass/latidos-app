import Link from "next/link";
import { redirect } from "next/navigation";

import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * Confirmacion de cuenta creada.
 *
 * Es una pantalla puente de Fase 1: en el flujo final (Fase 3, T023-T031) el
 * registro desemboca en el onboarding de 3 pantallas y de ahi a Inicio. Existe
 * para que el cierre del registro sea verificable end-to-end sin adelantar
 * trabajo de fases posteriores.
 *
 * Al leerse en el servidor tambien demuestra que la sesion quedo persistida en
 * cookies: sin sesion, esta ruta manda de vuelta al paso 1.
 */
export default async function RegistroListo() {
  const supabase = crearClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/registro/paso-1");
  }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("nombre, beats_balance")
    .eq("id", user.id)
    .single();

  return (
    <main className="flex min-h-dvh flex-col justify-center px-5 pb-8 pt-4">
      <p className="etiqueta">Cuenta creada</p>
      <h1 className="titulo-pantalla mt-3">
        Bienvenido a Latidos{usuario?.nombre ? `, ${usuario.nombre}` : ""}
      </h1>
      <p className="mt-4 text-texto-secundario">
        Tu sesion queda iniciada en este dispositivo. Vas a empezar con{" "}
        {usuario?.beats_balance ?? 0} Beats.
      </p>

      <div className="mt-10">
        <Link href="/" className="boton-secundario">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
