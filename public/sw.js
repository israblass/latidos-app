/*
 * Service worker de Latidos.
 *
 * Cachea el shell de la app para que abra rapido y muestre algo util sin
 * conexion (constitution §9). Deliberadamente simple: las estrategias por tipo
 * de contenido que necesitan Pulso y el escaneo llegan con sus propias fases.
 *
 * Regla de oro: este archivo solo se mete con lo que sabe manejar. Todo lo
 * demas pasa de largo sin tocarlo, porque un service worker que intercepta mal
 * rompe peticiones que sin el funcionarian perfectamente.
 */

const VERSION = "v3";
// v3: el manifest cambio de colores con el nuevo design system, asi que el
// shell precacheado se renueva.
const CACHE_SHELL = `latidos-shell-${VERSION}`;
const RUTA_SIN_CONEXION = "/sin-conexion";

// Lo minimo para que la app abra estando sin señal.
const SHELL = [RUTA_SIN_CONEXION, "/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE_SHELL)
      // addAll falla entero si un recurso falla; de a uno es mas tolerante.
      .then((cache) =>
        Promise.all(SHELL.map((ruta) => cache.add(ruta).catch(() => null))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nombres) =>
        Promise.all(
          nombres
            .filter((n) => n.startsWith("latidos-") && n !== CACHE_SHELL)
            .map((n) => caches.delete(n)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/**
 * Recursos que este service worker puede cachear sin riesgo: archivos
 * estaticos, con nombre versionado y sin parametros.
 *
 * Es una lista de permitidos y no de prohibidos a proposito. Con una lista de
 * prohibidos, cualquier cosa que no se hubiera previsto caia en la rama de
 * cache: fue lo que paso con los payloads RSC de Next (`?_rsc=...`), que se
 * intentaban cachear y terminaban rompiendo la navegacion entre los pasos del
 * registro.
 */
function sePuedeCachear(url) {
  // Con parametros no se cachea: distinguen contenido dinamico (los `?_rsc=`
  // de Next, los `?v=` del servidor de desarrollo) y ensucian el cache.
  if (url.search) return false;

  if (url.pathname.startsWith("/_next/static/")) return true;

  return /\.(?:png|jpg|jpeg|svg|webp|gif|ico|woff2?)$/.test(url.pathname);
}

/** Navegacion: la red manda; sin señal, la pantalla propia de sin conexion. */
async function resolverNavegacion(peticion) {
  try {
    return await fetch(peticion);
  } catch {
    const cache = await caches.open(CACHE_SHELL);
    const sinConexion = await cache.match(RUTA_SIN_CONEXION);
    if (sinConexion) return sinConexion;

    // Nunca `Response.error()`: el navegador lo reporta como error de red y la
    // pestaña queda en blanco. Mejor una respuesta de verdad.
    return new Response("Sin conexion", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}

/** Estatico: se sirve lo cacheado y se refresca por detras. */
async function resolverEstatico(peticion) {
  const cache = await caches.open(CACHE_SHELL);
  const cacheada = await cache.match(peticion);

  if (cacheada) {
    // Refresco en segundo plano: si falla, no afecta a esta respuesta.
    fetch(peticion)
      .then((respuesta) => {
        if (respuesta.ok) return cache.put(peticion, respuesta.clone());
      })
      .catch(() => null);
    return cacheada;
  }

  try {
    const respuesta = await fetch(peticion);
    // `cache.put` puede rechazar (respuestas parciales, opacas). Que falle el
    // guardado no puede tumbar la respuesta que ya se tiene.
    if (respuesta.ok) {
      cache.put(peticion, respuesta.clone()).catch(() => null);
    }
    return respuesta;
  } catch {
    return new Response("", { status: 504, statusText: "Sin conexion" });
  }
}

self.addEventListener("fetch", (evento) => {
  const peticion = evento.request;

  // Escrituras (POST, PATCH, DELETE...) van directas a la red, siempre. Aqui
  // entran /api/auth/registro y el resto de la API: son transacciones, no
  // archivos, y el servidor tiene que verlas todas.
  if (peticion.method !== "GET") return;

  let url;
  try {
    url = new URL(peticion.url);
  } catch {
    return;
  }

  if (url.origin !== self.location.origin) return;
  if (!url.protocol.startsWith("http")) return;

  // La API y el flujo de confirmacion nunca se cachean ni se interceptan.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) {
    return;
  }

  if (peticion.mode === "navigate") {
    evento.respondWith(resolverNavegacion(peticion));
    return;
  }

  if (sePuedeCachear(url)) {
    evento.respondWith(resolverEstatico(peticion));
  }

  // Cualquier otra cosa (payloads RSC, HMR del servidor de desarrollo, lo que
  // venga) sigue su camino sin que este archivo la toque.
});
