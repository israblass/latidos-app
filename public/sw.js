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

const VERSION = "v10";
// v3: el manifest cambio de colores con el nuevo design system, asi que el
// shell precacheado se renueva.
// v4: la pantalla de Beats guarda una copia de su HTML para abrirse sin señal
// (plan de Beats §3, "Pantalla de Beats disponible sin conexion").
// v5: llegan las ilustraciones definitivas. La de sin conexion y error se
// precachea con el shell, y la vieja de estados-vacios deja de existir.
// v6: el manifest pasa al crema (#FFFFF5) y llega el icono nuevo (/icons/),
// ambos precacheados en el shell.
// v7: el CSS cambio (botones en pildora, Inicio nuevo) y la copia
// precacheada de /sin-conexion apunta a la hoja de estilos anterior.
// v8: el CSS vuelve a cambiar (vidrio del Inicio, gris de la barra y las
// hojas, principio de paleta): misma razon que la v7.
// v9: la pantalla de Beats pasa a dashboard (CSS nuevo) y su copia sin red
// guarda tambien la linea de latido de "Tu pulso".
// v10: CSS nuevo (techo de nubes, circulos del pulso, boton de deslizar,
// tarjeta de Beats unificada). Las dos ilustraciones nuevas del Inicio no se
// precachean (~200 KB): como todo .webp, se guardan la primera vez que se ven
// con red y desde ahi se sirven sin ella.
const CACHE_SHELL = `latidos-shell-${VERSION}`;
const RUTA_SIN_CONEXION = "/sin-conexion";

/**
 * Pantallas cuyo HTML se guarda en cada visita con red y se sirve sin ella.
 * Solo las que no llevan datos de nadie en el HTML: la de Beats es una
 * pantalla de cliente que trae los datos despues, con la sesion de quien la
 * abre. Una pantalla renderizada en servidor con datos de la persona NUNCA
 * puede entrar aqui: se le serviria a otra persona en el mismo telefono.
 */
const PANTALLAS_CON_COPIA = ["/beats"];

/**
 * Lo que una pantalla con copia muestra SOLO sin red, y que por lo tanto nunca
 * se llega a pedir con red: se guarda junto con su copia. Sin esto, la
 * ilustracion de "sin conexion" de Beats se veria rota justo cuando hace falta.
 */
const ILUSTRACION_SIN_SENAL = "/ilustraciones/latido-ecg-ruido.webp";

/**
 * La linea de latido de "Tu pulso" (~32 KB). Se ve con red, pero la primera
 * visita a Beats puede no estar controlada todavia por este service worker:
 * se guarda junto con la copia para que sin red no se vea rota.
 */
const ECG_PULSO = "/ilustraciones/ecg-pulso.webp";

const RECURSOS_SIN_RED = {
  "/beats": [ILUSTRACION_SIN_SENAL, ECG_PULSO],
};

// Lo minimo para que la app abra estando sin señal. La ilustracion del latido
// con ruido es la de las pantallas de sin conexion y de error: tiene que estar
// antes de que falte la red. Es la unica ilustracion que se precachea (~21 KB);
// las demas se guardan solo si se llegan a ver con red.
const SHELL = [
  RUTA_SIN_CONEXION,
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  ILUSTRACION_SIN_SENAL,
];

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
  // Las variantes que genera next/image llevan la imagen, el ancho y la
  // calidad como parametros, pero son archivos estaticos: sin guardarlas, sin
  // red se veian rotos los iconos de la barra y de las filas.
  if (url.pathname === "/_next/image") return true;

  // Con parametros no se cachea: distinguen contenido dinamico (los `?_rsc=`
  // de Next, los `?v=` del servidor de desarrollo) y ensucian el cache.
  if (url.search) return false;

  if (url.pathname.startsWith("/_next/static/")) return true;

  return /\.(?:png|jpg|jpeg|svg|webp|gif|ico|woff2?)$/.test(url.pathname);
}

/**
 * Copia limpia de una respuesta de navegacion para guardarla: mismo cuerpo y
 * tipo, sin ninguna otra cabecera. Asi no queda guardado nada que dependa de
 * quien la pidio (cookies de sesion, cabeceras de cache del servidor).
 */
async function copiaParaGuardar(respuesta) {
  const cuerpo = await respuesta.clone().blob();
  return new Response(cuerpo, {
    status: 200,
    headers: { "content-type": respuesta.headers.get("content-type") || "text/html" },
  });
}

/** Navegacion: la red manda; sin señal, la copia o la pantalla de sin conexion. */
async function resolverNavegacion(peticion, url) {
  const conCopia = PANTALLAS_CON_COPIA.includes(url.pathname);
  try {
    const respuesta = await fetch(peticion);
    // Solo se guarda una respuesta buena y final: una redireccion (a la
    // bienvenida, al onboarding) no es la pantalla.
    // Se guarda por detras, sin hacer esperar a la pantalla.
    if (conCopia && respuesta.ok && !respuesta.redirected) {
      copiaParaGuardar(respuesta)
        .then(async (copia) => {
          const cache = await caches.open(CACHE_SHELL);
          await cache.put(url.pathname, copia);
          for (const recurso of RECURSOS_SIN_RED[url.pathname] || []) {
            if (!(await cache.match(recurso))) await cache.add(recurso).catch(() => null);
          }
        })
        .catch(() => null);
    }
    return respuesta;
  } catch {
    const cache = await caches.open(CACHE_SHELL);
    if (conCopia) {
      const copia = await cache.match(url.pathname);
      if (copia) return copia;
    }
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
    evento.respondWith(resolverNavegacion(peticion, url));
    return;
  }

  if (sePuedeCachear(url)) {
    evento.respondWith(resolverEstatico(peticion));
  }

  // Cualquier otra cosa (payloads RSC, HMR del servidor de desarrollo, lo que
  // venga) sigue su camino sin que este archivo la toque.
});
