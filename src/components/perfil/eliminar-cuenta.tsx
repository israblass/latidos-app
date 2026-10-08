"use client";

import { useCallback, useState } from "react";

import { BotonVidrio } from "@/components/ui/boton-vidrio";
import { HojaInferior } from "@/components/ui/hoja-inferior";

/**
 * "Eliminar mi cuenta" (Perfil v1): solo informa. No borra nada; el borrado
 * de cuentas no existe todavia (no hay policy de delete en `usuarios`). El
 * proyecto aun no tiene un contacto de soporte definido: cuando lo tenga, va
 * en esta hoja.
 */
export function EliminarCuenta() {
  const [abierta, setAbierta] = useState(false);
  const cerrar = useCallback(() => setAbierta(false), []);

  return (
    <>
      <button type="button" onClick={() => setAbierta(true)} className="perfil-eliminar-cuenta">
        Eliminar mi cuenta
      </button>

      <HojaInferior abierta={abierta} alCerrar={cerrar} titulo="Eliminar mi cuenta">
        <p className="text-[15px] text-texto-secundario">Para eliminar tu cuenta escríbenos a soporte.</p>
        <div className="mt-5">
          <BotonVidrio type="button" tono="blanco" flecha={false} onClick={cerrar}>
            Entendido
          </BotonVidrio>
        </div>
      </HojaInferior>
    </>
  );
}
