"use client";

import { borrarTodasLasCaches, hayCachesGuardadas } from "@/lib/beats/cache";
import { crearClienteNavegador } from "@/lib/supabase/client";

/**
 * Datos de la persona que la app guarda en el navegador y que no pueden
 * quedar al cerrar sesion, para que otra persona en el mismo telefono no los
 * vea.
 *
 * Hoy es solo la copia de Beats (`latidos:beats:*` en localStorage), de TODAS
 * las cuentas que hayan pasado por este navegador. La sesion vive en cookies y
 * la borra el propio signOut. Lo que no es de la persona se queda: la memoria
 * del aviso de instalacion es del dispositivo, y el service worker no guarda
 * nada por usuario (la copia de /beats es una pantalla sin datos).
 *
 * Si algun dia la app guarda algo mas de la persona en el navegador, se borra
 * aqui.
 */
export function limpiarDatosDeLaPersona() {
  borrarTodasLasCaches();
}

/**
 * Cierra la sesion en este dispositivo.
 *
 * 1. Cierra los canales en vivo (el de movimientos de Beats) antes de soltar
 *    la sesion, para que no quede un socket abierto con el token viejo.
 * 2. signOut con `scope: "local"` revoca en Supabase solo la sesion de este
 *    dispositivo y la borra del navegador. Las sesiones de la misma cuenta en
 *    otros telefonos siguen abiertas: el default ("global") las cerraba
 *    todas. Aunque la revocacion falle (sin red), auth-js igual borra la
 *    sesion local y emite SIGNED_OUT: quien toca "Cerrar sesion" sale siempre.
 * 3. La limpieza de datos la hace el escucha de SIGNED_OUT
 *    (src/components/pwa/limpiar-cache-sesion.tsx), que cubre tambien un
 *    cierre que no pase por este boton. Aqui solo se comprueba que haya
 *    ocurrido, y se hace si no: una sola limpieza efectiva, nunca ninguna.
 */
export async function cerrarSesion() {
  const supabase = crearClienteNavegador();
  await supabase.removeAllChannels().catch(() => null);
  await supabase.auth.signOut({ scope: "local" }).catch(() => null);
  if (hayCachesGuardadas()) limpiarDatosDeLaPersona();
}
