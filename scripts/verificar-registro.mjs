#!/usr/bin/env node
/**
 * V001 — Verificacion del registro contra el Supabase real del proyecto.
 *
 * Recorre el contrato del plan §3 de punta a punta, incluyendo la confirmacion
 * de correo:
 *
 *   1. POST /api/auth/registro con los 6 campos -> 201 { usuario_id, sesion_token }
 *      con sesion_token en null, porque el correo aun no esta confirmado.
 *   2. El mismo correo otra vez -> 409 correo_ya_registrado.
 *   3. Datos con formato invalido -> 400 datos_invalidos.
 *   4. Se confirma el correo y se abre /auth/confirmar, que lleva al onboarding.
 *   5. Queda sesion iniciada y la fila de `usuarios` existe con los datos
 *      declarados y beats_balance en 0.
 *
 * Uso:
 *   node scripts/verificar-registro.mjs
 *
 * Necesita, en el entorno o en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * Para el paso 4 hay dos modos:
 *   - Automatico: con SUPABASE_SERVICE_ROLE_KEY en el entorno, el script pide a
 *     Supabase el enlace de confirmacion por la API de admin. Esta key es SOLO
 *     para esta verificacion; la app no la usa.
 *   - Manual: sin esa key, el script se detiene y pide que se pegue el enlace
 *     que llego al correo.
 *
 * Variables opcionales:
 *   BASE_URL  (default http://localhost:3000)
 *   CORREO_PRUEBA_QA  correo real al que se manda la confirmacion. Hace falta
 *     cuando el proveedor de correo solo entrega a direcciones conocidas: Resend
 *     sin dominio verificado unicamente escribe a la direccion con la que se
 *     abrio la cuenta, asi que un correo inventado nunca llega. Si no se define,
 *     el script genera uno con marca de tiempo (sirve solo si el correo de
 *     verdad sale, o en modo automatico con service-role).
 *   ENLACE_CONFIRMACION  el enlace del correo, para correr sin terminal
 *     interactiva (CI, o si prefieres no pegarlo a mano).
 */

import { createInterface } from "node:readline/promises";
import { readFileSync } from "node:fs";

// --- Entorno -----------------------------------------------------------------

function cargarEnvLocal() {
  try {
    for (const linea of readFileSync(".env.local", "utf8").split("\n")) {
      const limpia = linea.trim();
      if (!limpia || limpia.startsWith("#")) continue;
      const separador = limpia.indexOf("=");
      if (separador === -1) continue;
      const clave = limpia.slice(0, separador).trim();
      if (!process.env[clave]) {
        process.env[clave] = limpia.slice(separador + 1).trim();
      }
    }
  } catch {
    // Sin .env.local se usa lo que venga del entorno.
  }
}

cargarEnvLocal();

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  );
  process.exit(1);
}

if (SUPABASE_URL.includes("tu-proyecto")) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL sigue con el valor de ejemplo. Apunta al proyecto real.",
  );
  process.exit(1);
}

// --- Utilidades --------------------------------------------------------------

let fallos = 0;

function comprobar(etiqueta, condicion, detalle = "") {
  if (condicion) {
    console.log(`PASA   ${etiqueta}`);
  } else {
    fallos += 1;
    console.log(`FALLA  ${etiqueta}${detalle ? ` — ${detalle}` : ""}`);
  }
}

/** Cliente HTTP que arrastra cookies, como haria el navegador. */
function crearSesionHttp() {
  const galleta = new Map();

  return async function pedir(ruta, opciones = {}) {
    const cabeceras = new Headers(opciones.headers ?? {});
    if (galleta.size > 0) {
      cabeceras.set(
        "cookie",
        [...galleta].map(([n, v]) => `${n}=${v}`).join("; "),
      );
    }

    const respuesta = await fetch(new URL(ruta, BASE_URL), {
      ...opciones,
      headers: cabeceras,
      redirect: "manual",
    });

    for (const cabecera of respuesta.headers.getSetCookie?.() ?? []) {
      const [par] = cabecera.split(";");
      const separador = par.indexOf("=");
      const nombre = par.slice(0, separador).trim();
      const valor = par.slice(separador + 1).trim();
      if (valor === "" || cabecera.includes("Max-Age=0")) galleta.delete(nombre);
      else galleta.set(nombre, valor);
    }

    return respuesta;
  };
}

