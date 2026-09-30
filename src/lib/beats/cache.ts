import type { CacheBeats } from "@/types/beats";

/**
 * Copia local de la pantalla de Beats, por usuario (T039; plan §2, CacheBeats).
 *
 * Sirve para abrir la pantalla al instante y para mostrar algo util sin señal
 * (spec §8.2). Vive en localStorage con una clave por usuario, y nunca se
 * muestra la copia de alguien que no sea quien tiene la sesion: en un telefono
 * compartido, la segunda persona no puede ver los Beats de la primera (spec
 * §10.17).
 *
 * Todo va en try/catch: el almacenamiento puede no existir (navegacion
 * privada, cuota llena), y eso no puede tumbar la pantalla. Sin almacenamiento,
 * simplemente no hay copia.
 */

const PREFIJO = "latidos:beats:";
/** Cambia si cambia la forma de CacheBeats: una copia vieja se descarta. */
const VERSION = 1;

type Guardado = CacheBeats & { version: number };

const clave = (usuarioId: string) => `${PREFIJO}${usuarioId}`;

export function leerCache(usuarioId: string): CacheBeats | null {
  try {
    const crudo = window.localStorage.getItem(clave(usuarioId));
    if (!crudo) return null;
    const guardado = JSON.parse(crudo) as Guardado;
    // Una copia que no es de esta persona o de otra version no se usa.
    if (guardado.version !== VERSION || guardado.usuario_id !== usuarioId) return null;
    const cache: CacheBeats & { version?: number } = { ...guardado };
    delete cache.version;
    return cache;
  } catch {
    return null;
  }
}

export function escribirCache(cache: CacheBeats) {
  try {
    const guardado: Guardado = { ...cache, version: VERSION };
    window.localStorage.setItem(clave(cache.usuario_id), JSON.stringify(guardado));
  } catch {
    // Sin espacio o sin almacenamiento: la pantalla sigue sin copia.
  }
}

/** Claves de copias de Beats que hay en este navegador. */
function clavesGuardadas(): string[] {
  try {
    const claves: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k?.startsWith(PREFIJO)) claves.push(k);
    }
    return claves;
  } catch {
    return [];
  }
}

/** Borra las copias de cualquier usuario que no sea el de la sesion actual. */
export function borrarCachesAjenas(usuarioId: string) {
  try {
    for (const k of clavesGuardadas()) {
      if (k !== clave(usuarioId)) window.localStorage.removeItem(k);
    }
  } catch {
    // nada que hacer
  }
}

/** Borra todas las copias de Beats (al cerrar sesion). */
export function borrarTodasLasCaches() {
  try {
    for (const k of clavesGuardadas()) window.localStorage.removeItem(k);
  } catch {
    // nada que hacer
  }
}
