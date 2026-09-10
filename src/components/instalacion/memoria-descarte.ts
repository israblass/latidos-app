"use client";

/**
 * Recuerda que la persona cerro el prompt de instalacion.
 *
 * La spec (§10 suposicion 3) pide que el prompt se pueda descartar y que no
 * vuelva a aparecer de forma insistente en cada sesion: como maximo un
 * recordatorio discreto ocasional. Por eso el descarte se guarda con fecha y
 * el prompt completo no vuelve hasta pasada una semana; mientras tanto queda
 * el boton discreto de la bienvenida, que siempre esta disponible.
 *
 * Vive en localStorage, que puede fallar (modo privado, cookies bloqueadas).
 * Si falla, el peor caso es que el prompt reaparezca: molesto, nunca roto.
 */

const CLAVE = "latidos:instalacion-descartada";
const DIAS_DE_ESPERA = 7;

export function marcarDescartado(): void {
  try {
    window.localStorage.setItem(CLAVE, String(Date.now()));
  } catch {
    // Sin almacenamiento no hay memoria del descarte, y no pasa nada grave.
  }
}

export function fueDescartadoHacePoco(): boolean {
  try {
    const guardado = window.localStorage.getItem(CLAVE);
    if (!guardado) return false;

    const cuando = Number(guardado);
    if (!Number.isFinite(cuando)) return false;

    const transcurrido = Date.now() - cuando;
    return transcurrido < DIAS_DE_ESPERA * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}
