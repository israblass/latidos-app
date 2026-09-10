/*
 * Service worker de Latidos.
 *
 * Cachea el shell de la app para que abra rapido y muestre algo util sin
 * conexion (constitution §9: "la app debe mostrar datos cacheados si no hay
 * conexion"). Deliberadamente simple: las estrategias por tipo de contenido
 * que necesitan Pulso y el escaneo llegan con sus propias fases.
 */

const VERSION = "v1";
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

/** Peticiones que nunca deben pasar por cache. */
function seIgnora(peticion, url) {
  return (
    peticion.method !== "GET" ||
    !url.protocol.startsWith("http") ||
    url.origin !== self.location.origin ||
    // Nada de la API: las transacciones se validan siempre contra el servidor.
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    // Recarga en caliente del servidor de desarrollo.
    url.pathname.startsWith("/_next/webpack-hmr")
  );
}

self.addEventListener("fetch", (evento) => {
  const url = new URL(evento.request.url);
  if (seIgnora(evento.request, url)) return;

  // Navegaciones: primero la red, para no servir pantallas viejas. Si no hay
  // señal, se responde con la pantalla de sin conexion.
  if (evento.request.mode === "navigate") {
    evento.respondWith(
      fetch(evento.request).catch(async () => {
        const cache = await caches.open(CACHE_SHELL);
        return (
          (await cache.match(evento.request)) ??
          (await cache.match(RUTA_SIN_CONEXION)) ??
          Response.error()
        );
      }),
    );
    return;
  }

  // Estaticos: se sirve lo cacheado y se refresca por detras.
  evento.respondWith(
    caches.open(CACHE_SHELL).then(async (cache) => {
      const cacheada = await cache.match(evento.request);
      const desdeRed = fetch(evento.request)
        .then((respuesta) => {
          if (respuesta.ok) cache.put(evento.request, respuesta.clone());
          return respuesta;
        })
        .catch(() => cacheada);
      return cacheada ?? desdeRed;
    }),
  );
});
