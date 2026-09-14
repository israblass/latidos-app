"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { MensajeSinConexion } from "@/components/escaneo/mensaje-sin-conexion";
import { TarjetaExito } from "@/components/escaneo/tarjeta-exito";
import { BarraAcento } from "@/components/marca/titulo-con-acento";
import { useConexion } from "@/hooks/use-conexion";
import type { MotivoCanjeFallido, ResultadoCanje } from "@/types/configuracion";

interface Props {
  idQR: string;
  marca: string;
  beatsEnJuego: number;
  balanceActual: number;
}

type Estado =
  | { fase: "confirmando" }
  | { fase: "enviando" }
  | { fase: "otorgado"; resultado: Extract<ResultadoCanje, { ok: true }> }
  | { fase: "fallido"; motivo: MotivoCanjeFallido }
  | { fase: "sin-conexion" };

const MENSAJES_FALLO: Record<MotivoCanjeFallido, { titulo: string; detalle: string }> = {
  ya_escaneado_hoy: {
    titulo: "Ya sumaste con esta marca hoy",
    detalle: "Vuelve manana y suma otra vez.",
  },
  limite_alcanzado: {
    titulo: "Este codigo ya no esta activo",
    detalle: "Busca otro QR de marca para seguir sumando.",
  },
  qr_invalido: {
    titulo: "Este codigo ya no esta activo",
    detalle: "Busca otro QR de marca para seguir sumando.",
  },
  sesion_invalida: {
    titulo: "Tu sesion se cerro",
    detalle: "Vuelve a entrar para seguir sumando.",
  },
};

/**
 * Confirmacion previa al canje (T049, T055).
 *
 * Los Beats se muestran, no se otorgan: solo se acreditan si la persona toca
 * confirmar (spec §9 regla 8). Cancelar no crea ningun registro ni cuenta
 * contra el limite del QR — basta con irse, porque nada se ha escrito.
 */
export function PantallaConfirmar({ idQR, marca, beatsEnJuego, balanceActual }: Props) {
  const router = useRouter();
  const enLinea = useConexion();
  const [estado, setEstado] = useState<Estado>({ fase: "confirmando" });

  /**
   * Al salir del canje hay que refrescar: Inicio lee el balance en el servidor
   * y el router de Next guarda en cache la version vieja. El refresh va
   * *despues* de navegar, nunca antes: refrescar estando todavia en esta
   * pantalla la volveria a renderizar en el servidor, donde el QR ya figura
   * escaneado hoy, y el mensaje de exito desapareceria delante de la persona.
   */
  const volverAEscanear = () => {
    router.replace("/escanear");
    router.refresh();
  };

  const volverAInicio = () => {
    router.push("/inicio");
    router.refresh();
  };

  const confirmar = async () => {
    // Sin red no se intenta: se avisa de una vez en vez de esperar el fallo.
    if (!enLinea) {
      setEstado({ fase: "sin-conexion" });
      return;
    }

    setEstado({ fase: "enviando" });

    try {
      const respuesta = await fetch("/api/qr/confirmar-canje", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido: idQR }),
      });

      const cuerpo = (await respuesta.json()) as ResultadoCanje | { error: string };

      if ("ok" in cuerpo && cuerpo.ok) {
        setEstado({ fase: "otorgado", resultado: cuerpo });
        return;
      }

      setEstado({
        fase: "fallido",
        motivo: "ok" in cuerpo ? cuerpo.motivo : "sesion_invalida",
      });
    } catch {
      setEstado({ fase: "sin-conexion" });
    }
  };

  const botonInicio = (
    <button type="button" onClick={volverAInicio} className="boton-secundario">
      Volver a Inicio
    </button>
  );
  const botonEscanear = (
    <button type="button" onClick={volverAEscanear} className="boton-primario">
      Escanear otro
    </button>
  );

  if (estado.fase === "otorgado") {
    return (
      <TarjetaExito
        marca={marca}
        beatsOtorgados={estado.resultado.beats_otorgados}
        balanceAnterior={balanceActual}
        balanceNuevo={estado.resultado.beats_balance_actualizado}
        modoEventoActivo={estado.resultado.modo_evento_activo}
        onSeguirEscaneando={volverAEscanear}
        onVolverAInicio={volverAInicio}
      />
    );
  }

  if (estado.fase === "sin-conexion") {
    return (
      <MensajeSinConexion
        acciones={
          <>
            <button
              type="button"
              onClick={() => setEstado({ fase: "confirmando" })}
              className="boton-primario"
            >
              Reintentar
            </button>
            {botonInicio}
          </>
        }
      />
    );
  }

  if (estado.fase === "fallido") {
    const mensaje = MENSAJES_FALLO[estado.motivo];
    return (
      <div className="tarjeta flex flex-col items-center px-5 py-8 text-center">
        <h2 className="font-display text-[22px] uppercase leading-tight text-texto-principal">
          {mensaje.titulo}
        </h2>
        <p className="mt-2 text-[15px] text-texto-secundario">{mensaje.detalle}</p>
        <div className="mt-7 flex w-full flex-col gap-3">
          {botonEscanear}
          {botonInicio}
        </div>
      </div>
    );
  }

  const enviando = estado.fase === "enviando";

  return (
    <div className="tarjeta-elevada flex flex-col items-center px-5 py-8 text-center">
      <p className="etiqueta">Vas a canjear el QR de</p>
      <h2 className="font-display mt-2 text-[26px] uppercase leading-tight text-texto-principal">
        {marca}
      </h2>

      {/* Mismo patron que el contador de Inicio: numero en navy, amarillo como
          acento. Ninguna card de la app lleva fondo oscuro. */}
      <div className="tarjeta-plana elevado-piloto mt-6 w-full px-5 py-6">
        <p className="font-display text-[48px] leading-none text-texto-principal">
          +{beatsEnJuego}
        </p>
        <BarraAcento className="mt-3" />
        <p className="etiqueta mt-3 text-texto-secundario">Beats</p>
      </div>

      {!enLinea ? (
        <p role="status" className="mt-5 text-[14px] text-alerta-texto">
          Estas sin conexion. Conectate para confirmar el canje.
        </p>
      ) : null}

      <div className="mt-7 flex w-full flex-col gap-3">
        <button
          type="button"
          onClick={() => void confirmar()}
          disabled={enviando}
          className="boton-primario elevado-piloto"
        >
          {enviando ? (
            <>
              <span className="girador mr-2" aria-hidden="true" />
              Confirmando...
            </>
          ) : (
            "Confirmar canje"
          )}
        </button>

        {/* Cancelar no escribe nada: simplemente se vuelve al escaner. */}
        <button
          type="button"
          onClick={volverAEscanear}
          disabled={enviando}
          className="boton-secundario"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