// --- Datos de la prueba ------------------------------------------------------

// CORREO_PRUEBA queda como alias del nombre anterior de la variable.
const correoFijo = process.env.CORREO_PRUEBA_QA ?? process.env.CORREO_PRUEBA ?? null;
const correo = correoFijo ?? `qa-latidos-${Date.now()}@ejemplo.com`;
const contrasena = "prueba-latidos-1";
const datos = {
  cedula: "V-12345678",
  nombre: "Maria",
  apellido: "Rodriguez",
  telefono: "04141234567",
  correo,
  tipo_usuario: "estudiante_ucv",
  contrasena,
};

console.log(`V001 contra ${BASE_URL} / ${SUPABASE_URL}`);
console.log(
  `Correo de prueba: ${correo}${correoFijo ? " (fijo, via CORREO_PRUEBA_QA)" : " (generado)"}\n`,
);

const http = crearSesionHttp();

// --- 0. Preflight: el proyecto esta configurado como espera este flujo -------

async function preflight() {
  let ajustes;
  try {
    const respuesta = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: ANON_KEY },
    });
    ajustes = await respuesta.json();
  } catch (error) {
    console.error(`No se pudo hablar con ${SUPABASE_URL}: ${error.message}`);
    console.error("Revisa la URL, la anon key y que la red alcance el proyecto.");
    process.exit(1);
  }

  // mailer_autoconfirm en true significa que Supabase confirma solo, es decir
  // que "Confirm email" esta APAGADO. Este flujo lo necesita encendido.
  if (ajustes.mailer_autoconfirm === true) {
    console.error(
      "Configuracion: 'Confirm email' esta apagado en Supabase Auth.\n" +
        "Enciendelo en Authentication -> Sign In / Providers -> Email.",
    );
    process.exit(1);
  }
  console.log("PASA   preflight: 'Confirm email' esta encendido");

  const tabla = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?select=id&limit=1`, {
    headers: { apikey: ANON_KEY },
  });
  if (tabla.status === 404 || tabla.status === 400) {
    const detalle = await tabla.json().catch(() => ({}));
    console.error(
      "Configuracion: la tabla 'usuarios' no responde.\n" +
        "Aplica supabase/migrations/20260910120000_usuarios.sql en el SQL Editor.\n" +
        `Detalle: ${JSON.stringify(detalle)}`,
    );
    process.exit(1);
  }
  console.log("PASA   preflight: la tabla 'usuarios' existe\n");

  console.log(
    "Nota: la API no permite comprobar las Redirect URLs ni la plantilla del\n" +
      "correo. Si la confirmacion falla, revisa que /auth/confirmar este en las\n" +
      "Redirect URLs y que la plantilla use {{ .TokenHash }}.\n",
  );
}

await preflight();

// --- 1. Registro -------------------------------------------------------------

const registro = await http("/api/auth/registro", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(datos),
});
const cuerpoRegistro = await registro.json();

// Un correo fijo solo sirve una vez: en la segunda corrida la cuenta ya existe
// y el registro responde 409. Vale la pena decirlo claro en vez de dejar que
// todos los chequeos siguientes fallen sin explicacion.
if (correoFijo && registro.status === 409) {
  console.error(
    `El correo ${correo} ya tiene cuenta de una corrida anterior.\n` +
      "Borra ese usuario en el panel (Authentication -> Users -> ... -> Delete user)\n" +
      "y vuelve a correr, o usa otro correo en CORREO_PRUEBA_QA.",
  );
  process.exit(1);
}

comprobar(
  "el registro responde 201",
  registro.status === 201,
  `recibido ${registro.status}: ${JSON.stringify(cuerpoRegistro)}`,
);
comprobar(
  "la salida tiene exactamente usuario_id y sesion_token (plan §3)",
  JSON.stringify(Object.keys(cuerpoRegistro).sort()) ===
    JSON.stringify(["sesion_token", "usuario_id"]),
  `llaves: ${Object.keys(cuerpoRegistro).join(", ")}`,
);
comprobar(
  "usuario_id es un UUID",
  /^[0-9a-f-]{36}$/i.test(cuerpoRegistro.usuario_id ?? ""),
);
comprobar(
  "sesion_token viene en null: falta confirmar el correo",
  cuerpoRegistro.sesion_token === null,
  `recibido ${JSON.stringify(cuerpoRegistro.sesion_token)}`,
);

const usuarioId = cuerpoRegistro.usuario_id;

// --- 2. Correo repetido ------------------------------------------------------

const repetido = await fetch(new URL("/api/auth/registro", BASE_URL), {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ...datos, cedula: "V-99999999" }),
});
const cuerpoRepetido = await repetido.json();
comprobar(
  "un correo ya registrado responde 409 (plan §3)",
  repetido.status === 409 && cuerpoRepetido.error === "correo_ya_registrado",
  `recibido ${repetido.status}: ${JSON.stringify(cuerpoRepetido)}`,
);

// --- 3. Formato invalido -----------------------------------------------------

const invalido = await fetch(new URL("/api/auth/registro", BASE_URL), {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ...datos, correo: "sinarroba", telefono: "hola" }),
});
const cuerpoInvalido = await invalido.json();
comprobar(
  "un formato invalido responde 400 (plan §3)",
  invalido.status === 400 && cuerpoInvalido.error === "datos_invalidos",
  `recibido ${invalido.status}: ${JSON.stringify(cuerpoInvalido)}`,
);

// --- 4. Confirmacion del correo ---------------------------------------------

async function enlaceDeConfirmacion() {
  if (SERVICE_ROLE) {
    const respuesta = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "signup", email: correo, password: contrasena }),
    });
    const cuerpo = await respuesta.json();
    if (!respuesta.ok) {
      throw new Error(`admin/generate_link respondio ${respuesta.status}: ${JSON.stringify(cuerpo)}`);
    }
    const hash = cuerpo.hashed_token ?? cuerpo.properties?.hashed_token;
    if (!hash) throw new Error("la respuesta no trae hashed_token");
    return `${BASE_URL}/auth/confirmar?token_hash=${hash}&type=signup`;
  }

  if (process.env.ENLACE_CONFIRMACION) {
    return process.env.ENLACE_CONFIRMACION.trim();
  }

  if (!process.stdin.isTTY) {
    throw new Error(
      "no hay terminal interactiva para pedir el enlace. Pasa el enlace en " +
        "ENLACE_CONFIRMACION, o define SUPABASE_SERVICE_ROLE_KEY para obtenerlo solo.",
    );
  }

  const lectura = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const pegado = await Promise.race([
      lectura.question(
        `\nAbre el correo enviado a ${correo} y pega aqui el enlace de confirmacion:\n> `,
      ),
      // Si la entrada se cierra (Ctrl-D, stdin agotado), `question` se queda
      // colgada para siempre en vez de resolver. Esto lo convierte en un error.
      new Promise((_, rechazar) =>
        lectura.once("close", () =>
          rechazar(new Error("la entrada se cerro sin recibir el enlace")),
        ),
      ),
    ]);
    return String(pegado).trim();
  } finally {
    lectura.close();
  }
}

/**
 * Lleva el enlace pegado a la app que se esta verificando.
 *
 * El enlace del correo apunta al Site URL configurado en Supabase, que no tiene
 * por que ser el servidor local: si ahi dice `https://latidos.app` y ese dominio
 * todavia no esta desplegado, pedirlo tal cual devuelve un 404 que no dice nada
 * del codigo. Aqui se conserva solo la ruta y los parametros, y se apuntan a
 * BASE_URL.
 */
