import Link from "next/link";
import { redirect } from "next/navigation";

import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * Destino tras confirmar el correo.
 *
 * Puente temporal de Fase 1: en Fase 3 (T023-T031) aqui empieza el onboarding
 * de 3 pantallas. Existe para que el registro sea verificable de punta a punta
 * sin adelantar trabajo de fases posteriores.
 */
export default async function CuentaLista() {
  const supabase = crearClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/registro/confirma-tu-correo");
  }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("nombre, beats_balance")
    .eq("id", user.id)
    .single();

  return (
    <main className="flex min-h-dvh flex-col justify-center px-5 pb-8 pt-4">
      <p className="etiqueta">Correo confirmado</p>
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
