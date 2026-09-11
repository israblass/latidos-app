import Link from "next/link";
import { redirect } from "next/navigation";

import { MensajeLimiteAlcanzado } from "@/components/escaneo/mensaje-limite-alcanzado";
import { MensajeQRInvalido } from "@/components/escaneo/mensaje-qr-invalido";
import { MensajeYaEscaneado } from "@/components/escaneo/mensaje-ya-escaneado";
import { PantallaConfirmar } from "@/components/escaneo/pantalla-confirmar";
import { PARAMETRO_QR } from "@/lib/qr/contenido";
import { validarQR } from "@/lib/qr/validar";
import { crearClienteServidor } from "@/lib/supabase/server";
import { exigirPerfil } from "@/lib/usuario/sesion";

/**
 * Confirmacion previa al canje (T049).
 *
 * Se valida de nuevo en el servidor al entrar, en vez de recibir marca y Beats
 * del cliente: asi nadie puede llegar aqui con un QR agotado escribiendo la URL
 * a mano, ni inflarse los Beats que dice la pantalla. La comprobacion
 * definitiva vuelve a ocurrir al confirmar, dentro de la transaccion.
 */
export default async function ConfirmarCanje({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const perfil = await exigirPerfil();

  const parametro = searchParams[PARAMETRO_QR];
  const contenido = Array.isArray(parametro) ? parametro[0] : parametro;

  if (!contenido) redirect("/escanear");

  const supabase = crearClienteServidor();
  const resultado = await validarQR(supabase, perfil.id, contenido);

  const acciones = (
    <>
      <Link href="/escanear" className="boton-primario">
        Escanear otro
      </Link>
      <Link href="/inicio" className="boton-secundario">
        Volver a Inicio
      </Link>
    </>
  );

  return (
    <main className="flex min-h-dvh flex-col px-5 pb-8 pt-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="titulo-pantalla">Canje</h1>
        <Link
          href="/escanear"
          aria-label="Volver al escaner"
          className="-mr-2 flex h-12 w-12 items-center justify-center rounded-control text-texto-secundario transition-opacity active:opacity-60"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </Link>
      </header>

      <div className="mt-6 flex flex-1 flex-col justify-center">
        {resultado.valido ? (
          <PantallaConfirmar
            idQR={resultado.qr_marca_id}
            marca={resultado.marca.nombre}
            beatsEnJuego={resultado.beats_en_juego}
            balanceActual={perfil.beats_balance}
          />
        ) : null}

        {!resultado.valido && resultado.motivo === "ya_escaneado_hoy" ? (
          <MensajeYaEscaneado marca="esta marca" acciones={acciones} />
        ) : null}

        {!resultado.valido && resultado.motivo === "limite_alcanzado" ? (
          <MensajeLimiteAlcanzado acciones={acciones} />
        ) : null}

        {!resultado.valido && resultado.motivo === "qr_invalido" ? (
          <MensajeQRInvalido acciones={acciones} />
        ) : null}
      </div>
    </main>
  );
}