function normalizarEnlace(pegado) {
  const limpio = pegado.trim();

  let url;
  try {
    url = new URL(limpio, BASE_URL);
  } catch {
    throw new Error(`no parece un enlace: ${limpio}`);
  }

  if (url.pathname.includes("/auth/v1/verify")) {
    throw new Error(
      "ese enlace es el de la plantilla por defecto de Supabase " +
        "({{ .ConfirmationURL }}), que solo funciona en el navegador donde se " +
        "hizo el registro.\nCambia la plantilla de 'Confirm signup' para que " +
        "apunte a {{ .SiteURL }}/auth/confirmar?token_hash={{ .TokenHash }}&type=signup",
    );
  }

  if (!url.pathname.includes("/auth/confirmar")) {
    throw new Error(
      `el enlace no apunta a /auth/confirmar sino a ${url.pathname}.\n` +
        "Si tu proveedor de correo reescribe los enlaces (el click tracking de " +
        "Resend lo hace), apagalo o copia el enlace final tras seguir el " +
        "redirect en el navegador.",
    );
  }

  return {
    destino: new URL(url.pathname + url.search, BASE_URL),
    origen: url.origin,
  };
}

let enlace;
try {
  enlace = await enlaceDeConfirmacion();
} catch (error) {
  comprobar("se obtiene el enlace de confirmacion", false, error.message);
  process.exit(1);
}

let destinoConfirmacion;
try {
  const normalizado = normalizarEnlace(enlace);
  destinoConfirmacion = normalizado.destino;

  if (normalizado.origen !== new URL(BASE_URL).origin) {
    console.log(
      `\nAviso: el enlace apunta a ${normalizado.origen}, no a ${BASE_URL}.\n` +
        "Se reescribio para probar contra el servidor local, pero revisa el\n" +
        "Site URL en Authentication -> URL Configuration: tal como esta, el\n" +
        "enlace que reciben las personas no llega a esta app.\n",
    );
  }
} catch (error) {
  comprobar("el enlace de confirmacion es utilizable", false, error.message);
  process.exit(1);
}

const confirmacion = await http(
  destinoConfirmacion.pathname + destinoConfirmacion.search,
);
const destino = confirmacion.headers.get("location") ?? "";

comprobar(
  "confirmar el correo lleva al onboarding",
  confirmacion.status >= 300 &&
    confirmacion.status < 400 &&
    destino.includes("/onboarding/pantalla-1"),
  `se pidio ${destinoConfirmacion.href} y respondio ${confirmacion.status}` +
    (destino ? ` -> ${destino}` : ""),
);

// --- 5. Sesion y perfil ------------------------------------------------------

const onboarding = await http("/onboarding/pantalla-1");
comprobar(
  "la sesion queda iniciada tras confirmar",
  onboarding.status === 200,
  `recibido ${onboarding.status}`,
);

// El onboarding aun no esta visto, asi que Inicio deberia devolver a el.
const inicioAntes = await http("/inicio");
comprobar(
  "Inicio manda al onboarding mientras no se haya visto",
  inicioAntes.status >= 300 &&
    inicioAntes.status < 400 &&
    (inicioAntes.headers.get("location") ?? "").includes("/onboarding/"),
  `recibido ${inicioAntes.status} -> ${inicioAntes.headers.get("location") ?? ""}`,
);

// Cerrar el onboarding (lo mismo que hacen "Empezar" y "Saltar").
const cierre = await http("/api/usuario/onboarding-completado", { method: "POST" });
const cuerpoCierre = await cierre.json().catch(() => ({}));
comprobar(
  "cerrar el onboarding responde { onboarding_visto: true } (plan §3)",
  cierre.status === 200 && cuerpoCierre.onboarding_visto === true,
  `recibido ${cierre.status}: ${JSON.stringify(cuerpoCierre)}`,
);

const inicio = await http("/inicio");
const html = await inicio.text();

comprobar("Inicio abre tras cerrar el onboarding", inicio.status === 200, `recibido ${inicio.status}`);
comprobar(
  "Inicio saluda con el nombre registrado",
  html.includes(datos.nombre),
);
comprobar("el balance arranca en 0 Beats", /Beats/.test(html) && />0</.test(html));

// Inicio lee la fila de `usuarios` con la sesion del propio usuario: si el
// insert o RLS hubieran fallado, no habria nombre ni balance que mostrar.

console.log(
  `\nUsuario de prueba: ${usuarioId} (${correo}).` +
    (correoFijo
      ? "\nBorralo en Authentication -> Users antes de volver a correr, o la\n" +
        "proxima corrida chocara contra el 409 de correo ya registrado."
      : "\nBorralo desde el panel de Supabase cuando termines."),
);
console.log(fallos === 0 ? "\nV001: todo pasa." : `\nV001: ${fallos} fallo(s).`);
process.exit(fallos === 0 ? 0 : 1);
